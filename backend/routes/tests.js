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
    const testData = {
      ...test.toObject(),
      questions: test.questions.map(q => ({
        ...q.toObject(),
        options: q.options.map(opt => ({
          text: opt.text,
          _id: opt._id
        }))
      }))
    };

    res.json(testData);
  } catch (error) {
    console.error('Error fetching test:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   GET /api/tests/share/:shareableLink
// @desc    Get test by shareable link
// @access  Public
router.get('/share/:shareableLink', async (req, res) => {
  try {
    const test = await Test.findOne({ shareableLink: req.params.shareableLink })
      .populate('createdBy', 'firstName lastName email');

    if (!test) {
      return res.status(404).json({ error: 'Test not found or link expired' });
    }

    // Check if link is valid
    if (!test.isLinkValid()) {
      return res.status(410).json({ 
        error: 'Test link has expired or is no longer active',
        linkExpired: true 
      });
    }

    // Return test with questions but hide correct answers
    const testData = {
      ...test.toObject(),
      questions: test.questions.map(q => ({
        ...q.toObject(),
        options: q.options.map(opt => ({
          text: opt.text,
          _id: opt._id
        }))
      }))
    };

    res.json(testData);
  } catch (error) {
    console.error('Error fetching test by shareable link:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   POST /api/tests/:id/generate-link
// @desc    Generate or refresh shareable link for a test
// @access  Public (should be protected in production)
router.post('/:id/generate-link', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid test ID format' });
    }

    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Generate new link
    const newShareableLink = test.generateShareableLink();
    
    // Prepare update data
    const updateData = {
      shareableLink: newShareableLink,
      linkActive: true
    };
    
    // Set expiry if provided
    if (req.body.expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(req.body.expiryDays));
      updateData.linkExpiry = expiryDate;
    }

    // Update security settings if provided
    if (req.body.proctoring) {
      updateData.proctoring = { ...test.proctoring, ...req.body.proctoring };
    }

    // Use findByIdAndUpdate to avoid validation issues
    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false } // Disable validators for this update
    );

    const baseUrl = req.protocol + '://' + req.get('host');
    // Convert backend URL to frontend URL
    const frontendUrl = baseUrl.replace(':3001', ':3000');
    const shareableUrl = updatedTest.getShareableUrl(frontendUrl);

    res.json({
      success: true,
      shareableLink: updatedTest.shareableLink,
      shareableUrl: shareableUrl,
      linkExpiry: updatedTest.linkExpiry,
      linkActive: updatedTest.linkActive,
      proctoring: updatedTest.proctoring
    });
  } catch (error) {
    console.error('Error generating shareable link:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   PUT /api/tests/:id/link-settings
// @desc    Update link settings (active status, expiry, etc.)
// @access  Public (should be protected in production)  
router.put('/:id/link-settings', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid test ID format' });
    }

    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Prepare update data
    const updateData = {};

    // Update link settings
    if (req.body.linkActive !== undefined) {
      updateData.linkActive = req.body.linkActive;
    }

    if (req.body.expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(req.body.expiryDays));
      updateData.linkExpiry = expiryDate;
    }

    if (req.body.removeExpiry) {
      updateData.linkExpiry = undefined;
    }

    if (req.body.proctoring) {
      updateData.proctoring = { ...test.proctoring, ...req.body.proctoring };
    }

    // Use findByIdAndUpdate to avoid validation issues
    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false } // Disable validators for this update
    );

    res.json({
      success: true,
      linkActive: updatedTest.linkActive,
      linkExpiry: updatedTest.linkExpiry,
      proctoring: updatedTest.proctoring
    });
  } catch (error) {
    console.error('Error updating link settings:', error.message);
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

    const { 
      answers, 
      userName, 
      userEmail, 
      timeTaken,
      violations,
      totalViolations,
      tabSwitches,
      autoSubmitted,
      examLocked,
      submissionReason,
      rollNumber,
      phone,
      accessMethod,
      shareableLink
    } = req.body;

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

      // Ensure correctAnswer is always a string, never undefined
      const correctAnswerText = correctOption >= 0 && question.options[correctOption] 
        ? question.options[correctOption].text 
        : 'No correct answer defined';

      const userAnswerText = userAnswer >= 0 && question.options[userAnswer] 
        ? question.options[userAnswer].text 
        : 'Not answered';

      detailedResults.push({
        questionIndex: index,
        question: question.questionText || 'Question text not available',
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect,
        marks: isCorrect ? (question.marks || 1) : 0
      });
    });

    const totalQuestions = test.questions.length;
    
    // Ensure correctAnswers is a valid number
    const validCorrectAnswers = Math.max(0, parseInt(correctAnswers) || 0);
    const validTotalQuestions = Math.max(1, totalQuestions); // Prevent division by zero
    
    // Calculate percentage with validation
    const percentage = Math.round((validCorrectAnswers / validTotalQuestions) * 100);
    
    const totalMarks = test.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const obtainedMarks = detailedResults.reduce((sum, result) => sum + (result.marks || 0), 0);

    console.log('Result calculation debug:', {
      correctAnswers: validCorrectAnswers,
      totalQuestions: validTotalQuestions,
      percentage,
      totalMarks,
      obtainedMarks
    });

    // Create result record
    const result = new Result({
      test: test._id,
      userName,
      userEmail,
      rollNumber: rollNumber || '',
      phone: phone || '',
      accessMethod: accessMethod || 'direct',
      shareableLink: shareableLink || '',
      answers,
      correctAnswers: validCorrectAnswers,
      totalQuestions: validTotalQuestions,
      percentage,
      obtainedMarks,
      totalMarks,
      timeTaken: timeTaken || 0,
      detailedResults,
      submittedAt: new Date(),
      violations: violations || [],
      totalViolations: totalViolations || 0,
      tabSwitches: tabSwitches || 0,
      autoSubmitted: autoSubmitted || false,
      examLocked: examLocked || false,
      submissionReason: submissionReason || 'manual'
    });

    await result.save();

    // Update test statistics
    await Test.findByIdAndUpdate(test._id, {
      $inc: { totalAttempts: 1 }
    });

    // For shared link submissions, return minimal information
    if (accessMethod === 'shared_link') {
      res.status(201).json({
        message: 'Test submitted successfully',
        submissionId: result._id,
        submittedAt: result.submittedAt,
        testTitle: test.title,
        isSharedLink: true
      });
    } else {
      // For direct submissions, return full result details (admin view)
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
    }

  } catch (error) {
    console.error('Error submitting test:', error.message);
    res.status(500).json({ error: 'Failed to submit test', message: error.message });
  }
});

module.exports = router;