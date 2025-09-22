import React, { useState } from 'react';
import { Container, Card, Button, Alert, Spinner, Accordion } from 'react-bootstrap';

const ScoreDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDebugAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/debug/test-structure');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setError(error.message);
      console.error('Debug analysis failed:', error);
    }
    setLoading(false);
  };

  const renderTestAnalysis = (testAnalysis) => (
    <Accordion.Item eventKey={testAnalysis.testId} key={testAnalysis.testId}>
      <Accordion.Header>
        {testAnalysis.title} 
        <span className="ms-2 text-muted">
          ({testAnalysis.questionCount} questions, {testAnalysis.questionsWithCorrectAnswers} with correct answers)
        </span>
      </Accordion.Header>
      <Accordion.Body>
        <div className="row">
          <div className="col-md-6">
            <h6>Test Overview:</h6>
            <ul>
              <li>Total Questions: {testAnalysis.questionCount}</li>
              <li>Questions with correct answers: <span className="text-success">{testAnalysis.questionsWithCorrectAnswers}</span></li>
              <li>Questions without correct answers: <span className="text-danger">{testAnalysis.questionsWithoutCorrectAnswers}</span></li>
            </ul>
          </div>
          <div className="col-md-6">
            <h6>Sample Questions:</h6>
            {testAnalysis.sampleQuestions.map((q, index) => (
              <div key={index} className="mb-2 p-2 border rounded">
                <small>
                  <strong>Q{q.questionIndex + 1}:</strong> {q.questionText}<br/>
                  <strong>Options ({q.optionCount}):</strong> Correct at index {q.correctOptionIndex >= 0 ? q.correctOptionIndex : 'NONE'}<br/>
                  <strong>Has Correct Answer:</strong> 
                  <span className={q.hasCorrectAnswer ? 'text-success' : 'text-danger'}>
                    {q.hasCorrectAnswer ? ' YES' : ' NO'}
                  </span>
                </small>
              </div>
            ))}
          </div>
        </div>
      </Accordion.Body>
    </Accordion.Item>
  );

  return (
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h4>Scoring System Debugger</h4>
          <p className="mb-0">This tool analyzes test questions to identify why all scores show 0%</p>
        </Card.Header>
        <Card.Body>
          <Button 
            variant="primary" 
            onClick={runDebugAnalysis}
            disabled={loading}
            className="mb-3"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Analyzing Test Structure...
              </>
            ) : (
              'Run Analysis'
            )}
          </Button>

          {error && (
            <Alert variant="danger">
              <h6>Error Running Analysis</h6>
              <p className="mb-0">{error}</p>
              <small className="text-muted">
                Make sure the backend server is running on http://localhost:3001
              </small>
            </Alert>
          )}

          {debugInfo && (
            <div>
              <Alert variant="info" className="mb-3">
                <h6>Analysis Summary</h6>
                <ul className="mb-0">
                  <li><strong>Total Tests:</strong> {debugInfo.totalTests}</li>
                  <li><strong>Total Results:</strong> {debugInfo.totalResults}</li>
                  <li><strong>Issues Found:</strong> {debugInfo.issues.length}</li>
                </ul>
              </Alert>

              {debugInfo.issues.length > 0 && (
                <Alert variant="warning" className="mb-3">
                  <h6>Issues Detected:</h6>
                  <ul className="mb-0">
                    {debugInfo.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {debugInfo.sampleResults.length > 0 && (
                <Alert variant={debugInfo.sampleResults.every(r => r.percentage === 0) ? 'danger' : 'success'} className="mb-3">
                  <h6>Sample Results Analysis:</h6>
                  {debugInfo.sampleResults.map((result, index) => (
                    <div key={index} className="mb-1">
                      <strong>Result {index + 1}:</strong> {result.percentage}% 
                      ({result.correctAnswers}/{result.totalQuestions} correct)
                      {result.percentage !== result.calculatedPercentage && (
                        <span className="text-warning ms-2">
                          [Expected: {result.calculatedPercentage}%]
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {debugInfo.sampleResults.every(r => r.percentage === 0) && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <strong>CRITICAL ISSUE:</strong> All results show 0% scores!<br/>
                      <small>This typically means test questions don't have correct answers properly marked.</small>
                    </div>
                  )}
                </Alert>
              )}

              {debugInfo.testAnalysis.length > 0 && (
                <Card className="mt-3">
                  <Card.Header>
                    <h6>Detailed Test Analysis</h6>
                  </Card.Header>
                  <Card.Body>
                    <Accordion>
                      {debugInfo.testAnalysis.map(renderTestAnalysis)}
                    </Accordion>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ScoreDebugger;