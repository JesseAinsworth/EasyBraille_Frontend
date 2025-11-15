const mongoose = require('mongoose');

const keyboardActionSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Practice session data
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Action details
  actionType: {
    type: String,
    enum: ['keypress', 'session_start', 'session_end', 'practice_complete'],
    required: true
  },
  
  // Key data (for keypress actions)
  keyPressed: {
    type: String,
    maxlength: 10
  },
  expectedKey: {
    type: String,
    maxlength: 10
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  
  // Timing data
  responseTime: {
    type: Number, // milliseconds
    min: 0,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Practice context
  practiceMode: {
    type: String,
    enum: ['letters', 'numbers', 'punctuation', 'words', 'sentences', 'mixed'],
    default: 'letters'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // Session metrics (for session_end actions)
  sessionStats: {
    totalKeys: { type: Number, min: 0 },
    correctKeys: { type: Number, min: 0 },
    accuracy: { type: Number, min: 0, max: 100 },
    wpm: { type: Number, min: 0 }, // words per minute
    duration: { type: Number, min: 0 }, // seconds
    errorsCount: { type: Number, min: 0 }
  },
  
  // Mobile app support
  deviceInfo: {
    platform: {
      type: String,
      enum: ['web', 'android', 'ios'],
      default: 'web'
    },
    screenSize: String,
    inputMethod: {
      type: String,
      enum: ['physical_keyboard', 'virtual_keyboard', 'braille_display'],
      default: 'virtual_keyboard'
    }
  },
  
  // Additional metadata
  language: {
    type: String,
    enum: ['es', 'en', 'fr'],
    default: 'es'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
keyboardActionSchema.index({ userId: 1, timestamp: -1 });
keyboardActionSchema.index({ sessionId: 1 });
keyboardActionSchema.index({ actionType: 1 });
keyboardActionSchema.index({ practiceMode: 1 });
keyboardActionSchema.index({ timestamp: -1 });

// Static method to get user practice stats
keyboardActionSchema.statics.getUserPracticeStats = function(userId, timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
        actionType: 'session_end'
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalKeys: { $sum: '$sessionStats.totalKeys' },
        totalCorrectKeys: { $sum: '$sessionStats.correctKeys' },
        avgAccuracy: { $avg: '$sessionStats.accuracy' },
        avgWpm: { $avg: '$sessionStats.wpm' },
        totalPracticeTime: { $sum: '$sessionStats.duration' },
        bestAccuracy: { $max: '$sessionStats.accuracy' },
        bestWpm: { $max: '$sessionStats.wpm' }
      }
    }
  ]);
};

// Static method to get practice progress over time
keyboardActionSchema.statics.getPracticeProgress = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
        actionType: 'session_end'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        sessions: { $sum: 1 },
        avgAccuracy: { $avg: '$sessionStats.accuracy' },
        avgWpm: { $avg: '$sessionStats.wpm' },
        totalTime: { $sum: '$sessionStats.duration' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

// Static method to get global keyboard stats
keyboardActionSchema.statics.getGlobalKeyboardStats = function() {
  return this.aggregate([
    {
      $match: { actionType: 'session_end' }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalUsers: { $addToSet: '$userId' },
        avgAccuracy: { $avg: '$sessionStats.accuracy' },
        avgWpm: { $avg: '$sessionStats.wpm' },
        totalPracticeTime: { $sum: '$sessionStats.duration' }
      }
    },
    {
      $project: {
        totalSessions: 1,
        totalUsers: { $size: '$totalUsers' },
        avgAccuracy: { $round: ['$avgAccuracy', 2] },
        avgWpm: { $round: ['$avgWpm', 2] },
        totalPracticeTime: 1
      }
    }
  ]);
};

// Static method to get leaderboard
keyboardActionSchema.statics.getLeaderboard = function(metric = 'wpm', limit = 10, timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  const sortField = metric === 'accuracy' ? 'avgAccuracy' : 'avgWpm';
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        actionType: 'session_end'
      }
    },
    {
      $group: {
        _id: '$userId',
        sessions: { $sum: 1 },
        avgAccuracy: { $avg: '$sessionStats.accuracy' },
        avgWpm: { $avg: '$sessionStats.wpm' },
        bestAccuracy: { $max: '$sessionStats.accuracy' },
        bestWpm: { $max: '$sessionStats.wpm' },
        totalTime: { $sum: '$sessionStats.duration' }
      }
    },
    {
      $match: {
        sessions: { $gte: 5 } // At least 5 sessions to be on leaderboard
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userName: '$user.name',
        userAvatar: '$user.avatar',
        sessions: 1,
        avgAccuracy: { $round: ['$avgAccuracy', 2] },
        avgWpm: { $round: ['$avgWpm', 2] },
        bestAccuracy: { $round: ['$bestAccuracy', 2] },
        bestWpm: { $round: ['$bestWpm', 2] },
        totalTime: 1
      }
    },
    {
      $sort: { [sortField]: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('KeyboardAction', keyboardActionSchema);