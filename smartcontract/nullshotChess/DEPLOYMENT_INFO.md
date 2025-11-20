# ChessGame Contract Deployment Information

## 🎯 Deployment Details

**Contract Address:** `0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183`

**Deployer Address:** `0x83C6Ed4127675F64E5DC76a3cC6EC77A1c5aa717`

**Network:** Lisk Sepolia Testnet

**Chain ID:** 4202

**Deployment Date:** 2025-11-20

## 🌐 Network Information

**RPC URL:** https://rpc.sepolia-api.lisk.com

**Block Explorer:** https://sepolia-blockscout.lisk.com

**Contract on Explorer:** https://sepolia-blockscout.lisk.com/address/0x9b7cef0b7cff1a46d2cec347dcad63c3c721a183

**Verification Status:** ✅ Verified

## 📋 Contract Details

**Solidity Version:** 0.8.28

**Compiler:** solc with via_ir optimization

**Optimization Runs:** 200

**Gas Used for Deployment:** ~1,958,049 gas

## 🔑 EIP-712 Domain for Signatures

When generating signatures for this contract, use these domain parameters:

```javascript
const domain = {
  name: "ChessGame",
  version: "1",
  chainId: 4202, // Lisk Sepolia
  verifyingContract: "0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183"
};
```

## 📝 Contract Functions

### Main Functions

- `submitTwoPlayerGame(string gameId, address player1, address player2, address winner, bool isDraw, bytes signature1, bytes signature2)`
- `submitAIGame(string gameId, address humanPlayer, bool humanWon, bool isDraw, bytes signature)`

### View Functions

- `getNonce(address player)` - Get current nonce for signature generation
- `getWins(address player)` - Get win count
- `getLosses(address player)` - Get loss count
- `getDraws(address player)` - Get draw count
- `getGamesPlayed(address player)` - Get total games played
- `getTotalDraws()` - Get total draws in the system
- `getGameDetails(string gameId)` - Get full game details
- `getWinners()` - Get array of all winners
- `balanceOf(address owner)` - Get NFT balance (ERC721)
- `ownerOf(uint256 tokenId)` - Get NFT owner (ERC721)

## 🧪 Testing the Contract

### Get Your Nonce

```javascript
const nonce = await contract.getNonce("0xYourAddress");
```

### Generate Signature (AI Game Example)

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const humanAddress = await signer.getAddress();

const domain = {
  name: "ChessGame",
  version: "1",
  chainId: 4202,
  verifyingContract: "0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183"
};

const types = {
  GameResult: [
    { name: "gameId", type: "string" },
    { name: "player1", type: "address" },
    { name: "player2", type: "address" },
    { name: "winner", type: "address" },
    { name: "isDraw", type: "bool" },
    { name: "nonce", type: "uint256" }
  ]
};

const message = {
  gameId: "test-1",
  player1: humanAddress,
  player2: "0x0000000000000000000000000000000000000000", // AI
  winner: "0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183", // AI wins (contract address)
  isDraw: false,
  nonce: 0 // Use actual nonce from getNonce()
};

const signature = await signer.signTypedData(domain, types, message);
```

### Submit Game Result

```javascript
await contract.submitAIGame(
  "test-1",
  humanAddress,
  false, // humanWon
  false, // isDraw
  signature
);
```

## 🔗 Add Network to MetaMask

```javascript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x106A', // 4202 in hex
    chainName: 'Lisk Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://rpc.sepolia-api.lisk.com'],
    blockExplorerUrls: ['https://sepolia-blockscout.lisk.com']
  }]
});
```

## 💰 Get Testnet ETH

You'll need Lisk Sepolia ETH to interact with the contract. Get it from:
- Lisk Sepolia Faucet: https://sepolia-faucet.lisk.com (if available)
- Bridge from Ethereum Sepolia to Lisk Sepolia

## 📚 Documentation

For more details, see:
- `README_DEPLOYMENT.md` - Full deployment guide
- `BLOCKCHAIN_INTEGRATION.md` - Integration guide
- `QUICK_START.md` - Quick reference

