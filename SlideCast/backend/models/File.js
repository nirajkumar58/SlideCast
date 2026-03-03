import mongoose from 'mongoose';
import crypto from 'crypto';

const slideSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true
  },
  textContent: {
    type: String,
    required: true
  },
  audioFileId: mongoose.Schema.Types.ObjectId,
  duration: Number,
  enhancements: {
    additionalPoints: [String],
    statistics: Map,
    newsUpdates: [String],
    notes: [String]
  }
});

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  pptFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  pdfFileId: mongoose.Schema.Types.ObjectId,
  fileSize: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'converting', 'completed', 'failed'],
    default: 'processing'
  },
  slides: [slideSchema],
  shareableLink: {
    type: String,
    unique: true
  },
  audioConfig: {
    mode: String,
    voices: [{
      role: String,
      voiceId: String
    }],
    playbackSettings: {
      speed: Number,
      noiseReduction: {
        enabled: Boolean,
        level: Number
      },
      clarity: {
        enabled: Boolean,
        level: Number
      },
      equalizer: {
        enabled: Boolean,
        frequencies: [Number],
        gains: [Number]
      }
    }
  }
}, {
  timestamps: true
});

// Generate shareable link before saving
fileSchema.pre('save', function(next) {
  if (!this.shareableLink) {
    // Generate a random string
    const randomBytes = crypto.randomBytes(16);
    // Convert to URL-safe base64 and remove non-alphanumeric characters
    this.shareableLink = randomBytes.toString('base64url');
  }
  next();
});

// Add index for faster lookups
fileSchema.index({ shareableLink: 1 });

const File = mongoose.model('File', fileSchema);

export default File;
