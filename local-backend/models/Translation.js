const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Translation data
  inputText: {
    type: String,
    required: function() { return this.translationType === 'text-to-braille'; },
    maxlength: [5000, 'Input text cannot exceed 5000 characters']
  },
  outputText: {
    type: String,
    required: true,
    maxlength: [10000, 'Output text cannot exceed 10000 characters']
  },
  
  // Translation type
  translationType: {
    type: String,
    enum: ['text-to-braille', 'braille-to-text', 'image-to-braille', 'image-to-text'],
    required: true
  },
  
  // Image data (for image translations)
  imageData: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadDate: Date
  },
  
  // Detection confidence (from Railway backend)
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  
  // Metadata
  language: {
    type: String,
    enum: ['es', 'en', 'fr'],
    default: 'es'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  
  // Quality metrics
  accuracy: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  userRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  
  // Mobile app support
  deviceInfo: {
    platform: {
      type: String,
      enum: ['web', 'android', 'ios'],
      default: 'web'
    },
    appVersion: String,
    deviceModel: String
  },
  
  // Processing info
  processingTime: {
    type: Number, // milliseconds
    default: null
  },
  railwayBackendUsed: {
    type: Boolean,
    default: false
  },
  errorLogs: [{
    timestamp: Date,
    error: String,
    stack: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
translationSchema.index({ userId: 1, createdAt: -1 });
translationSchema.index({ translationType: 1 });
translationSchema.index({ language: 1 });
translationSchema.index({ isPublic: 1 });
translationSchema.index({ createdAt: -1 });

// Virtual for word count
translationSchema.virtual('wordCount').get(function() {
  if (!this.inputText) return 0;
  return this.inputText.trim().split(/\s+/).length;
});

// Virtual for character count
translationSchema.virtual('characterCount').get(function() {
  return (this.inputText || '').length;
});

// Pre-save middleware to update timestamp
translationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to add error log
translationSchema.methods.addErrorLog = function(error) {
  this.errorLogs.push({
    timestamp: new Date(),
    error: error.message,
    stack: error.stack
  });
  return this.save();
};

// Instance method to update user rating
translationSchema.methods.setRating = function(rating, feedback) {
  this.userRating = rating;
  if (feedback) this.feedback = feedback;
  return this.save();
};

// Static method to get user translation stats
translationSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$translationType',
        count: { $sum: 1 },
        avgRating: { $avg: '$userRating' },
        totalWords: { $sum: '$wordCount' },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);
};

// Static method to get global translation stats
translationSchema.statics.getGlobalStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalTranslations: { $sum: 1 },
        textToBraille: { 
          $sum: { $cond: [{ $eq: ['$translationType', 'text-to-braille'] }, 1, 0] }
        },
        brailleToText: { 
          $sum: { $cond: [{ $eq: ['$translationType', 'braille-to-text'] }, 1, 0] }
        },
        imageToBraille: { 
          $sum: { $cond: [{ $eq: ['$translationType', 'image-to-braille'] }, 1, 0] }
        },
        avgRating: { $avg: '$userRating' },
        avgProcessingTime: { $avg: '$processingTime' },
        railwayUsage: { 
          $sum: { $cond: ['$railwayBackendUsed', 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get recent translations
translationSchema.statics.getRecentTranslations = function(limit = 10) {
  return this.find({ isPublic: true })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('inputText outputText translationType confidence createdAt');
};

// Static method to get popular translations
translationSchema.statics.getPopularTranslations = function(limit = 10) {
  return this.find({ isPublic: true, userRating: { $gte: 4 } })
    .populate('userId', 'name avatar')
    .sort({ userRating: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to search translations
translationSchema.statics.searchTranslations = function(query, userId = null) {
  const searchQuery = {
    $or: [
      { inputText: { $regex: query, $options: 'i' } },
      { outputText: { $regex: query, $options: 'i' } }
    ]
  };
  
  if (userId) {
    searchQuery.userId = mongoose.Types.ObjectId(userId);
  } else {
    searchQuery.isPublic = true;
  }
  
  return this.find(searchQuery)
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50);
};

module.exports = mongoose.model('Translation', translationSchema);