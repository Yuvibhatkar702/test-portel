import React, { useState, useEffect, useRef } from 'react';
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
  const [showStartButton, setShowStartButton] = useState(false); // Show start button for shared links
  
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
  const [lastViolationTime, setLastViolationTime] = useState(0);
  const [activeViolationType, setActiveViolationType] = useState(null);
  const [lastWarningTime, setLastWarningTime] = useState(0);

  const recordViolation = (type, description) => {
    const now = Date.now();
    const mappedType = {
      'Tab Switch': 'tab_switch',
      'Fullscreen Exit': 'fullscreen_exit',
      'Window Blur': 'window_blur',
      'Window Exit': 'window_exit',
      'Page Exit': 'page_exit',
      'Shortcut Attempt': 'shortcut_attempt',
      'Right Click': 'right_click',
      'Copy Attempt': 'copy_attempt'
    }[type] || type;

    // Debounce similar violations within 3 seconds
    const DEBOUNCE_TIME = 3000;
    const isSimilarViolation = 
      (type === 'Tab Switch' && activeViolationType === 'tab_switch') ||
      (type === 'Window Blur' && activeViolationType === 'tab_switch') ||
      (type === 'Tab Switch' && activeViolationType === 'window_blur') ||
      (type === 'Window Blur' && activeViolationType === 'window_blur');

    if (isSimilarViolation && (now - lastViolationTime) < DEBOUNCE_TIME) {
      console.log(`Debounced ${type} violation - too soon after last violation`);
      return;
    }

    // Record the violation
    const violation = {
      type: mappedType,
      description,
      timestamp: new Date().toISOString(),
      questionIndex: currentQuestion
    };

    setViolations(prev => [...prev, violation]);
    setLastViolationTime(now);
    setActiveViolationType(mappedType);

    // Clear the active violation type after debounce period
    setTimeout(() => {
      setActiveViolationType(null);
    }, DEBOUNCE_TIME);

    // Update warning count and check for auto-submit
    setWarningCount(prev => {
      const newCount = prev + 1;
      
      // More aggressive for tab switching violations
      const tabSwitchViolations = violations.filter(v => v.type === 'tab_switch').length + 
                                  (mappedType === 'tab_switch' ? 1 : 0);
      
      if ((tabSwitchViolations >= 2) || (newCount >= 5)) {
        if (!examLocked) {
          setViolationMessage('Too many security violations detected. Exam will be submitted automatically in 3 seconds!');
          setExamLocked(true);
          setTimeout(() => {
            handleAutoSubmit();
          }, 3000);
        }
      } else if (tabSwitchViolations === 1) {
        showViolationWarning('WARNING: One more tab switch will result in immediate exam submission!');
      }
      
      return newCount;
    });

    // Update tab switch count if it's a tab switch violation
    if (type === 'Tab Switch') {
      setTabSwitchCount(prev => prev + 1);
    }
  };

  const showViolationWarning = (message) => {
    const now = Date.now();
    const WARNING_DEBOUNCE_TIME = 2000; // 2 seconds between warnings
    
    if (now - lastWarningTime < WARNING_DEBOUNCE_TIME) {
      console.log('Warning debounced - too soon after last warning');
      return;
    }
    
    setViolationMessage(message);
    setShowViolationModal(true);
    setLastWarningTime(now);
    
    setTimeout(() => {
      setShowViolationModal(false);
    }, 3000);
  };

  const handleAutoSubmit = () => {
    setViolationMessage('Time expired! Submitting exam automatically...');
    setShowViolationModal(true);
    setTimeout(() => {
      submitTest(true);
    }, 2000);
  };
  

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, preloadedTest]);

  useEffect(() => {
    console.log('Timer effect triggered. testStarted:', testStarted, 'timeLeft:', timeLeft);
    let timer;
    if (testStarted && timeLeft > 0 && test && test.duration > 0) {
      console.log('Starting timer...');
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          console.log('Timer tick, time left:', newTime);
          if (newTime <= 1) {
            console.log('Time expired, triggering auto submit');
            handleAutoSubmit();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      console.log('Timer conditions not met - testStarted:', testStarted, 'timeLeft:', timeLeft, 'test duration:', test?.duration);
    }
    return () => {
      if (timer) {
        console.log('Clearing timer');
        clearInterval(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testStarted, timeLeft]);

  // Security monitoring setup
  const setupSecurityMonitoring = () => {
    console.log('Setting up security monitoring...');
    
    // Remove existing listeners first to avoid duplicates
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    document.removeEventListener('contextmenu', preventRightClick);
    document.removeEventListener('keydown', preventShortcuts);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('mouseleave', handleMouseLeave);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    // Add event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('keydown', preventShortcuts, true); // Use capture phase
    document.addEventListener('keyup', preventShortcuts, true); // Also capture keyup
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add more aggressive event monitoring
    document.addEventListener('focusout', (e) => {
      if (testStarted) {
        console.log('Focus out event detected');
        setTimeout(() => {
          if (!document.hasFocus()) {
            window.focus();
            document.body.focus();
          }
        }, 10);
      }
    }, true);
    
    document.addEventListener('focusin', (e) => {
      if (testStarted) {
        console.log('Focus in event detected');
      }
    }, true);
    
    // Try to capture window switching attempts
    window.addEventListener('pagehide', (e) => {
      if (testStarted) {
        e.preventDefault();
        recordViolation('Page Hide', 'Attempted to hide/switch page');
        return false;
      }
    }, true);
    
    window.addEventListener('pageshow', (e) => {
      if (testStarted) {
        console.log('Page show event - ensuring focus');
        window.focus();
        document.body.focus();
      }
    }, true);
    
    // Additional detection methods - backup polling for focus issues
    const focusInterval = setInterval(() => {
      if (testStarted) {
        const isHidden = document.hidden || document.webkitHidden || document.msHidden;
        const hasFocus = document.hasFocus();
        
        // Aggressively try to maintain focus
        if (isHidden || !hasFocus) {
          console.log('Focus/visibility lost - attempting restoration');
          window.focus();
          document.body.focus();
          
          // Show warning if student is away too long
          if (isHidden) {
            setTimeout(() => {
              if (document.hidden || !document.hasFocus()) {
                showViolationWarning('Return to the exam immediately! Extended absence may result in auto-submission.');
              }
            }, 1000);
          }
        }
        
        // Only trigger violation recording if visibility API might have missed something
        if (!isHidden && !hasFocus) {
          console.log('Polling detected focus loss without tab switch');
          recordViolation('Focus Loss', 'Focus lost without tab switch (polling backup)');
        }
      }
    }, 1500); // Check every 1.5 seconds for more aggressive monitoring
    
    // Store interval ID for cleanup
    window.examFocusInterval = focusInterval;
    
    console.log('Security monitoring setup complete');
  };

  const cleanup = () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    document.removeEventListener('contextmenu', preventRightClick);
    document.removeEventListener('keydown', preventShortcuts, true);
    document.removeEventListener('keyup', preventShortcuts, true);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('mouseleave', handleMouseLeave);
    
    // Remove additional event listeners
    document.removeEventListener('focusout', () => {}, true);
    document.removeEventListener('focusin', () => {}, true);
    window.removeEventListener('pagehide', () => {}, true);
    window.removeEventListener('pageshow', () => {}, true);
    
    // Clear focus monitoring interval
    if (window.examFocusInterval) {
      clearInterval(window.examFocusInterval);
      window.examFocusInterval = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
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
  showViolationWarning('Please return to fullscreen mode to continue the exam.');
    }
  };

  const handleWindowFocus = () => {
    if (testStarted) {
      console.log('Window focused');
    }
  };

  const handleBeforeUnload = (e) => {
    if (testStarted) {
      console.log('Page unload detected');
      recordViolation('Page Exit', 'Student attempted to leave the exam page');
      e.preventDefault();
      e.returnValue = 'EXAM IN PROGRESS - Leaving will result in automatic submission!';
      return 'EXAM IN PROGRESS - Leaving will result in automatic submission!';
    }
  };

  const handleMouseLeave = (e) => {
    if (testStarted && (e.clientY <= 0 || e.clientX <= 0 || 
        e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
      console.log('Mouse left window boundary');
      recordViolation('Window Exit', 'Mouse cursor left the exam window');
  showViolationWarning('Please keep your cursor within the exam window.');
    }
  };

  const handleWindowBlur = () => {
    console.log('Window blur event fired. Test started:', testStarted);
    if (testStarted) {
      // Only record blur if document is not hidden (to avoid duplicate with tab switch)
      if (!document.hidden) {
        console.log('Window blur detected - focus lost to another window');
        recordViolation('Focus Loss', 'Focus lost to another window');
  showViolationWarning('Focus change detected! Please keep the exam window active.');
      } else {
        console.log('Window blur ignored - document is hidden (tab switch already handled)');
      }
      
      // Try to regain focus after a short delay
      setTimeout(() => {
        if (testStarted && !document.hidden) {
          window.focus();
          document.body.focus();
        }
      }, 500);
    }
  };

  // Page Visibility API: detect tab switch/minimize and return
  const handleVisibilityChange = () => {
    if (!testStarted) return;
    if (document.hidden) {
      console.log('Document hidden: tab switch or minimize detected');
      setTabSwitchCount(prev => prev + 1);
      recordViolation('Tab Switch', 'Switched tabs, minimized, or window lost visibility');
    } else {
      console.log('Document visible again');
      // Try to restore focus on return
      setTimeout(() => {
        if (testStarted) {
          window.focus();
          document.body.focus();
        }
      }, 100);
    }
  };


  const preventRightClick = (e) => {
    if (testStarted) {
      e.preventDefault();
      recordViolation('Right Click', 'Attempted right click context menu');
      return false;
    }
  };

  const preventShortcuts = (e) => {
    if (testStarted) {
      // Prevent common shortcuts
      const forbiddenKeys = [
        'F12', // Developer tools
        'I', 'J', 'C', 'U', 'S', 'A', 'T', 'N' // When combined with Ctrl
      ];
      
      // Block all function keys
      if (e.key.startsWith('F') && e.key.length > 1) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Shortcut Attempt', `Attempted to use function key: ${e.key}`);
  showViolationWarning('Function keys are disabled during the exam.');
        return false;
      }
      
      // Block window switching and navigation
      if (
        (e.altKey && e.key === 'Tab') || // Alt+Tab
        (e.altKey && e.key === 'F4') || // Alt+F4 (close window)
        (e.ctrlKey && e.key === 'w') || // Ctrl+W (close tab)
        (e.ctrlKey && e.key === 't') || // Ctrl+T (new tab)
        (e.ctrlKey && e.key === 'n') || // Ctrl+N (new window)
        (e.ctrlKey && e.shiftKey && e.key === 'T') || // Ctrl+Shift+T (reopen tab)
        (e.ctrlKey && e.key === 'Tab') || // Ctrl+Tab (switch tabs)
        (e.ctrlKey && e.shiftKey && e.key === 'Tab') || // Ctrl+Shift+Tab
        e.key === 'F11' || // Fullscreen toggle
        (e.key >= '1' && e.key <= '9' && e.ctrlKey) // Ctrl+1-9 (switch to tab)
      ) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Shortcut Attempt', `Attempted window switching: ${e.key}`);
  showViolationWarning('Window switching is blocked during the exam.');
        return false;
      }
      
      if (
        (e.ctrlKey && forbiddenKeys.includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        e.key === 'F5' || // Refresh
        (e.ctrlKey && e.key === 'r') || // Refresh
        (e.ctrlKey && e.key === 'R') // Refresh (uppercase)
      ) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Shortcut Attempt', `Attempted to use shortcut: ${e.key}`);
  showViolationWarning('Keyboard shortcuts are disabled during the exam.');
        return false;
      }
    }
  };  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 }, 
          height: { ideal: 480 }
        }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Ensure video plays and is visible
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            console.log('Camera stream started successfully');
          } catch (playError) {
            console.error('Video play error:', playError);
          }
        };
        
        // Force video to be visible
        videoRef.current.style.display = 'block';
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
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

  const enterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      return true;
    } catch (error) {
      console.warn('Fullscreen request failed:', error);
      return false;
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
    if (e) e.preventDefault();
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
    const fullscreenGranted = await enterFullscreen();
    
    if (!fullscreenGranted) {
      console.warn('Fullscreen mode could not be enabled, but continuing with exam');
    }
    
    // Step 3: Start the exam
    setError('');
    setShowUserForm(false);
    setTestStarted(true);
    setStartTime(new Date());
    
    // Force fullscreen state update
    setTimeout(() => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen) {
        showViolationWarning('Fullscreen mode is recommended. Please avoid switching tabs during the exam.');
      }
    }, 500);
    
    // Show initial instructions
    setTimeout(() => {
      showViolationWarning('Exam monitoring is now active. Please stay in fullscreen mode and avoid switching tabs.');
    }, 1000);
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

  const mapSubmissionReason = ({ autoSubmit, locked }) => {
    if (locked) return 'security_violations';
    if (autoSubmit) return 'time_expired';
    return 'manual';
  };

  const submitTest = async (autoSubmit = false) => {
    // Prevent double submission
    if (submitting) return;
    
    setSubmitting(true);
    const endTime = new Date();
    const timeTaken = startTime ? Math.round((endTime - startTime) / 1000) : 0;

    // Convert answers object to array format expected by backend
    const answersArray = test.questions.map((_, index) => answers[index] || -1);

    // Create clean violations array without circular references
    const cleanViolations = violations.map(violation => ({
      type: violation.type,
      description: violation.description,
      timestamp: violation.timestamp,
      questionIndex: violation.questionIndex
    }));

    const payload = {
      answers: answersArray,
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      timeTaken,
      violations: cleanViolations,
      totalViolations: cleanViolations.length,
      tabSwitches: tabSwitchCount,
      autoSubmitted: Boolean(autoSubmit),
      examLocked: Boolean(examLocked),
      submissionReason: mapSubmissionReason({ autoSubmit: Boolean(autoSubmit), locked: Boolean(examLocked) })
    };

    // Add shared link info if applicable
    if (isSharedLink && studentInfo) {
      payload.rollNumber = studentInfo.rollNumber || '';
      payload.phone = studentInfo.phone || '';
      payload.accessMethod = 'shared_link';
      payload.shareableLink = window.location.pathname.split('/').pop();
    }

    console.log('Submitting payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await testsAPI.submitTest(testId, payload);

      // For shared links, show completion message without score details
      if (isSharedLink) {
        // Show completion message without navigation
        setError('');
        setTestStarted(false);
        setSubmitting(false);
        
        // Show completion screen
        setShowUserForm(false);
        setTest({ 
          ...test, 
          completed: true, 
          completionMessage: 'Thank you for completing the exam. Your responses have been submitted successfully.' 
        });
        
        // Clean up monitoring
        cleanup();
        
        // Remove all event listeners to prevent further interactions
        document.removeEventListener('keydown', () => {});
        document.removeEventListener('contextmenu', () => {});
        window.removeEventListener('beforeunload', () => {});
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

  // Show start button for shared links when ready
  useEffect(() => {
    if (isSharedLink && studentInfo && test && !testStarted && !showUserForm && !loading) {
      setShowStartButton(true);
    }
  }, [isSharedLink, studentInfo, test, testStarted, showUserForm, loading]);

  // Handle completion screen interactions for shared links
  useEffect(() => {
    if (isSharedLink && test && test.completed) {
      const handlePopState = (event) => {
        event.preventDefault();
        window.history.pushState(null, null, window.location.pathname);
      };
      
      window.history.pushState(null, null, window.location.pathname);
      window.addEventListener('popstate', handlePopState);
      
      // Disable right-click and common shortcuts permanently
      const disableInteractions = (e) => {
        e.preventDefault();
        return false;
      };
      
      document.addEventListener('contextmenu', disableInteractions);
      document.addEventListener('keydown', disableInteractions);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
        document.removeEventListener('contextmenu', disableInteractions);
        document.removeEventListener('keydown', disableInteractions);
      };
    }
  }, [isSharedLink, test]);

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

  // Show completion screen for shared link users after submission
  if (isSharedLink && test.completed) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="mt-5">
              <Card.Header className="bg-success text-white text-center">
                <h3 className="mb-0">
                  <i className="bi bi-check-circle me-2"></i>
                  Exam Completed!
                </h3>
              </Card.Header>
              <Card.Body className="text-center py-5">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h4 className="text-success mb-4">{test.title}</h4>
                <p className="lead mb-4">
                  {test.completionMessage || 'Thank you for completing the exam. Your responses have been submitted successfully.'}
                </p>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Your exam has been submitted successfully.</strong><br />
                  Results will be communicated to you through appropriate channels.
                </div>
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Important:</strong> Please do not refresh this page or use the back button.
                </div>
                <p className="text-muted small mt-4">
                  You may now close this window. Thank you for your participation.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Show start button for shared links
  if (showStartButton) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Header>
                <h4 className="mb-0">{test.title}</h4>
              </Card.Header>
              <Card.Body>
                <div className="text-center">
                  <div className="mb-4">
                    <h5>Welcome, {studentInfo.name}!</h5>
                    <p className="text-muted">Ready to start your exam?</p>
                  </div>
                  
                  <div className="mb-4">
                    <strong>Test Details:</strong>
                    <ul className="mt-2 text-start">
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
                    <ul className="mt-2 mb-0 small text-start">
                      <li><strong>Camera Access:</strong> Required for identity verification</li>
                      <li><strong>Fullscreen Mode:</strong> Recommended for best experience</li>
                      <li><strong>Tab Switching:</strong> Not allowed during exam</li>
                      <li><strong>Auto-Submit:</strong> Exam will auto-submit when time expires</li>
                    </ul>
                  </div>

                  {error && <Alert variant="danger">{error}</Alert>}

                  <Button 
                    variant="success" 
                    size="lg"
                    onClick={(e) => {
                      setShowStartButton(false);
                      startTest(e);
                    }}
                  >
                    <i className="bi bi-camera-video me-2"></i>
                    Start Exam
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
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
    <Container className="px-2" style={{ maxWidth: '1200px' }}>
      {/* Security Monitoring Bar */}
      {testStarted && (
        <Row className="bg-light border-bottom py-2 mb-3">
          <Col>
            <div className="d-flex justify-content-between align-items-center small flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <Badge bg={cameraAccess ? 'success' : 'danger'} className="text-nowrap">
                  <i className="bi bi-camera-video me-1"></i>
                  Camera: {cameraAccess ? 'Active' : 'Inactive'}
                </Badge>
                <Badge bg={isFullscreen ? 'success' : 'warning'} className="text-nowrap">
                  <i className="bi bi-fullscreen me-1"></i>
                  Fullscreen: {isFullscreen ? 'On' : 'Off'}
                </Badge>
                <Badge bg={warningCount === 0 ? 'success' : warningCount < 3 ? 'warning' : 'danger'} className="text-nowrap">
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
        <Col lg={3} md={4} sm={12}>
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
        <Col lg={9} md={8} sm={12}>
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
            onClick={() => submitTest(false)}
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
          width: '160px',
          height: '120px',
          border: '3px solid #28a745',
          borderRadius: '12px',
          zIndex: 1000,
          backgroundColor: '#000',
          objectFit: 'cover',
          display: testStarted ? 'block' : 'none'
        }}
        onLoadedData={() => {
          console.log('Video loaded and ready to play');
          if (videoRef.current) {
            videoRef.current.play().catch(err => console.error('Play failed:', err));
          }
        }}
        onError={(e) => {
          console.error('Video error:', e);
          setCameraError('Camera display error. Please refresh and try again.');
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