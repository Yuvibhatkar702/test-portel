import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Image, Modal } from 'react-bootstrap';
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
      questionImage: null,
      questionImagePreview: null,
      options: ['', ''],
      optionImages: [null, null],
      optionImagePreviews: [null, null],
      correctAnswer: 0,
      points: 1,
      questionType: 'text' // 'text', 'image', 'mixed'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageType, setCurrentImageType] = useState(''); // 'question' or 'option'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);

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
          questionImage: q.questionImage || null,
          questionImagePreview: q.questionImage || null,
          options: q.options.map(opt => opt.text || ''),
          optionImages: q.options.map(opt => opt.image || null),
          optionImagePreviews: q.options.map(opt => opt.image || null),
          correctAnswer: q.options.findIndex(opt => opt.isCorrect) || 0,
          points: q.marks || 1,
          questionType: q.questionImage ? (q.questionText ? 'mixed' : 'image') : 'text'
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
    updatedQuestions[questionIndex].optionImages.push(null);
    updatedQuestions[questionIndex].optionImagePreviews.push(null);
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length > 2) {
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      updatedQuestions[questionIndex].optionImages.splice(optionIndex, 1);
      updatedQuestions[questionIndex].optionImagePreviews.splice(optionIndex, 1);
      // Adjust correct answer if necessary
      if (updatedQuestions[questionIndex].correctAnswer >= optionIndex) {
        updatedQuestions[questionIndex].correctAnswer = Math.max(0, updatedQuestions[questionIndex].correctAnswer - 1);
      }
      setQuestions(updatedQuestions);
    }
  };

  // Image handling functions
  const handleQuestionImageUpload = (questionIndex, file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].questionImage = file;
        updatedQuestions[questionIndex].questionImagePreview = e.target.result;
        updatedQuestions[questionIndex].questionType = 
          updatedQuestions[questionIndex].question ? 'mixed' : 'image';
        setQuestions(updatedQuestions);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptionImageUpload = (questionIndex, optionIndex, file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].optionImages[optionIndex] = file;
        updatedQuestions[questionIndex].optionImagePreviews[optionIndex] = e.target.result;
        setQuestions(updatedQuestions);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeQuestionImage = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].questionImage = null;
    updatedQuestions[questionIndex].questionImagePreview = null;
    updatedQuestions[questionIndex].questionType = 'text';
    setQuestions(updatedQuestions);
  };

  const removeOptionImage = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].optionImages[optionIndex] = null;
    updatedQuestions[questionIndex].optionImagePreviews[optionIndex] = null;
    setQuestions(updatedQuestions);
  };

  const [imageModalShow, setImageModalShow] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');

  const openImageModal = (imageSrc) => {
    setModalImageSrc(imageSrc);
    setImageModalShow(true);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        questionImage: null,
        questionImagePreview: null,
        options: ['', ''],
        optionImages: [null, null],
        optionImagePreviews: [null, null],
        correctAnswer: 0,
        points: 1,
        questionType: 'text'
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

    // Check if questions have either text or image
    if (questions.some(q => !q.question.trim() && !q.questionImage)) {
      setError('All questions must have either text or an image');
      setLoading(false);
      return;
    }

    // Check if options have either text or image
    if (questions.some(q => q.options.some((opt, idx) => !opt.trim() && !q.optionImages[idx]))) {
      setError('All options must have either text or an image');
      setLoading(false);
      return;
    }

    try {
      // Helper function to compress and convert image to base64
      const compressImage = (file, maxWidth = 800, quality = 0.8) => {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            // Draw and compress the image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64 with compression
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          };
          
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });
      };

      // Helper function to convert file to base64 (fallback for non-images)
      const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      };

      // Format questions for backend with image support and compression
      const formattedQuestions = await Promise.all(questions.map(async (q) => {
        // Convert and compress question image if present
        let questionImageData = null;
        if (q.questionImage) {
          try {
            // Try to compress if it's an image
            questionImageData = await compressImage(q.questionImage);
          } catch (error) {
            // Fallback to regular base64 conversion
            questionImageData = await fileToBase64(q.questionImage);
          }
        }

        // Convert and compress option images if present
        const optionData = await Promise.all(q.options.map(async (text, index) => {
          let optionImageData = null;
          if (q.optionImages[index]) {
            try {
              // Try to compress if it's an image
              optionImageData = await compressImage(q.optionImages[index], 400, 0.7); // Smaller size for options
            } catch (error) {
              // Fallback to regular base64 conversion
              optionImageData = await fileToBase64(q.optionImages[index]);
            }
          }

          return {
            text,
            image: optionImageData,
            isCorrect: index === q.correctAnswer
          };
        }));

        return {
          questionText: q.question,
          questionImage: questionImageData,
          options: optionData,
          marks: q.points
        };
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
                    <Form.Label>Question Text</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={question.question}
                      onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                      placeholder="Enter your question"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Question Image</Form.Label>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleQuestionImageUpload(questionIndex, file);
                          }
                        }}
                        size="sm"
                        style={{ maxWidth: '200px' }}
                      />
                      {question.questionImagePreview && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeQuestionImage(questionIndex)}
                          title="Remove image"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      )}
                    </div>
                    {question.questionImagePreview && (
                      <div className="mt-2">
                        <Image
                          src={question.questionImagePreview}
                          alt="Question preview"
                          thumbnail
                          style={{ maxWidth: '200px', maxHeight: '150px', cursor: 'pointer' }}
                          onClick={() => openImageModal(question.questionImagePreview)}
                        />
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Options</Form.Label>
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="mb-3">
                        <div className="d-flex align-items-center mb-2 flex-wrap gap-1">
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
                            placeholder={`Option ${optionIndex + 1} text`}
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
                        
                        <div className="d-flex align-items-center gap-2 ms-4">
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleOptionImageUpload(questionIndex, optionIndex, file);
                              }
                            }}
                            size="sm"
                            style={{ maxWidth: '180px' }}
                            placeholder="Option image"
                          />
                          {question.optionImagePreviews[optionIndex] && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeOptionImage(questionIndex, optionIndex)}
                              title="Remove option image"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </div>
                        
                        {question.optionImagePreviews[optionIndex] && (
                          <div className="mt-2 ms-4">
                            <Image
                              src={question.optionImagePreviews[optionIndex]}
                              alt={`Option ${optionIndex + 1} preview`}
                              thumbnail
                              style={{ maxWidth: '120px', maxHeight: '80px', cursor: 'pointer' }}
                              onClick={() => openImageModal(question.optionImagePreviews[optionIndex])}
                            />
                          </div>
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

      {/* Image Modal */}
      <Modal
        show={imageModalShow}
        onHide={() => setImageModalShow(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <Image
            src={modalImageSrc}
            alt="Full size preview"
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
        </Modal.Body>
      </Modal>
        </>
      )}
    </Container>
  );
}

export default CreateTest;