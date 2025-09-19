const express = require('express');
const router = express.Router();
const Result = require('../models/Result');

// @route   GET /api/results
// @desc    Get all results
// @access  Public
router.get('/', async (req, res) => {
  try {
    const results = await Result.find()
      .populate('testId', 'title category')
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/results/test/:testId
// @desc    Get results for a specific test
// @access  Public
router.get('/test/:testId', async (req, res) => {
  try {
    const results = await Result.find({ testId: req.params.testId })
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/results/user/:userId
// @desc    Get results for a specific user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const results = await Result.find({ userId: req.params.userId })
      .populate('testId', 'title category')
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/results/:id
// @desc    Get result by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('testId', 'title category questions')
      .populate('userId', 'name email');

    if (!result) {
      return res.status(404).json({ msg: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Result not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/results/:id
// @desc    Delete a result
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ msg: 'Result not found' });
    }

    await Result.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Result removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Result not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;