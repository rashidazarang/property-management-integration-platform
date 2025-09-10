#!/bin/bash

# PMIP Dry-Run Mode Test Runner
# This script runs the integration tests in dry-run mode

echo "================================================"
echo "    PMIP DRY-RUN MODE TEST RUNNER"
echo "================================================"
echo ""

# Change to PMIP directory
cd "$(dirname "$0")"

# Check if TypeScript is compiled
if [ ! -d "dist" ]; then
    echo "Building TypeScript files..."
    npm run build
fi

# Set environment variables for testing (optional - will use mock data anyway in dry-run)
export PROPERTYWARE_URL="${PROPERTYWARE_URL:-https://app.propertyware.com/pw/api/v1/soap.asmx}"
export PROPERTYWARE_WSDL="${PROPERTYWARE_WSDL:-https://app.propertyware.com/pw/api/v1/soap.asmx?WSDL}"
export PROPERTYWARE_USERNAME="${PROPERTYWARE_USERNAME:-test-user}"
export PROPERTYWARE_PASSWORD="${PROPERTYWARE_PASSWORD:-test-pass}"

export SERVICEFUSION_BASE_URL="${SERVICEFUSION_BASE_URL:-https://api.servicefusion.com/v1}"
export SERVICEFUSION_CLIENT_ID="${SERVICEFUSION_CLIENT_ID:-test-client-id}"
export SERVICEFUSION_CLIENT_SECRET="${SERVICEFUSION_CLIENT_SECRET:-test-client-secret}"

export SUPABASE_URL="${SUPABASE_URL:-https://test.supabase.co}"
export SUPABASE_KEY="${SUPABASE_KEY:-test-key}"

# Run the test using tsx (TypeScript executor)
echo "Running dry-run integration test..."
echo ""
npx tsx tests/dry-run-test.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dry-run test completed successfully!"
else
    echo ""
    echo "❌ Dry-run test failed!"
    exit 1
fi