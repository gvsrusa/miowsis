#!/bin/bash

echo "🧪 Running MIOwSIS test suite..."

# Frontend tests
echo "📱 Running frontend tests..."
cd frontend
npm test -- --run
FRONTEND_EXIT_CODE=$?
cd ..

# Backend tests
echo "☕ Running backend tests..."
cd backend
./gradlew test
BACKEND_EXIT_CODE=$?
cd ..

# Summary
echo ""
echo "📊 Test Results:"
if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo "✅ Frontend tests: PASSED"
else
    echo "❌ Frontend tests: FAILED"
fi

if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo "✅ Backend tests: PASSED"
else
    echo "❌ Backend tests: FAILED"
fi

# Exit with non-zero if any tests failed
if [ $FRONTEND_EXIT_CODE -ne 0 ] || [ $BACKEND_EXIT_CODE -ne 0 ]; then
    exit 1
fi

echo ""
echo "🎉 All tests passed!"