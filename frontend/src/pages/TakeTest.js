import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, ProgressBar, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { testsAPI } from '../services/api';

function TakeTest({ testId: propTestId, preloadedTest, isSharedLink = false, studentInfo }) {
  const { id: routeTestId } = useParams();
  const testId = propTestId || routeTestId;
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [userName, setUserName] = useState(studentInfo?.name || '');
  const [userEmail, setUserEmail] = useState(studentInfo?.email || '');
  const [showUserForm, setShowUserForm] = useState(!studentInfo); // Skip form if student info provided
  
  // Security and monitoring states
  const [cameraAccess, setCameraAccess] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState([]);
  const [warningCount, setWarningCount] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [examLocked, setExamLocked] = useState(false);

  useEffect(() => {
    if (preloadedTest) {
      setTest(preloadedTest);
      setTimeLeft(preloadedTest.duration * 60);
      setLoading(false);
    } else {
      loadTest();
    }
    setupSecurityMonitoring();
    return () => {
      cleanup();
    };
  }, [testId, preloadedTest]);

  useEffect(() => {
    let timer;
    if (testStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  // Security monitoring setup
  const setupSecurityMonitoring = () => {
    // Monitor visibility change (tab switch)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Monitor fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Prevent right-click and common shortcuts
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('keydown', preventShortcuts);

    // Monitor focus/blur
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
  };

  const cleanup = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    document.removeEventListener('contextmenu', preventRightClick);
    document.removeEventListener('keydown', preventShortcuts);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleVisibilityChange = () => {
    if (testStarted && document.hidden) {
      recordViolation('Tab Switch', 'Student switched to another tab or window');
      setTabSwitchCount(prev => prev + 1);
      showViolationWarning('⚠️ Tab switching detected! This action has been recorded.');
    }
  };

  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    
    setIsFullscreen(isCurrentlyFullscreen);
    
    if (testStarted && !isCurrentlyFullscreen) {
      recordViolation('Fullscreen Exit', 'Student exited fullscreen mode');
      showViolationWarning('⚠️ Please return to fullscreen mode to continue the exam.');
    }
  };

  const handleWindowFocus = () => {
    if (testStarted) {
      console.log('Window focused');
    }
  };

  const handleWindowBlur = () => {
    if (testStarted) {
      recordViolation('Window Blur', 'Student switched focus away from exam window');
      showViolationWarning('⚠️ Focus change detected! Please keep the exam window active.');
    }
  };

  const preventRightClick = (e) => {
    if (testStarted) {
      e.preventDefault();
      return false;
    }
  };

  const preventShortcuts = (e) => {
    if (testStarted) {
      // Prevent common shortcuts
      const forbiddenKeys = [
        'F12', // Developer tools
        'I', 'J', 'C', 'U', 'S', 'A' // When combined with Ctrl
      ];
      
      if (
        (e.ctrlKey && forbiddenKeys.includes(e.key.toUpperCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        e.key === 'F5' || // Refresh
        (e.ctrlKey && e.key === 'r') // Refresh
      ) {
        e.preventDefault();
        recordViolation('Shortcut Attempt', `Attempted to use shortcut: ${e.key}`);
        showViolationWarning('⚠️ Keyboard shortcuts are disabled during the exam.');
        return false;
      }
    }
  };

  const recordViolation = (type, description) => {
    const violation = {
      type,
      description,
      timestamp: new Date().toISOString(),
      questionIndex: currentQuestion
    };
    
    setViolations(prev => [...prev, violation]);
    setWarningCount(prev => prev + 1);
    
    // Auto-submit if too many violations
    if (warningCount >= 3) {
      setViolationMessage('Too many security violations detected. Exam will be submitted automatically.');
      setExamLocked(true);
      setTimeout(() => {
        handleAutoSubmit();
      }, 3000);
    }
  };

  const showViolationWarning = (message) => {
    setViolationMessage(message);
    setShowViolationModal(true);
    setTimeout(() => {
      setShowViolationModal(false);
    }, 3000);
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraAccess(true);
      setCameraError('');
      return true;
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Camera access is required to take this exam. Please allow camera permissions and refresh the page.');
      setCameraAccess(false);
      return false;
    }
  };

  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  };

  const loadTest = async () => {
    if (preloadedTest) return; // Skip loading if test is already provided
    
    try {
      setLoading(true);
      const response = await testsAPI.getTest(testId);
      setTest(response.data);
      
      if (response.data.duration > 0) {
        setTimeLeft(response.data.duration * 60); // Convert minutes to seconds
      }
    } catch (err) {
      setError('Failed to load test. Please try again.');
      console.error('Error loading test:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setError('Please enter your name and email to start the test.');
      return;
    }

    // Step 1: Request camera access
    setError('Checking camera access...');
    const cameraGranted = await requestCameraAccess();
    if (!cameraGranted) {
      setError('Camera access is required to take this exam. Please allow camera permissions and try again.');
      return;
    }

    // Step 2: Enter fullscreen mode
    setError('Please allow fullscreen mode...');
    try {
      await enterFullscreen();
      // Wait a moment for fullscreen to activate
      setTimeout(() => {
        if (!isFullscreen) {
          setError('Fullscreen mode is required to take this exam. Please try again.');
          return;
        }
        
        // Step 3: Start the exam
        setError('');
        setShowUserForm(false);
        setTestStarted(true);
        setStartTime(new Date());
        
        // Show initial instructions
        showViolationWarning('📹 Exam monitoring is active. Stay in fullscreen mode and avoid switching tabs.');
        
      }, 1000);
    } catch (fullscreenError) {
      setError('Unable to enter fullscreen mode. Please try again or use a different browser.');
    }
  };

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: answerIndex
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const goToQuestion = (questionIndex) => {
    setCurrentQuestion(questionIndex);
  };

  const handleAutoSubmit = () => {
    setViolationMessage('⏰ Time expired! Submitting exam automatically...');
    setShowViolationModal(true);
    setTimeout(() => {
      submitTest(true);
    }, 2000);
  };

  const submitTest = async (autoSubmit = false) => {
    setSubmitting(true);
    const endTime = new Date();
    const timeTaken = startTime ? Math.round((endTime - startTime) / 1000) : 0;

    // Convert answers object to array format expected by backend
    const answersArray = test.questions.map((_, index) => answers[index] || -1);

    try {
      const response = await testsAPI.submitTest(testId, {
        answers: answersArray,
        userName,
        userEmail,
        timeTaken,
        violations: violations, // Include security violations
        totalViolations: violations.length,
        tabSwitches: tabSwitchCount,
        autoSubmitted: autoSubmit,
        examLocked: examLocked,
        submissionReason: autoSubmit ? 'Time expired' : examLocked ? 'Security violations' : 'Manual submission',
        // Additional info for shared links
        ...(isSharedLink && studentInfo && {
          rollNumber: studentInfo.rollNumber || '',
          phone: studentInfo.phone || '',
          accessMethod: 'shared_link',
          shareableLink: window.location.pathname.split('/').pop()
        })
      });

      // Navigate to results page or show results
      if (isSharedLink) {
        // For shared links, show results immediately without navigation
        navigate('/test-result', { 
          state: { 
            result: response.data,
            testTitle: test.title,
            isSharedLink: true
          }
        });
      } else {
        navigate('/results', { 
          state: { 
            result: response.data,
            testTitle: test.title
          }
        });
      }
    } catch (err) {
      setError('Failed to submit test. Please try again.');
      console.error('Error submitting test:', err);
      setSubmitting(false);
    }
  };

  const getAnsweredQuestions = () => {
    return Object.keys(answers).length;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.round((getAnsweredQuestions() / test.questions.length) * 100);
  };

  if (loading) {
    return (
      <Container>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error && !test) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!test) {
    return (
      <Container>
        <Alert variant="warning">Test not found.</Alert>
      </Container>
    );
  }

  if (showUserForm) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Header>
                <h4 className="mb-0">{test.title}</h4>
              </Card.Header>
              <Card.Body>
                {test.description && (
                  <p className="text-muted">{test.description}</p>
                )}
                
                <div className="mb-4">
                  <strong>Test Details:</strong>
                  <ul className="mt-2">
                    <li>Questions: {test.questions.length}</li>
                    {test.duration > 0 && (
                      <li>Time Limit: {test.duration} minutes</li>
                    )}
                    <li>Category: {test.category}</li>
                  </ul>
                </div>

                <div className="mb-4 p-3 bg-light rounded">
                  <strong className="text-warning">
                    <i className="bi bi-shield-exclamation me-2"></i>
                    Security Requirements:
                  </strong>
                  <ul className="mt-2 mb-0 small">
                    <li><strong>Camera Access:</strong> Required for identity verification</li>
                    <li><strong>Fullscreen Mode:</strong> Must remain in fullscreen during exam</li>
                    <li><strong>Tab Switching:</strong> Not allowed during exam</li>
                    <li><strong>Screen Recording:</strong> This session may be monitored</li>
                    <li><strong>Auto-Submit:</strong> Exam will auto-submit when time expires</li>
                  </ul>
                  <div className="mt-2 text-danger small">
                    <strong>Warning:</strong> Multiple violations will result in automatic submission
                  </div>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={startTest}>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Your Email *</Form.Label>
                    <Form.Control
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      label="I understand and agree to the security requirements above"
                      required
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                      Back to Dashboard
                    </Button>
                    <Button type="submit" variant="success" size="lg">
                      <i className="bi bi-camera-video me-2"></i>
                      Start Secure Test
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Security Monitoring Bar */}
      {testStarted && (
        <Row className="bg-light border-bottom py-2 mb-3">
          <Col>
            <div className="d-flex justify-content-between align-items-center small">
              <div className="d-flex align-items-center gap-3">
                <Badge bg={cameraAccess ? 'success' : 'danger'}>
                  <i className="bi bi-camera-video me-1"></i>
                  Camera: {cameraAccess ? 'Active' : 'Inactive'}
                </Badge>
                <Badge bg={isFullscreen ? 'success' : 'warning'}>
                  <i className="bi bi-fullscreen me-1"></i>
                  Fullscreen: {isFullscreen ? 'On' : 'Off'}
                </Badge>
                <Badge bg={warningCount === 0 ? 'success' : warningCount < 3 ? 'warning' : 'danger'}>
                  <i className="bi bi-shield-exclamation me-1"></i>
                  Violations: {warningCount}
                </Badge>
              </div>
              <div className="text-muted">
                <i className="bi bi-eye me-1"></i>
                Monitoring Active - Stay in fullscreen mode
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* Header */}
      <Row className="bg-white border-bottom py-3 mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">{test.title}</h4>
              <small className="text-muted">
                Question {currentQuestion + 1} of {test.questions.length}
              </small>
            </div>
            <div className="d-flex align-items-center gap-3">
              {test.duration > 0 && (
                <div className={`badge ${timeLeft < 300 ? 'bg-danger' : 'bg-success'} fs-6`}>
                  <i className="bi bi-clock me-1"></i>
                  {formatTime(timeLeft)}
                </div>
              )}
              <div className="text-muted">
                Answered: {getAnsweredQuestions()}/{test.questions.length}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {/* Question Navigation Sidebar */}
        <Col md={3}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Progress</h6>
            </Card.Header>
            <Card.Body>
              <ProgressBar 
                now={getProgressPercentage()} 
                label={`${getProgressPercentage()}%`}
                className="mb-3"
              />
              
              <div className="d-grid gap-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {test.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={
                      index === currentQuestion 
                        ? 'primary' 
                        : answers.hasOwnProperty(index) 
                        ? 'success' 
                        : 'outline-secondary'
                    }
                    size="sm"
                    onClick={() => goToQuestion(index)}
                  >
                    {index + 1}
                    {answers.hasOwnProperty(index) && (
                      <i className="bi bi-check ms-1"></i>
                    )}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Question Content */}
        <Col md={9}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Question {currentQuestion + 1}</h5>
            </Card.Header>
            <Card.Body>
              <h6 className="mb-4">{test.questions[currentQuestion].questionText}</h6>
              
              <Form>
                {test.questions[currentQuestion].options.map((option, optionIndex) => (
                  <Form.Check
                    key={optionIndex}
                    type="radio"
                    name={`question-${currentQuestion}`}
                    id={`q-${currentQuestion}-option-${optionIndex}`}
                    label={option.text}
                    checked={answers[currentQuestion] === optionIndex}
                    onChange={() => handleAnswerChange(currentQuestion, optionIndex)}
                    className="mb-3 fs-5"
                  />
                ))}
              </Form>
            </Card.Body>
          </Card>

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between">
            <Button 
              variant="outline-secondary" 
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              <i className="bi bi-chevron-left"></i> Previous
            </Button>
            
            <div className="d-flex gap-2">
              {currentQuestion === test.questions.length - 1 ? (
                <Button 
                  variant="success" 
                  onClick={() => setShowSubmitModal(true)}
                >
                  Submit Test
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={nextQuestion}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Submit Confirmation Modal */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Submit Test</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to submit your test?</p>
          <div className="alert alert-info">
            <strong>Summary:</strong>
            <ul className="mb-0 mt-2">
              <li>Answered: {getAnsweredQuestions()} out of {test.questions.length} questions</li>
              <li>Unanswered: {test.questions.length - getAnsweredQuestions()} questions</li>
            </ul>
          </div>
          <p className="text-muted small">
            Once submitted, you cannot change your answers.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowSubmitModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={submitTest}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submitting...
              </>
            ) : (
              'Submit Test'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Security Violation Modal */}
      <Modal 
        show={showViolationModal} 
        centered 
        backdrop="static" 
        keyboard={false}
        size="sm"
      >
        <Modal.Header className="bg-warning">
          <Modal.Title className="text-dark">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Security Alert
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="mb-0">{violationMessage}</p>
          {warningCount > 0 && (
            <div className="mt-2">
              <small className="text-muted">
                Violations: {warningCount}/3
              </small>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Hidden Camera Video for Monitoring */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '120px',
          height: '80px',
          border: '2px solid #28a745',
          borderRadius: '8px',
          zIndex: 1000,
          display: testStarted && cameraAccess ? 'block' : 'none'
        }}
      />

      {/* Camera Error Alert */}
      {cameraError && (
        <Alert 
          variant="danger" 
          className="position-fixed bottom-0 start-50 translate-middle-x"
          style={{ zIndex: 1050, maxWidth: '400px' }}
        >
          <Alert.Heading className="h6">Camera Access Required</Alert.Heading>
          <p className="mb-0 small">{cameraError}</p>
        </Alert>
      )}

      {/* Exam Locked Overlay */}
      {examLocked && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
          style={{ zIndex: 2000 }}
        >
          <Card className="text-center p-4">
            <Card.Body>
              <div className="text-danger mb-3">
                <i className="bi bi-shield-x" style={{ fontSize: '3rem' }}></i>
              </div>
              <h4 className="text-danger">Exam Locked</h4>
              <p className="text-muted">
                Too many security violations detected.<br/>
                Your exam will be submitted automatically.
              </p>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
}

export default TakeTest;