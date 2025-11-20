#!/bin/bash

# MCP Chess Server Test Script
# This script tests the MCP server functionality

set -e

echo "🧪 MCP Chess Server Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server URL and Session ID
SERVER_URL="http://localhost:8787"
SESSION_ID="test-session-$(date +%s)"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_codes=$5

    echo -e "${YELLOW}Testing: ${test_name}${NC}"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$SERVER_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$SERVER_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if echo "$expected_codes" | grep -q "$http_code"; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        echo "Response: $body" | head -c 200
        echo ""
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code, expected: $expected_codes)"
        echo "Response: $body"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: Server is running
echo "Test 1: Check if server is running"
if curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL" | grep -q "200\|404"; then
    echo -e "${GREEN}✓ Server is running${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Server is not responding${NC}"
    ((TESTS_FAILED++))
    exit 1
fi
echo ""

# Test 2: Establish SSE Connection
echo "Test 2: Establish SSE Connection"
echo -e "${YELLOW}Testing: SSE Connection${NC}"
response=$(curl -s -w "\n%{http_code}" -m 2 "$SERVER_URL/sse?sessionId=$SESSION_ID")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
    ((TESTS_FAILED++))
fi
echo ""

# Test 3: MCP Initialize
test_endpoint "MCP Initialize" "POST" "/sse/message?sessionId=$SESSION_ID" '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "test-client",
      "version": "1.0.0"
    }
  }
}' "200|202"

# Test 4: List Tools
test_endpoint "List Tools" "POST" "/sse/message?sessionId=$SESSION_ID" '{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}' "200|202"

# Test 5: List Resources
test_endpoint "List Resources" "POST" "/sse/message?sessionId=$SESSION_ID" '{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/list",
  "params": {}
}' "200|202"

# Test 6: List Prompts
test_endpoint "List Prompts" "POST" "/sse/message?sessionId=$SESSION_ID" '{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "prompts/list",
  "params": {}
}' "200|202"

# Test 7: Call make_chess_move tool
test_endpoint "Call make_chess_move Tool" "POST" "/sse/message?sessionId=$SESSION_ID" '{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "make_chess_move",
    "arguments": {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "side": "white",
      "difficulty": "medium"
    }
  }
}' "200|202"

# Test 8: Read chess game resource
test_endpoint "Read Chess Game Resource" "POST" "/sse/message?sessionId=$SESSION_ID" '{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "resources/read",
  "params": {
    "uri": "resource://chess/game/default"
  }
}' "200|202"

# Test 9: Get chess strategy prompt
test_endpoint "Get Chess Strategy Prompt" "POST" "/sse/message?sessionId=$SESSION_ID" '{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "prompts/get",
  "params": {
    "name": "chess_strategy"
  }
}' "200|202"

# Summary
echo "================================"
echo "Test Summary:"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

