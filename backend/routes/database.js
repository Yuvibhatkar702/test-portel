const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const Result = require('../models/Result');
const User = require('../models/User');

// @route   DELETE /api/database/clear-all
// @desc    Clear all data from the database (tests, results, users)
// @access  Public (for development/testing only - should be protected in production)
router.delete('/clear-all', async (req, res) => {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Count existing data before deletion
    const testCount = await Test.countDocuments();
    const resultCount = await Result.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`Found ${testCount} tests, ${resultCount} results, ${userCount} users`);
    
    // Delete all data
    const deleteResults = await Promise.all([
      Test.deleteMany({}),
      Result.deleteMany({}),
      User.deleteMany({})
    ]);
    
    const deletedTests = deleteResults[0].deletedCount;
    const deletedResults = deleteResults[1].deletedCount;
    const deletedUsers = deleteResults[2].deletedCount;
    
    console.log('✅ Database cleanup completed');
    console.log(`Deleted: ${deletedTests} tests, ${deletedResults} results, ${deletedUsers} users`);
    
    res.json({
      success: true,
      message: 'All database data cleared successfully',
      deletedCounts: {
        tests: deletedTests,
        results: deletedResults,
        users: deletedUsers,
        total: deletedTests + deletedResults + deletedUsers
      },
      summary: `Cleared ${deletedTests + deletedResults + deletedUsers} total records from database`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    res.status(500).json({ 
      error: 'Failed to clear database', 
      message: error.message 
    });
  }
});

// @route   DELETE /api/database/clear-tests
// @desc    Clear only test data (tests and related results)
// @access  Public (for development/testing only)
router.delete('/clear-tests', async (req, res) => {
  try {
    console.log('🗑️  Clearing test data...');
    
    const testCount = await Test.countDocuments();
    const resultCount = await Result.countDocuments();
    
    // Delete all tests and their results
    const deleteResults = await Promise.all([
      Test.deleteMany({}),
      Result.deleteMany({})
    ]);
    
    const deletedTests = deleteResults[0].deletedCount;
    const deletedResults = deleteResults[1].deletedCount;
    
    console.log(`✅ Deleted ${deletedTests} tests and ${deletedResults} results`);
    
    res.json({
      success: true,
      message: 'Test data cleared successfully',
      deletedCounts: {
        tests: deletedTests,
        results: deletedResults
      },
      summary: `Cleared ${deletedTests} tests and ${deletedResults} results`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error.message);
    res.status(500).json({ 
      error: 'Failed to clear test data', 
      message: error.message 
    });
  }
});

// @route   DELETE /api/database/clear-results
// @desc    Clear only result data
// @access  Public (for development/testing only)
router.delete('/clear-results', async (req, res) => {
  try {
    console.log('🗑️  Clearing result data...');
    
    const resultCount = await Result.countDocuments();
    const deleteResult = await Result.deleteMany({});
    const deletedResults = deleteResult.deletedCount;
    
    console.log(`✅ Deleted ${deletedResults} results`);
    
    res.json({
      success: true,
      message: 'Result data cleared successfully',
      deletedCounts: {
        results: deletedResults
      },
      summary: `Cleared ${deletedResults} results`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error clearing result data:', error.message);
    res.status(500).json({ 
      error: 'Failed to clear result data', 
      message: error.message 
    });
  }
});

// @route   GET /api/database/status
// @desc    Get database status and record counts
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const testCount = await Test.countDocuments();
    const resultCount = await Result.countDocuments();
    const userCount = await User.countDocuments();
    
    // Get some sample data for verification
    const sampleTest = await Test.findOne().lean();
    const sampleResult = await Result.findOne().lean();
    
    res.json({
      status: 'connected',
      recordCounts: {
        tests: testCount,
        results: resultCount,
        users: userCount,
        total: testCount + resultCount + userCount
      },
      sampleData: {
        hasTests: !!sampleTest,
        hasResults: !!sampleResult,
        latestTestTitle: sampleTest?.title || 'None',
        latestResultScore: sampleResult?.percentage || 'None'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting database status:', error.message);
    res.status(500).json({ 
      error: 'Failed to get database status', 
      message: error.message 
    });
  }
});

module.exports = router;