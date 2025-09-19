import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs, Badge } from 'react-bootstrap';

function MyAccount() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@testportal.com',
    role: 'Administrator',
    joinDate: '2025-01-01',
    lastLogin: new Date().toISOString()
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    testResults: true,
    newResponses: false,
    weeklyReports: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationChange = (e) => {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Profile updated successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match.');
      setMessageType('danger');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      setMessageType('danger');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Password updated successfully!');
      setMessageType('success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage('Failed to update password. Please try again.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Notification preferences updated successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to update notifications. Please try again.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">
            <i className="bi bi-gear me-2"></i>
            My Account
          </h2>
        </Col>
      </Row>

      {message && (
        <Row className="mb-4">
          <Col>
            <Alert variant={messageType} onClose={() => setMessage('')} dismissible>
              {message}
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col md={3}>
          {/* Account Overview Card */}
          <Card className="mb-4">
            <Card.Body className="text-center">
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                   style={{ width: '80px', height: '80px', fontSize: '32px', color: 'white' }}>
                {profileData.name.charAt(0).toUpperCase()}
              </div>
              <h5>{profileData.name}</h5>
              <p className="text-muted">{profileData.email}</p>
              <Badge bg="success" className="mb-2">{profileData.role}</Badge>
              <hr />
              <small className="text-muted">
                <strong>Member since:</strong><br />
                {formatDate(profileData.joinDate)}
              </small>
              <br />
              <small className="text-muted">
                <strong>Last login:</strong><br />
                {formatDate(profileData.lastLogin)}
              </small>
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">Account Statistics</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Tests Created:</span>
                <Badge bg="info">4</Badge>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Responses:</span>
                <Badge bg="success">0</Badge>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Active Tests:</span>
                <Badge bg="warning">1</Badge>
              </div>
              <div className="d-flex justify-content-between">
                <span>Storage Used:</span>
                <Badge bg="secondary">2.1 MB</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          <Card>
            <Card.Header>
              <Tabs activeKey={activeTab} onSelect={setActiveTab}>
                <Tab eventKey="profile" title="Profile Information" />
                <Tab eventKey="password" title="Change Password" />
                <Tab eventKey="notifications" title="Notifications" />
                <Tab eventKey="billing" title="Billing & Usage" />
              </Tabs>
            </Card.Header>
            <Card.Body>
              {activeTab === 'profile' && (
                <Form onSubmit={handleProfileUpdate}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.role}
                      disabled
                      className="bg-light"
                    />
                    <Form.Text className="text-muted">
                      Contact support to change your role.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Time Zone</Form.Label>
                    <Form.Select>
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Language</Form.Label>
                    <Form.Select>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </Form.Select>
                  </Form.Group>

                  <Button type="submit" variant="success" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </Form>
              )}

              {activeTab === 'password' && (
                <Form onSubmit={handlePasswordUpdate}>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter your current password"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength="6"
                      placeholder="Enter your new password"
                    />
                    <Form.Text className="text-muted">
                      Password must be at least 6 characters long.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Confirm your new password"
                    />
                  </Form.Group>

                  <Button type="submit" variant="success" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </Form>
              )}

              {activeTab === 'notifications' && (
                <Form onSubmit={handleNotificationUpdate}>
                  <h5 className="mb-3">Email Notifications</h5>
                  
                  <Form.Check
                    type="switch"
                    id="emailNotifications"
                    name="emailNotifications"
                    label="Enable email notifications"
                    checked={notifications.emailNotifications}
                    onChange={handleNotificationChange}
                    className="mb-3"
                  />

                  <Form.Check
                    type="switch"
                    id="testResults"
                    name="testResults"
                    label="New test results"
                    checked={notifications.testResults}
                    onChange={handleNotificationChange}
                    className="mb-3"
                    disabled={!notifications.emailNotifications}
                  />

                  <Form.Check
                    type="switch"
                    id="newResponses"
                    name="newResponses"
                    label="New respondent registrations"
                    checked={notifications.newResponses}
                    onChange={handleNotificationChange}
                    className="mb-3"
                    disabled={!notifications.emailNotifications}
                  />

                  <Form.Check
                    type="switch"
                    id="weeklyReports"
                    name="weeklyReports"
                    label="Weekly summary reports"
                    checked={notifications.weeklyReports}
                    onChange={handleNotificationChange}
                    className="mb-4"
                    disabled={!notifications.emailNotifications}
                  />

                  <Button type="submit" variant="success" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      'Save Preferences'
                    )}
                  </Button>
                </Form>
              )}

              {activeTab === 'billing' && (
                <div>
                  <h5 className="mb-3">Current Plan</h5>
                  <Card className="border-success mb-4">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">Free Plan</h6>
                    </Card.Header>
                    <Card.Body>
                      <ul className="list-unstyled mb-0">
                        <li><i className="bi bi-check-circle text-success me-2"></i>Unlimited tests</li>
                        <li><i className="bi bi-check-circle text-success me-2"></i>Up to 100 responses/month</li>
                        <li><i className="bi bi-check-circle text-success me-2"></i>Basic analytics</li>
                        <li><i className="bi bi-check-circle text-success me-2"></i>Email support</li>
                      </ul>
                    </Card.Body>
                  </Card>

                  <h5 className="mb-3">Usage This Month</h5>
                  <Row>
                    <Col md={6}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-primary">0</h4>
                          <small className="text-muted">Responses Used</small>
                          <div className="progress mt-2">
                            <div className="progress-bar" role="progressbar" style={{width: '0%'}}></div>
                          </div>
                          <small className="text-muted">0 / 100 limit</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="text-center">
                        <Card.Body>
                          <h4 className="text-info">4</h4>
                          <small className="text-muted">Tests Created</small>
                          <div className="progress mt-2">
                            <div className="progress-bar bg-info" role="progressbar" style={{width: '4%'}}></div>
                          </div>
                          <small className="text-muted">4 / ∞ limit</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <div className="mt-4">
                    <Button variant="primary" className="me-2">Upgrade Plan</Button>
                    <Button variant="outline-secondary">View Billing History</Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default MyAccount;