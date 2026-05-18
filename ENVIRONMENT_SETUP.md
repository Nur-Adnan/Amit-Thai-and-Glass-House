# Environment Setup Guide

This guide explains how to set up and manage different environments (development, staging, production) for the Thai & Aluminum Business Management System.

## 🏗️ Environment Structure

The application supports three environments:
- **Development** (`NODE_ENV=development`) - Local development
- **Staging** (`NODE_ENV=staging`) - Pre-production testing
- **Production** (`NODE_ENV=production`) - Live production system

## 📁 Configuration Files

### Backend Environment Files
```
backend/
├── .env.example          # Template with all available variables
├── .env.staging          # Staging environment configuration
├── .env.production       # Production environment configuration
└── .env                  # Local development (git-ignored)
```

### Frontend Environment Files
```
frontend/
├── .env.example          # Template with all available variables
├── .env.staging          # Staging environment configuration
├── .env.production       # Production environment configuration
└── .env.local            # Local development (git-ignored)
```

## 🚀 Quick Setup

### 1. Backend Setup

```bash
cd backend

# Copy example file for development
cp .env.example .env

# Edit .env with your local configuration
nano .env

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Copy example file for development
cp .env.example .env.local

# Edit .env.local with your local configuration
nano .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Backend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `development` |
| `PORT` | Server port | No | `3001` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRE` | JWT expiration time | No | `30d` |
| `APP_URL` | Backend API URL | No | `http://localhost:3001` |
| `FRONTEND_URL` | Frontend URL | No | `http://localhost:3000` |
| `BACKUP_PATH` | Backup storage path | No | `./backups` |
| `LOG_LEVEL` | Logging level | No | `info` |

### Frontend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_NAME` | Application name | No | `Thai & Aluminum` |
| `NEXT_PUBLIC_ENABLE_DEBUG` | Debug mode | No | `false` |
| `NEXT_PUBLIC_DEFAULT_LANGUAGE` | Default language | No | `en` |

## 🌍 Environment-Specific Setup

### Development Environment

**Backend (.env)**:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/thai_aluminum_dev
JWT_SECRET=your_development_jwt_secret_here
LOG_LEVEL=debug
ENABLE_SCHEDULED_BACKUPS=false
```

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

### Staging Environment

**Backend (.env.staging)**:
```env
NODE_ENV=staging
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/thai_aluminum_staging
JWT_SECRET=staging_jwt_secret_change_this
APP_URL=https://staging-api.yourdomain.com
FRONTEND_URL=https://staging.yourdomain.com
LOG_LEVEL=debug
```

**Frontend (.env.staging)**:
```env
NODE_ENV=staging
NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Production Environment

**Backend (.env.production)**:
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/thai_aluminum_prod
JWT_SECRET=VERY_LONG_SECURE_PRODUCTION_SECRET_AT_LEAST_64_CHARACTERS_LONG
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
LOG_LEVEL=warn
ENABLE_SCHEDULED_BACKUPS=true
```

**Frontend (.env.production)**:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## 🚀 Deployment

### Staging Deployment

**Backend**:
```bash
cd backend
./scripts/deploy-staging.sh
```

**Frontend**:
```bash
cd frontend
./scripts/deploy-staging.sh
```

### Production Deployment

**Backend**:
```bash
cd backend
./scripts/deploy-production.sh
```

**Frontend**:
```bash
cd frontend
./scripts/deploy-production.sh
```

## 🔒 Security Best Practices

### JWT Secrets
- **Development**: Use a simple secret for testing
- **Staging**: Use a secure random string (32+ characters)
- **Production**: Use a very long, secure random string (64+ characters)

### Database Security
- Use separate databases for each environment
- Use different credentials for each environment
- Enable MongoDB authentication in production
- Use connection string with SSL in production

### Environment Files
- Never commit `.env` files to version control
- Use `.env.example` as a template
- Store production secrets in secure secret management systems
- Rotate secrets regularly

## 📊 Monitoring and Logging

### Development
- Console logging enabled
- Debug information visible
- All log levels active

### Staging
- Structured logging
- Debug information available
- Performance monitoring

### Production
- Minimal logging (warn/error only)
- No debug information
- Performance monitoring
- Error tracking
- Log rotation configured

## 🧪 Testing Environments

### Running Tests

**Backend**:
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Test coverage
npm run test:coverage
```

**Frontend**:
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

### Test Databases
- Use separate test databases
- Automatically cleaned after tests
- In-memory databases for unit tests

## 🔄 Environment Switching

### Backend
```bash
# Development
NODE_ENV=development npm start

# Staging
NODE_ENV=staging npm start

# Production
NODE_ENV=production npm start
```

### Frontend
```bash
# Development
npm run dev

# Staging build
npm run build:staging

# Production build
npm run build
```

## 🆘 Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Check if all required variables are set
   - Verify file names (.env vs .env.local)
   - Ensure proper file permissions

2. **Database Connection Issues**
   - Verify MongoDB URI format
   - Check network connectivity
   - Validate credentials

3. **JWT Issues**
   - Ensure JWT_SECRET is set
   - Check secret length (32+ chars for production)
   - Verify token expiration settings

4. **CORS Issues**
   - Check FRONTEND_URL configuration
   - Verify allowed origins
   - Ensure proper protocol (http/https)

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env)"

# Test database connection
npm run test:db

# Validate configuration
npm run config:validate
```

## 📚 Additional Resources

- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)

---

For additional help, please refer to the project documentation or contact the development team.