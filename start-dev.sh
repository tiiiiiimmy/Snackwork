#!/bin/bash

echo "Starting SnackSpot Auckland Development Environment..."

# Function to handle cleanup on exit
cleanup() {
    echo "Shutting down development servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting .NET backend on port 5011..."
cd src/backend/SnackSpotAuckland.Api
dotnet run --launch-profile http &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting React frontend on port 5174..."
cd ../../../src/frontend
npm run dev &
FRONTEND_PID=$!

# Display status
echo ""
echo "🚀 Development servers started!"
echo "   Frontend: http://localhost:5174"
echo "   Backend:  http://localhost:5011"
echo "   API Docs: http://localhost:5011/swagger"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for all background jobs to finish
wait 