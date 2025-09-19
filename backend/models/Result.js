const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedAnswer: {
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
    required: true
  },
  marksObtained: {
    type: Number,
    required: true
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0
  }
});

const resultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  answers: [answerSchema],
  score: {
    obtained: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    }
  },
  timeTaken: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['started', 'in-progress', 'completed', 'abandoned', 'expired'],
    default: 'completed'
  },
  attempt: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 1000
    }
  }
}, {
  timestamps: true
});

// Virtual for pass/fail status
resultSchema.virtual('isPassed').get(function() {
  return this.score.percentage >= 60; // Default passing score
});

// Virtual for grade calculation
resultSchema.virtual('grade').get(function() {
  const percentage = this.score.percentage;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
});

// Index for better performance
resultSchema.index({ user: 1, test: 1 });
resultSchema.index({ user: 1, createdAt: -1 });
resultSchema.index({ test: 1, createdAt: -1 });
resultSchema.index({ status: 1 });
resultSchema.index({ 'score.percentage': -1 });

// Pre-save middleware to calculate percentage
resultSchema.pre('save', function(next) {
  if (this.score.total > 0) {
    this.score.percentage = Math.round((this.score.obtained / this.score.total) * 100 * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('Result', resultSchema);