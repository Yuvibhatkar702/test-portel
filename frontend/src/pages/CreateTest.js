import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { testsAPI } from '../services/api';

function CreateTest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editTestId = searchParams.get('edit');
  const isEditing = Boolean(editTestId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'UNCATEGORIZED',
    timeLimit: 0,
    attempts: -1
  });
  const [questions, setQuestions] = useState([
    {
      question: '',
      options: ['', ''],
      correctAnswer: 0,
      points: 1
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load test data for editing
  useEffect(() => {
    if (isEditing && editTestId) {
      loadTestForEditing();
    }
  }, [isEditing, editTestId]);

  const loadTestForEditing = async () => {
    try {
      setLoadingTest(true);
      const response = await testsAPI.getTest(editTestId);
      const test = response.data;

      setFormData({
        title: test.title || '',
        description: test.description || '',
        category: test.category || 'UNCATEGORIZED',
        timeLimit: test.duration || 0,
        attempts: -1
      });

      if (test.questions && test.questions.length > 0) {
        const formattedQuestions = test.questions.map(q => ({
          question: q.questionText || '',
          options: q.options.map(opt => opt.text || ''),
          correctAnswer: q.options.findIndex(opt => opt.isCorrect) || 0,
          points: q.marks || 1
        }));
        setQuestions(formattedQuestions);
      }
    } catch (err) {
      setError('Failed to load test for editing.');
      console.error('Error loading test:', err);
    } finally {
      setLoadingTest(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push('');
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length > 2) {
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      // Adjust correct answer if necessary
      if (updatedQuestions[questionIndex].correctAnswer >= optionIndex) {
        updatedQuestions[questionIndex].correctAnswer = Math.max(0, updatedQuestions[questionIndex].correctAnswer - 1);
      }
      setQuestions(updatedQuestions);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', ''],
        correctAnswer: 0,
        points: 1
      }
    ]);
  };

  const removeQuestion = (questionIndex) => {
    if (questions.length > 1) {
      const updatedQuestions = questions.filter((_, index) => index !== questionIndex);
      setQuestions(updatedQuestions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate form
    if (!formData.title.trim()) {
      setError('Test title is required');
      setLoading(false);
      return;
    }

    if (questions.some(q => !q.question.trim())) {
      setError('All questions must have text');
      setLoading(false);
      return;
    }

    if (questions.some(q => q.options.some(opt => !opt.trim()))) {
      setError('All options must be filled');
      setLoading(false);
      return;
    }

    try {
      // Format questions for backend
      const formattedQuestions = questions.map(q => ({
        questionText: q.question,
        options: q.options.map((text, index) => ({
          text,
          isCorrect: index === q.correctAnswer
        })),
        marks: q.points
      }));

      const testData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration: parseInt(formData.timeLimit),
        difficulty: 'Intermediate', // Default difficulty
        subject: formData.category,
        questions: formattedQuestions
      };

      if (isEditing) {
        await testsAPI.updateTest(editTestId, testData);
        setSuccess('Test updated successfully!');
      } else {
        await testsAPI.createTest(testData);
        setSuccess('Test created successfully!');
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} test. Please try again.`);
      console.error(`Error ${isEditing ? 'updating' : 'creating'} test:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: '1200px' }}>
      {loadingTest ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <Row>
            <Col>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{isEditing ? 'Edit Test' : 'Create New Test'}</h2>
                <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </div>
            </Col>
          </Row>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Test Information</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col lg={8} md={7} sm={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Enter test title"
                    required
                  />
                </Form.Group>
              </Col>
              <Col lg={4} md={5} sm={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                  >
                    <option value="UNCATEGORIZED">UNCATEGORIZED</option>
                    <option value="SCIENCE">SCIENCE</option>
                    <option value="MATH">MATH</option>
                    <option value="HISTORY">HISTORY</option>
                    <option value="LANGUAGE">LANGUAGE</option>
                    <option value="PROGRAMMING">PROGRAMMING</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Enter test description (optional)"
              />
            </Form.Group>

            <Row>
              <Col lg={6} md={6} sm={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Time Limit (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="timeLimit"
                    value={formData.timeLimit}
                    onChange={handleFormChange}
                    min="0"
                    placeholder="0 for no time limit"
                  />
                  <Form.Text className="text-muted">
                    Set to 0 for no time limit
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col lg={6} md={6} sm={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Attempts Allowed</Form.Label>
                  <Form.Control
                    type="number"
                    name="attempts"
                    value={formData.attempts}
                    onChange={handleFormChange}
                    min="-1"
                    placeholder="-1 for unlimited attempts"
                  />
                  <Form.Text className="text-muted">
                    Set to -1 for unlimited attempts
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0">Questions ({questions.length})</h5>
            <Button variant="outline-success" size="sm" onClick={addQuestion}>
              <i className="bi bi-plus"></i> Add Question
            </Button>
          </Card.Header>
          <Card.Body>
            {questions.map((question, questionIndex) => (
              <Card key={questionIndex} className="mb-3 question-card">
                <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <span>Question {questionIndex + 1}</span>
                  {questions.length > 1 && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => removeQuestion(questionIndex)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Question Text *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={question.question}
                      onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                      placeholder="Enter your question"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Options</Form.Label>
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="d-flex align-items-center mb-2 flex-wrap gap-1">
                        <Form.Check
                          type="radio"
                          name={`correct-${questionIndex}`}
                          checked={question.correctAnswer === optionIndex}
                          onChange={() => handleQuestionChange(questionIndex, 'correctAnswer', optionIndex)}
                          className="me-2 flex-shrink-0"
                          style={{ minWidth: 'auto' }}
                        />
                        <Form.Control
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          required
                          className="flex-grow-1"
                          style={{ minWidth: '200px' }}
                        />
                        {question.options.length > 2 && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="ms-2 flex-shrink-0"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                          >
                            <i className="bi bi-x"></i>
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => addOption(questionIndex)}
                    >
                      <i className="bi bi-plus"></i> Add Option
                    </Button>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Points</Form.Label>
                    <Form.Control
                      type="number"
                      value={question.points}
                      onChange={(e) => handleQuestionChange(questionIndex, 'points', parseInt(e.target.value))}
                      min="1"
                      max="10"
                      style={{ width: '80px' }}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Test' : 'Create Test'
            )}
          </Button>
        </div>
      </Form>
        </>
      )}
    </Container>
  );
}

export default CreateTest;