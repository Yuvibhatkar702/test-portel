import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { testsAPI } from '../services/api';

function TakeTest() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showUserForm, setShowUserForm] = useState(true);

  useEffect(() => {
    loadTest();
  }, [id]);

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

  const loadTest = async () => {
    try {
      setLoading(true);
      const response = await testsAPI.getTest(id);
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

  const startTest = (e) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setError('Please enter your name and email to start the test.');
      return;
    }
    setShowUserForm(false);
    setTestStarted(true);
    setStartTime(new Date());
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
    submitTest();
  };

  const submitTest = async () => {
    setSubmitting(true);
    const endTime = new Date();
    const timeTaken = startTime ? Math.round((endTime - startTime) / 1000) : 0;

    // Convert answers object to array format expected by backend
    const answersArray = test.questions.map((_, index) => answers[index] || -1);

    try {
      const response = await testsAPI.submitTest(id, {
        answers: answersArray,
        userName,
        userEmail,
        timeTaken
      });

      // Navigate to results page or show results
      navigate('/results', { 
        state: { 
          result: response.data,
          testTitle: test.title
        }
      });
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
                
                <div className="mb-3">
                  <strong>Test Details:</strong>
                  <ul className="mt-2">
                    <li>Questions: {test.questions.length}</li>
                    {test.duration > 0 && (
                      <li>Time Limit: {test.duration} minutes</li>
                    )}
                    <li>Category: {test.category}</li>
                  </ul>
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

                  <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                      Back to Dashboard
                    </Button>
                    <Button type="submit" variant="success">
                      Start Test
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
    </Container>
  );
}

export default TakeTest;