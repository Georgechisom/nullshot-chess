# Chess AI Agent - Blockchain Integration Guide

## 🎯 Complete System Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │◄────►│  MCP Agent       │◄────►│  Blockchain     │
│   (React)       │      │  (Cloudflare)    │      │  (Sepolia)      │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                         │                          │
        │                         │                          │
    Chess.js                 Chess Tools              ChessGame.sol
    Game Logic              AI Moves                  NFT Minting
    UI/UX                   Blockchain Submit         Result Storage
```

## 📦 Components

### 1. Smart Contract (`smartcontract/nullshotChess/`)

- **ChessGame.sol**: Main contract with EIP-712 signatures
- **Tests**: Comprehensive Foundry tests
- **Deployment**: Scripts for local and testnet deployment

### 2. MCP Agent (`my-chess-agent/mcp-server/`)

- **Chess Tools**: Make moves, validate positions
- **Blockchain Tool**: Auto-submit AI wins and draws to blockchain
- **Resources**: Game state management
- **Prompts**: Chess strategy suggestions

### 3. Frontend (To be implemented)

- React app with chess.js
- Web3 wallet integration (MetaMask)
- EIP-712 signature generation
- Game result submission

## 🚀 Setup Instructions

### Step 1: Deploy Smart Contract

```bash
cd smartcontract/nullshotChess

# Install dependencies (already done)
forge install

# Build
forge build

# Test
forge test -vv

# Deploy to Sepolia
export PRIVATE_KEY=your_deployer_private_key
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

forge script script/DeployChessGame.s.sol:DeployChessGame \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_ETHERSCAN_API_KEY

# Save the deployed contract address!
```

### Step 2: Configure MCP Agent for Blockchain

#### 2.1 Create Cloudflare KV Namespace

```bash
cd my-chess-agent/mcp-server

# Create KV namespace
wrangler kv:namespace create "KV_NAMESPACE"

# Note the ID returned, e.g., id = "abc123..."
```

#### 2.2 Update wrangler.jsonc

Add KV binding to `my-chess-agent/mcp-server/wrangler.jsonc`:

```json
{
  "name": "mcp-server",
  "main": "src/index.ts",
  "compatibility_date": "2024-11-01",
  "durable_objects": {
    "bindings": [
      {
        "name": "EXAMPLE_MCP_SERVER",
        "class_name": "ExampleMcpServer",
        "script_name": "mcp-server"
      }
    ]
  },
  "kv_namespaces": [
    {
      "binding": "KV_NAMESPACE",
      "id": "YOUR_KV_NAMESPACE_ID_HERE"
    }
  ]
}
```

#### 2.3 Store AI Wallet Private Key

```bash
# Generate a new wallet for the AI (or use existing)
# IMPORTANT: This wallet needs Sepolia ETH for gas!

wrangler kv:key put --binding=KV_NAMESPACE "AI_WALLET_KEY" "0xYourAIWalletPrivateKey"
```

#### 2.4 Update Contract Address in server.ts

Edit `my-chess-agent/mcp-server/src/server.ts` line 159:

```typescript
const contractAddress = "0xYourDeployedChessGameAddress"; // Replace with actual address
```

Also update line 154 with your RPC URL:

```typescript
const rpcUrl = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
```

### Step 3: Test the Integration

#### 3.1 Start MCP Server

```bash
cd my-chess-agent/mcp-server
pnpm dev
```

#### 3.2 Test Blockchain Tool in MCP Inspector

Open the Inspector UI and test the `submit_game_result` tool:

```json
{
  "gameId": "test-game-123",
  "humanAddress": "0xHumanPlayerAddress",
  "winner": "ai",
  "signature": "0xSignatureFromHumanPlayer"
}
```

## 🔐 Generating Signatures (Frontend)

### Install Dependencies

```bash
npm install ethers
```

### Signature Generation Code

```typescript
import { ethers } from "ethers";

async function generateGameSignature(
  gameId: string,
  player1: string,
  player2: string,
  winner: string,
  contractAddress: string,
  signer: ethers.Signer
): Promise<string> {
  // Get nonce from contract
  const contract = new ethers.Contract(
    contractAddress,
    ["function getNonce(address) view returns (uint256)"],
    signer
  );

  const nonce = await contract.getNonce(await signer.getAddress());

  // EIP-712 Domain
  const domain = {
    name: "ChessGame",
    version: "1",
    chainId: 11155111, // Sepolia
    verifyingContract: contractAddress,
  };

  // EIP-712 Types
  const types = {
    GameResult: [
      { name: "gameId", type: "string" },
      { name: "player1", type: "address" },
      { name: "player2", type: "address" },
      { name: "winner", type: "address" },
      { name: "isDraw", type: "bool" },
      { name: "nonce", type: "uint256" },
    ],
  };

  // Message
  const message = {
    gameId,
    player1,
    player2,
    winner,
    isDraw,
    nonce,
  };

  // Sign
  return await signer.signTypedData(domain, types, message);
}

