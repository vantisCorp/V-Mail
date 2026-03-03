#!/bin/bash

# Vantis Mail - Deployment Script
# Deploys the application to production

set -e

echo "=================================="
echo "Vantis Mail - Deployment Script"
echo "=================================="
echo ""

# Check if we're on the main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Error: Not on main branch. Current branch: $CURRENT_BRANCH"
    echo "Please switch to main branch before deploying."
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: Uncommitted changes detected."
    echo "Please commit or stash changes before deploying."
    exit 1
fi

# Run tests
echo "Step 1: Running tests..."
npm run test
if [ $? -ne 0 ]; then
    echo "Error: Tests failed. Aborting deployment."
    exit 1
fi
echo "✓ Tests passed"

# Build application
echo "Step 2: Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: Build failed. Aborting deployment."
    exit 1
fi
echo "✓ Build successful"

# Build backend
echo "Step 3: Building backend..."
cd backend && cargo build --release
if [ $? -ne 0 ]; then
    echo "Error: Backend build failed. Aborting deployment."
    exit 1
fi
cd ..
echo "✓ Backend build successful"

# Tag the release
echo "Step 4: Creating release tag..."
VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"
git tag -a "$TAG" -m "Release version $VERSION"
git push origin "$TAG"
echo "✓ Release tag created: $TAG"

# Deploy (actual deployment would be handled by CI/CD)
echo "Step 5: Triggering deployment..."
echo "Deployment will be handled by CI/CD pipeline"
echo "Check GitHub Actions for deployment status"

echo ""
echo "=================================="
echo "Deployment initiated successfully!"
echo "=================================="
echo "Version: $VERSION"
echo "Tag: $TAG"
echo ""
echo "Next steps:"
echo "1. Monitor CI/CD pipeline in GitHub Actions"
echo "2. Verify deployment to production"
echo "3. Monitor application health"
echo ""