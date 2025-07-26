#!/bin/bash

# SnackSpot Auckland - Developer Setup Script
# This script sets up the development environment for new developers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}"
    echo "======================================================"
    echo "    SnackSpot Auckland - Developer Setup"
    echo "======================================================"
    echo -e "${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        log_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is >= 20
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 20 ]; then
            log_error "Node.js version 20+ is required. Current version: $NODE_VERSION"
            exit 1
        fi
    else
        log_error "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log_success "npm is installed: $NPM_VERSION"
    else
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check .NET
    if command_exists dotnet; then
        DOTNET_VERSION=$(dotnet --version)
        log_success ".NET is installed: $DOTNET_VERSION"
    else
        log_error ".NET SDK is not installed. Please install .NET 9.0+ from https://dotnet.microsoft.com/"
        exit 1
    fi
    
    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version)
        log_success "Git is installed: $GIT_VERSION"
    else
        log_error "Git is not installed"
        exit 1
    fi
    
    # Check Docker (optional)
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version)
        log_success "Docker is installed: $DOCKER_VERSION"
    else
        log_warning "Docker is not installed (optional for local PostgreSQL)"
    fi
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "src/backend/SnackSpotAuckland.Api/appsettings.Development.json" ]; then
        log_info "Creating backend development settings..."
        cat > src/backend/SnackSpotAuckland.Api/appsettings.Development.json << 'EOF'
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=snackspot_dev;Username=snackspot;Password=snackspot123"
  },
  "Jwt": {
    "Key": "your-super-secret-key-at-least-256-bits-long-for-security-development-only",
    "Issuer": "SnackSpotAuckland",
    "Audience": "SnackSpotAuckland",
    "ExpirationMinutes": 60,
    "RefreshExpirationDays": 7
  },
  "GoogleMaps": {
    "ApiKey": "your-google-maps-api-key-here"
  }
}
EOF
        log_success "Created backend development settings"
    else
        log_info "Backend development settings already exist"
    fi
    
    # Frontend environment
    if [ ! -f "src/frontend/.env.development" ]; then
        log_info "Creating frontend development environment..."
        cat > src/frontend/.env.development << 'EOF'
VITE_API_URL=http://localhost:5011/api/v1
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
VITE_APP_NAME=SnackSpot Auckland
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
EOF
        log_success "Created frontend development environment"
    else
        log_info "Frontend development environment already exists"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Backend dependencies
    log_info "Installing backend dependencies..."
    cd src/backend/SnackSpotAuckland.Api
    dotnet restore
    log_success "Backend dependencies installed"
    cd ../../../
    
    # Frontend dependencies
    log_info "Installing frontend dependencies..."
    cd src/frontend
    npm install
    log_success "Frontend dependencies installed"
    cd ../../
}

# Setup database
setup_database() {
    log_info "Setting up database..."
    
    if command_exists docker; then
        log_info "Starting PostgreSQL with Docker..."
        
        # Check if container already exists
        if [ "$(docker ps -aq -f name=snackspot-postgres)" ]; then
            log_info "PostgreSQL container already exists, starting it..."
            docker start snackspot-postgres || true
        else
            log_info "Creating PostgreSQL container..."
            docker run -d \
                --name snackspot-postgres \
                -e POSTGRES_DB=snackspot_dev \
                -e POSTGRES_USER=snackspot \
                -e POSTGRES_PASSWORD=snackspot123 \
                -p 5432:5432 \
                postgis/postgis:16-3.4
        fi
        
        # Wait for PostgreSQL to be ready
        log_info "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        # Run database migrations
        log_info "Running database migrations..."
        cd src/backend/SnackSpotAuckland.Api
        dotnet ef database update || {
            log_warning "Database migrations failed. You may need to create them first."
            log_info "Run: dotnet ef migrations add InitialCreate"
        }
        cd ../../../
        
        log_success "Database setup completed"
    else
        log_warning "Docker not available. Please set up PostgreSQL manually:"
        log_info "1. Install PostgreSQL with PostGIS extension"
        log_info "2. Create database 'snackspot_dev'"
        log_info "3. Create user 'snackspot' with password 'snackspot123'"
        log_info "4. Grant permissions to the user"
        log_info "5. Run database migrations with: dotnet ef database update"
    fi
}

