import React, { useState } from 'react';
import { Modal, Button, Form, Alert, InputGroup, Badge, Row, Col } from 'react-bootstrap';

const ShareableLinkModal = ({ show, onHide, test, onLinkGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkData, setLinkData] = useState(null);
  const [settings, setSettings] = useState({
    expiryDays: 30,
    cameraRequired: true,
    fullscreenRequired: true,
    tabSwitchLimit: 3,
    preventCopy: true
  });

  const handleGenerateLink = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tests/${test._id}/generate-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expiryDays: settings.expiryDays,
          proctoring: {
            cameraRequired: settings.cameraRequired,
            fullscreenRequired: settings.fullscreenRequired,
            tabSwitchLimit: settings.tabSwitchLimit,
            preventCopy: settings.preventCopy
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate link');
      }

      const data = await response.json();
      setLinkData(data);
      setSuccess('Shareable link generated successfully!');
      
      if (onLinkGenerated) {
        onLinkGenerated(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate shareable link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Link copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Failed to copy to clipboard');
    });
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-share-alt me-2"></i>
          Generate Shareable Link
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div className="mb-3">
          <h6 className="fw-bold">Test Details</h6>
          <p className="text-muted mb-1">{test?.title}</p>
          <p className="text-muted small">Duration: {test?.duration} minutes | Questions: {test?.questions?.length}</p>
        </div>

        {/* Link Settings */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Link Settings</h6>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Expiry (Days)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="365"
                  value={settings.expiryDays}
                  onChange={(e) => handleSettingChange('expiryDays', parseInt(e.target.value))}
                />
                <Form.Text className="text-muted">Link will expire after specified days</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Tab Switch Limit</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="10"
                  value={settings.tabSwitchLimit}
                  onChange={(e) => handleSettingChange('tabSwitchLimit', parseInt(e.target.value))}
                />
                <Form.Text className="text-muted">Max allowed tab switches (0 = unlimited)</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Security Settings */}
          <div className="mb-3">
            <h6 className="fw-bold mb-2">Security Requirements</h6>
            <Row>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="camera-required"
                  label="Camera Required"
                  checked={settings.cameraRequired}
                  onChange={(e) => handleSettingChange('cameraRequired', e.target.checked)}
                  className="mb-2"
                />
                <Form.Check
                  type="switch"
                  id="fullscreen-required"
                  label="Fullscreen Required"
                  checked={settings.fullscreenRequired}
                  onChange={(e) => handleSettingChange('fullscreenRequired', e.target.checked)}
                  className="mb-2"
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="prevent-copy"
                  label="Prevent Copy/Paste"
                  checked={settings.preventCopy}
                  onChange={(e) => handleSettingChange('preventCopy', e.target.checked)}
                  className="mb-2"
                />
              </Col>
            </Row>
          </div>
        </div>

        {/* Generated Link */}
        {linkData && (
          <div className="mb-3">
            <h6 className="fw-bold mb-3">Generated Link</h6>
            <InputGroup className="mb-3">
              <Form.Control
                readOnly
                value={linkData.shareableUrl}
                className="font-monospace small"
              />
              <Button
                variant="outline-secondary"
                onClick={() => copyToClipboard(linkData.shareableUrl)}
              >
                <i className="fas fa-copy"></i>
              </Button>
            </InputGroup>

            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>Expires:</strong> {formatExpiryDate(linkData.linkExpiry)}
                </small>
              </div>
              <div className="col-md-6">
                <Badge bg={linkData.linkActive ? 'success' : 'danger'}>
                  {linkData.linkActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {/* Security Summary */}
            <div className="mt-3">
              <h6 className="fw-bold small mb-2">Security Settings Applied:</h6>
              <div className="d-flex flex-wrap gap-1">
                {linkData.proctoring?.cameraRequired && 
                  <Badge bg="info" className="small">Camera Required</Badge>
                }
                {linkData.proctoring?.fullscreenRequired && 
                  <Badge bg="info" className="small">Fullscreen Required</Badge>
                }
                {linkData.proctoring?.preventCopy && 
                  <Badge bg="info" className="small">Copy Prevention</Badge>
                }
                <Badge bg="warning" text="dark" className="small">
                  Max {linkData.proctoring?.tabSwitchLimit} Tab Switches
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleGenerateLink}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Generating...
            </>
          ) : (
            <>
              <i className="fas fa-link me-1"></i>
              {linkData ? 'Regenerate Link' : 'Generate Link'}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ShareableLinkModal;