#!/bin/bash

# Test script for blockchain submission functionality
# Tests the submit_game_result MCP tool via HTTP API

echo "🧪 Testing MCP Server Blockchain Submission"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server URL
SERVER_URL="http://localhost:8787/api/chess/submit"

echo "📍 Server: $SERVER_URL"
echo ""

# Test 1: Human Win (should not submit to blockchain)
echo -e "${YELLOW}Test 1: Human Win${NC}"
echo "Expected: Should return 'Human won; frontend submits.'"
RESPONSE=$(curl -s -X POST $SERVER_URL \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "test-game-001",
    "humanAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "winner": "human",
    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "Human won; frontend submits"; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi
echo ""

# Test 2: AI Win (should attempt blockchain submission)
echo -e "${YELLOW}Test 2: AI Win${NC}"
echo "Expected: Should attempt blockchain submission (will fail without wallet key)"
RESPONSE=$(curl -s -X POST $SERVER_URL \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "test-game-002",
    "humanAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "winner": "ai",
    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "Wallet key not found\|Victory recorded"; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi
echo ""

# Test 3: Draw (should attempt blockchain submission)
echo -e "${YELLOW}Test 3: Draw${NC}"
echo "Expected: Should attempt blockchain submission (will fail without wallet key)"
RESPONSE=$(curl -s -X POST $SERVER_URL \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "test-game-003",
    "humanAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "winner": "draw",
    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "Wallet key not found\|Victory recorded"; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi
echo ""

# Test 4: Missing parameters
echo -e "${YELLOW}Test 4: Missing Parameters${NC}"
echo "Expected: Should return 'Missing required parameters'"
RESPONSE=$(curl -s -X POST $SERVER_URL \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "test-game-004"
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "Missing required parameters"; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi
echo ""

echo "=============================================="
echo "🎉 Test Suite Complete!"
echo ""
echo "📝 Note: To enable actual blockchain submission:"
echo "   1. Set AI_WALLET_KEY in KV storage:"
echo "      wrangler kv:key put --binding=KV_NULLSHOTCHESS \"AI_WALLET_KEY\" \"your-private-key\""
echo ""
