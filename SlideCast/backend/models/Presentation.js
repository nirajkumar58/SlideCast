import mongoose from 'mongoose';

const presentationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  totalSlides: {
    type: Number,
    required: true,
    min: 1
  },
  mode: {
    type: String,
    enum: ['overview', 'per-slide', 'dual'],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  audioScript: {
    type: String
  },
  audioData: [{
    role: String,
    filename: String,
    path: String
  }],
  hasAudio: {
    type: Boolean,
    default: false
  },
  audioMode: {
    type: String,
    enum: ['single', 'dual']
  },
  processingStatus: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  error: {
    type: String
  },
  errorDetails: {
    type: String
  }
}, {
  timestamps: true
});

// Add indexes for common queries
presentationSchema.index({ processingStatus: 1 });
presentationSchema.index({ createdAt: -1 });

// Add methods for status updates
presentationSchema.methods.updateProgress = async function(progress) {
  this.processingProgress = progress;
  return this.save();
};

presentationSchema.methods.markCompleted = async function(content, audioData = null) {
  this.processingStatus = 'completed';
  this.processingProgress = 100;
  this.content = content;
  if (audioData) {
    this.audioData = audioData;
    this.hasAudio = true;
  }
  return this.save();
};

presentationSchema.methods.markFailed = async function(error, details = null) {
  this.processingStatus = 'failed';
  this.error = error;
  if (details) {
    this.errorDetails = JSON.stringify(details);
  }
  return this.save();
};

// Add virtual for processing duration
presentationSchema.virtual('processingDuration').get(function() {
  if (!this.createdAt) return null;
  const end = this.updatedAt || new Date();
  return (end - this.createdAt) / 1000; // Duration in seconds
});

// Ensure virtuals are included in JSON output
presentationSchema.set('toJSON', { virtuals: true });
presentationSchema.set('toObject', { virtuals: true });

const Presentation = mongoose.model('Presentation', presentationSchema);

export default Presentation;
