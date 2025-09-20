import React, { useState } from 'react';
import { Container, Card, Button, Alert, Spinner, Accordion } from 'react-bootstrap';

const ScoreDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState(null);

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

  const fixTestQuestions = async () => {
    setFixing(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/test-fix/comprehensive-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setFixResult(result);
      
      // Re-run debug analysis to show updated results
      setTimeout(() => {
        runDebugAnalysis();
      }, 1000);
      
    } catch (error) {
      setError('Failed to fix test questions: ' + error.message);
      console.error('Fix failed:', error);
    }
    setFixing(false);
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
          <h4>🔍 Scoring System Debugger</h4>
          <p className="mb-0">This tool analyzes test questions to identify why all scores show 0%</p>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <Button 
              variant="primary" 
              onClick={runDebugAnalysis}
              disabled={loading || fixing}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Analyzing Test Structure...
                </>
              ) : (
                '� Run Debug Analysis'
              )}
            </Button>

            {debugInfo && debugInfo.issues.length > 0 && (
              <Button 
                variant="success" 
                onClick={fixTestQuestions}
                disabled={loading || fixing}
              >
                {fixing ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Fixing Questions...
                  </>
                ) : (
                  '🔧 Fix Test Questions'
                )}
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="danger">
              <h6>❌ Error Running Analysis</h6>
              <p className="mb-0">{error}</p>
              <small className="text-muted">
                Make sure the backend server is running on http://localhost:3001
              </small>
            </Alert>
          )}

          {fixResult && (
            <Alert variant="success" className="mb-3">
              <h6>✅ Comprehensive Fix Applied Successfully!</h6>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Summary:</strong></p>
                  <ul>
                    <li>Total Tests: {fixResult.summary?.totalTests}</li>
                    <li>Tests Fixed: <span className="text-success">{fixResult.summary?.testsFixed}</span></li>
                    <li>Already Correct: {fixResult.summary?.testsAlreadyCorrect}</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  {fixResult.testCalculation && (
                    <div>
                      <p><strong>Test Calculation Verification:</strong></p>
                      <small>
                        Test "{fixResult.testCalculation.testTitle}" simulation:<br/>
                        • Should score: 100% (all correct)<br/>
                        • Actually scores: <span className={fixResult.testCalculation.percentage === 100 ? 'text-success' : 'text-danger'}>
                          {fixResult.testCalculation.percentage}%
                        </span><br/>
                        • Questions: {fixResult.testCalculation.correctAnswers}/{fixResult.testCalculation.totalQuestions}
                      </small>
                    </div>
                  )}
                </div>
              </div>
              
              {fixResult.fixedTestDetails?.length > 0 && (
                <div className="mt-3">
                  <strong>Fixed Tests:</strong>
                  <ul className="mb-0 mt-2">
                    {fixResult.fixedTestDetails.map((test, index) => (
                      <li key={index}>
                        <strong>{test.title}</strong> - Fixed {test.questionsFixed}/{test.totalQuestions} questions
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {fixResult.recommendations && (
                <div className="mt-3 p-2 bg-info bg-opacity-10 rounded">
                  <strong>📋 Next Steps:</strong>
                  <ul className="mb-0 mt-1">
                    {fixResult.recommendations.map((rec, index) => (
                      <li key={index}><small>{rec}</small></li>
                    ))}
                  </ul>
                </div>
              )}
            </Alert>
          )}

          {debugInfo && (
            <div>
              <Alert variant="info" className="mb-3">
                <h6>📊 Analysis Summary</h6>
                <ul className="mb-0">
                  <li><strong>Total Tests:</strong> {debugInfo.totalTests}</li>
                  <li><strong>Total Results:</strong> {debugInfo.totalResults}</li>
                  <li><strong>Issues Found:</strong> {debugInfo.issues.length}</li>
                </ul>
              </Alert>

              {debugInfo.issues.length > 0 && (
                <Alert variant="warning" className="mb-3">
                  <h6>⚠️ Issues Detected:</h6>
                  <ul className="mb-0">
                    {debugInfo.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {debugInfo.sampleResults.length > 0 && (
                <Alert variant={debugInfo.sampleResults.every(r => r.percentage === 0) ? 'danger' : 'success'} className="mb-3">
                  <h6>📈 Sample Results Analysis:</h6>
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
                  
                  {debugInfo.sampleResults.every(r => r.percentage === 0) && !fixResult && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <strong>🚨 CRITICAL ISSUE:</strong> All results show 0% scores!<br/>
                      <small>This typically means test questions don't have correct answers properly marked.</small><br/>
                      <small><strong>💡 Solution:</strong> Click the "🔧 Fix Test Questions" button above to automatically fix this issue.</small>
                    </div>
                  )}
                  
                  {debugInfo.sampleResults.every(r => r.percentage === 0) && fixResult && (
                    <div className="mt-2 p-2 bg-success bg-opacity-10 rounded">
                      <strong>✅ ISSUE RESOLVED:</strong> Test questions have been fixed!<br/>
                      <small>New test attempts should now show correct scores. Existing results in the database will remain at 0% as they were calculated with the old question structure.</small><br/>
                      <small><strong>📝 Next Steps:</strong> You may want to manually review the correct answers for each test to ensure accuracy.</small>
                    </div>
                  )}
                </Alert>
              )}

              {debugInfo.testAnalysis.length > 0 && (
                <Card className="mt-3">
                  <Card.Header>
                    <h6>🧪 Detailed Test Analysis</h6>
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