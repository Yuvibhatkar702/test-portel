import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { resultsAPI, testsAPI } from '../services/api';
import ScoreDebugger from '../components/ScoreDebugger';
import DatabaseManager from '../components/DatabaseManager';

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
          (result.testTitle || result.testId?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by test
      if (testFilter !== 'All Tests') {
        filtered = filtered.filter(result => 
          (result.testTitle || result.testId?.title) === testFilter
        );
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
      
      const testsData = testsResponse.data;
      const resultsData = resultsResponse.data;
      
      // The backend already provides test data via populate
      // No need for separate test mapping since result.test contains the test data
      const populatedResults = resultsData.map(result => ({
        ...result,
        testId: result.test || null,  // Use the populated test data
        testTitle: result.testTitle || result.test?.title || 'Unknown Test',
        // Keep original percentage from backend - don't recalculate
        percentage: result.percentage,
        correctAnswers: result.correctAnswers || 0,
        totalQuestions: result.totalQuestions || 0
      }));
      
      setResults(populatedResults);
      setTests(testsData);
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
        `"${result.testTitle || 'Unknown Test'}"`,
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

  const viewResultDetails = (result) => {
    const detailsWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    const detailsHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Result Details - ${result.userName}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { padding: 20px; background: #f8f9fa; }
          .detail-card { margin-bottom: 20px; }
          .score-badge { font-size: 1.2em; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 class="mb-4">Test Result Details</h2>
          
          <div class="row">
            <div class="col-md-6">
              <div class="card detail-card">
                <div class="card-header bg-primary text-white">
                  <h5 class="mb-0">Participant Information</h5>
                </div>
                <div class="card-body">
                  <p><strong>Name:</strong> ${result.userName}</p>
                  <p><strong>Email:</strong> ${result.userEmail}</p>
                  <p><strong>Submitted:</strong> ${formatDate(result.submittedAt)}</p>
                  <p><strong>Time Taken:</strong> ${formatTime(result.timeTaken)}</p>
                </div>
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="card detail-card">
                <div class="card-header bg-success text-white">
                  <h5 class="mb-0">Test Information</h5>
                </div>
                <div class="card-body">
                  <p><strong>Test:</strong> ${result.testTitle || 'Unknown Test'}</p>
                  <p><strong>Category:</strong> ${result.testCategory || result.testId?.category || 'N/A'}</p>
                  <p><strong>Total Questions:</strong> ${result.totalQuestions}</p>
                  <p><strong>Correct Answers:</strong> ${result.correctAnswers}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-12">
              <div class="card detail-card">
                <div class="card-header bg-warning text-dark">
                  <h5 class="mb-0">Score Summary</h5>
                </div>
                <div class="card-body text-center">
                  <h1 class="display-4 score-badge">
                    <span class="badge bg-${getScoreBadgeVariant(result.percentage)}">${result.percentage}%</span>
                  </h1>
                  <h3>${result.correctAnswers} out of ${result.totalQuestions} correct</h3>
                  <p class="text-muted">Performance: ${result.percentage >= 80 ? 'Excellent' : result.percentage >= 60 ? 'Good' : 'Needs Improvement'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    detailsWindow.document.write(detailsHTML);
    detailsWindow.document.close();
  };

  const exportSingleResult = (result) => {
    const csvContent = [
      ['Name', 'Email', 'Test', 'Score', 'Percentage', 'Time Taken', 'Submitted Date'].join(','),
      [
        `"${result.userName}"`,
        `"${result.userEmail}"`,
        `"${result.testTitle || 'Unknown Test'}"`,
        `${result.correctAnswers}/${result.totalQuestions}`,
        `${result.percentage}%`,
        formatTime(result.timeTaken),
        formatDate(result.submittedAt)
      ].join(',')
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${result.userName}-${result.testTitle || 'test'}-result.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const deleteResult = async (resultId) => {
    if (window.confirm('Are you sure you want to delete this result? This action cannot be undone.')) {
      try {
        await resultsAPI.deleteResult(resultId);
        // Reload data to reflect changes
        loadData();
        alert('Result deleted successfully!');
      } catch (error) {
        console.error('Error deleting result:', error);
        alert('Failed to delete result. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Container className="py-4" style={{ maxWidth: '1400px' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '1400px' }}>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h2 className="mb-0">
              <i className="bi bi-database me-2"></i>
              Results Database ({filteredResults.length})
            </h2>
            <div className="d-flex gap-2 flex-wrap">
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

      <Row className="mb-4 g-3">
        <Col lg={4} md={6} sm={12}>
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
        <Col lg={8} md={6} sm={12}>
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
                              <strong>{result.testTitle || 'Unknown Test'}</strong>
                              {(result.testCategory || result.testId?.category) && (
                                <Badge bg="secondary" className="ms-2 small">
                                  {result.testCategory || result.testId?.category}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td>
                            <strong>{result.correctAnswers || 0}/{result.totalQuestions || 0}</strong>
                          </td>
                          <td>
                            <Badge bg={getScoreBadgeVariant(result.percentage || 0)} className="fs-6">
                              {result.percentage || 0}%
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
                                <Dropdown.Item onClick={() => viewResultDetails(result)}>
                                  <i className="bi bi-eye me-2"></i>
                                  View Details
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => exportSingleResult(result)}>
                                  <i className="bi bi-download me-2"></i>
                                  Export Result
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                  className="text-danger"
                                  onClick={() => deleteResult(result._id)}
                                >
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
                  {filteredResults.length > 0 
                    ? Math.round(filteredResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / filteredResults.length)
                    : 0
                  }%
                </h4>
                <small className="text-muted">Avg Score</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-info">
              <Card.Body>
                <h4 className="text-info">
                  {filteredResults.length > 0 
                    ? Math.max(...filteredResults.map(r => r.percentage || 0))
                    : 0
                  }%
                </h4>
                <small className="text-muted">Highest</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-warning">
              <Card.Body>
                <h4 className="text-warning">
                  {filteredResults.length > 0 
                    ? Math.min(...filteredResults.map(r => r.percentage || 0))
                    : 0
                  }%
                </h4>
                <small className="text-muted">Lowest</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-secondary">
              <Card.Body>
                <h4 className="text-secondary">
                  {filteredResults.filter(r => (r.percentage || 0) >= 70).length}
                </h4>
                <small className="text-muted">Passed</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-danger">
              <Card.Body>
                <h4 className="text-danger">
                  {filteredResults.filter(r => (r.percentage || 0) < 70).length}
                </h4>
                <small className="text-muted">Failed</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {/* Database Management - For clearing all data */}
      <DatabaseManager />
      
      {/* Debug Component - Temporary for diagnosing 0% score issue */}
      <ScoreDebugger />
    </Container>
  );
}

export default ResultsDatabase;