#!/bin/bash

# Staging Deployment Script for Thai & Aluminum Backend

set -e  # Exit on any error

echo "🚀 Starting staging deployment..."

# Load staging environment
export NODE_ENV=staging

# Check if .env.staging exists
if [ ! -f .env.staging ]; then
    echo "❌ .env.staging file not found!"
    echo "Please create .env.staging with staging configuration"
    exit 1
fi

# Validate required environment variables
echo "🔍 Validating environment variables..."
source .env.staging

required_vars=("MONGODB_URI" "JWT_SECRET" "APP_URL" "FRONTEND_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run database migrations if any
echo "🗄️  Running database setup..."
# Add migration commands here if needed

# Run tests
echo "🧪 Running tests..."
npm test

# Build application (if needed)
echo "🔨 Building application..."
# Add build commands here if needed

# Start application with PM2 (process manager)
echo "🚀 Starting application..."
if command -v pm2 &> /dev/null; then
    pm2 stop thai-aluminum-staging || true
    pm2 delete thai-aluminum-staging || true
    pm2 start src/index.js --name thai-aluminum-staging --env staging
    pm2 save
    echo "✅ Application started with PM2"
else
    echo "⚠️  PM2 not found. Starting with node..."
    node src/index.js &
    echo $! > staging.pid
    echo "✅ Application started (PID saved to staging.pid)"
fi

echo "🎉 Staging deployment completed successfully!"
echo "📍 API URL: $APP_URL"
echo "🌐 Frontend URL: $FRONTEND_URL"