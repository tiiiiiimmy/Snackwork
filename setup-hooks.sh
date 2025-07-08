#!/bin/bash

# Setup script for development environment

set -e

echo "🔧 Setting up SnackSpot Auckland development environment..."

# Setup Git hooks
echo "🎣 Setting up Git hooks..."
./scripts/setup-git-hooks.sh

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd src/frontend
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend/SnackSpotAuckland.Api
dotnet restore

# Go back to root
cd ../../..

echo "✅ Development environment setup complete!"
echo ""
echo "🚀 Next steps:"
echo "  1. Run './start-dev.sh' to start the development servers"
echo "  2. All commits will now be automatically linted and formatted!"
echo ""
echo "📝 Commit message format: type(scope): description"
echo "   Examples:"
echo "   - feat(auth): add JWT token refresh functionality"
echo "   - fix(map): resolve marker clustering performance issue"
echo "   - docs(api): update authentication endpoints documentation"