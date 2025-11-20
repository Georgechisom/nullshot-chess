# 🚀 Quick Start Guide - MCP Chess Server

## Your Server is Ready!

All issues have been fixed. Here's how to use your MCP Chess Server:

## Start the Server

```bash
cd my-chess-agent/mcp-server
pnpm dev
```

This will:
1. Start the Wrangler dev server on `http://localhost:8787`
2. Launch MCP Inspector on `http://localhost:6274`
3. Open the Inspector in your browser automatically

## Verify It's Working

### ✅ Check 1: Server Logs
You should see:
```
Ready on http://localhost:8787
MCP Inspector is up and running at: http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=...
```

### ✅ Check 2: MCP Inspector UI
In the Inspector, you should see:
- **Server Info**: NullShotChessAI v1.0.0
- **Tools**: make_chess_move
- **Resources**: chess_game_state  
- **Prompts**: chess_strategy

### ✅ Check 3: Quick curl Test
```bash
# Test SSE connection
curl "http://localhost:8787/sse?sessionId=test-123"
# Should return: event: endpoint, data: /sse/message?sessionId=test-123
```

## Use the Chess Tool

### Via MCP Inspector (Easiest)

1. Open the Inspector (auto-opens when you run `pnpm dev`)
2. Click on "Tools" tab
3. Select `make_chess_move`
4. Fill in parameters:
   ```json
   {
     "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
     "side": "white"
   }
   ```
5. Click "Call Tool"
6. See the AI's move in the response!

### Via curl (Advanced)

```bash
# Set session ID
SESSION_ID="chess-game-$(date +%s)"

# 1. Establish SSE connection (run in background)
curl "http://localhost:8787/sse?sessionId=$SESSION_ID" &
sleep 1

# 2. Initialize
curl -X POST "http://localhost:8787/sse/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'

# 3. Call chess tool
curl -X POST "http://localhost:8787/sse/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "make_chess_move",
      "arguments": {
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "side": "white"
      }
    }
  }'
```

## Common Commands

```bash
# Start with Inspector
pnpm dev

# Start server only (no Inspector)
pnpm start

# Run tests
pnpm test

# Deploy to Cloudflare
pnpm run deploy

# Type checking
pnpm run build
```

## Understanding the Response

When you call `make_chess_move`, you'll get a response like:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Moved: e4. New FEN: rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
    }
  ]
}
```

The AI has:
- Made a move (e.g., "e4")
- Returned the new board state in FEN notation

## What's Next?

### 1. Enhance the AI
Currently, the chess AI makes random moves. To make it smarter:
- Integrate with an LLM (Claude, GPT-4, etc.)
- Use chess engines like Stockfish
- Implement minimax algorithm

### 2. Add Game State Persistence
Store games in Cloudflare KV or D1:
```typescript
// In setupChessResources
const gameState = await c.env.CHESS_GAMES.get(gameId);
```

### 3. Build a Frontend
Create a chess UI that calls your MCP server:
- React + chess.js
- Display board visually
- Call `make_chess_move` tool for AI moves

### 4. Deploy to Production
```bash
pnpm run deploy
```

Your server will be live at:
```
https://mcp-server.<your-subdomain>.workers.dev
```

## Files Modified

✅ `src/index.ts` - Simplified worker routing with named DO instance
✅ `src/server.ts` - Added constructor, removed custom handlers
✅ `mcp.json` - Updated endpoint configuration

## Documentation

- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - Detailed explanation of fixes
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [README.md](./README.md) - Full project documentation

## Support

- NullShot Docs: https://nullshot.ai/docs
- MCP Spec: https://modelcontextprotocol.io
- GitHub: https://github.com/null-shot/typescript-agent-framework

---

**Happy Hacking! 🎉**

Your MCP Chess Server is ready to play!

