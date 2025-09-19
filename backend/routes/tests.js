const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const mongoose = require('mongoose');
const Result = require('../models/Result');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// @route   GET /api/tests
// @desc    Get all active tests
// @access  Public
router.get('/', async (req, res) => {
  try {
    const tests = await Test.find({ status: 'Active' })
      .populate('createdBy', 'firstName lastName email')
      .select('-questions.correctAnswer -questions.explanation') // Hide sensitive data
      .sort({ createdAt: -1 });

    // Add computed fields for frontend compatibility
    const testsWithStats = tests.map(test => ({
      ...test.toObject(),
      id: test._id,
      questions: test.questions.length,
      attempts: test.totalAttempts || 0
    }));

    res.json(testsWithStats);
  } catch (error) {
    console.error('Error fetching tests:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   GET /api/tests/:id
// @desc    Get test by ID (with questions for taking test)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid test ID format' });
    }

    const test = await Test.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Return test with questions but hide correct answers
    const testData = test.toObject();
    testData.id = test._id;
    testData.questions = testData.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options.map(opt => ({ text: opt.text })), // Hide isCorrect field
      marks: q.marks
    }));

    res.json(testData);
  } catch (error) {
    console.error('Error fetching test:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid test ID format' });
    }
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   POST /api/tests
// @desc    Create a new test
// @access  Public (for now)
router.post('/', [
  body('title', 'Title is required').trim().isLength({ min: 1 }),
  body('subject', 'Subject is required').trim().isLength({ min: 1 }),
  body('description', 'Description is required').trim().isLength({ min: 1 }),
  body('duration', 'Duration must be a positive number').isInt({ min: 1 }),
  body('difficulty', 'Difficulty must be specified').isIn(['Beginner', 'Intermediate', 'Advanced']),
  body('category', 'Category is required').trim().isLength({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Create default admin user if doesn't exist
    let defaultUser = await User.findOne({ email: 'admin@testportal.com' });
    if (!defaultUser) {
      defaultUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@testportal.com',
        password: 'admin123',
        role: 'admin'
      });
      await defaultUser.save();
    }

    const newTest = new Test({
      ...req.body,
      createdBy: defaultUser._id,
      questions: req.body.questions || [],
      status: 'Active'
    });

    const test = await newTest.save();
    await test.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      ...test.toObject(),
      id: test._id,
      questions: test.questions.length
    });
  } catch (error) {
    console.error('Error creating test:', error.message);
    res.status(400).json({ error: 'Failed to create test', message: error.message });
  }
});

// @route   PUT /api/tests/:id
// @desc    Update a test
// @access  Public (for now)
router.put('/:id', async (req, res) => {
  try {
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid test ID format' });
    }

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({
      ...test.toObject(),
      id: test._id,
      questions: test.questions.length
    });
  } catch (error) {
    console.error('Error updating test:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid test ID format' });
    }
    res.status(400).json({ error: 'Failed to update test', message: error.message });
  }
});

// @route   DELETE /api/tests/:id
// @desc    Delete a test and all related data
// @access  Public (for now)
router.delete('/:id', async (req, res) => {
  try {
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid test ID format' });
    }

    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Delete all results associated with this test
    const deletedResults = await Result.deleteMany({ test: req.params.id });

    // Delete the test
    await Test.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Test deleted successfully',
      test: { id: test._id, title: test.title },
      cascadeDeleted: { results: deletedResults.deletedCount }
    });
  } catch (error) {
    console.error('Error deleting test:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid test ID format' });
    }
    res.status(500).json({ error: 'Failed to delete test', message: error.message });
  }
});

// @route   POST /api/tests/:id/submit
// @desc    Submit test answers and get results
// @access  Public
router.post('/:id/submit', async (req, res) => {
  try {
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid test ID format' });
    }

    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const { answers, userName, userEmail, timeTaken } = req.body;

    // Validate required fields
    if (!userName || !userEmail || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing required fields: userName, userEmail, answers' });
    }

    // Calculate score
    let correctAnswers = 0;
    const detailedResults = [];

    test.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const correctOption = question.options.findIndex(option => option.isCorrect);
      const isCorrect = userAnswer === correctOption;
      
      if (isCorrect) {
        correctAnswers++;
      }

      detailedResults.push({
        questionIndex: index,
        question: question.questionText,
        userAnswer: userAnswer >= 0 ? question.options[userAnswer]?.text : 'Not answered',
        correctAnswer: question.options[correctOption]?.text,
        isCorrect,
        marks: isCorrect ? question.marks : 0
      });
    });

    const totalQuestions = test.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const totalMarks = test.questions.reduce((sum, q) => sum + q.marks, 0);
    const obtainedMarks = detailedResults.reduce((sum, result) => sum + result.marks, 0);

    // Create result record
    const result = new Result({
      test: test._id,
      userName,
      userEmail,
      answers,
      correctAnswers,
      totalQuestions,
      percentage,
      obtainedMarks,
      totalMarks,
      timeTaken: timeTaken || 0,
      submittedAt: new Date(),
      detailedResults
    });

    await result.save();

    // Update test statistics
    await Test.findByIdAndUpdate(test._id, {
      $inc: { totalAttempts: 1 }
    });

    res.status(201).json({
      message: 'Test submitted successfully',
      result: {
        _id: result._id,
        correctAnswers,
        totalQuestions,
        percentage,
        obtainedMarks,
        totalMarks,
        timeTaken,
        detailedResults: detailedResults.map(r => ({
          question: r.question,
          userAnswer: r.userAnswer,
          correctAnswer: r.correctAnswer,
          isCorrect: r.isCorrect
        }))
      }
    });

  } catch (error) {
    console.error('Error submitting test:', error.message);
    res.status(500).json({ error: 'Failed to submit test', message: error.message });
  }
});

module.exports = router;