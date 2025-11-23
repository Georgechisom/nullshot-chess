# MCP Chess Server Troubleshooting Guide

## Quick Fix Summary

The main issues were:
1. **Session ID Management**: Each request was creating a new Durable Object instance
2. **Transport Layer**: Custom handlers were interfering with MCP SDK's built-in transport
3. **Endpoint Configuration**: Inspector was trying to connect to `/ws` instead of `/sse`

## What Was Fixed

### 1. Simplified Worker Entry Point (`src/index.ts`)
- **Before**: Complex session ID validation and routing logic
- **After**: Simple routing to a single named Durable Object instance (`mcp-session`)
- **Why**: Ensures all requests go to the same DO instance for session persistence

### 2. Cleaned Up Server Implementation (`src/server.ts`)
- **Before**: Custom `/sse` and `/ws` handlers with manual JSON-RPC processing
- **After**: Rely on `McpHonoServerDO` parent class to handle all transport
- **Why**: The parent class already implements proper MCP protocol handling

### 3. Updated MCP Configuration (`mcp.json`)
- **Before**: `"url": "http://localhost:8787/ws"`
- **After**: `"url": "http://localhost:8787/sse"` with `"transport": "streamable-http"`
- **Why**: MCP Inspector uses streamable-http transport over SSE endpoint

## Testing the Server

### Step 1: Start the Server
```bash
cd my-chess-agent/mcp-server
pnpm dev
```

You should see:
```
⛅️ wrangler 4.x.x
Ready on http://localhost:8787
MCP Inspector is up and running at: http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=...
```

### Step 2: Test with MCP Inspector

The Inspector should automatically open in your browser. If not, copy the URL from the terminal.

**Expected Behavior:**
- ✅ Connection status shows "Connected"
- ✅ Server info shows "NullShotChessAI v1.0.0"
- ✅ Tools list shows `make_chess_move`
- ✅ Resources list shows `chess_game_state`
- ✅ Prompts list shows `chess_strategy`

### Step 3: Test with curl

Run the test script:
```bash
chmod +x test-mcp.sh
./test-mcp.sh
```

Or test manually:
```bash
# Initialize
curl -X POST http://localhost:8787/sse \
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
  }'

# List tools
curl -X POST http://localhost:8787/sse \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}'

# Call make_chess_move
curl -X POST http://localhost:8787/sse \
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
  }'
```

## Common Issues

### Issue 1: "Connection Error" in MCP Inspector

**Symptoms:**
- Inspector shows "Connection Error"
- No server info displayed

**Solutions:**
1. Check server is running: `curl http://localhost:8787`
2. Check logs for errors in terminal
3. Try refreshing the Inspector page
4. Restart the server with `pnpm dev`

### Issue 2: "Invalid Durable Object ID" errors

**Symptoms:**
- Logs show "TypeError: Invalid Durable Object ID"
- 500 errors in responses

**Solution:**
- This should be fixed by using `idFromName('mcp-session')` instead of `idFromString()`
- If still occurring, check that `src/index.ts` matches the fixed version

### Issue 3: 404 errors on `/sse` or `/ws`

**Symptoms:**
- curl returns 404
- Inspector can't connect

**Solution:**
- Ensure `McpHonoServerDO` parent class is properly setting up routes
- Check that `configureServer()` is being called
- Verify no custom route handlers are interfering

### Issue 4: Tools not showing in Inspector

**Symptoms:**
- Inspector connects but shows no tools

**Solution:**
- Check `setupChessTools()` is called in `configureServer()`
- Verify tool registration syntax matches MCP SDK
- Check server logs for errors during tool setup

## Verification Checklist

- [ ] Server starts without errors
- [ ] MCP Inspector opens automatically
- [ ] Inspector shows "Connected" status
- [ ] Server info displays correctly
- [ ] Tools list shows `make_chess_move`
- [ ] Can call `make_chess_move` tool successfully
- [ ] Resources list shows `chess_game_state`
- [ ] Prompts list shows `chess_strategy`
- [ ] curl tests pass
- [ ] No errors in server logs

## Production Considerations

### Security
- **Never use `DANGEROUSLY_OMIT_AUTH=true` in production**
- Implement proper authentication tokens
- Use environment variables for sensitive config

### Deployment
```bash
# Deploy to Cloudflare Workers
pnpm run deploy
```

### Monitoring
- Check Cloudflare Workers dashboard for errors
- Monitor Durable Object usage
- Set up alerts for failures

## Additional Resources

- [NullShot Framework](https://github.com/null-shot/typescript-agent-framework)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)