// Example usage for AI game (AI wins)
const signature = await generateGameSignature(
  "game-123",
  humanAddress,
  ethers.ZeroAddress, // AI = address(0)
  contractAddress, // AI wins
  false, // Not a draw
  contractAddress,
  signer
);

// Example usage for draw
const drawSignature = await generateGameSignature(
  "game-456",
  humanAddress,
  ethers.ZeroAddress,
  ethers.ZeroAddress, // address(0) for draws
  true, // Is a draw
  contractAddress,
  signer
);
```

## 🎮 Complete Game Flow

### Human vs AI Game (Win)

1. **Frontend**: User plays chess against AI
2. **MCP Agent**: AI makes moves using `make_chess_move` tool
3. **Game Ends**: Determine winner
4. **Frontend**: Generate EIP-712 signature (with `isDraw: false`)
5. **Frontend**: Call MCP `submit_game_result` tool with `winner: 'ai'` or `'human'`
6. **MCP Agent**: If AI won, auto-submit to blockchain
7. **Blockchain**: Mint NFT to winner (if human won, frontend submits directly)

### Human vs AI Game (Draw)

1. **Frontend**: User plays chess against AI
2. **MCP Agent**: AI makes moves using `make_chess_move` tool
3. **Game Ends**: Draw detected (stalemate, insufficient material, etc.)
4. **Frontend**: Generate EIP-712 signature (with `winner: address(0)`, `isDraw: true`)
5. **Frontend**: Call MCP `submit_game_result` tool with `winner: 'draw'`
6. **MCP Agent**: Auto-submit draw to blockchain
7. **Blockchain**: Record draw, increment draw stats for both players, **no NFT minted**

### Two-Player Game (Win)

1. **Frontend**: Two players play chess
2. **Game Ends**: Determine winner
3. **Frontend**: Both players sign result with EIP-712 (with `isDraw: false`)
4. **Frontend**: Submit to blockchain directly via `submitTwoPlayerGame()`
5. **Blockchain**: Verify both signatures, mint NFT to winner

### Two-Player Game (Draw)

1. **Frontend**: Two players play chess
2. **Game Ends**: Draw detected
3. **Frontend**: Both players sign result with EIP-712 (with `winner: address(0)`, `isDraw: true`)
4. **Frontend**: Submit to blockchain via `submitTwoPlayerGame()`
5. **Blockchain**: Verify both signatures, record draw, **no NFT minted**

## 📊 Monitoring & Verification

### Check Contract on Etherscan

```
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

### Query Game Results

```typescript
const gameDetails = await contract.getGameDetails("game-123");
console.log("Winner:", gameDetails.winner);
console.log("Timestamp:", gameDetails.timestamp);

const wins = await contract.getWins(playerAddress);
console.log("Total wins:", wins);
```

### View NFTs

```typescript
const balance = await contract.balanceOf(playerAddress);
console.log("NFTs owned:", balance);
```

## 🔧 Troubleshooting

### MCP Agent Issues

- **"KV_NAMESPACE not configured"**: Add KV binding to wrangler.jsonc
- **"Wallet key not found"**: Store key with `wrangler kv:key put`
- **"Insufficient funds"**: Fund AI wallet with Sepolia ETH

### Contract Issues

- **"Invalid signature"**: Check nonce, domain, and message match
- **"Game already submitted"**: Each gameId can only be used once
- **"Winner must be one of the players"**: Winner must be player1 or player2

### Get Sepolia ETH

- [Sepolia Faucet 1](https://sepoliafaucet.com/)
- [Sepolia Faucet 2](https://www.alchemy.com/faucets/ethereum-sepolia)

## 🎉 Success Checklist

- [ ] Smart contract deployed to Sepolia
- [ ] Contract verified on Etherscan
- [ ] KV namespace created
- [ ] AI wallet private key stored in KV
- [ ] AI wallet funded with Sepolia ETH
- [ ] Contract address updated in server.ts
- [ ] RPC URL configured
- [ ] MCP server running
- [ ] Blockchain tool tested in Inspector
- [ ] Frontend can generate signatures
- [ ] End-to-end game flow tested

## 📚 Next Steps

1. Build React frontend with chess.js
2. Integrate MetaMask for wallet connection
3. Implement signature generation in frontend
4. Add game history display
5. Show NFT gallery for winners
6. Deploy to production (mainnet)