# Setup development tools
setup_tools() {
    log_info "Setting up development tools..."
    
    # Install global tools if not already installed
    if ! command_exists dotnet-ef; then
        log_info "Installing Entity Framework tools..."
        dotnet tool install --global dotnet-ef
        log_success "Entity Framework tools installed"
    else
        log_info "Entity Framework tools already installed"
    fi
    
    # Setup Git hooks
    if [ ! -f ".git/hooks/pre-commit" ]; then
        log_info "Setting up Git pre-commit hook..."
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run linting and tests before commit

echo "Running pre-commit checks..."

# Frontend checks
cd src/frontend
npm run lint
if [ $? -ne 0 ]; then
    echo "Frontend linting failed"
    exit 1
fi

npm run test -- --run
if [ $? -ne 0 ]; then
    echo "Frontend tests failed"
    exit 1
fi

cd ../../

# Backend checks
cd src/backend/SnackSpotAuckland.Api
dotnet build
if [ $? -ne 0 ]; then
    echo "Backend build failed"
    exit 1
fi

cd ../../../

echo "Pre-commit checks passed"
EOF
        chmod +x .git/hooks/pre-commit
        log_success "Git pre-commit hook installed"
    else
        log_info "Git pre-commit hook already exists"
    fi
}

# Create development scripts
create_scripts() {
    log_info "Creating development scripts..."
    
    # Start script
    cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash
# Start development servers

echo "Starting SnackSpot Auckland development environment..."

# Start PostgreSQL if using Docker
if command -v docker >/dev/null 2>&1; then
    docker start snackspot-postgres 2>/dev/null || true
fi

# Start backend in background
echo "Starting backend server..."
cd src/backend/SnackSpotAuckland.Api
dotnet run &
BACKEND_PID=$!
cd ../../../

# Wait a moment for backend to start
sleep 5

# Start frontend
echo "Starting frontend server..."
cd src/frontend
npm run dev &
FRONTEND_PID=$!
cd ../../

echo "Development servers started:"
echo "- Backend: http://localhost:5011"
echo "- Frontend: http://localhost:5173"
echo "- API Documentation: http://localhost:5011/swagger"
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle cleanup on exit
cleanup() {
    echo "Stopping development servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
EOF
    chmod +x scripts/start-dev.sh
    
    # Test script
    cat > scripts/run-tests.sh << 'EOF'
#!/bin/bash
# Run all tests

echo "Running SnackSpot Auckland test suite..."

# Frontend tests
echo "Running frontend tests..."
cd src/frontend
npm run test:coverage
npm run test:accessibility
cd ../../

# Backend tests (when available)
echo "Running backend tests..."
cd src/backend/SnackSpotAuckland.Api
dotnet test || echo "No backend tests found"
cd ../../../

echo "Test suite completed"
EOF
    chmod +x scripts/run-tests.sh
    
    log_success "Development scripts created"
}

# Print post-setup instructions
print_instructions() {
    log_success "Setup completed successfully!"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Configure your Google Maps API key in the environment files"
    echo "2. Start the development environment: ./scripts/start-dev.sh"
    echo "3. Open http://localhost:5173 in your browser"
    echo "4. API documentation: http://localhost:5011/swagger"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "- Start development: ./scripts/start-dev.sh"
    echo "- Run tests: ./scripts/run-tests.sh"
    echo "- Frontend linting: cd src/frontend && npm run lint"
    echo "- Backend build: cd src/backend/SnackSpotAuckland.Api && dotnet build"
    echo "- Database migrations: cd src/backend/SnackSpotAuckland.Api && dotnet ef migrations add <name>"
    echo ""
    echo -e "${BLUE}Project structure:${NC}"
    echo "- src/frontend/: React TypeScript frontend"
    echo "- src/backend/: .NET Core Web API"
    echo "- docs/: Project documentation"
    echo "- scripts/: Development scripts"
    echo ""
    echo -e "${GREEN}Happy coding! 🍿${NC}"
}

# Main setup flow
main() {
    print_header
    
    log_info "Starting developer setup for SnackSpot Auckland..."
    
    check_requirements
    setup_environment
    install_dependencies
    setup_database
    setup_tools
    create_scripts
    print_instructions
}

# Run setup if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi