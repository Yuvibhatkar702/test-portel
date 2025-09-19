import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { testsAPI } from '../services/api';

function ImportTest() {
  const navigate = useNavigate();
  const [importMethod, setImportMethod] = useState('json');
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState(null);

  const sampleJSON = {
    title: "Sample Imported Test",
    description: "This is a test imported from JSON",
    category: "IMPORTED",
    timeLimit: 30,
    attempts: 3,
    questions: [
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
        points: 1
      },
      {
        question: "Which planet is closest to the Sun?",
        options: ["Venus", "Mercury", "Earth", "Mars"],
        correctAnswer: 1,
        points: 1
      }
    ]
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          setPreviewData(parsed);
        } else if (file.name.endsWith('.csv')) {
          parseCSV(content);
        }
      } catch (err) {
        setError('Failed to parse file. Please check the format.');
      }
    };
    
    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      setError('Unsupported file format. Please use JSON or CSV files.');
    }
  };

  const parseCSV = (content) => {
    // Simple CSV parser for demo purposes
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setError('CSV file must have at least a header and one data row.');
      return;
    }

    // Assuming CSV format: Question, Option1, Option2, Option3, Option4, CorrectAnswer, Points
    const questions = [];
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
      if (columns.length >= 6) {
        questions.push({
          question: columns[0],
          options: [columns[1], columns[2], columns[3], columns[4]].filter(opt => opt),
          correctAnswer: parseInt(columns[5]) || 0,
          points: parseInt(columns[6]) || 1
        });
      }
    }

    const testData = {
      title: "Imported from CSV",
      description: "Test imported from CSV file",
      category: "IMPORTED",
      questions: questions
    };

    setPreviewData(testData);
  };

  const handleJSONInput = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setPreviewData(parsed);
      setError('');
    } catch (err) {
      setError('Invalid JSON format. Please check your syntax.');
    }
  };

  const handleImport = async () => {
    if (!previewData) {
      setError('Please provide test data to import.');
      return;
    }

    // Validate required fields
    if (!previewData.title || !previewData.questions || previewData.questions.length === 0) {
      setError('Test must have a title and at least one question.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await testsAPI.createTest(previewData);
      setSuccess('Test imported successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Failed to import test. Please try again.');
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = (format) => {
    let content, filename, type;
    
    if (format === 'json') {
      content = JSON.stringify(sampleJSON, null, 2);
      filename = 'sample-test.json';
      type = 'application/json';
    } else {
      content = [
        'Question,Option1,Option2,Option3,Option4,CorrectAnswer,Points',
        '"What is the capital of France?","London","Berlin","Paris","Madrid",2,1',
        '"Which planet is closest to the Sun?","Venus","Mercury","Earth","Mars",1,1'
      ].join('\n');
      filename = 'sample-test.csv';
      type = 'text/csv';
    }

    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <i className="bi bi-upload me-2"></i>
                Import Test
              </h2>
              <p className="text-muted mt-2">Import tests from JSON or CSV files to quickly add multiple questions.</p>
            </div>
            <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
              <i className="bi bi-arrow-left me-1"></i>
              Back to Dashboard
            </Button>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Import Method</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Choose Import Method</Form.Label>
                  <Form.Select 
                    value={importMethod} 
                    onChange={(e) => setImportMethod(e.target.value)}
                  >
                    <option value="json">JSON File</option>
                    <option value="csv">CSV File</option>
                    <option value="text">JSON Text</option>
                  </Form.Select>
                </Form.Group>

                {importMethod === 'json' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Upload JSON File</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                    />
                    <Form.Text className="text-muted">
                      Upload a JSON file containing test data. <br/>
                      <Button variant="link" className="p-0" onClick={() => downloadSample('json')}>
                        Download sample JSON file
                      </Button>
                    </Form.Text>
                  </Form.Group>
                )}

                {importMethod === 'csv' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Upload CSV File</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                    />
                    <Form.Text className="text-muted">
                      CSV should have columns: Question, Option1, Option2, Option3, Option4, CorrectAnswer, Points <br/>
                      <Button variant="link" className="p-0" onClick={() => downloadSample('csv')}>
                        Download sample CSV file
                      </Button>
                    </Form.Text>
                  </Form.Group>
                )}

                {importMethod === 'text' && (
                  <Form.Group className="mb-3">
                    <Form.Label>JSON Text</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={10}
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      placeholder="Paste your JSON test data here..."
                    />
                    <div className="mt-2">
                      <Button variant="outline-secondary" size="sm" onClick={handleJSONInput}>
                        Parse JSON
                      </Button>
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => setJsonText(JSON.stringify(sampleJSON, null, 2))}
                      >
                        Use Sample Data
                      </Button>
                    </div>
                  </Form.Group>
                )}
              </Form>
            </Card.Body>
          </Card>

          {previewData && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Preview</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Title:</strong> {previewData.title} <br/>
                  <strong>Description:</strong> {previewData.description || 'No description'} <br/>
                  <strong>Category:</strong> <Badge bg="secondary">{previewData.category || 'UNCATEGORIZED'}</Badge> <br/>
                  <strong>Questions:</strong> {previewData.questions?.length || 0} <br/>
                  {previewData.timeLimit > 0 && (
                    <>
                      <strong>Time Limit:</strong> {previewData.timeLimit} minutes <br/>
                    </>
                  )}
                </div>

                <h6>Questions Preview:</h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <Table size="sm" striped>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Question</th>
                        <th>Options</th>
                        <th>Correct</th>
                        <th>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.questions?.map((q, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{q.question}</td>
                          <td>{q.options?.length || 0} options</td>
                          <td>#{(q.correctAnswer || 0) + 1}</td>
                          <td>{q.points || 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                <div className="mt-3">
                  <Button 
                    variant="success" 
                    onClick={handleImport}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Importing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check me-1"></i>
                        Import Test
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    className="ms-2"
                    onClick={() => setPreviewData(null)}
                  >
                    Clear
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Import Guidelines
              </h6>
            </Card.Header>
            <Card.Body>
              <h6>JSON Format Requirements:</h6>
              <ul className="small">
                <li>Must include "title" and "questions" fields</li>
                <li>Each question needs "question", "options", and "correctAnswer"</li>
                <li>correctAnswer is the index (0-based) of the correct option</li>
                <li>Optional fields: description, category, timeLimit, attempts</li>
              </ul>

              <h6 className="mt-3">CSV Format:</h6>
              <ul className="small">
                <li>First row must be the header</li>
                <li>Columns: Question, Option1-4, CorrectAnswer, Points</li>
                <li>CorrectAnswer is 0-based index (0 for first option)</li>
                <li>Empty options are automatically filtered out</li>
              </ul>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-lightbulb me-2"></i>
                Tips
              </h6>
            </Card.Header>
            <Card.Body>
              <ul className="small mb-0">
                <li>Always preview your data before importing</li>
                <li>Use sample files as templates for your imports</li>
                <li>Questions with missing options or invalid correct answers will be skipped</li>
                <li>Large imports may take a moment to process</li>
                <li>You can edit the imported test after creation</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ImportTest;