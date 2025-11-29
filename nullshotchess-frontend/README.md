# NullShot Chess Frontend - Decentralized 3D Chess dApp

A stunning 3D chess dApp built with React Three Fiber, featuring immersive gameplay, blockchain-verified results, and ERC721 NFT rewards for winners.
---

## Features

### Gameplay
- **Immersive 3D Chess**: Hyper realistic chess pieces rendered with Three.js and React Three Fiber
- **Dual Game Modes**:
  - **VS Another Player**: Local multiplayer on same device
  - **VS NullShot AI**: Powered by MCP agent with Claude Sonnet 4
- **Legal Move Validation**: Chess.js ensures all moves follow official rules
- **Move Highlights**: Visual indicators for selected pieces and valid moves
- **Captured Pieces Display**: Shows captured pieces for both sides

### Customization
- **10 Luxurious Themes**: 
  - Classic Wood, Emerald Crown, Sapphire Throne, Ruby Dynasty
  - Diamond Grandmaster, Onyx Emperor, Pearl Kingdom
  - Jade Palace, Obsidian Knight, Amber Conquest
- **10 Board Designs**: 
  - Dark Walnut, Marble Elegance, Jade Garden, Lapis Lazuli
  - Rosewood Classic, Ebony Mist, Cherry Blossom
  - Pine Forest, Teak Glory, Bamboo Zen
- **Real-time Theme Preview**: See piece materials update instantly
- **Persistent Preferences**: Saved in localStorage

### Blockchain Integration
- **Blockchain Verified**: Game results submitted on-chain with EIP-712 signatures
- **NFT Rewards**: Mint ERC721 "ChessVictory" badges for every win
- **Live Leaderboard**: On-chain rankings fetched from smart contracts
- **Gasless Submission**: AI wallet pays gas fees (users play for free!)
- **Fallback to Manual**: If AI runs out of gas, users can submit manually

### Wallet & Network
- **RainbowKit Integration**: Seamless wallet connection
  - MetaMask, WalletConnect, Coinbase Wallet, etc.
- **Thirdweb SDK**: Simplified blockchain interactions
- **Lisk Sepolia Testnet**: Development/testing network
- **ENS Support**: Display ENS names if available

---

## Tech Stack

### Frontend Framework
- **React 18**: Component based architecture
- **TypeScript**: Type safety and better DX
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing

### 3D Graphics
- **Three.js**: WebGL 3D rendering engine
- **React Three Fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers (OrbitControls, Environment, etc.)
- **@react-three/postprocessing**: Visual effects

### Styling
- **TailwindCSS**: Utility-first CSS framework
- **Shadcn UI**: Pre-built accessible components
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icons

### Blockchain
- **Lisk Sepolia Testnet**: L2 Ethereum testnet
- **RainbowKit**: Wallet connection UI
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum library
- **Thirdweb SDK**: Contract interactions and NFT minting
- **EIP-712**: Typed data signing for game results

### Game Logic
- **chess.js**: Chess rules validation and move generation
- **WebSockets**: Real-time AI move communication with MCP server

---

## Quick Start

### Prerequisites

