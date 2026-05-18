#!/bin/bash

# Production Deployment Script for Thai & Aluminum Frontend

set -e  # Exit on any error

echo "🚀 Starting frontend production deployment..."

# Load production environment
export NODE_ENV=production

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with production configuration"
    exit 1
fi

# Load environment variables
source .env.production

echo "🔍 Validating production configuration..."
echo "API URL: $NEXT_PUBLIC_API_URL"
echo "App Name: $NEXT_PUBLIC_APP_NAME"
echo "Debug Mode: $NEXT_PUBLIC_ENABLE_DEBUG"

# Ensure debug is disabled in production
if [ "$NEXT_PUBLIC_ENABLE_DEBUG" = "true" ]; then
    echo "❌ Debug mode must be disabled in production"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run type checking
echo "🔧 Running type checking..."
npx tsc --noEmit

# Run tests
echo "🧪 Running comprehensive tests..."
npm test -- --watchAll=false --coverage

# Build application
echo "🔨 Building optimized production build..."
npm run build

# Analyze bundle size
echo "📊 Analyzing bundle size..."
if [ -f "package.json" ] && grep -q "@next/bundle-analyzer" package.json; then
    ANALYZE=true npm run build
fi

# Run post-build validation
echo "✅ Validating build..."
if [ ! -d ".next" ]; then
    echo "❌ Build failed - .next directory not found"
    exit 1
fi

# Check build size
build_size=$(du -sh .next | cut -f1)
echo "📦 Build size: $build_size"

# Deploy to production (customize based on your deployment method)
echo "🚀 Deploying to production..."

# Example: Deploy to Vercel
if command -v vercel &> /dev/null; then
    vercel --prod --env .env.production
    echo "✅ Deployed to Vercel production"
# Example: Deploy to Netlify
elif command -v netlify &> /dev/null; then
    netlify deploy --prod --dir=.next
    echo "✅ Deployed to Netlify production"
# Example: Deploy to AWS S3 + CloudFront
elif command -v aws &> /dev/null; then
    echo "🌩️  Deploying to AWS..."
    npm run export  # If using static export
    aws s3 sync out/ s3://your-production-bucket --delete
    aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
    echo "✅ Deployed to AWS S3 + CloudFront"
# Example: Deploy to custom server
else
    echo "📁 Build completed. Deploy the .next folder to your production server"
    echo "Build location: $(pwd)/.next"
    echo "Static files: $(pwd)/public"
fi

# Post-deployment health check
echo "🏥 Performing health check..."
sleep 10
if command -v curl &> /dev/null; then
    health_check=$(curl -s -o /dev/null -w "%{http_code}" $NEXT_PUBLIC_API_URL || echo "000")
    if [ "$health_check" = "200" ]; then
        echo "✅ Backend health check passed"
    else
        echo "⚠️  Backend health check failed (HTTP $health_check)"
    fi
fi

# Setup monitoring (if available)
echo "📊 Setting up monitoring..."
if [ -n "$NEXT_PUBLIC_GA_TRACKING_ID" ]; then
    echo "✅ Google Analytics configured: $NEXT_PUBLIC_GA_TRACKING_ID"
fi

echo "🎉 Frontend production deployment completed successfully!"
echo "🌐 Production URL: Check your deployment platform"
echo "📊 Monitor performance and errors through your analytics platform"