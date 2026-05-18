#!/bin/bash

# Environment Validation Script
# Validates that all environment files are properly configured

set -e

echo "🔍 Validating Environment Configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validation results
ERRORS=0
WARNINGS=0

# Function to check if file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $description missing: $file${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check environment variable in file
check_env_var() {
    local file=$1
    local var=$2
    local description=$3
    
    if [ -f "$file" ]; then
        if grep -q "^$var=" "$file"; then
            local value=$(grep "^$var=" "$file" | cut -d'=' -f2-)
            if [ -n "$value" ] && [ "$value" != "your_value_here" ] && [ "$value" != "change_this" ]; then
                echo -e "${GREEN}✅ $description configured${NC}"
                return 0
            else
                echo -e "${YELLOW}⚠️  $description needs configuration in $file${NC}"
                WARNINGS=$((WARNINGS + 1))
                return 1
            fi
        else
            echo -e "${RED}❌ $description missing in $file${NC}"
            ERRORS=$((ERRORS + 1))
            return 1
        fi
    else
        echo -e "${RED}❌ File $file not found${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "📁 Checking Backend Environment Files..."

# Check backend environment files
check_file "backend/.env.example" "Backend example environment file"
check_file "backend/.env.staging" "Backend staging environment file"
check_file "backend/.env.production" "Backend production environment file"

# Check backend environment variables
if [ -f "backend/.env.staging" ]; then
    echo "🔍 Validating backend staging configuration..."
    check_env_var "backend/.env.staging" "MONGODB_URI" "MongoDB URI"
    check_env_var "backend/.env.staging" "JWT_SECRET" "JWT Secret"
    check_env_var "backend/.env.staging" "APP_URL" "App URL"
fi

if [ -f "backend/.env.production" ]; then
    echo "🔍 Validating backend production configuration..."
    check_env_var "backend/.env.production" "MONGODB_URI" "MongoDB URI"
    check_env_var "backend/.env.production" "JWT_SECRET" "JWT Secret"
    check_env_var "backend/.env.production" "APP_URL" "App URL"
    
    # Check JWT secret length for production
    if grep -q "^JWT_SECRET=" "backend/.env.production"; then
        jwt_secret=$(grep "^JWT_SECRET=" "backend/.env.production" | cut -d'=' -f2-)
        if [ ${#jwt_secret} -lt 32 ]; then
            echo -e "${RED}❌ Production JWT secret must be at least 32 characters${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${GREEN}✅ Production JWT secret length is adequate${NC}"
        fi
    fi
fi

echo "📁 Checking Frontend Environment Files..."

# Check frontend environment files
check_file "frontend/.env.example" "Frontend example environment file"
check_file "frontend/.env.staging" "Frontend staging environment file"
check_file "frontend/.env.production" "Frontend production environment file"

# Check frontend environment variables
if [ -f "frontend/.env.staging" ]; then
    echo "🔍 Validating frontend staging configuration..."
    check_env_var "frontend/.env.staging" "NEXT_PUBLIC_API_URL" "API URL"
fi

if [ -f "frontend/.env.production" ]; then
    echo "🔍 Validating frontend production configuration..."
    check_env_var "frontend/.env.production" "NEXT_PUBLIC_API_URL" "API URL"
    
    # Check that debug is disabled in production
    if grep -q "^NEXT_PUBLIC_ENABLE_DEBUG=true" "frontend/.env.production"; then
        echo -e "${RED}❌ Debug mode should be disabled in production${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ Debug mode properly configured for production${NC}"
    fi
fi

echo "🔍 Checking Deployment Scripts..."

# Check deployment scripts
check_file "backend/scripts/deploy-staging.sh" "Backend staging deployment script"
check_file "backend/scripts/deploy-production.sh" "Backend production deployment script"
check_file "frontend/scripts/deploy-staging.sh" "Frontend staging deployment script"
check_file "frontend/scripts/deploy-production.sh" "Frontend production deployment script"

# Check script permissions
for script in backend/scripts/deploy-*.sh frontend/scripts/deploy-*.sh; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo -e "${GREEN}✅ $script is executable${NC}"
        else
            echo -e "${YELLOW}⚠️  $script is not executable (run: chmod +x $script)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

echo "🔍 Checking Configuration Files..."

# Check configuration utilities
check_file "backend/src/config/env.js" "Backend environment configuration utility"
check_file "backend/src/utils/logger.js" "Backend logger utility"
check_file "frontend/src/lib/config.ts" "Frontend configuration utility"
check_file "frontend/src/lib/api.ts" "Frontend API utility"

echo "🔍 Checking Documentation..."

# Check documentation
check_file "ENVIRONMENT_SETUP.md" "Environment setup documentation"

# Summary
echo ""
echo "📊 Validation Summary:"
echo "====================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All environment configurations are valid!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configuration is mostly valid with $WARNINGS warnings${NC}"
    echo "Please review the warnings above and fix them when possible."
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS errors and $WARNINGS warnings${NC}"
    echo "Please fix the errors above before deploying to staging or production."
    exit 1
fi