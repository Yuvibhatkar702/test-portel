import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Tabs, Tab, Alert } from 'react-bootstrap';
import { resultsAPI, testsAPI } from '../services/api';

function SharedLinkResultsDashboard() {
  const [results, setResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [testFilter, setTestFilter] = useState('All Tests');
  const [activeTab, setActiveTab] = useState('shared-links');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterResults();
  }, [results, searchTerm, testFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [sharedResults, allResultsData, testsData] = await Promise.all([
        resultsAPI.getSharedLinkResults(),
        resultsAPI.getAllResults(),
        testsAPI.getAllTests()
      ]);

      setResults(sharedResults.data);
      setAllResults(allResultsData.data);
      setTests(testsData.data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load results data');
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = results;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(result =>
        result.userName?.toLowerCase().includes(term) ||
        result.userEmail?.toLowerCase().includes(term) ||
        result.rollNumber?.toLowerCase().includes(term) ||
        result.testTitle?.toLowerCase().includes(term)
      );
    }

    if (testFilter !== 'All Tests') {
      filtered = filtered.filter(result => result.testTitle === testFilter);
    }

    return filtered;
  };

  const getUniqueTests = () => {
    const testTitles = [...new Set(results.map(r => r.testTitle))].filter(Boolean);
    return testTitles;
  };

  const getStatusBadge = (result) => {
    if (result.isPassed) {
      return <Badge bg="success">Passed</Badge>;
    } else {
      return <Badge bg="danger">Failed</Badge>;
    }
  };

  const getViolationsBadge = (result) => {
    const violations = result.violationSummary?.total || result.totalViolations || 0;
    if (violations === 0) {
      return <Badge bg="success">Clean</Badge>;
    } else if (violations <= 2) {
      return <Badge bg="warning">Warning</Badge>;
    } else {
      return <Badge bg="danger">Violations</Badge>;
    }
  };

  const getAccessMethodBadge = (result) => {
    return result.isSharedLink ? 
      <Badge bg="primary">Shared Link</Badge> : 
      <Badge bg="secondary">Direct</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  const exportToCSV = () => {
    const filteredData = filterResults();
    const csvContent = [
      ['Name', 'Email', 'Roll Number', 'Phone', 'Test', 'Score', 'Grade', 'Status', 'Time Taken', 'Violations', 'Submitted At'].join(','),
      ...filteredData.map(result => [
        result.userName,
        result.userEmail,
        result.rollNumber || '',
        result.phone || '',
        result.testTitle,
        `${isNaN(result.percentage) ? '0' : result.percentage}%`,
        result.grade || 'N/A',
        result.isPassed ? 'Passed' : 'Failed',
        result.timeTakenFormatted,
        result.totalViolations || 0,
        formatDate(result.submittedAt)
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredResults = filterResults();

  const getStatistics = () => {
    const total = filteredResults.length;
    const passed = filteredResults.filter(r => r.isPassed).length;
    const failed = total - passed;
    const avgScore = total > 0 ? 
      (filteredResults.reduce((sum, r) => {
        const percentage = isNaN(r.percentage) ? 0 : r.percentage;
        return sum + percentage;
      }, 0) / total).toFixed(1) : 0;
    const withViolations = filteredResults.filter(r => (r.totalViolations || 0) > 0).length;

    return { total, passed, failed, avgScore, withViolations };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5>Loading Results...</h5>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Results</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadData}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="h2 mb-0">
            <i className="fas fa-chart-bar me-2"></i>
            Results Dashboard
          </h1>
          <p className="text-muted">View and manage exam results from shared links</p>
        </Col>
        <Col xs="auto">
          <Button variant="success" onClick={exportToCSV}>
            <i className="fas fa-download me-2"></i>
            Export CSV
          </Button>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h2 text-primary mb-1">{stats.total}</div>
              <div className="text-muted small">Total Submissions</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h2 text-success mb-1">{stats.passed}</div>
              <div className="text-muted small">Passed</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h2 text-danger mb-1">{stats.failed}</div>
              <div className="text-muted small">Failed</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="h2 text-warning mb-1">{stats.avgScore}%</div>
              <div className="text-muted small">Average Score</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, email, or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filter by Test</Form.Label>
                <Form.Select
                  value={testFilter}
                  onChange={(e) => setTestFilter(e.target.value)}
                >
                  <option value="All Tests">All Tests</option>
                  {getUniqueTests().map(testTitle => (
                    <option key={testTitle} value={testTitle}>{testTitle}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setTestFilter('All Tests');
                }}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">
            <i className="fas fa-users me-2"></i>
            Shared Link Submissions ({filteredResults.length})
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredResults.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No Results Found</h5>
              <p className="text-muted">No exam submissions match your current filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Student Info</th>
                    <th>Test</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Violations</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result.id}>
                      <td>
                        <div>
                          <div className="fw-bold">{result.userName}</div>
                          <small className="text-muted">{result.userEmail}</small>
                          {result.rollNumber && (
                            <div><small className="text-muted">Roll: {result.rollNumber}</small></div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-semibold">{result.testTitle}</div>
                          {getAccessMethodBadge(result)}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-bold">
                            {isNaN(result.percentage) ? '0' : result.percentage}%
                          </div>
                          <Badge bg="info">{result.grade || 'N/A'}</Badge>
                        </div>
                      </td>
                      <td>{getStatusBadge(result)}</td>
                      <td>{result.timeTakenFormatted}</td>
                      <td>
                        <div>
                          {getViolationsBadge(result)}
                          {(result.totalViolations || 0) > 0 && (
                            <div><small className="text-muted">{result.totalViolations} violations</small></div>
                          )}
                        </div>
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
                          onClick={() => {
                            // Navigate to detailed result view
                            window.open(`/results/${result.id}`, '_blank');
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SharedLinkResultsDashboard;