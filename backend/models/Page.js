const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  content: {
    type: String,
    required: true
  },
  pageType: {
    type: String,
    enum: ['home', 'about', 'courses', 'faculty', 'contact', 'custom'],
    default: 'custom'
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  featuredImage: String,
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Page', pageSchema);

