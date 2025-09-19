import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { resultsAPI, testsAPI } from '../services/api';

function ResultsDatabase() {
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [testFilter, setTestFilter] = useState('All Tests');
  const [filteredResults, setFilteredResults] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filterResults = () => {
      let filtered = results;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(result =>
          result.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.testId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by test
      if (testFilter !== 'All Tests') {
        filtered = filtered.filter(result => result.testId?.title === testFilter);
      }

      setFilteredResults(filtered);
    };
    
    filterResults();
  }, [results, searchTerm, testFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resultsResponse, testsResponse] = await Promise.all([
        resultsAPI.getAllResults(),
        testsAPI.getAllTests()
      ]);
      setResults(resultsResponse.data);
      setTests(testsResponse.data);
    } catch (err) {
      setError('Failed to load results database. Make sure the backend server is running.');
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
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreBadgeVariant = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  const exportResults = () => {
    // Create CSV content
    const csvContent = [
      ['Name', 'Email', 'Test', 'Score', 'Percentage', 'Time Taken', 'Submitted Date'].join(','),
      ...filteredResults.map(result => [
        `"${result.userName}"`,
        `"${result.userEmail}"`,
        `"${result.testId?.title || 'Unknown Test'}"`,
        `${result.correctAnswers}/${result.totalQuestions}`,
        `${result.percentage}%`,
        formatTime(result.timeTaken),
        formatDate(result.submittedAt)
      ].join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">
              <i className="bi bi-database me-2"></i>
              Results Database ({filteredResults.length})
            </h2>
            <div className="d-flex gap-2">
              <Button variant="outline-success" onClick={exportResults}>
                <i className="bi bi-download me-1"></i>
                Export CSV
              </Button>
              <Button variant="success" onClick={loadData}>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small text-muted">Filter by Test</Form.Label>
            <Form.Select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
            >
              <option value="All Tests">All Tests</option>
              {tests.map(test => (
                <option key={test._id} value={test.title}>{test.title}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={8}>
          <Form.Group>
            <Form.Label className="small text-muted">Search Results</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name, email, or test title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-secondary">
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>

      {error && (
        <Row>
          <Col>
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          </Col>
        </Row>
      )}

      {filteredResults.length === 0 ? (
        <Row>
          <Col>
            <div className="text-center py-5">
              <i className="bi bi-database display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No results found</h4>
              <p className="text-muted">
                {results.length === 0 
                  ? "No test results available yet." 
                  : "Try adjusting your filters or search term."
                }
              </p>
            </div>
          </Col>
        </Row>
      ) : (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">All Test Results</h5>
                  <small className="text-muted">
                    Showing {filteredResults.length} of {results.length} results
                  </small>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <Table responsive hover className="mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Participant</th>
                        <th>Test</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Time</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map(result => (
                        <tr key={result._id}>
                          <td>
                            <div>
                              <strong>{result.userName}</strong>
                              <br />
                              <small className="text-muted">{result.userEmail}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>{result.testId?.title || 'Unknown Test'}</strong>
                              {result.testId?.category && (
                                <Badge bg="secondary" className="ms-2 small">
                                  {result.testId.category}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td>
                            <strong>{result.correctAnswers}/{result.totalQuestions}</strong>
                          </td>
                          <td>
                            <Badge bg={getScoreBadgeVariant(result.percentage)} className="fs-6">
                              {result.percentage}%
                            </Badge>
                          </td>
                          <td>
                            {formatTime(result.timeTaken)}
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(result.submittedAt)}
                            </small>
                          </td>
                          <td>
                            <Dropdown align="end">
                              <Dropdown.Toggle variant="outline-secondary" size="sm">
                                <i className="bi bi-three-dots"></i>
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item>
                                  <i className="bi bi-eye me-2"></i>
                                  View Details
                                </Dropdown.Item>
                                <Dropdown.Item>
                                  <i className="bi bi-download me-2"></i>
                                  Export Result
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item className="text-danger">
                                  <i className="bi bi-trash me-2"></i>
                                  Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Statistics Summary */}
      {filteredResults.length > 0 && (
        <Row className="mt-4">
          <Col md={2}>
            <Card className="text-center border-primary">
              <Card.Body>
                <h4 className="text-primary">{filteredResults.length}</h4>
                <small className="text-muted">Total Results</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-success">
              <Card.Body>
                <h4 className="text-success">
                  {Math.round(filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length)}%
                </h4>
                <small className="text-muted">Avg Score</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-info">
              <Card.Body>
                <h4 className="text-info">
                  {Math.max(...filteredResults.map(r => r.percentage))}%
                </h4>
                <small className="text-muted">Highest</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-warning">
              <Card.Body>
                <h4 className="text-warning">
                  {Math.min(...filteredResults.map(r => r.percentage))}%
                </h4>
                <small className="text-muted">Lowest</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-secondary">
              <Card.Body>
                <h4 className="text-secondary">
                  {filteredResults.filter(r => r.percentage >= 70).length}
                </h4>
                <small className="text-muted">Passed</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-danger">
              <Card.Body>
                <h4 className="text-danger">
                  {filteredResults.filter(r => r.percentage < 70).length}
                </h4>
                <small className="text-muted">Failed</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default ResultsDatabase;