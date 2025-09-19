import React from 'react';
import { Container, Row, Col, Card, Accordion, Button, Form } from 'react-bootstrap';

function Help() {
  const faqs = [
    {
      question: "How do I create a new test?",
      answer: "Click the 'New test' button on the dashboard, fill in your test details, add questions with multiple-choice options, and mark the correct answers. Don't forget to set time limits and attempt restrictions if needed."
    },
    {
      question: "Can I edit a test after creating it?",
      answer: "Yes, you can edit tests by clicking the three dots menu on any test card and selecting 'Edit'. However, be careful when editing tests that already have responses, as this might affect the results."
    },
    {
      question: "How do I share a test with respondents?",
      answer: "Each test has a unique URL that you can share. Click on any test card to get the test link, or use the sharing options in the test menu. Respondents will need to enter their name and email before taking the test."
    },
    {
      question: "Can I set a time limit for tests?",
      answer: "Yes, when creating or editing a test, you can set a time limit in minutes. Set it to 0 for no time limit. Tests will automatically submit when the time runs out."
    },
    {
      question: "How do I view test results?",
      answer: "Click 'Results' on any test card to view all responses for that test. You can also access all results through the 'Results database' in the sidebar."
    },
    {
      question: "Can I export test results?",
      answer: "Yes, go to the Results database and click 'Export CSV' to download all results in a spreadsheet format. You can also filter results before exporting."
    },
    {
      question: "What's the difference between ACTIVE and FROZEN tests?",
      answer: "ACTIVE tests can be taken by respondents, while FROZEN tests are temporarily disabled. You can change the status when editing a test."
    },
    {
      question: "How many attempts can respondents have?",
      answer: "When creating a test, you can set the number of attempts allowed. Set to -1 for unlimited attempts, or specify a number to limit retakes."
    },
    {
      question: "Can I organize tests into categories?",
      answer: "Yes, you can assign categories to tests when creating or editing them. Use the category filter on the dashboard to organize your tests."
    },
    {
      question: "Is there a mobile app available?",
      answer: "The Test Portal is fully responsive and works great on mobile browsers. There's no dedicated mobile app, but the web interface adapts to all screen sizes."
    }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">
            <i className="bi bi-question-circle me-2"></i>
            Help & Support
          </h2>
          <p className="text-muted mt-2">Find answers to common questions or get in touch with our support team.</p>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          {/* Getting Started Section */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-play-circle me-2"></i>
                Getting Started
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Card className="h-100 border-primary">
                    <Card.Body className="text-center">
                      <i className="bi bi-plus-circle display-4 text-primary mb-3"></i>
                      <h6>Create Your First Test</h6>
                      <p className="text-muted small">
                        Start by creating a test with questions, options, and correct answers.
                      </p>
                      <Button variant="outline-primary" size="sm">
                        View Tutorial
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100 border-success">
                    <Card.Body className="text-center">
                      <i className="bi bi-share display-4 text-success mb-3"></i>
                      <h6>Share With Respondents</h6>
                      <p className="text-muted small">
                        Share your test link and start collecting responses from participants.
                      </p>
                      <Button variant="outline-success" size="sm">
                        Learn How
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Video Tutorials */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-play-btn me-2"></i>
                Video Tutorials
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3">
                  <Card className="border-0 shadow-sm">
                    <div className="bg-primary text-white p-4 text-center">
                      <i className="bi bi-play-fill display-4"></i>
                    </div>
                    <Card.Body>
                      <h6>Creating Tests</h6>
                      <p className="text-muted small">Learn how to create comprehensive tests with multiple question types.</p>
                      <small className="text-muted">Duration: 5 min</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="mb-3">
                  <Card className="border-0 shadow-sm">
                    <div className="bg-success text-white p-4 text-center">
                      <i className="bi bi-play-fill display-4"></i>
                    </div>
                    <Card.Body>
                      <h6>Managing Results</h6>
                      <p className="text-muted small">Discover how to view, analyze, and export your test results.</p>
                      <small className="text-muted">Duration: 3 min</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="mb-3">
                  <Card className="border-0 shadow-sm">
                    <div className="bg-info text-white p-4 text-center">
                      <i className="bi bi-play-fill display-4"></i>
                    </div>
                    <Card.Body>
                      <h6>Advanced Features</h6>
                      <p className="text-muted small">Explore time limits, categories, and other advanced options.</p>
                      <small className="text-muted">Duration: 7 min</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* FAQ Section */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-question-diamond me-2"></i>
                Frequently Asked Questions
              </h5>
            </Card.Header>
            <Card.Body>
              <Accordion>
                {faqs.map((faq, index) => (
                  <Accordion.Item key={index} eventKey={index.toString()}>
                    <Accordion.Header>{faq.question}</Accordion.Header>
                    <Accordion.Body>{faq.answer}</Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Quick Links */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Quick Links</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" className="text-start">
                  <i className="bi bi-book me-2"></i>
                  User Guide
                </Button>
                <Button variant="outline-success" className="text-start">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  API Documentation
                </Button>
                <Button variant="outline-info" className="text-start">
                  <i className="bi bi-chat-dots me-2"></i>
                  Community Forum
                </Button>
                <Button variant="outline-warning" className="text-start">
                  <i className="bi bi-bug me-2"></i>
                  Report a Bug
                </Button>
                <Button variant="outline-secondary" className="text-start">
                  <i className="bi bi-lightbulb me-2"></i>
                  Feature Requests
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Contact Support */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-headset me-2"></i>
                Contact Support
              </h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleContactSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Select required>
                    <option value="">Choose a topic...</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="general">General Question</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Describe your issue or question..."
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="your@email.com"
                    defaultValue="admin@testportal.com"
                    required
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button type="submit" variant="success">
                    <i className="bi bi-send me-2"></i>
                    Send Message
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Support Hours */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-clock me-2"></i>
                Support Hours
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span>Monday - Friday:</span>
                  <span>9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Saturday:</span>
                  <span>10:00 AM - 4:00 PM EST</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Sunday:</span>
                  <span>Closed</span>
                </div>
                <div className="alert alert-info small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  We typically respond within 24 hours on business days.
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* System Status */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-activity me-2"></i>
                System Status
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Test Portal API</span>
                <span className="badge bg-success">Operational</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Database</span>
                <span className="badge bg-success">Operational</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>File Storage</span>
                <span className="badge bg-success">Operational</span>
              </div>
              <small className="text-muted">
                <i className="bi bi-check-circle text-success me-1"></i>
                All systems operational
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Help;