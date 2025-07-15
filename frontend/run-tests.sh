#!/bin/bash

# Dividend Tracker E2E Test Runner
# This script helps run Detox tests with proper setup

set -e

echo "🚀 Starting Dividend Tracker E2E Tests"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backend is running
check_backend() {
    print_status "Checking if backend is running..."
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        print_success "Backend is running on port 5001"
    else
        print_error "Backend is not running on port 5001"
        print_status "Please start the backend first:"
        echo "  cd ../backend && npm run dev"
        exit 1
    fi
}

# Check if iOS simulator is available
check_ios_simulator() {
    print_status "Checking iOS simulator availability..."
    if xcrun simctl list devices | grep -q "iPhone 15"; then
        print_success "iPhone 15 simulator found"
    else
        print_warning "iPhone 15 simulator not found, using available simulator"
        # List available simulators
        echo "Available simulators:"
        xcrun simctl list devices | grep "iPhone" | head -5
    fi
}

# Clean up previous builds
cleanup() {
    print_status "Cleaning up previous builds..."
    npm run test:e2e:clean || true
}

# Build the app
build_app() {
    print_status "Building app for testing..."
    npm run test:e2e:build
    if [ $? -eq 0 ]; then
        print_success "App built successfully"
    else
        print_error "Failed to build app"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running E2E tests..."
    npm run test:e2e
    if [ $? -eq 0 ]; then
        print_success "All tests passed! 🎉"
    else
        print_error "Some tests failed"
        exit 1
    fi
}

# Main execution
main() {
    print_status "Starting test setup..."
    
    # Check prerequisites
    check_backend
    check_ios_simulator
    
    # Clean and build
    cleanup
    build_app
    
    # Run tests
    run_tests
    
    print_success "Test execution completed!"
}

# Handle script arguments
case "${1:-}" in
    "clean")
        cleanup
        print_success "Cleanup completed"
        ;;
    "build")
        check_backend
        build_app
        ;;
    "run")
        run_tests
        ;;
    "check")
        check_backend
        check_ios_simulator
        ;;
    *)
        main
        ;;
esac 