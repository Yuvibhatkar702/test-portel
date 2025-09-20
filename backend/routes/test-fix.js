const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const Result = require('../models/Result');

// @route   POST /api/test-fix/comprehensive-fix
// @desc    Comprehensive fix for all scoring issues
// @access  Public (for debugging only)
router.post('/comprehensive-fix', async (req, res) => {
  try {
    const tests = await Test.find();
    let fixedTests = 0;
    const fixedTestDetails = [];
    const debugInfo = [];
    
    for (let test of tests) {
      const testDebug = {
        testId: test._id,
        title: test.title,
        originalQuestions: [],
        fixedQuestions: [],
        needsFix: false
      };
      
      let testNeedsFix = false;
      
      // Analyze each question
      for (let i = 0; i < test.questions.length; i++) {
        const question = test.questions[i];
        
        // Store original question structure for debugging
        testDebug.originalQuestions.push({
          index: i,
          questionText: question.questionText?.substring(0, 50) + '...',
          options: question.options.map((opt, idx) => ({
            index: idx,
            text: opt.text?.substring(0, 20) + '...',
            isCorrect: opt.isCorrect
          })),
          hasCorrectAnswer: question.options.some(opt => opt.isCorrect === true)
        });
        
        // Check if any option is marked as correct
        const hasCorrectAnswer = question.options.some(option => option.isCorrect === true);
        
        if (!hasCorrectAnswer && question.options.length > 0) {
          // No correct answer found - set the first option as correct by default
          question.options[0].isCorrect = true;
          testNeedsFix = true;
          testDebug.needsFix = true;
          
          testDebug.fixedQuestions.push({
            index: i,
            action: 'Set first option as correct',
            optionIndex: 0,
            optionText: question.options[0].text?.substring(0, 30) + '...'
          });
        }
      }
      
      debugInfo.push(testDebug);
      
      if (testNeedsFix) {
        await test.save();
        fixedTests++;
        
        fixedTestDetails.push({
          testId: test._id,
          title: test.title,
          questionsFixed: testDebug.fixedQuestions.length,
          totalQuestions: test.questions.length
        });
      }
    }
    
    // Test score calculation with a sample test
    let testCalculation = null;
    if (tests.length > 0) {
      const sampleTest = tests[0];
      if (sampleTest.questions.length > 0) {
        // Simulate correct answers for all questions
        const simulatedAnswers = sampleTest.questions.map(q => 
          q.options.findIndex(opt => opt.isCorrect === true)
        );
        
        // Calculate score using the same logic as the submission endpoint
        let correctAnswers = 0;
        sampleTest.questions.forEach((question, index) => {
          const userAnswer = simulatedAnswers[index];
          const correctOption = question.options.findIndex(option => option.isCorrect);
          if (userAnswer === correctOption) {
            correctAnswers++;
          }
        });
        
        const totalQuestions = sampleTest.questions.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        testCalculation = {
          testId: sampleTest._id,
          testTitle: sampleTest.title,
          totalQuestions,
          simulatedAnswers,
          correctAnswers,
          percentage,
          shouldBe100Percent: simulatedAnswers.every(ans => ans >= 0)
        };
      }
    }
    
    res.json({
      success: true,
      message: `Comprehensive fix completed`,
      summary: {
        totalTests: tests.length,
        testsFixed: fixedTests,
        testsAlreadyCorrect: tests.length - fixedTests
      },
      fixedTestDetails,
      debugInfo: debugInfo.slice(0, 3), // First 3 tests for review
      testCalculation,
      recommendations: [
        fixedTests > 0 ? '✅ Tests have been fixed with default correct answers' : 'ℹ️ All tests already had correct answers marked',
        '⚠️ Please review each test manually to ensure the correct answers are actually correct',
        '🎯 New test submissions should now show proper scores',
        '📝 Existing results will remain at 0% as they were calculated with the old structure'
      ]
    });
    
  } catch (error) {
    console.error('Error in comprehensive fix:', error.message);
    res.status(500).json({ 
      error: 'Comprehensive fix failed', 
      message: error.message 
    });
  }
});

// @route   POST /api/test-fix/test-submission-simulation
// @desc    Simulate a test submission to verify scoring works
// @access  Public (for debugging only)
router.post('/test-submission-simulation/:testId', async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // Create different answer scenarios
    const scenarios = [];
    
    // Scenario 1: All correct answers
    const allCorrectAnswers = test.questions.map(q => 
      q.options.findIndex(opt => opt.isCorrect === true)
    );
    
    // Scenario 2: All wrong answers (first option if not correct, otherwise second)
    const allWrongAnswers = test.questions.map(q => {
      const correctIndex = q.options.findIndex(opt => opt.isCorrect === true);
      if (correctIndex === 0 && q.options.length > 1) return 1;
      return 0;
    });
    
    // Scenario 3: Half correct answers
    const halfCorrectAnswers = test.questions.map((q, index) => {
      if (index % 2 === 0) {
        return q.options.findIndex(opt => opt.isCorrect === true);
      } else {
        const correctIndex = q.options.findIndex(opt => opt.isCorrect === true);
        return correctIndex === 0 ? 1 : 0;
      }
    });
    
    const testScenarios = [
      { name: 'All Correct', answers: allCorrectAnswers },
      { name: 'All Wrong', answers: allWrongAnswers },
      { name: 'Half Correct', answers: halfCorrectAnswers }
    ];
    
    testScenarios.forEach(scenario => {
      let correctAnswers = 0;
      const detailedResults = [];
      
      test.questions.forEach((question, index) => {
        const userAnswer = scenario.answers[index];
        const correctOption = question.options.findIndex(option => option.isCorrect);
        const isCorrect = userAnswer === correctOption;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        detailedResults.push({
          questionIndex: index,
          userAnswer,
          correctOption,
          isCorrect,
          questionHasCorrectAnswer: correctOption >= 0
        });
      });
      
      const totalQuestions = test.questions.length;
      const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      scenarios.push({
        scenario: scenario.name,
        answers: scenario.answers,
        correctAnswers,
        totalQuestions,
        percentage,
        detailedResults: detailedResults.slice(0, 3) // First 3 for brevity
      });
    });
    
    res.json({
      testId: test._id,
      testTitle: test.title,
      totalQuestions: test.questions.length,
      questionStructure: test.questions.map((q, i) => ({
        index: i,
        hasCorrectAnswer: q.options.some(opt => opt.isCorrect === true),
        correctOptionIndex: q.options.findIndex(opt => opt.isCorrect === true),
        optionCount: q.options.length
      })),
      simulationResults: scenarios,
      analysis: {
        allQuestionsHaveCorrectAnswers: test.questions.every(q => 
          q.options.some(opt => opt.isCorrect === true)
        ),
        questionsWithoutCorrectAnswers: test.questions.filter(q => 
          !q.options.some(opt => opt.isCorrect === true)
        ).length
      }
    });
    
  } catch (error) {
    console.error('Error in test simulation:', error.message);
    res.status(500).json({ 
      error: 'Test simulation failed', 
      message: error.message 
    });
  }
});

module.exports = router;