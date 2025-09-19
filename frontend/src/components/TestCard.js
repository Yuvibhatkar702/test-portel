import React, { useState } from 'react';
import { Card, Badge, Button, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { testsAPI } from '../services/api';
import ShareableLinkModal from './ShareableLinkModal';

function TestCard({ test, onTestDeleted }) {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);

  const formatDate = (dateString) => {
    return `CREATED: ${dateString}`;
  };

  const getStatusBadge = (status) => {
    return (
      <Badge bg="secondary" className="text-uppercase fs-6 px-2 py-1">
        {status}
      </Badge>
    );
  };

  const getScoreDisplay = () => {
    if (test.averageScore === null || test.averageScore === undefined) {
      return (
        <div className="d-flex align-items-center">
          <span className="text-muted fs-5 me-2">-%</span>
          <span className="text-muted small">avg. score</span>
        </div>
      );
    }
    return (
      <div className="d-flex align-items-center">
        <span className="text-success fs-5 me-2">{test.averageScore}%</span>
        <span className="text-muted small">avg. score</span>
      </div>
    );
  };

  const handleTakeTest = () => {
    console.log('Taking test:', test._id);
    navigate(`/test/${test._id}`);
  };

  const handleEditTest = () => {
    console.log('Editing test:', test._id);
    // For now, redirect to create test page (you can create an edit page later)
    navigate(`/create-test?edit=${test._id}`);
  };

  const handleViewResults = () => {
    console.log('Viewing results for test:', test._id);
    navigate(`/results/${test._id}`);
  };

  const handleDeleteTest = async () => {
    if(window.confirm(`Are you sure you want to delete "${test.title}"?`)) {
      try {
        console.log('Deleting test:', test._id);
        
        // Call the API to delete the test
        await testsAPI.deleteTest(test._id);
        
        // Show success message
        alert('Test deleted successfully!');
        
        // Notify parent component to refresh the test list
        if (onTestDeleted) {
          onTestDeleted(test._id);
        }
        
        // Alternatively, you could refresh the page
        // window.location.reload();
        
      } catch (error) {
        console.error('Error deleting test:', error);
        alert('Failed to delete test. Please try again.');
      }
    }
  };

  const handleShareTest = () => {
    setShowShareModal(true);
  };

  const handleLinkGenerated = (linkData) => {
    console.log('Link generated for test:', test._id, linkData);
    // You can add additional actions here like updating test state
  };

  return (
    <Card className="h-100 border shadow-sm">
      <div className="border-start border-primary border-4 position-absolute h-100"></div>
      <Card.Body className="p-4">
        {/* Header with status and date */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          {getStatusBadge(test.status)}
          <small className="text-muted">
            {formatDate(test.createdAt)}
          </small>
          <Dropdown align="end">
            <Dropdown.Toggle 
              variant="link" 
              className="text-muted p-0 border-0" 
              style={{ fontSize: '1.2rem', textDecoration: 'none' }}
              id={`dropdown-${test._id}`}
            >
              ⋯
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleTakeTest}>
                <i className="bi bi-play-circle me-2"></i>
                Take Test
              </Dropdown.Item>
              <Dropdown.Item onClick={handleEditTest}>
                <i className="bi bi-pencil me-2"></i>
                Edit
              </Dropdown.Item>
              <Dropdown.Item onClick={handleViewResults}>
                <i className="bi bi-bar-chart me-2"></i>
                View Results
              </Dropdown.Item>
              <Dropdown.Item onClick={handleShareTest}>
                <i className="fas fa-share-alt me-2"></i>
                Generate Share Link
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item 
                className="text-danger"
                onClick={handleDeleteTest}
              >
                <i className="bi bi-trash me-2"></i>
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Test Title */}
        <Card.Title className="mb-3 fw-bold">
          <span 
            className="text-decoration-none text-dark" 
            style={{ cursor: 'pointer' }}
            onClick={handleTakeTest}
          >
            {test.title}
          </span>
        </Card.Title>

        {/* Description */}
        <Card.Text className="text-muted mb-4">
          {test.description}
        </Card.Text>

        {/* Bottom section with score and results */}
        <div className="d-flex justify-content-between align-items-center">
          {getScoreDisplay()}
          <div>
            <Button 
              variant="link" 
              className="p-0 text-primary text-decoration-none"
              onClick={handleViewResults}
            >
              Results ({test.totalAttempts})
            </Button>
          </div>
          <Badge bg="light" text="dark" className="text-uppercase">
            {test.category}
          </Badge>
        </div>
      </Card.Body>

      {/* Share Modal */}
      <ShareableLinkModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        test={test}
        onLinkGenerated={handleLinkGenerated}
      />
    </Card>
  );
}

export default TestCard;