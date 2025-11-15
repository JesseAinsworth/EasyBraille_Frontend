# EasyBraille Local Backend - Complete API Reference

## 🚀 Quick Start

### Environment Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if not using Docker)
mongod

# Run the server
npm start

# Or run in development mode
npm run dev
```

### Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual container
docker build -t easybraille-backend .
docker run -p 5000:5000 easybraille-backend
```

## 📋 Base URL and Configuration

- **Development**: `http://localhost:5000/api`
- **Production**: Configure with your domain
- **Health Check**: `GET /health`

### Headers
All authenticated endpoints require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 🔐 Authentication Endpoints

### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "securePassword123",
  "language": "es",
  "theme": "light"
}
```

**Response (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "user_id",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user",
    "avatar": null,
    "language": "es",
    "theme": "light",
    "learningLevel": "beginner",
    "totalTranslations": 0,
    "totalKeyboardPractice": 0,
    "streakDays": 0,
    "isEmailVerified": false,
    "lastLoginAt": null
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": "15m"
  }
}
```

### POST `/auth/login`
Authenticate user and get access tokens.

**Request Body:**
```json
{
  "email": "juan@example.com",
  "password": "securePassword123",
  "platform": "web",
  "deviceToken": "optional_push_token"
}
```

**Response (200):**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": { /* user object */ },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": "15m"
  }
}
```

### POST `/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "current_refresh_token"
}
```

**Response (200):**
```json
{
  "accessToken": "new_jwt_access_token",
  "expiresIn": "15m"
}
```

### POST `/auth/logout`
Logout user and invalidate tokens.

**Request Body:**
```json
{
  "refreshToken": "current_refresh_token",
  "deviceToken": "optional_device_token"
}
```

**Response (200):**
```json
{
  "message": "Cierre de sesión exitoso"
}
```

## 📝 Translation Endpoints

### POST `/translations/text`
Translate text between Spanish and Braille.

**Request Body:**
```json
{
  "inputText": "Hola mundo",
  "translationType": "text-to-braille",
  "language": "es",
  "isPublic": false,
  "deviceInfo": {
    "platform": "web",
    "appVersion": "1.0.0",
    "deviceModel": "Chrome Browser"
  }
}
```

**Response (200):**
```json
{
  "message": "Traducción completada exitosamente",
  "translation": {
    "id": "translation_id",
    "inputText": "Hola mundo",
    "outputText": "⠓⠕⠇⠁ ⠍⠥⠝⠙⠕",
    "translationType": "text-to-braille",
    "language": "es",
    "processingTime": 45,
    "createdAt": "2024-01-15T10:30:00Z",
    "confidence": null
  }
}
```

### POST `/translations/image`
Upload and translate Braille image using Railway backend.

**Request (multipart/form-data):**
- `image`: Image file (PNG, JPG, JPEG)
- `language`: Language code (default: "es")
- `deviceInfo`: JSON string with device information

**Response (200):**
```json
{
  "message": "Imagen procesada exitosamente",
  "translation": {
    "id": "translation_id",
    "inputText": null,
    "outputText": "Texto detectado en la imagen",
    "translationType": "image-to-text",
    "language": "es",
    "processingTime": 2340,
    "createdAt": "2024-01-15T10:30:00Z",
    "confidence": 0.95,
    "imageInfo": {
      "filename": "braille_image.jpg",
      "size": 245760,
      "type": "image/jpeg"
    }
  }
}
```

### GET `/translations`
Get user's translation history with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Filter by translation type
- `search`: Search in translations

**Response (200):**
```json
{
  "translations": [
    {
      "id": "translation_id",
      "outputText": "⠓⠕⠇⠁ ⠍⠥⠝⠙⠕",
      "translationType": "text-to-braille",
      "createdAt": "2024-01-15T10:30:00Z",
      "confidence": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET `/translations/public`
Get public translations for community features.

**Response (200):**
```json
{
  "translations": [
    {
      "outputText": "⠓⠕⠇⠁ ⠍⠥⠝⠙⠕",
      "translationType": "text-to-braille",
      "createdAt": "2024-01-15T10:30:00Z",
      "likes": 5
    }
  ]
}
```

### DELETE `/translations/:id`
Delete a specific translation.

**Response (200):**
```json
{
  "message": "Traducción eliminada exitosamente"
}
```

## ⌨️ Keyboard Practice Endpoints

### POST `/keyboard-actions`
Record keyboard practice actions and statistics.

**Request Body:**
```json
{
  "sessionId": "session_uuid",
  "actionType": "keypress",
  "keyPressed": "a",
  "expectedKey": "a",
  "isCorrect": true,
  "responseTime": 450,
  "practiceMode": "letters",
  "difficulty": "beginner",
  "sessionStats": {
    "totalKeys": 50,
    "correctKeys": 45,
    "accuracy": 90.0,
    "wpm": 15.5,
    "duration": 300,
    "errorsCount": 5
  },
  "deviceInfo": {
    "platform": "web",
    "appVersion": "1.0.0",
    "deviceModel": "Chrome Browser"
  },
  "language": "es"
}
```

**Response (201):**
```json
{
  "message": "Acción de teclado registrada exitosamente"
}
```

### GET `/keyboard-actions/stats`
Get keyboard practice statistics for the user.

**Response (200):**
```json
{
  "totalSessions": 25,
  "totalKeystrokes": 1250,
  "avgAccuracy": 85.5,
  "avgWpm": 12.8,
  "bestAccuracy": 95.0,
  "bestWpm": 18.2,
  "practiceTime": 7200,
  "progressByDifficulty": {
    "beginner": { "sessions": 15, "avgAccuracy": 88.0 },
    "intermediate": { "sessions": 8, "avgAccuracy": 82.0 },
    "advanced": { "sessions": 2, "avgAccuracy": 75.0 }
  }
}
```

## 🖼️ Braille Image Detection

### POST `/braille-image`
Direct proxy to Railway backend for Braille image detection.

**Request (multipart/form-data):**
- `image`: Image file
- `deviceInfo`: JSON string with device information

**Response (200):**
```json
{
  "message": "Imagen procesada exitosamente",
  "texto": "Texto detectado en Braille",
  "confidence": 0.92,
  "processingTime": 1850,
  "imageInfo": {
    "filename": "image.jpg",
    "size": 156789,
    "type": "image/jpeg"
  },
  "railwayBackendUsed": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 👤 User Management Endpoints

### GET `/users/profile`
Get current user profile information.

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "avatar": "avatar_url",
    "language": "es",
    "theme": "light",
    "learningLevel": "intermediate",
    "totalTranslations": 150,
    "totalKeyboardPractice": 45,
    "streakDays": 7,
    "joinedAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-15T09:30:00Z"
  }
}
```

### PUT `/users/profile`
Update user profile information.

**Request Body:**
```json
{
  "name": "Juan Carlos Pérez",
  "language": "en",
  "theme": "dark",
  "learningLevel": "advanced"
}
```

**Response (200):**
```json
{
  "message": "Perfil actualizado exitosamente",
  "user": { /* updated user object */ }
}
```

### POST `/users/change-password`
Change user password.

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

### DELETE `/users/account`
Delete user account and all associated data.

**Request Body:**
```json
{
  "password": "userPassword123",
  "confirmDelete": true
}
```

**Response (200):**
```json
{
  "message": "Cuenta eliminada exitosamente"
}
```

## 📱 Mobile-Specific Endpoints

### GET `/mobile/dashboard`
Get optimized dashboard data for mobile apps.

**Response (200):**
```json
{
  "user": {
    "name": "Juan Pérez",
    "avatar": "avatar_url",
    "learningLevel": "intermediate",
    "streakDays": 7
  },
  "stats": {
    "totalTranslations": 150,
    "totalKeyboardPractice": 45,
    "todayTranslations": 5,
    "todayKeyboardSessions": 2
  },
  "recentTranslations": [
    {
      "outputText": "⠓⠕⠇⠁",
      "translationType": "text-to-braille",
      "createdAt": "2024-01-15T10:30:00Z",
      "confidence": null
    }
  ],
  "keyboardProgress": {
    "totalSessions": 25,
    "avgAccuracy": 85.5,
    "avgWpm": 12.8,
    "bestAccuracy": 95.0,
    "bestWpm": 18.2
  }
}
```

### POST `/mobile/sync-progress`
Sync offline progress data from mobile app.

**Request Body:**
```json
{
  "keyboardSessions": [
    {
      "sessionId": "uuid",
      "completedAt": "2024-01-15T10:00:00Z",
      "stats": {
        "totalKeys": 50,
        "correctKeys": 45,
        "accuracy": 90.0,
        "wpm": 15.5,
        "duration": 300
      }
    }
  ],
  "translations": [
    {
      "inputText": "test",
      "outputText": "⠞⠑⠎⠞",
      "translationType": "text-to-braille",
      "createdAt": "2024-01-15T10:15:00Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Progreso sincronizado exitosamente",
  "syncedItems": {
    "keyboardSessions": 1,
    "translations": 1
  }
}
```

### GET `/mobile/offline-data`
Get essential data for offline functionality.

**Response (200):**
```json
{
  "brailleReference": {
    "alphabet": {
      "a": "⠁", "b": "⠃", "c": "⠉"
    },
    "numbers": {
      "1": "⠼⠁", "2": "⠼⠃", "3": "⠼⠉"
    },
    "punctuation": {
      ".": "⠲", ",": "⠂", "?": "⠦"
    }
  },
  "practicePatterns": [
    {
      "id": "letters_basic",
      "name": "Letras Básicas",
      "difficulty": "beginner",
      "keys": ["a", "b", "c", "d", "e"]
    }
  ],
  "lastSyncAt": "2024-01-15T10:30:00Z"
}
```

## 👑 Admin Endpoints

### GET `/admin/users`
Get all users with pagination (Admin only).

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search users
- `role`: Filter by role

**Response (200):**
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "user",
      "totalTranslations": 150,
      "totalKeyboardPractice": 45,
      "lastLoginAt": "2024-01-15T09:30:00Z",
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 95
  }
}
```

### PUT `/admin/users/:id/role`
Update user role (Admin only).

**Request Body:**
```json
{
  "role": "admin"
}
```

### GET `/admin/stats`
Get platform statistics (Admin only).

**Response (200):**
```json
{
  "totalUsers": 1250,
  "totalTranslations": 15000,
  "totalKeyboardSessions": 8500,
  "activeUsersToday": 45,
  "newUsersThisWeek": 12,
  "topTranslationTypes": [
    { "type": "text-to-braille", "count": 8500 },
    { "type": "braille-to-text", "count": 4200 },
    { "type": "image-to-text", "count": 2300 }
  ],
  "userGrowth": [
    { "date": "2024-01-01", "users": 1200 },
    { "date": "2024-01-08", "users": 1220 },
    { "date": "2024-01-15", "users": 1250 }
  ]
}
```

## 🔍 Discovery Endpoint

### GET `/discovery`
Get API status and available endpoints.

**Response (200):**
```json
{
  "message": "EasyBraille Local Backend API",
  "version": "1.0.0",
  "status": "operational",
  "endpoints": {
    "auth": "/api/auth/*",
    "translations": "/api/translations/*",
    "keyboardActions": "/api/keyboard-actions/*",
    "brailleImage": "/api/braille-image",
    "users": "/api/users/*",
    "mobile": "/api/mobile/*",
    "admin": "/api/admin/*"
  },
  "railwayBackend": {
    "status": "connected",
    "url": "https://easybraille-backend-production.up.railway.app"
  }
}
```

## ❌ Error Responses

### Standard Error Format
```json
{
  "error": "Error type",
  "message": "Human readable error message",
  "details": {
    "field": "specific error details"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

### Validation Errors (400)
```json
{
  "error": "ValidationError",
  "message": "Los datos proporcionados no son válidos",
  "details": {
    "email": "El email es requerido",
    "password": "La contraseña debe tener al menos 6 caracteres"
  }
}
```

## 🔒 Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **Translation endpoints**: 30 requests per minute per user
- **General endpoints**: 100 requests per minute per IP
- **Admin endpoints**: 60 requests per minute per admin user

## 📊 Monitoring and Health

### Health Check: `GET /health`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 7200,
  "database": "connected",
  "railwayBackend": "connected",
  "memory": {
    "used": "245MB",
    "total": "512MB"
  }
}
```

This API reference provides comprehensive documentation for integrating with the EasyBraille Local Backend, supporting both web applications and mobile app development.