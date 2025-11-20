# NullShot Chess AI - Quick Start Guide

## 🎯 What You Have

A complete chess AI system with blockchain integration:

1. **MCP Chess Agent** - AI that plays chess (Cloudflare Workers)
2. **Smart Contract** - On-chain game results & NFT rewards (Solidity)
3. **Blockchain Integration** - AI auto-submits wins to blockchain

## ⚡ Quick Commands

### Smart Contract

```bash
# Navigate to contract folder
cd smartcontract/nullshotChess

# Build
forge build

# Test (all 9 tests should pass)
forge test -vv

# Deploy to local blockchain
anvil  # In separate terminal
forge script script/DeployChessGame.s.sol:DeployChessGame \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Deploy to Sepolia
export PRIVATE_KEY=your_key
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
forge script script/DeployChessGame.s.sol:DeployChessGame \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### MCP Server

```bash
# Navigate to MCP server
cd my-chess-agent/mcp-server

# Install dependencies (already done)
pnpm install

# Run development server
pnpm dev

# Server runs on http://localhost:8787
```

### MCP Inspector

```bash
# Open Inspector UI
# URL: https://inspector.nullshot.ai/?transport=sse&serverUrl=http://localhost:8787/sse&MCP_PROXY_FULL_ADDRESS=http://localhost:6277&MCP_PROXY_AUTH_TOKEN=d94157603d4169abff3d2d2599ae9a9100561edb3701a5c7f6a5dd8c4772f531
```

## 🎮 Testing the Chess AI

### 1. Test Chess Move Tool

In MCP Inspector, use the `make_chess_move` tool:

```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "side": "white",
  "difficulty": "hard"
}
```

Expected response: AI's chess move (e.g., "e2e4")

### 2. Test Blockchain Submission Tool

```json
{
  "gameId": "test-123",
  "humanAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "winner": "ai",
  "signature": "0x..."
}
```

**For draw games:**

```json
{
  "gameId": "test-456",
  "humanAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "winner": "draw",
  "signature": "0x..."
}
```

## 🔧 Configuration Checklist

### For Blockchain Integration

- [ ] Deploy ChessGame.sol to Sepolia
- [ ] Create Cloudflare KV namespace: `wrangler kv:namespace create "KV_NAMESPACE"`
- [ ] Add KV binding to `wrangler.jsonc`
- [ ] Store AI wallet key: `wrangler kv:key put --binding=KV_NAMESPACE "AI_WALLET_KEY" "0x..."`
- [ ] Update contract address in `src/server.ts` (line 159)
- [ ] Update RPC URL in `src/server.ts` (line 154)
- [ ] Fund AI wallet with Sepolia ETH

## 📁 Project Structure

```
nullshot-chess/
├── my-chess-agent/
│   └── mcp-server/
│       ├── src/
│       │   ├── server.ts          # Main MCP server with chess & blockchain tools
│       │   └── index.ts           # Worker entry point
│       ├── wrangler.jsonc         # Cloudflare config (add KV here)
│       └── package.json
│
├── smartcontract/
│   └── nullshotChess/
│       ├── src/
│       │   └── ChessGame.sol      # Main contract
│       ├── test/
│       │   └── ChessGame.t.sol    # Comprehensive tests
│       ├── script/
│       │   └── DeployChessGame.s.sol  # Deployment script
│       ├── foundry.toml           # Foundry config
│       └── README_DEPLOYMENT.md   # Detailed deployment guide
│
├── BLOCKCHAIN_INTEGRATION.md      # Complete integration guide
└── QUICK_START.md                 # This file
```

## 🎯 MCP Tools Available

### Chess Tools

1. **make_chess_move** - AI makes a chess move
   - Input: FEN position, side, difficulty
   - Output: Best move in UCI format

### Blockchain Tools

2. **submit_game_result** - Submit AI win or draw to blockchain
   - Input: gameId, humanAddress, winner ('ai', 'human', or 'draw'), signature
   - Output: Transaction hash or error

### Resources

- **chess_game_state** - Get current game state

### Prompts

- **chess_strategy** - Get strategic advice

## 🧪 Test Results

All smart contract tests passing:

```
✅ testSubmitTwoPlayerGame (gas: 408,719)
✅ testSubmitAIGameHumanWins (gas: 306,328)
✅ testSubmitAIGameAIWins (gas: 193,651)
✅ testRevertDuplicateGameSubmission (gas: 402,821)
✅ testRevertInvalidSignature (gas: 37,134)
✅ testRevertInvalidWinner (gas: 31,379)
✅ testMultipleGamesAndStats (gas: 924,803)
```

## 🔐 Security Notes

1. **Never commit private keys** to git
2. **Use environment variables** for sensitive data
3. **Test on Sepolia** before mainnet
4. **Verify contracts** on Etherscan
5. **Audit smart contracts** before production

## 📚 Documentation

- **Smart Contract**: `smartcontract/nullshotChess/README_DEPLOYMENT.md`
- **Integration Guide**: `BLOCKCHAIN_INTEGRATION.md`
- **Foundry Docs**: https://book.getfoundry.sh/
- **NullShot Docs**: https://docs.nullshot.ai/

## 🆘 Common Issues

### "KV_NAMESPACE not configured"

→ Add KV binding to `wrangler.jsonc`

### "Wallet key not found in KV"

→ Run: `wrangler kv:key put --binding=KV_NAMESPACE "AI_WALLET_KEY" "0x..."`

### "Invalid signature"

→ Check nonce matches contract state

### "Insufficient funds"

→ Fund AI wallet with Sepolia ETH from faucet

### Tests fail with "Stack too deep"

→ Already fixed with `via_ir = true` in foundry.toml

## 🎉 Next Steps

1. **Deploy to Sepolia** - Get contract on testnet
2. **Configure KV** - Store AI wallet key
3. **Test end-to-end** - Play game, submit result
4. **Build frontend** - React app with chess.js
5. **Add MetaMask** - Wallet integration
6. **Go live** - Deploy to mainnet

## 💡 Tips

- Use **hard difficulty** for best AI moves
- **Starting FEN**: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`
- **AI address**: `address(0)` in contract
- **Nonce**: Get from contract before signing
- **Chain ID**: 11155111 for Sepolia

## 🚀 You're Ready!

Everything is set up and tested. Follow the configuration checklist to enable blockchain integration, then start building your frontend!

Good luck with your hackathon! 🏆
