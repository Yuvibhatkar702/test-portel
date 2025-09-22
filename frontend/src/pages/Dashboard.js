import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Badge, InputGroup, Alert, Modal, ListGroup } from 'react-bootstrap';
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState([]);

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
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(test => test.category))].filter(Boolean);
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error loading tests:', err);
      setError('Failed to load tests. Please try again.');
      setTests([]);
      setFilteredTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManageCategories = () => {
    setShowCategoryModal(true);
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
      <Container className="py-4" style={{ maxWidth: '1400px' }}>
        {error && (
          <Row className="mb-3">
            <Col>
              <Alert variant="danger" className="d-flex justify-content-between align-items-center flex-wrap gap-2">
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
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
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
        <Row className="mb-4 align-items-end g-3">
          <Col lg={3} md={4} sm={6} xs={12}>
            <Form.Group>
              <Form.Label className="text-muted small">Category</Form.Label>
              <Form.Select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white"
              >
                <option value="All categories">All categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg={2} md={3} sm={6} xs={12}>
            <Form.Group>
              <Form.Label className="text-muted small">Actions</Form.Label>
              <Button 
                className="btn-manage-categories d-flex align-items-center justify-content-center w-100"
                onClick={handleManageCategories}
              >
                <i className="bi bi-gear me-2" style={{ fontSize: '12px' }}></i>
                <span style={{ fontSize: '13px' }}>Manage categories</span>
              </Button>
            </Form.Group>
          </Col>
          <Col lg={2} md={3} sm={6} xs={12}>
            <Form.Group>
              <Form.Label className="text-muted small">Status</Form.Label>
              <Form.Select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white"
              >
                <option value="All">All</option>
                <option value="Frozen">Frozen</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg={5} md={12} sm={12} xs={12}>
            <Form.Group>
              <Form.Label className="text-muted small">Search</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white">
                  <i className="bi bi-search"></i>
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

      {/* Category Management Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-gear me-2"></i>
            Manage Categories
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6 className="text-muted">Current Categories</h6>
            {categories.length > 0 ? (
              <ListGroup>
                {categories.map((category, index) => (
                  <ListGroup.Item 
                    key={index}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>{category}</span>
                    <Badge bg="success" className="badge-status">
                      {tests.filter(test => test.category === category).length} tests
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <div className="text-center py-4">
                <i className="bi bi-folder-x display-4 text-muted mb-3"></i>
                <p className="text-muted">No categories found. Categories are created automatically when you create tests.</p>
              </div>
            )}
          </div>
          
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Note:</strong> Categories are automatically created when you create new tests. 
            You can organize your tests by assigning them to different categories during test creation.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowCategoryModal(false)}>
            Close
          </Button>
          <Button variant="success" href="/create-test">
            <i className="bi bi-plus-circle me-2"></i>
            Create New Test
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Dashboard;