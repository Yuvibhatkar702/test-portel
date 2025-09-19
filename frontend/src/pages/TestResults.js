import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { resultsAPI } from '../services/api';

function TestResults() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.result) {
      // Single result from test submission
      setLoading(false);
    } else if (testId) {
      // Load results for specific test
      loadTestResults();
    } else {
      // Load all results
      loadAllResults();
    }
  }, [testId, location.state]);

  const loadTestResults = async () => {
    try {
      setLoading(true);
      const response = await resultsAPI.getTestResults(testId);
      setResults(response.data);
    } catch (err) {
      setError('Failed to load test results.');
      console.error('Error loading test results:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllResults = async () => {
    try {
      setLoading(true);
      const response = await resultsAPI.getAllResults();
      setResults(response.data);
    } catch (err) {
      setError('Failed to load results.');
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreBadgeVariant = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  // Single result view (from test submission)
  if (location.state?.result) {
    const result = location.state.result;
    const testTitle = location.state.testTitle || 'Test';

    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="text-center">
              <Card.Header className="bg-success text-white">
                <h3 className="mb-0">Test Completed!</h3>
              </Card.Header>
              <Card.Body>
                <h4 className="mb-4">{testTitle}</h4>
                
                <Row className="text-center mb-4">
                  <Col md={3}>
                    <div className="display-4 text-success">{result.percentage}%</div>
                    <small className="text-muted">Score</small>
                  </Col>
                  <Col md={3}>
                    <div className="display-4">{result.correctAnswers}</div>
                    <small className="text-muted">Correct</small>
                  </Col>
                  <Col md={3}>
                    <div className="display-4">{result.totalQuestions - result.correctAnswers}</div>
                    <small className="text-muted">Incorrect</small>
                  </Col>
                  <Col md={3}>
                    <div className="display-4">{result.totalQuestions}</div>
                    <small className="text-muted">Total</small>
                  </Col>
                </Row>

                <Alert variant={result.percentage >= 70 ? 'success' : result.percentage >= 50 ? 'warning' : 'danger'}>
                  {result.percentage >= 70 && 'Excellent work! You passed with flying colors.'}
                  {result.percentage >= 50 && result.percentage < 70 && 'Good effort! You passed the test.'}
                  {result.percentage < 50 && 'Keep practicing! You can retake the test to improve your score.'}
                </Alert>

                <div className="d-flex justify-content-center gap-3">
                  <Button variant="primary" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                  </Button>
                  <Button variant="outline-secondary" onClick={() => navigate(`/test/${testId}`)}>
                    Retake Test
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

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

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Test Results</h2>
            <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Col>
      </Row>

      {results.length === 0 ? (
        <Row>
          <Col>
            <div className="text-center py-5">
              <i className="bi bi-clipboard-data display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No results found</h4>
              <p className="text-muted">No one has taken this test yet.</p>
            </div>
          </Col>
        </Row>
      ) : (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Results Summary ({results.length} submissions)</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Participant</th>
                      <th>Email</th>
                      {!testId && <th>Test</th>}
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Time Taken</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(result => (
                      <tr key={result._id}>
                        <td>
                          <strong>{result.userName}</strong>
                        </td>
                        <td>{result.userEmail}</td>
                        {!testId && (
                          <td>
                            <div>
                              <strong>{result.testId?.title}</strong>
                              {result.testId?.category && (
                                <Badge bg="secondary" className="ms-2 small">
                                  {result.testId.category}
                                </Badge>
                              )}
                            </div>
                          </td>
                        )}
                        <td>
                          <strong>{result.correctAnswers}/{result.totalQuestions}</strong>
                        </td>
                        <td>
                          <Badge bg={getScoreBadgeVariant(result.percentage)} className="fs-6">
                            {result.percentage}%
                          </Badge>
                        </td>
                        <td>
                          {result.timeTaken > 0 ? formatTime(result.timeTaken) : 'N/A'}
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(result.submittedAt)}
                          </small>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => {/* TODO: View detailed result */}}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Statistics Card */}
      {results.length > 0 && (
        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Statistics</h5>
              </Card.Header>
              <Card.Body>
                <Row className="text-center">
                  <Col md={3}>
                    <div className="h3 text-primary">
                      {Math.round(results.reduce((sum, result) => sum + result.percentage, 0) / results.length)}%
                    </div>
                    <small className="text-muted">Average Score</small>
                  </Col>
                  <Col md={3}>
                    <div className="h3 text-success">
                      {Math.max(...results.map(result => result.percentage))}%
                    </div>
                    <small className="text-muted">Highest Score</small>
                  </Col>
                  <Col md={3}>
                    <div className="h3 text-warning">
                      {Math.min(...results.map(result => result.percentage))}%
                    </div>
                    <small className="text-muted">Lowest Score</small>
                  </Col>
                  <Col md={3}>
                    <div className="h3 text-info">
                      {results.filter(result => result.percentage >= 70).length}
                    </div>
                    <small className="text-muted">Passed (70%+)</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default TestResults;