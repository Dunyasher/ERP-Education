const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const lessonSchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  content: {
    videoUrl: String,
    videoDuration: Number, // in seconds
    notesPdf: String,
    slidesPdf: String,
    resources: [{
      name: String,
      url: String,
      type: {
        type: String,
        enum: ['pdf', 'video', 'link', 'document']
      }
    }]
  },
  assignment: {
    title: String,
    description: String,
    dueDate: Date,
    maxMarks: Number,
    instructions: String
  },
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      marks: Number
    }],
    totalMarks: Number,
    timeLimit: Number // in minutes
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate SR No before saving
lessonSchema.pre('save', async function(next) {
  if (!this.srNo) {
    this.srNo = await generateSerialNumber('LES');
  }
  next();
});

module.exports = mongoose.model('Lesson', lessonSchema);

