const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  explanation: {
    type: String,
    trim: true
  },
  marks: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  }
}, {
  _id: true
});

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 300 // max 5 hours in minutes
  },
  totalMarks: {
    type: Number,
    min: 1
  },
  questions: [questionSchema],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Inactive', 'Archived'],
    default: 'Draft'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  instructions: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: 'Please read all questions carefully and select the best answer.'
  },
  passingScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 60
  },
  negativeMarking: {
    enabled: {
      type: Boolean,
      default: false
    },
    penalty: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.25
    }
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  avgScore: {
    type: Number,
    default: 0
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for question count
testSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Index for better performance
testSchema.index({ subject: 1, status: 1 });
testSchema.index({ category: 1 });
testSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate totalMarks and validate questions
testSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, question) => sum + question.marks, 0);
    
    // Validate that each question has at least one correct answer
    for (let question of this.questions) {
      const hasCorrectAnswer = question.options.some(option => option.isCorrect === true);
      if (!hasCorrectAnswer) {
        const err = new Error('Each question must have at least one correct answer');
        return next(err);
      }
    }
  }
  next();
});

module.exports = mongoose.model('Test', testSchema);