const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    trim: true,
    default: ''
  },
  questionImage: {
    type: String, // Base64 encoded image data
    default: null
  },
  options: [{
    text: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String, // Base64 encoded image data
      default: null
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
  // Shareable link functionality
  shareableLink: {
    type: String,
    unique: true,
    index: true
  },
  linkExpiry: {
    type: Date
  },
  linkActive: {
    type: Boolean,
    default: true
  },
  allowAnonymous: {
    type: Boolean,
    default: true
  },
  maxAttempts: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  // Security settings
  proctoring: {
    cameraRequired: {
      type: Boolean,
      default: true
    },
    fullscreenRequired: {
      type: Boolean,
      default: true
    },
    tabSwitchLimit: {
      type: Number,
      default: 3
    },
    preventCopy: {
      type: Boolean,
      default: true
    }
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
  // Only validate questions if questions array is being modified or is new
  if (this.questions && this.questions.length > 0 && (this.isModified('questions') || this.isNew)) {
    this.totalMarks = this.questions.reduce((sum, question) => sum + question.marks, 0);
    
    // Validate that each question has either text or image
    for (let question of this.questions) {
      if (!question.questionText && !question.questionImage) {
        const err = new Error('Each question must have either text or an image');
        return next(err);
      }
      
      // Validate options
      if (question.options && question.options.length > 0) {
        // Check that each option has either text or image
        for (let option of question.options) {
          if (!option.text && !option.image) {
            const err = new Error('Each option must have either text or an image');
            return next(err);
          }
        }
        
        // Validate that each question has at least one correct answer
        const hasCorrectAnswer = question.options.some(option => option.isCorrect === true);
        if (!hasCorrectAnswer) {
          const err = new Error('Each question must have at least one correct answer');
          return next(err);
        }
      }
    }
  }
  
  // Generate shareable link if not exists
  if (!this.shareableLink) {
    this.shareableLink = this.generateShareableLink();
  }
  
  next();
});

// Method to generate unique shareable link
testSchema.methods.generateShareableLink = function() {
  const crypto = require('crypto');
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `exam-${timestamp}-${randomStr}`;
};

// Method to generate shareable URL
testSchema.methods.getShareableUrl = function(baseUrl = 'http://localhost:3000') {
  return `${baseUrl}/take-exam/${this.shareableLink}`;
};

// Method to check if link is valid
testSchema.methods.isLinkValid = function() {
  if (!this.linkActive) return false;
  if (this.linkExpiry && new Date() > this.linkExpiry) return false;
  if (this.status !== 'Active') return false;
  return true;
};

module.exports = mongoose.model('Test', testSchema);