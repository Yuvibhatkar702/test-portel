const mongoose = require('mongoose');

const detailedResultSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  userAnswer: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  marks: {
    type: Number,
    required: true,
    default: 0
  }
});

const resultSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  // Additional student information for shared links
  rollNumber: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  accessMethod: {
    type: String,
    enum: ['direct', 'shared_link'],
    default: 'direct'
  },
  shareableLink: {
    type: String,
    trim: true
  },
  answers: [{
    type: Number, // Array of selected answer indices
    default: -1
  }],
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  obtainedMarks: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  timeTaken: {
    type: Number, // in seconds
    min: 0,
    default: 0
  },
  detailedResults: [detailedResultSchema],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // Security and monitoring data
  violations: [{
    type: {
      type: String,
      // Accepted violation type identifiers. Frontend should send these snake_case values.
      // Legacy or display names are mapped in frontend before submission.
      enum: [
        'tab_switch',
        'camera_lost',
        'fullscreen_exit',
        'window_blur',
        'window_exit',
        'page_exit',
        'shortcut_attempt',
        'copy_attempt',
        'right_click'
      ]
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    count: {
      type: Number,
      default: 1
    }
  }],
  totalViolations: {
    type: Number,
    default: 0
  },
  tabSwitches: {
    type: Number,
    default: 0
  },
  autoSubmitted: {
    type: Boolean,
    default: false
  },
  examLocked: {
    type: Boolean,
    default: false
  },
  submissionReason: {
    type: String,
    enum: ['manual', 'time_expired', 'security_violations', 'auto_submit'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Virtual for pass/fail status (assuming 60% passing score)
resultSchema.virtual('isPassed').get(function() {
  return this.percentage >= 60;
});

// Virtual for grade calculation
resultSchema.virtual('grade').get(function() {
  const percentage = this.percentage;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
});

// Index for better performance
resultSchema.index({ test: 1, submittedAt: -1 });
resultSchema.index({ userEmail: 1, submittedAt: -1 });
resultSchema.index({ accessMethod: 1 });
resultSchema.index({ shareableLink: 1 });
resultSchema.index({ percentage: -1 });

module.exports = mongoose.model('Result', resultSchema);