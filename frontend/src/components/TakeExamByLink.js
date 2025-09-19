import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import TakeTest from '../pages/TakeTest';

const TakeExamByLink = () => {
  const { shareableLink } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(true);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    rollNumber: '',
    phone: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTestByLink();
  }, [shareableLink]);

  const fetchTestByLink = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tests/share/${shareableLink}`);
      
      if (response.status === 404) {
        setError('This exam link is not valid or has been removed.');
        return;
      }
      
      if (response.status === 410) {
        const data = await response.json();
        setError(data.error || 'This exam link has expired.');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load exam');
      }

      const testData = await response.json();
      setTest(testData);
    } catch (error) {
      console.error('Error fetching test by link:', error);
      setError('Unable to load the exam. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentInfoSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validate required fields
    if (!studentInfo.name.trim() || !studentInfo.email.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentInfo.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // Proceed to exam
    setShowStudentForm(false);
  };

  const handleInputChange = (field, value) => {
    setStudentInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light">
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-3">
              <h5 className="text-muted">Loading Exam...</h5>
              <p className="text-muted">Please wait while we prepare your exam.</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 bg-light">
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <Card className="border-danger shadow" style={{ maxWidth: '500px' }}>
              <Card.Body>
                <div className="text-danger mb-3">
                  <i className="fas fa-exclamation-triangle fa-3x"></i>
                </div>
                <h5 className="card-title text-danger">Exam Not Available</h5>
                <p className="card-text">{error}</p>
                <div className="mt-4">
                  <Button 
                    variant="primary" 
                    className="me-2"
                    onClick={() => window.location.href = '/'}
                  >
                    <i className="fas fa-home me-1"></i>
                    Go to Home
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    onClick={fetchTestByLink}
                  >
                    <i className="fas fa-redo me-1"></i>
                    Try Again
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-vh-100 bg-light">
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <h5 className="text-muted">Exam not found</h5>
          </div>
        </Container>
      </div>
    );
  }

  // Show student information form first
  if (showStudentForm) {
    return (
      <div className="min-vh-100 bg-light">
        <Container fluid className="py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              {/* Exam Header */}
              <Card className="shadow-sm mb-4">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i className="fas fa-graduation-cap fa-3x text-primary"></i>
                  </div>
                  <h2 className="fw-bold text-primary">{test.title}</h2>
                  <p className="text-muted mb-1">{test.description}</p>
                  <div className="d-flex justify-content-center gap-4 mt-3">
                    <div className="text-center">
                      <div className="fw-bold text-primary">{test.duration}</div>
                      <small className="text-muted">Minutes</small>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold text-primary">{test.questions?.length || 0}</div>
                      <small className="text-muted">Questions</small>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold text-primary">{test.totalMarks || 0}</div>
                      <small className="text-muted">Total Marks</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Student Information Form */}
              <Card className="shadow">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-user me-2"></i>
                    Student Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted mb-4">
                    Please fill in your information before starting the exam. This information will be used to identify your results.
                  </p>

                  {formError && (
                    <Alert variant="danger">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {formError}
                    </Alert>
                  )}

                  <Form onSubmit={handleStudentInfoSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Full Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter your full name"
                            value={studentInfo.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Email Address <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Enter your email"
                            value={studentInfo.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Roll Number / ID</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter your roll number or student ID"
                            value={studentInfo.rollNumber}
                            onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            placeholder="Enter your phone number"
                            value={studentInfo.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Security Notice */}
                    {test.proctoring && (
                      <Alert variant="warning" className="mb-4">
                        <h6 className="alert-heading">
                          <i className="fas fa-shield-alt me-2"></i>
                          Security Requirements
                        </h6>
                        <div className="mb-2">
                          This exam has the following security requirements:
                        </div>
                        <ul className="mb-0">
                          {test.proctoring.cameraRequired && (
                            <li>Camera access required for proctoring</li>
                          )}
                          {test.proctoring.fullscreenRequired && (
                            <li>Fullscreen mode will be enforced</li>
                          )}
                          {test.proctoring.tabSwitchLimit > 0 && (
                            <li>Maximum {test.proctoring.tabSwitchLimit} tab switches allowed</li>
                          )}
                          {test.proctoring.preventCopy && (
                            <li>Copy/paste operations are disabled</li>
                          )}
                        </ul>
                      </Alert>
                    )}

                    <div className="d-grid">
                      <Button type="submit" variant="primary" size="lg">
                        <i className="fas fa-play me-2"></i>
                        Start Exam
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // Pass the test data and student info to TakeTest component
  return (
    <div className="exam-by-link min-vh-100">
      <TakeTest 
        testId={test._id} 
        preloadedTest={test} 
        isSharedLink={true}
        studentInfo={studentInfo}
      />
    </div>
  );
};

export default TakeExamByLink;