import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Badge, InputGroup, Alert } from 'react-bootstrap';
import TestCard from '../components/TestCard';
import { testsAPI } from '../services/api';

function Dashboard() {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await testsAPI.getAllTests();
      setTests(response.data);
      setFilteredTests(response.data);
    } catch (err) {
      console.error('Error loading tests:', err);
      setError('Failed to load tests. Please try again.');
      setTests([]);
      setFilteredTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = tests;

    if (selectedCategory !== 'All categories') {
      filtered = filtered.filter(test => test.category === selectedCategory);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(test => test.status === selectedStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(test =>
        test.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTests(filtered);
  }, [tests, selectedCategory, selectedStatus, searchQuery]);

  const handleTestDeleted = (deletedTestId) => {
    // Remove the deleted test from the state and reload from server
    setTests(prevTests => prevTests.filter(test => test._id !== deletedTestId));
    setFilteredTests(prevFiltered => prevFiltered.filter(test => test._id !== deletedTestId));
    
    // Optionally reload tests from server to ensure sync
    // loadTests();
  };

  if (loading) {
    return (
      <div className="min-vh-100">
        <Container fluid className="py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100">
      <Container fluid className="py-4">
        {error && (
          <Row className="mb-3">
            <Col>
              <Alert variant="danger" className="d-flex justify-content-between align-items-center">
                {error}
                <Button variant="outline-danger" size="sm" onClick={loadTests}>
                  Retry
                </Button>
              </Alert>
            </Col>
          </Row>
        )}
        
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">My tests <Badge bg="secondary" className="ms-2">({filteredTests.length})</Badge></h4>
              </div>
              <div>
                <Button variant="outline-secondary" className="me-2" onClick={() => window.location.href = '/import-test'}>
                  Import test
                </Button>
                <Button variant="success" onClick={() => window.location.href = '/create-test'}>
                  + New test
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-4 align-items-end">
          <Col md={3}>
            <Form.Group>
              <Form.Label className="text-muted small">Category</Form.Label>
              <Form.Select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white"
              >
                <option value="All categories">All categories</option>
                <option value="UNCATEGORIZED">Uncategorized</option>
                <option value="SALES">Sales</option>
                <option value="HR">HR</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Button 
              variant="link" 
              className="text-primary p-0 text-decoration-none d-flex align-items-center"
              onClick={() => alert('Manage categories functionality - Add your category management logic here')}
              style={{ fontSize: '14px' }}
            >
              ⚙️ <span className="ms-2">Manage categories</span>
            </Button>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label className="text-muted small">Status</Form.Label>
              <Form.Select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white"
              >
                <option value="All">All</option>
                <option value="FROZEN">Frozen</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label className="text-muted small">Search</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white">
                  🔍
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Form.Group>
          </Col>
        </Row>

        {/* Test Grid */}
        <Row>
          {filteredTests.map(test => (
            <Col md={6} lg={6} key={test._id} className="mb-4">
              <TestCard test={test} onTestDeleted={handleTestDeleted} />
            </Col>
          ))}
        </Row>

        {filteredTests.length === 0 && !loading && !error && (
          <Row>
            <Col className="text-center py-5">
              <div className="mb-4">
                <i className="bi bi-clipboard-check display-1 text-muted"></i>
              </div>
              <h5 className="text-muted mb-3">No tests found</h5>
              <p className="text-muted mb-4">
                {tests.length === 0 
                  ? "You haven't created any tests yet. Start by creating your first test!"
                  : "No tests match your current filters. Try adjusting your search criteria."
                }
              </p>
              {tests.length === 0 && (
                <Button variant="success" href="/create-test">
                  + Create Your First Test
                </Button>
              )}
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}

export default Dashboard;