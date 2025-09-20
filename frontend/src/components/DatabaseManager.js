import React, { useState } from 'react';
import { Container, Card, Button, Alert, Spinner, Modal, Row, Col } from 'react-bootstrap';

const DatabaseManager = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);
  const [clearResult, setClearResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [clearType, setClearType] = useState('');

  const getDatabaseStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/database/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setError('Failed to get database status: ' + error.message);
      console.error('Status check failed:', error);
    }
    setLoading(false);
  };

  const confirmClear = (type) => {
    setClearType(type);
    setShowConfirmModal(true);
  };

  const clearDatabase = async () => {
    setClearing(true);
    setError(null);
    setClearResult(null);
    setShowConfirmModal(false);
    
    const endpoints = {
      'all': '/api/database/clear-all',
      'tests': '/api/database/clear-tests',
      'results': '/api/database/clear-results'
    };
    
    try {
      const response = await fetch(`http://localhost:3001${endpoints[clearType]}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setClearResult(result);
      
      // Refresh status after clearing
      setTimeout(() => {
        getDatabaseStatus();
      }, 1000);
      
    } catch (error) {
      setError('Failed to clear database: ' + error.message);
      console.error('Clear failed:', error);
    }
    setClearing(false);
  };

  const getConfirmationMessage = () => {
    switch(clearType) {
      case 'all':
        return {
          title: '🚨 Clear ALL Database Data',
          message: 'This will permanently delete ALL tests, results, and users from the database. This action cannot be undone!',
          variant: 'danger'
        };
      case 'tests':
        return {
          title: '⚠️ Clear Test Data',
          message: 'This will permanently delete all tests and their related results. Users will remain. This action cannot be undone!',
          variant: 'warning'
        };
      case 'results':
        return {
          title: '📊 Clear Results Only',
          message: 'This will permanently delete all test results. Tests and users will remain. This action cannot be undone!',
          variant: 'info'
        };
      default:
        return { title: '', message: '', variant: 'secondary' };
    }
  };

  const confirmInfo = getConfirmationMessage();

  return (
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h4>🗄️ Database Management</h4>
          <p className="mb-0">Manage and clear database data for testing and development</p>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <Button 
              variant="primary" 
              onClick={getDatabaseStatus}
              disabled={loading || clearing}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Checking Status...
                </>
              ) : (
                '📊 Get Database Status'
              )}
            </Button>

            {status && (
              <>
                <Button 
                  variant="danger" 
                  onClick={() => confirmClear('all')}
                  disabled={loading || clearing}
                >
                  {clearing && clearType === 'all' ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Clearing All...
                    </>
                  ) : (
                    '🗑️ Clear ALL Data'
                  )}
                </Button>

                <Button 
                  variant="warning" 
                  onClick={() => confirmClear('tests')}
                  disabled={loading || clearing}
                >
                  {clearing && clearType === 'tests' ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Clearing Tests...
                    </>
                  ) : (
                    '📝 Clear Tests Only'
                  )}
                </Button>

                <Button 
                  variant="info" 
                  onClick={() => confirmClear('results')}
                  disabled={loading || clearing}
                >
                  {clearing && clearType === 'results' ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Clearing Results...
                    </>
                  ) : (
                    '📈 Clear Results Only'
                  )}
                </Button>
              </>
            )}
          </div>

          {error && (
            <Alert variant="danger">
              <h6>❌ Error</h6>
              <p className="mb-0">{error}</p>
            </Alert>
          )}

          {clearResult && (
            <Alert variant="success" className="mb-3">
              <h6>✅ Database Cleared Successfully!</h6>
              <Row>
                <Col md={6}>
                  <p><strong>Summary:</strong> {clearResult.summary}</p>
                  <ul className="mb-0">
                    {clearResult.deletedCounts.tests !== undefined && (
                      <li>Tests deleted: <span className="text-danger">{clearResult.deletedCounts.tests}</span></li>
                    )}
                    {clearResult.deletedCounts.results !== undefined && (
                      <li>Results deleted: <span className="text-danger">{clearResult.deletedCounts.results}</span></li>
                    )}
                    {clearResult.deletedCounts.users !== undefined && (
                      <li>Users deleted: <span className="text-danger">{clearResult.deletedCounts.users}</span></li>
                    )}
                  </ul>
                </Col>
                <Col md={6}>
                  <small className="text-muted">
                    <strong>Cleared at:</strong> {new Date(clearResult.timestamp).toLocaleString()}
                  </small>
                </Col>
              </Row>
            </Alert>
          )}

          {status && (
            <Card className="mt-3">
              <Card.Header>
                <h6>📊 Current Database Status</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Record Counts:</h6>
                    <ul>
                      <li><strong>Tests:</strong> <span className="text-primary">{status.recordCounts.tests}</span></li>
                      <li><strong>Results:</strong> <span className="text-success">{status.recordCounts.results}</span></li>
                      <li><strong>Users:</strong> <span className="text-info">{status.recordCounts.users}</span></li>
                      <li><strong>Total Records:</strong> <span className="text-dark">{status.recordCounts.total}</span></li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <h6>Sample Data:</h6>
                    <ul>
                      <li><strong>Has Tests:</strong> {status.sampleData.hasTests ? '✅ Yes' : '❌ No'}</li>
                      <li><strong>Has Results:</strong> {status.sampleData.hasResults ? '✅ Yes' : '❌ No'}</li>
                      <li><strong>Latest Test:</strong> {status.sampleData.latestTestTitle}</li>
                      <li><strong>Latest Score:</strong> {status.sampleData.latestResultScore}%</li>
                    </ul>
                  </Col>
                </Row>
                <small className="text-muted">
                  Status checked at: {new Date(status.timestamp).toLocaleString()}
                </small>
              </Card.Body>
            </Card>
          )}

          {/* Warning message */}
          <Alert variant="warning" className="mt-3">
            <h6>⚠️ Important Warning</h6>
            <p>Database clearing operations are <strong>PERMANENT</strong> and cannot be undone. Use these tools only for:</p>
            <ul className="mb-0">
              <li>Development and testing purposes</li>
              <li>Clearing corrupted data</li>
              <li>Starting fresh with clean data</li>
            </ul>
            <small><strong>Production Note:</strong> These endpoints should be protected or removed in production environments.</small>
          </Alert>
        </Card.Body>
      </Card>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{confirmInfo.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={confirmInfo.variant}>
            {confirmInfo.message}
          </Alert>
          <p><strong>Are you absolutely sure you want to proceed?</strong></p>
          {status && (
            <div className="bg-light p-2 rounded">
              <small>
                <strong>Current data that will be deleted:</strong><br/>
                {clearType === 'all' && (
                  <>• {status.recordCounts.tests} tests<br/>
                  • {status.recordCounts.results} results<br/>
                  • {status.recordCounts.users} users</>
                )}
                {clearType === 'tests' && (
                  <>• {status.recordCounts.tests} tests<br/>
                  • {status.recordCounts.results} results (related to tests)</>
                )}
                {clearType === 'results' && (
                  <>• {status.recordCounts.results} results</>
                )}
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant={confirmInfo.variant} onClick={clearDatabase}>
            Yes, Clear Database
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DatabaseManager;