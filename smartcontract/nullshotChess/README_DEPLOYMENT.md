# ChessGame Smart Contract - Complete Deployment Guide

## 📋 Overview

This smart contract enables off-chain chess gameplay with on-chain result verification and NFT rewards for winners. It supports:

- Two-player games with dual signature verification (EIP-712)
- Human vs AI games with single signature
- **Draw results** (no NFT minted, both players get draw stats)
- ERC721 NFT minting for winners
- Comprehensive game statistics tracking (wins, losses, draws)
- Replay attack prevention with nonces

## 🏗️ Contract Architecture

### Key Features

- **EIP-712 Signatures**: Secure off-chain signing for game results
- **Dual Verification**: Both players must sign two-player game results
- **NFT Rewards**: Winners receive unique ERC721 tokens
- **Statistics Tracking**: Wins, losses, and total games played
- **Replay Protection**: Nonce-based system prevents duplicate submissions

### Contract Functions

#### Submit Functions

- `submitTwoPlayerGame()` - Submit results for two-player games
- `submitAIGame()` - Submit results for human vs AI games

#### View Functions

- `getWinners()` - Get all winner addresses
- `getWins(address)` - Get win count for a player
- `getLosses(address)` - Get loss count for a player
- `getDraws(address)` - Get draw count for a player
- `getTotalDraws()` - Get total number of draws in the system
- `getGamesPlayed(address)` - Get total games for a player
- `getGameDetails(string)` - Get full game information (includes isDraw field)
- `getNonce(address)` - Get current nonce for signature generation
- `totalSupply()` - Get total NFTs minted

## 🚀 Quick Start

### 1. Build the Contract

```bash
cd smartcontract/nullshotChess
forge build
```

### 2. Run Tests

```bash
forge test -vv
```

All 9 tests should pass:

- ✅ testSubmitTwoPlayerGame
- ✅ testSubmitAIGameHumanWins
- ✅ testSubmitAIGameAIWins
- ✅ testTwoPlayerDraw
- ✅ testAIGameDraw
- ✅ testRevertDuplicateGameSubmission
- ✅ testRevertInvalidSignature
- ✅ testRevertInvalidWinner
- ✅ testMultipleGamesAndStats

### 3. Deploy Locally (Anvil)

```bash
# Terminal 1: Start local blockchain
anvil

# Terminal 2: Deploy contract
forge script script/DeployChessGame.s.sol:DeployChessGame \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

### 4. Deploy to Sepolia Testnet

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key_here
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Deploy
forge script script/DeployChessGame.s.sol:DeployChessGame \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_ETHERSCAN_API_KEY
```

## 📝 Generating EIP-712 Signatures

### For Frontend Integration

```typescript
import { ethers } from "ethers";

// EIP-712 Domain
const domain = {
  name: "ChessGame",
  version: "1",
  chainId: 11155111, // Sepolia
  verifyingContract: "0xYourContractAddress",
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

// Get nonce from contract
const nonce = await contract.getNonce(playerAddress);

// Create message (for a regular win)
const message = {
  gameId: "game123",
  player1: "0xPlayer1Address",
  player2: "0xPlayer2Address",
  winner: "0xPlayer1Address",
  isDraw: false,
  nonce: nonce,
};

// Sign
const signer = await provider.getSigner();
const signature = await signer.signTypedData(domain, types, message);
```

### For Draw Games

```typescript
// For draw games, winner must be address(0) and isDraw must be true
const drawMessage = {
  gameId: "game456",
  player1: "0xPlayer1Address",
  player2: "0xPlayer2Address",
  winner: "0x0000000000000000000000000000000000000000", // address(0)
  isDraw: true,
  nonce: nonce,
};

const signature = await signer.signTypedData(domain, types, drawMessage);
```

### For AI Games

```typescript
// For AI games, player2 is address(0)
const message = {
  gameId: "ai-game123",
  player1: humanPlayerAddress,
  player2: ethers.ZeroAddress, // AI represented as address(0)
  winner: humanWon ? humanPlayerAddress : contractAddress,
  isDraw: false,
  nonce: nonce,
};

const signature = await signer.signTypedData(domain, types, message);

// Submit to contract
await contract.submitAIGame(
  gameId,
  humanPlayerAddress,
  humanWon,
  false,
  signature
);
```

### For AI Game Draws

```typescript
// For AI game draws
const drawMessage = {
  gameId: "ai-draw-game",
  player1: humanPlayerAddress,
  player2: ethers.ZeroAddress,
  winner: ethers.ZeroAddress, // address(0) for draws
  isDraw: true,
  nonce: nonce,
};

const signature = await signer.signTypedData(domain, types, drawMessage);

// Submit to contract (humanWon is ignored when isDraw is true)
await contract.submitAIGame(gameId, humanPlayerAddress, false, true, signature);
```

## 🔧 Configuration Files

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.28"
optimizer = true
optimizer_runs = 200
via_ir = true
remappings = [
    "@openzeppelin/=lib/openzeppelin-contracts/",
    "forge-std/=lib/forge-std/src/"
]
```

## 📊 Gas Estimates

- Deploy: ~2,500,000 gas
- submitTwoPlayerGame: ~400,000 gas
- submitAIGame (human wins): ~300,000 gas
- submitAIGame (AI wins): ~190,000 gas

## 🔐 Security Features

1. **EIP-712 Signatures**: Industry-standard typed data signing
2. **Nonce System**: Prevents replay attacks
3. **Dual Verification**: Both players must agree on two-player results
4. **Immutable Records**: Games cannot be modified after submission
5. **Access Control**: Ownable pattern for admin functions

## 📚 Additional Resources

- [OpenZeppelin EIP712](https://docs.openzeppelin.com/contracts/4.x/api/utils#EIP712)
- [Foundry Book](https://book.getfoundry.sh/)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
