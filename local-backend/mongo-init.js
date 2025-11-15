// MongoDB initialization script
db.createUser({
  user: 'easybraille',
  pwd: 'easybraille123',
  roles: [
    {
      role: 'readWrite',
      db: 'easybraille'
    }
  ]
});

// Create collections with indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ lastActivityDate: -1 });

db.translations.createIndex({ userId: 1, createdAt: -1 });
db.translations.createIndex({ translationType: 1 });
db.translations.createIndex({ language: 1 });
db.translations.createIndex({ isPublic: 1 });
db.translations.createIndex({ createdAt: -1 });

db.keyboardactions.createIndex({ userId: 1, timestamp: -1 });
db.keyboardactions.createIndex({ sessionId: 1 });
db.keyboardactions.createIndex({ actionType: 1 });
db.keyboardactions.createIndex({ practiceMode: 1 });
db.keyboardactions.createIndex({ timestamp: -1 });

// Create admin user
db.users.insertOne({
  name: 'EasyBraille Admin',
  email: 'admin@easybraille.com',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/8oGGvxKUelzbfDPl6', // admin123
  role: 'admin',
  isActive: true,
  isEmailVerified: true,
  language: 'es',
  theme: 'light',
  learningLevel: 'advanced',
  totalTranslations: 0,
  totalKeyboardPractice: 0,
  streakDays: 0,
  deviceTokens: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActivityDate: new Date()
});

print('Database initialized successfully!');