- **Node.js** v18+ and npm
- **MetaMask** or compatible Web3 wallet
- **Lisk Sepolia ETH** (get from [faucet](https://sepolia-faucet.lisk.com/))

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd nullshot-chess/nullshotchess-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:8080` to see the app.

### Environment Variables

Create `.env` file in the root:

```env
# Thirdweb
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Smart Contract
VITE_CONTRACT_ADDRESS=0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183

# MCP Server
VITE_MCP_SERVER_URL=https://your-mcp-server.workers.dev

# Chain (Lisk Sepolia)
VITE_CHAIN_ID=4202
VITE_RPC_URL=https://rpc.sepolia-api.lisk.com
```

---

## Project Structure

```
src/
├── components/
│   ├── chess/
│   │   ├── ChessBoard3D.tsx       # Main 3D chessboard component
│   │   ├── ChessPiece.tsx         # Individual 3D piece rendering
│   │   ├── CapturedPiece.tsx      # Captured piece display
│   │   ├── ChessBoardPreview.tsx  # Rotating preview for landing page
│   │   └── Square3D.tsx           # Individual board square
│   ├── game/
│   │   ├── GameModeSelector.tsx   # Mode selection (Human vs AI)
│   │   ├── ThemeSelector.tsx      # 10 theme options with preview
│   │   ├── BoardSelector.tsx      # 10 board design options
│   │   └── GameControls.tsx       # Reset, submit, difficulty
│   ├── layout/
│   │   ├── Header.tsx             # Navigation with wallet button
│   │   ├── Footer.tsx             # Links and social media
│   │   └── Layout.tsx             # Main layout wrapper
│   ├── leaderboard/
│   │   └── LeaderboardTable.tsx   # On-chain rankings display
│   └── ui/                        # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ... (more components)
├── pages/
│   ├── Index.tsx                  # Landing page with hero section
│   ├── Arena.tsx                  # Game configuration and play
│   ├── About.tsx                  # Project info and tech stack
│   ├── HowToPlay.tsx              # Step-by-step guide
│   ├── Contact.tsx                # Contact form and links
│   ├── Leaderboard.tsx            # On-chain rankings page
│   └── NotFound.tsx               # 404 page
├── services/
│   ├── mcpClient.ts               # MCP server API calls
│   └── blockchain.ts              # Contract interaction utilities
├── utils/
│   ├── themes.ts                  # Theme configurations
│   └── constants.ts               # App constants
├── types/
│   └── index.ts                   # TypeScript type definitions
├── index.css                      # Design system (colors, tokens)
├── App.tsx                        # Routes and providers
└── main.tsx                       # Entry point
```

---

## Design System

The app uses a **premium aesthetic** with jewel tones and solid colors:

### Color Palette

- **Primary**: Deep Navy (`#001F3F`) - Mature, elegant background
- **Accent**: Emerald (`#50C878`) - Highlights and CTAs
- **Gold**: `#FFD700` - Special elements and rank 1
- **Sapphire**: `#0F52BA` - Secondary accents
- **Maroon**: `#500000` - Key actions
- **Ruby**: `#E0115F` - Danger/delete actions
- **Pearl**: `#F0EAD6` - Light backgrounds
- **Silver**: `#C0C0C0` - Rank 2-3

### Typography

- **Font**: Google Fonts (Inter for UI, JetBrains Mono for code)
- **Headings**: Bold, large sizes with letter spacing
- **Body**: Clean, readable 16px base

### Components

All components follow Shadcn UI patterns with custom theming via CSS variables defined in `index.css`.

---

## Blockchain Integration

### Smart Contract Interaction

The app interacts with `ChessGame.sol` deployed on Lisk Sepolia:

```typescript
// services/blockchain.ts
import { prepareContractCall, sendTransaction } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";

// Submit game result
const transaction = prepareContractCall({
  contract,
  method: "submitAIGame",
  params: [gameId, humanAddress, humanWon, isDraw, signature],
});

const { transactionHash } = await sendTransaction({
  transaction,
  account,
});
```

### EIP-712 Signing

Human signs typed data proving they approve the result:

```typescript
const domain = {
  name: "ChessGame",
  version: "1",
  chainId: 4202,
  verifyingContract: CONTRACT_ADDRESS,
};

const types = {
  GameResult: [
    { name: "gameId", type: "string" },
    { name: "humanPlayer", type: "address" },
    { name: "humanWon", type: "bool" },
    { name: "isDraw", type: "bool" },
  ],
};

const signature = await account.signTypedData({ domain, types, message });
```

### Wallet Integration

RainbowKit is pre-configured in `Header.tsx`:

```typescript
import { ConnectButton } from "@rainbow-me/rainbowkit";

<ConnectButton 
  chainStatus="icon"
  accountStatus="address"
  showBalance={false}
/>
```

---

## AI Integration (MCP Agent)

The NullShot AI agent runs on Cloudflare Workers. Connect via HTTP:

```typescript
// services/mcpClient.ts
export async function getAIMove(fen: string, side: string, difficulty: string) {
  const response = await fetch(`${MCP_SERVER_URL}/api/chess/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fen, side, difficulty }),
  });
  
  const data = await response.json();
  return data.move; // e.g., "Nf3"
}
```

---

## Build & Deploy

### Development

```bash
npm run dev     # Start dev server
npm run build   # Build for production
npm run preview # Preview production build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

---

## Testing

```bash
# Run tests (if configured)
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## Key Features Implementation

### 1. 3D Chess Rendering

Uses React Three Fiber for WebGL rendering:

```tsx
<Canvas camera={{ position: [0, 8, 8], fov: 50 }}>
  <ambientLight intensity={0.6} />
  <directionalLight position={[5, 10, 5]} intensity={0.8} />
  <OrbitControls />
  <Environment preset="sunset" />
  
  {/* Render board squares */}
  {board.map((rank, i) =>
    rank.map((square, j) => (
      <Square3D key={`${i}-${j}`} position={[i, 0, j]} />
    ))
  )}
  
  {/* Render pieces */}
  {pieces.map(piece => (
    <ChessPiece key={piece.id} {...piece} theme={theme} />
  ))}
</Canvas>
```

### 2. Move Validation

Chess.js handles all move validation:

```typescript
const chess = new Chess(); // Start position

// Validate and make move
try {
  const move = chess.move("e4"); // Returns move object
  setPosition(chess.board());
} catch (error) {
  // Invalid move
  toast.error("Illegal move!");
}
```

### 3. Gasless Submission

AI wallet submits on behalf of user:

```typescript
// 1. Human signs
const signature = await signTypedData({ domain, types, message });

// 2. Send to MCP server
const response = await fetch(`${MCP_URL}/api/chess/submit`, {
  method: "POST",
  body: JSON.stringify({ gameId, humanAddress, winner, signature }),
});

// 3. MCP server's AI wallet submits transaction
// 4. User gets result without paying gas!
```

---

## Troubleshooting

### Issue: 3D pieces not rendering

**Solution**: Ensure WebGL is supported in your browser. Try updating your graphics drivers.

### Issue: Wallet won't connect

**Solution**: 
- Make sure you're on Lisk Sepolia testnet
- Clear browser cache and reload
- Check MetaMask is unlocked

### Issue: Transaction reverts

**Solution**:
- Verify you signed with the correct address
- Check game hasn't already been submitted
- Ensure smart contract isn't paused

---

## License

MIT License - See [LICENSE](../LICENSE) for details.

---

## Contact

**George Chisom**
- Email: georgechipaul@gmail.com
- GitHub: [@Georgechisom](https://github.com/Georgechisom)
- Twitter: [@chisom_georgee](https://twitter.com/chisom_georgee)

---

**Made with ♔ for Chess Enthusiasts**
