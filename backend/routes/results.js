const express = require('express');
const router = express.Router();
const Result = require('../models/Result');

// Helper functions
const getGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// @route   GET /api/results
// @desc    Get all results with enhanced data for shared links
// @access  Public
router.get('/', async (req, res) => {
  try {
    const results = await Result.find()
      .populate('test', 'title category description duration totalMarks')
      .sort({ submittedAt: -1 })
      .lean();

    // Add computed fields and format data
    const formattedResults = results.map(result => ({
      ...result,
      id: result._id,
      testTitle: result.test?.title || 'Unknown Test',
      testCategory: result.test?.category || 'Unknown',
      grade: getGrade(result.percentage),
      isPassed: result.percentage >= 60,
      violationSummary: {
        total: result.totalViolations || 0,
        tabSwitches: result.tabSwitches || 0,
        hasViolations: (result.totalViolations || 0) > 0
      },
      isSharedLink: result.accessMethod === 'shared_link',
      timeTakenFormatted: formatTime(result.timeTaken || 0)
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching results:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   GET /api/results/test/:testId
// @desc    Get results for a specific test
// @access  Public
router.get('/test/:testId', async (req, res) => {
  try {
    const results = await Result.find({ test: req.params.testId })
      .populate('test', 'title category')
      .sort({ submittedAt: -1 })
      .lean();

    const formattedResults = results.map(result => ({
      ...result,
      id: result._id,
      grade: getGrade(result.percentage),
      isPassed: result.percentage >= 60,
      isSharedLink: result.accessMethod === 'shared_link',
      timeTakenFormatted: formatTime(result.timeTaken || 0)
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching test results:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   GET /api/results/shared-links
// @desc    Get all results from shared link access
// @access  Public
router.get('/shared-links', async (req, res) => {
  try {
    const results = await Result.find({ accessMethod: 'shared_link' })
      .populate('test', 'title category description duration totalMarks')
      .sort({ submittedAt: -1 })
      .lean();

    const formattedResults = results.map(result => ({
      ...result,
      id: result._id,
      testTitle: result.test?.title || 'Unknown Test',
      grade: getGrade(result.percentage),
      isPassed: result.percentage >= 60,
      timeTakenFormatted: formatTime(result.timeTaken || 0)
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching shared link results:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   GET /api/results/shared-links
// @desc    Get results from shared link submissions only (for admin dashboard)
// @access  Public (should be protected in production)
router.get('/shared-links', async (req, res) => {
  try {
    const results = await Result.find({ accessMethod: 'shared_link' })
      .populate('test', 'title category description duration totalMarks')
      .sort({ submittedAt: -1 })
      .lean();

    // Add computed fields and format data specifically for admin view
    const formattedResults = results.map(result => ({
      ...result,
      id: result._id,
      testTitle: result.test?.title || 'Unknown Test',
      testCategory: result.test?.category || 'Unknown',
      grade: getGrade(result.percentage),
      isPassed: result.percentage >= 60,
      violationSummary: {
        total: result.totalViolations || 0,
        tabSwitches: result.tabSwitches || 0,
        hasViolations: (result.totalViolations || 0) > 0,
        details: result.violations || []
      },
      isSharedLink: true,
      timeTakenFormatted: formatTime(result.timeTaken || 0),
      securityStatus: (result.totalViolations || 0) > 2 ? 'High Risk' : 
                     (result.totalViolations || 0) > 0 ? 'Low Risk' : 'Clean'
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching shared link results:', error.message);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   GET /api/results/:id
// @desc    Get result by ID with detailed information
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('test', 'title category questions totalMarks duration')
      .lean();

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const formattedResult = {
      ...result,
      id: result._id,
      grade: getGrade(result.percentage),
      isPassed: result.percentage >= 60,
      isSharedLink: result.accessMethod === 'shared_link',
      timeTakenFormatted: formatTime(result.timeTaken || 0)
    };

    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching result:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// @route   DELETE /api/results/:id
// @desc    Delete a result
// @access  Public (should be protected in production)
router.delete('/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    await Result.findByIdAndDelete(req.params.id);

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;