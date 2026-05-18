#!/bin/bash

# Staging Deployment Script for Thai & Aluminum Frontend

set -e  # Exit on any error

echo "🚀 Starting frontend staging deployment..."

# Load staging environment
export NODE_ENV=staging

# Check if .env.staging exists
if [ ! -f .env.staging ]; then
    echo "❌ .env.staging file not found!"
    echo "Please create .env.staging with staging configuration"
    exit 1
fi

# Load environment variables
source .env.staging

echo "🔍 Validating configuration..."
echo "API URL: $NEXT_PUBLIC_API_URL"
echo "App Name: $NEXT_PUBLIC_APP_NAME"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run type checking
echo "🔧 Running type checking..."
npx tsc --noEmit

# Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false

# Build application
echo "🔨 Building application..."
npm run build

# Deploy to staging server (customize based on your deployment method)
echo "🚀 Deploying to staging..."

# Example: Deploy to Vercel staging
if command -v vercel &> /dev/null; then
    vercel --prod --env .env.staging
    echo "✅ Deployed to Vercel staging"
# Example: Deploy to Netlify
elif command -v netlify &> /dev/null; then
    netlify deploy --prod --dir=.next
    echo "✅ Deployed to Netlify staging"
# Example: Deploy to custom server
else
    echo "📁 Build completed. Deploy the .next folder to your staging server"
    echo "Build location: $(pwd)/.next"
fi

echo "🎉 Frontend staging deployment completed!"
echo "🌐 Staging URL: $NEXT_PUBLIC_API_URL"