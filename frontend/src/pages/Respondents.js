import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { resultsAPI } from '../services/api';

function Respondents() {
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRespondents, setFilteredRespondents] = useState([]);

  useEffect(() => {
    loadRespondents();
  }, []);

  useEffect(() => {
    const filterRespondents = () => {
      if (!searchTerm) {
        setFilteredRespondents(respondents);
        return;
      }

      const filtered = respondents.filter(respondent =>
        respondent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        respondent.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRespondents(filtered);
    };
    
    filterRespondents();
  }, [respondents, searchTerm]);

  const loadRespondents = async () => {
    try {
      setLoading(true);
      // Get all results to extract unique respondents
      const resultsResponse = await resultsAPI.getAllResults();
      const results = resultsResponse.data;
      
      // Create unique respondents list
      const respondentsMap = {};
      results.forEach(result => {
        if (!respondentsMap[result.userEmail]) {
          respondentsMap[result.userEmail] = {
            name: result.userName,
            email: result.userEmail,
            testsCompleted: 0,
            averageScore: 0,
            lastActivity: result.submittedAt,
            totalScore: 0
          };
        }
        respondentsMap[result.userEmail].testsCompleted++;
        respondentsMap[result.userEmail].totalScore += result.percentage;
        
        // Update last activity if this is more recent
        if (new Date(result.submittedAt) > new Date(respondentsMap[result.userEmail].lastActivity)) {
          respondentsMap[result.userEmail].lastActivity = result.submittedAt;
        }
      });

      // Calculate average scores
      const respondentsList = Object.values(respondentsMap).map(respondent => ({
        ...respondent,
        averageScore: Math.round(respondent.totalScore / respondent.testsCompleted)
      }));

      setRespondents(respondentsList);
    } catch (err) {
      setError('Failed to load respondents. Make sure the backend server is running.');
      console.error('Error loading respondents:', err);
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

  const getScoreBadgeVariant = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
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
              <i className="bi bi-people me-2"></i>
              Respondents ({filteredRespondents.length})
            </h2>
            <Button variant="success" onClick={loadRespondents}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label className="small text-muted">Search Respondents</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name or email..."
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

      {filteredRespondents.length === 0 ? (
        <Row>
          <Col>
            <div className="text-center py-5">
              <i className="bi bi-people display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No respondents found</h4>
              <p className="text-muted">
                {respondents.length === 0 
                  ? "No one has taken any tests yet." 
                  : "Try adjusting your search term."
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
                <h5 className="mb-0">All Respondents</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Tests Completed</th>
                      <th>Average Score</th>
                      <th>Last Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRespondents.map((respondent, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" 
                                 style={{ width: '32px', height: '32px', fontSize: '14px', color: 'white' }}>
                              {respondent.name.charAt(0).toUpperCase()}
                            </div>
                            <strong>{respondent.name}</strong>
                          </div>
                        </td>
                        <td>{respondent.email}</td>
                        <td>
                          <Badge bg="info">{respondent.testsCompleted}</Badge>
                        </td>
                        <td>
                          <Badge bg={getScoreBadgeVariant(respondent.averageScore)} className="fs-6">
                            {respondent.averageScore}%
                          </Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(respondent.lastActivity)}
                          </small>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-1">
                            <i className="bi bi-eye me-1"></i>
                            View Results
                          </Button>
                          <Button variant="outline-secondary" size="sm">
                            <i className="bi bi-envelope me-1"></i>
                            Contact
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

      {/* Statistics Cards */}
      {filteredRespondents.length > 0 && (
        <Row className="mt-4">
          <Col md={3}>
            <Card className="text-center border-primary">
              <Card.Body>
                <h3 className="text-primary">{filteredRespondents.length}</h3>
                <small className="text-muted">Total Respondents</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-success">
              <Card.Body>
                <h3 className="text-success">
                  {Math.round(filteredRespondents.reduce((sum, r) => sum + r.averageScore, 0) / filteredRespondents.length)}%
                </h3>
                <small className="text-muted">Average Score</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-info">
              <Card.Body>
                <h3 className="text-info">
                  {filteredRespondents.reduce((sum, r) => sum + r.testsCompleted, 0)}
                </h3>
                <small className="text-muted">Total Tests Taken</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-warning">
              <Card.Body>
                <h3 className="text-warning">
                  {filteredRespondents.filter(r => r.averageScore >= 70).length}
                </h3>
                <small className="text-muted">Passed (70%+)</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Respondents;