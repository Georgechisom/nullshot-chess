#!/bin/bash

# Test MCP Server Connection
echo "🔍 Testing MCP Server Connection..."
echo ""

SESSION_ID="test-$(date +%s)"

echo "1️⃣ Testing SSE Connection..."
echo "URL: http://localhost:8787/sse?sessionId=$SESSION_ID"
echo ""

# Start SSE connection in background
curl -N "http://localhost:8787/sse?sessionId=$SESSION_ID" 2>&1 &
SSE_PID=$!

# Wait for connection to establish
sleep 2

echo ""
echo "2️⃣ Sending Initialize Request..."
INIT_RESPONSE=$(curl -s -X POST "http://localhost:8787/sse/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    }
  }')

echo "Response: $INIT_RESPONSE"
echo ""

echo "3️⃣ Listing Tools..."
TOOLS_RESPONSE=$(curl -s -X POST "http://localhost:8787/sse/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}')

echo "Response: $TOOLS_RESPONSE"
echo ""

echo "4️⃣ Calling make_chess_move..."
MOVE_RESPONSE=$(curl -s -X POST "http://localhost:8787/sse/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "make_chess_move",
      "arguments": {
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "side": "white"
      }
    }
  }')

echo "Response: $MOVE_RESPONSE"
echo ""

# Kill SSE connection
kill $SSE_PID 2>/dev/null

echo "✅ Test Complete!"
echo ""
echo "📊 Check the responses above to see if the server is working correctly."
echo "   - Initialize should return server info"
echo "   - Tools/list should show 'make_chess_move'"
echo "   - Tools/call should return a chess move"

