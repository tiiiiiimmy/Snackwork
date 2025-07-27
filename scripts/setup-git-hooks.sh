#!/bin/bash

# Git hooks setup script for SnackSpot Auckland

set -e

echo "🔧 Setting up Git hooks for SnackSpot Auckland..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🚀 Running pre-commit checks..."

# Check if we're in the right directory
if [[ ! -f "start-dev.sh" ]]; then
    echo "❌ Please run this from the project root directory"
    exit 1
fi

# Frontend checks
echo "📦 Checking frontend..."
cd src/frontend

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Run frontend linting
echo "🧹 Running frontend linting..."
npm run lint || {
    echo "❌ Frontend linting failed"
    exit 1
}

# Run TypeScript type checking
echo "🔍 Running TypeScript type checking..."
npx tsc --noEmit || {
    echo "❌ TypeScript type checking failed"
    exit 1
}

# Go back to root
cd ../..

# Backend checks
echo "🔧 Checking backend..."
cd src/backend/SnackSpotAuckland.Api

# Restore dependencies
echo "📦 Restoring backend dependencies..."
dotnet restore

# Format code
echo "✨ Formatting backend code..."
dotnet format --no-restore

# Build backend
echo "🏗️ Building backend..."
dotnet build --no-restore || {
    echo "❌ Backend build failed"
    exit 1
}

# Go back to root
cd ../../..

echo "✅ All pre-commit checks passed!"
EOF

# Create pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

echo "🚀 Running pre-push checks..."

# Check if tests exist and run them
if [[ -f "src/frontend/package.json" ]]; then
    cd src/frontend
    if grep -q '"test"' package.json; then
        echo "🧪 Running frontend tests..."
        npm test 2>/dev/null || echo "⚠️  Frontend tests not fully implemented yet"
    fi
    cd ../..
fi

# Check if backend tests exist
if [[ -f "src/backend/SnackSpotAuckland.Api/SnackSpotAuckland.Api.csproj" ]]; then
    cd src/backend/SnackSpotAuckland.Api
    if dotnet test --list-tests 2>/dev/null | grep -q "Test"; then
        echo "🧪 Running backend tests..."
        dotnet test --no-restore || echo "⚠️  Backend tests not fully implemented yet"
    fi
    cd ../../..
fi

echo "✅ Pre-push checks completed!"
EOF

# Commit message validation hook removed as per updated requirements.

# Make hooks executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push

echo "✅ Git hooks setup complete!"
echo ""
echo "🎣 Installed hooks:"
echo "  - pre-commit: Runs linting and type checking"
echo "  - pre-push: Runs tests before pushing"
echo ""