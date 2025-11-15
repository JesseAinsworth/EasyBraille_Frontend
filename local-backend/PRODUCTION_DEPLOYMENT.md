# EasyBraille Local Backend - Production Deployment Guide

## 🚀 Quick Production Setup

### Option 1: Docker Compose (Recommended)

```bash
# Clone or navigate to project directory
cd local-backend

# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Build and deploy
docker-compose up -d --build

# Verify deployment
curl http://localhost:5000/health
```

### Option 2: Manual Setup

```bash
# Install Node.js 18+
# Install MongoDB
# Install PM2 for process management
npm install -g pm2

# Install dependencies
npm install --production

# Set up environment
cp .env.example .env
# Configure .env with production settings

# Start with PM2
pm2 start ecosystem.config.js --env production
```

## 🔧 Environment Configuration

### Production `.env` File
```bash
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://mongo:27017/easybraille_prod
# or for external MongoDB:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/easybraille_prod

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your_super_secure_jwt_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_min_32_chars

# Railway Backend Integration
RAILWAY_BACKEND_URL=https://easybraille-backend-production.up.railway.app
RAILWAY_API_KEY=optional_api_key_if_required

# CORS Origins (comma-separated)
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@your-domain.com

# Redis for Session Management (optional)
REDIS_URL=redis://localhost:6379

# SSL Configuration
SSL_ENABLED=false
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem

# Monitoring
HEALTH_CHECK_INTERVAL=30000
LOG_LEVEL=info
```

## 🐳 Docker Configuration

### Dockerfile (Production-Optimized)
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    tini

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copy application code
COPY --chown=nodejs:nodejs . .

# Set security headers
RUN chmod -R 755 /app && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Use tini as PID 1
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "server.js"]
```

### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  backend:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://mongo:27017/easybraille_prod
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - RAILWAY_BACKEND_URL=${RAILWAY_BACKEND_URL}
      - CORS_ORIGINS=${CORS_ORIGINS}
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - easybraille-network
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
      - MONGO_INITDB_DATABASE=easybraille_prod
    volumes:
      - mongo_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - easybraille-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - backend
    networks:
      - easybraille-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - easybraille-network
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  mongo_data:
  redis_data:
  nginx_logs:

networks:
  easybraille-network:
    driver: bridge
```

## ⚙️ Nginx Configuration

### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/certificate.pem;
        ssl_certificate_key /etc/nginx/ssl/private-key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Client max body size (for file uploads)
        client_max_body_size 10M;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Auth routes with stricter rate limiting
        location /api/auth/ {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            access_log off;
        }

        # Static files (if serving frontend)
        location / {
            root /var/www/html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

## 🔄 PM2 Configuration

### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'easybraille-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Restart configuration
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Monitoring
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Advanced PM2 features
    kill_timeout: 5000,
    listen_timeout: 10000,
    
    // Environment variables
    env_file: '.env'
  }]
};
```

## 📊 Monitoring and Logging

### Enhanced Health Check (healthcheck.js)
```javascript
const http = require('http');
const mongoose = require('mongoose');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log('Health check failed');
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log('Health check error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
```

### Logging Configuration (winston)
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'easybraille-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## 🔐 Security Hardening

### Security Middleware Enhancement
```javascript
// security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Enhanced rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: 'TooManyRequests', message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'TooManyRequests',
        message: 'Demasiadas solicitudes, intenta de nuevo más tarde'
      });
    }
  });
};

// Security configuration
const securityConfig = {
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }),
  
  rateLimits: {
    general: createRateLimit(15 * 60 * 1000, 100, 'Límite general excedido'),
    auth: createRateLimit(15 * 60 * 1000, 5, 'Demasiados intentos de autenticación'),
    api: createRateLimit(15 * 60 * 1000, 60, 'Límite de API excedido')
  }
};

module.exports = securityConfig;
```

## 🌐 Cloud Deployment Options

### AWS ECS/Fargate
```yaml
# task-definition.json
{
  "family": "easybraille-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/easybraille-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:easybraille/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/easybraille-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node healthcheck.js || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### Google Cloud Run
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/easybraille-backend', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/easybraille-backend']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'easybraille-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/easybraille-backend'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'NODE_ENV=production'
      - '--memory'
      - '512Mi'
      - '--concurrency'
      - '80'
      - '--timeout'
      - '300'
```

## 📋 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Backup strategy planned

### Post-Deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] Railway backend integration working
- [ ] File upload working
- [ ] Authentication working
- [ ] Rate limiting working
- [ ] SSL certificate valid
- [ ] Monitoring alerts configured
- [ ] Performance metrics baseline

### Maintenance
- [ ] Regular security updates
- [ ] Database backups scheduled
- [ ] Log rotation configured
- [ ] SSL certificate renewal
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Capacity planning
- [ ] Documentation updates

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   docker-compose logs mongo
   
   # Test connection
   mongosh mongodb://localhost:27017/easybraille_prod
   ```

2. **Railway Backend Connection**
   ```bash
   # Test Railway backend
   curl https://easybraille-backend-production.up.railway.app/health
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate validity
   openssl x509 -in certificate.pem -text -noout
   
   # Test SSL
   curl -I https://your-domain.com
   ```

4. **Performance Issues**
   ```bash
   # Check system resources
   docker stats
   
   # Monitor PM2 processes
   pm2 monit
   ```

This comprehensive production deployment guide ensures your EasyBraille backend is secure, scalable, and production-ready.