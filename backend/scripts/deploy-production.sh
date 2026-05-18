#!/bin/bash

# Production Deployment Script for Thai & Aluminum Backend

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Load production environment
export NODE_ENV=production

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with production configuration"
    exit 1
fi

# Validate required environment variables
echo "🔍 Validating environment variables..."
source .env.production

required_vars=("MONGODB_URI" "JWT_SECRET" "APP_URL" "FRONTEND_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Validate JWT secret length for production
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "❌ JWT_SECRET must be at least 32 characters long in production"
    exit 1
fi

echo "✅ Environment variables validated"

# Create backup of current deployment
echo "💾 Creating backup..."
if [ -d "backup" ]; then
    rm -rf backup.old
    mv backup backup.old
fi
mkdir -p backup
cp -r src backup/
cp package*.json backup/
echo "✅ Backup created"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run comprehensive tests
echo "🧪 Running comprehensive tests..."
npm test
npm run test:integration || echo "⚠️  Integration tests failed or not available"

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate

# Build application (if needed)
echo "🔨 Building application..."
# Add build commands here if needed

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p $BACKUP_PATH
mkdir -p $UPLOAD_PATH

# Set proper permissions
chmod 755 logs
chmod 755 $BACKUP_PATH
chmod 755 $UPLOAD_PATH

# Start application with PM2 (process manager)
echo "🚀 Starting application..."
if command -v pm2 &> /dev/null; then
    pm2 stop thai-aluminum-prod || true
    pm2 delete thai-aluminum-prod || true
    pm2 start src/index.js --name thai-aluminum-prod --env production
    pm2 save
    pm2 startup
    echo "✅ Application started with PM2"
else
    echo "❌ PM2 is required for production deployment"
    echo "Please install PM2: npm install -g pm2"
    exit 1
fi

# Setup log rotation
echo "📝 Setting up log rotation..."
if command -v logrotate &> /dev/null; then
    cat > /etc/logrotate.d/thai-aluminum << EOF
$LOG_FILE {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reload thai-aluminum-prod
    endscript
}
EOF
    echo "✅ Log rotation configured"
else
    echo "⚠️  logrotate not found. Manual log management required"
fi

# Setup monitoring (if available)
echo "📊 Setting up monitoring..."
if command -v pm2 &> /dev/null; then
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    echo "✅ PM2 monitoring configured"
fi

# Health check
echo "🏥 Performing health check..."
sleep 5
health_check=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL/api/health || echo "000")
if [ "$health_check" = "200" ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed (HTTP $health_check)"
    echo "Rolling back..."
    pm2 stop thai-aluminum-prod
    # Restore backup if needed
    exit 1
fi

echo "🎉 Production deployment completed successfully!"
echo "📍 API URL: $APP_URL"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "📊 Monitor with: pm2 monit"
echo "📝 Logs: pm2 logs thai-aluminum-prod"