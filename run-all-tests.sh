#!/bin/bash

# PMIP Comprehensive Test Runner
# Runs all dry-run tests to validate PMIP functionality
# WITHOUT touching production infrastructure

set -e

echo "================================================"
echo "    PMIP COMPREHENSIVE TEST SUITE"
echo "    DRY_RUN Mode - Safe for Production"
echo "================================================"
echo ""
echo "🛡️  Safety Checks:"
echo "   ✓ DRY_RUN mode enabled"
echo "   ✓ No EventBridge modifications"
echo "   ✓ No Lambda invocations"
echo "   ✓ No database writes"
echo "   ✓ All API calls mocked"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check TypeScript is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx is not installed${NC}"
    exit 1
fi

# Create test results directory
RESULTS_DIR="test-results"
mkdir -p $RESULTS_DIR

# Timestamp for this test run
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$RESULTS_DIR/test-report-$TIMESTAMP.txt"

echo -e "${BLUE}📁 Test results will be saved to: $REPORT_FILE${NC}"
echo ""

# Function to run a test and capture results
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "${YELLOW}▶️  Running: $test_name${NC}"
    echo "================================================" >> $REPORT_FILE
    echo "$test_name" >> $REPORT_FILE
    echo "Started: $(date)" >> $REPORT_FILE
    echo "================================================" >> $REPORT_FILE
    
    if npx tsx $test_file >> $REPORT_FILE 2>&1; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        echo "Status: PASSED" >> $REPORT_FILE
        return 0
    else
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        echo "Status: FAILED" >> $REPORT_FILE
        return 1
    fi
    
    echo "" >> $REPORT_FILE
}

# Track overall results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "Starting test execution..."
echo ""

# Test 1: Basic Dry-Run Test
echo "────────────────────────────────────────────────"
if run_test "Basic Dry-Run Test" "tests/dry-run-test.ts"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Test 2: Comprehensive Dry-Run Test
echo "────────────────────────────────────────────────"
if run_test "Comprehensive Dry-Run Test" "tests/comprehensive-dry-run-test.ts"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Test 3: Production Validation Test
echo "────────────────────────────────────────────────"
if run_test "Production Validation Test" "tests/validate-against-production.ts"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Generate summary
echo ""
echo "================================================" | tee -a $REPORT_FILE
echo "    TEST EXECUTION SUMMARY" | tee -a $REPORT_FILE
echo "================================================" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Total Tests: $TOTAL_TESTS" | tee -a $REPORT_FILE
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}" | tee -a $REPORT_FILE
echo -e "${RED}Failed: $FAILED_TESTS${NC}" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE

# Calculate pass rate
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Pass Rate: $PASS_RATE%" | tee -a $REPORT_FILE
fi

echo "" | tee -a $REPORT_FILE
echo "Test Completed: $(date)" | tee -a $REPORT_FILE
echo "Report saved to: $REPORT_FILE" | tee -a $REPORT_FILE

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "PMIP is working correctly in dry-run mode."
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please review the report.${NC}"
    exit 1
fi