const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const Result = require('../models/Result');


router.get('/test-structure', async (req, res) => {
  try {
    const tests = await Test.find().lean();
    const results = await Result.find().limit(5).lean();
    
    const analysis = {
      totalTests: tests.length,
      totalResults: results.length,
      testAnalysis: [],
      sampleResults: results.map(r => ({
        percentage: r.percentage,
        correctAnswers: r.correctAnswers,
        totalQuestions: r.totalQuestions,
        calculatedPercentage: r.totalQuestions > 0 ? Math.round((r.correctAnswers / r.totalQuestions) * 100) : 0
      })),
      issues: []
    };
    
    // Analyze each test
    tests.forEach((test, index) => {
      if (index < 5) { // Only analyze first 5 tests
        const testAnalysis = {
          testId: test._id,
          title: test.title,
          questionCount: test.questions?.length || 0,
          questionsWithCorrectAnswers: 0,
          questionsWithoutCorrectAnswers: 0,
          sampleQuestions: []
        };
        
        if (test.questions && test.questions.length > 0) {
          test.questions.forEach((question, qIndex) => {
            if (qIndex < 2) { // Sample first 2 questions
              const correctOptionIndex = question.options?.findIndex(opt => opt.isCorrect === true);
              const hasCorrectAnswer = correctOptionIndex >= 0;
              
              testAnalysis.sampleQuestions.push({
                questionIndex: qIndex,
                questionText: question.questionText?.substring(0, 50) + '...',
                optionCount: question.options?.length || 0,
                correctOptionIndex: correctOptionIndex,
                hasCorrectAnswer: hasCorrectAnswer,
                options: question.options?.map((opt, i) => ({
                  index: i,
                  text: opt.text?.substring(0, 30) + '...',
                  isCorrect: opt.isCorrect
                })) || []
              });
              
              if (hasCorrectAnswer) {
                testAnalysis.questionsWithCorrectAnswers++;
              } else {
                testAnalysis.questionsWithoutCorrectAnswers++;
              }
            }
          });
        }
        
        analysis.testAnalysis.push(testAnalysis);
        
        // Identify issues
        if (testAnalysis.questionsWithoutCorrectAnswers > 0) {
          analysis.issues.push(`Test "${test.title}" has ${testAnalysis.questionsWithoutCorrectAnswers} questions without correct answers`);
        }
      }
    });
    
    // Check for universal 0% scores issue
    const allZeroScores = results.every(r => r.percentage === 0);
    if (allZeroScores && results.length > 0) {
      analysis.issues.push("CRITICAL: All results show 0% scores - likely indicates no questions have correct answers marked");
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Error in debug analysis:', error.message);
    res.status(500).json({ error: 'Debug analysis failed', message: error.message });
  }
});

// @route   GET /api/debug/score-calculation/:testId
// @desc    Test the score calculation logic for a specific test
// @access  Public (for debugging only)
router.get('/score-calculation/:testId', async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId).lean();
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // Simulate different answer patterns
    const simulationResults = [];
    
    // Test 1: All correct answers
    if (test.questions && test.questions.length > 0) {
      const allCorrectAnswers = test.questions.map(q => 
        q.options?.findIndex(opt => opt.isCorrect) || -1
      );
      
      let correctCount = 0;
      test.questions.forEach((question, index) => {
        const userAnswer = allCorrectAnswers[index];
        const correctOption = question.options?.findIndex(option => option.isCorrect);
        if (userAnswer === correctOption && correctOption >= 0) {
          correctCount++;
        }
      });
      
      simulationResults.push({
        scenario: 'All Correct Answers',
        userAnswers: allCorrectAnswers,
        correctCount: correctCount,
        totalQuestions: test.questions.length,
        percentage: Math.round((correctCount / test.questions.length) * 100)
      });
      
      // Test 2: All wrong answers (index 0 if not correct)
      const allWrongAnswers = test.questions.map(q => {
        const correctIndex = q.options?.findIndex(opt => opt.isCorrect) || 0;
        return correctIndex === 0 ? 1 : 0; // Pick different index than correct
      });
      
      correctCount = 0;
      test.questions.forEach((question, index) => {
        const userAnswer = allWrongAnswers[index];
        const correctOption = question.options?.findIndex(option => option.isCorrect);
        if (userAnswer === correctOption && correctOption >= 0) {
          correctCount++;
        }
      });
      
      simulationResults.push({
        scenario: 'All Wrong Answers',
        userAnswers: allWrongAnswers,
        correctCount: correctCount,
        totalQuestions: test.questions.length,
        percentage: Math.round((correctCount / test.questions.length) * 100)
      });
    }
    
    res.json({
      testId: test._id,
      testTitle: test.title,
      questionCount: test.questions?.length || 0,
      simulationResults,
      questionStructure: test.questions?.map((q, i) => ({
        index: i,
        hasOptions: !!q.options,
        optionCount: q.options?.length || 0,
        correctOptionIndex: q.options?.findIndex(opt => opt.isCorrect),
        hasCorrectAnswer: q.options?.some(opt => opt.isCorrect === true)
      })) || []
    });
    
  } catch (error) {
    console.error('Error in score calculation debug:', error.message);
    res.status(500).json({ error: 'Score calculation debug failed', message: error.message });
  }
});

module.exports = router;