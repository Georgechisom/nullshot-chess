# NullShot Chess - Decentralized 3D Chess dApp

A stunning 3D chess dApp built on the **NullShot** MCP, featuring immersive gameplay with React Three Fiber, blockchain verified results via Ethereum Sepolia, and ERC721 NFT rewards for winners.

![NullShot Chess](https://via.placeholder.com/1200x600/001F3F/50C878?text=NullShot+Chess+dApp)

## 🎮 Features

- **Immersive 3D Chess**: Hyper realistic chess pieces rendered with Three.js and React Three Fiber
- **Dual Game Modes**:
  - VS Another Player (local multiplayer)
  - VS NullShot AI (powered by MCP agent)
- **10 Luxurious Themes**: From Classic Wood to Emerald Crown, with jewel-toned Zuma aesthetics
- **10 Board Designs**: Dark Walnut, Marble, Jade, Lapis, and more with realistic textures
- **Blockchain Verified**: Game results submitted on-chain with EIP-712 signatures
- **NFT Rewards**: Mint ERC721 badges for every victory
- **Live Leaderboard**: On-chain rankings fetched from smart contracts
- **RainbowKit Integration**: Seamless wallet connection (MetaMask, WalletConnect, etc.)
- **Thirdweb SDK**: Simplified blockchain interactions

## 🛠️ Tech Stack

### Frontend

- **React** + **TypeScript**: Type-safe component architecture
- **React Three Fiber**: 3D rendering with Three.js
- **@react-three/drei**: Helpers for 3D scenes (OrbitControls, Environment)
- **Framer Motion**: Smooth animations and transitions
- **TailwindCSS**: Utility-first styling with custom design system
- **Shadcn UI**: Pre-built accessible components

### Blockchain

- **Lisk Sepolia Testnet**: Development/testing network
- **RainbowKit**: Wallet connection UI
- **Wagmi + Viem**: Ethereum hooks and utilities
- **Thirdweb SDK**: Contract interactions and NFT minting
- **EIP-712**: Typed data signing for game results

### Game Logic

- **chess.js**: Chess rules validation and move generation
- **WebSockets**: Real-time AI move communication with MCP agent

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ and npm
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH (get from [faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd nullshot-chess

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:8080` to see the app.

## 📁 Project Structure

```
src/
├── components/
│   ├── chess/
│   │   ├── ChessBoard3D.tsx       # Main 3D chessboard with game logic
│   │   ├── ChessPiece.tsx         # Individual piece rendering
│   │   └── ChessBoardPreview.tsx  # Rotating preview for landing page
│   ├── game/
│   │   ├── GameModeSelector.tsx   # Mode selection (Human vs AI)
│   │   ├── ThemeSelector.tsx      # 10 theme options
│   │   └── BoardSelector.tsx      # 10 board design options
│   ├── layout/
│   │   ├── Header.tsx             # Navigation with wallet button
│   │   └── Footer.tsx             # Links and social media
│   └── ui/                        # Shadcn UI components
├── pages/
│   ├── Index.tsx                  # Landing page with hero section
│   ├── Arena.tsx                  # Game configuration and play
│   ├── About.tsx                  # Project info and tech stack
│   ├── HowToPlay.tsx              # Step-by-step guide
│   ├── Contact.tsx                # Contact form and links
│   ├── Leaderboard.tsx            # On-chain rankings
│   └── NotFound.tsx               # 404 page
├── index.css                      # Design system (colors, tokens)
├── App.tsx                        # Routes and providers
└── main.tsx                       # Entry point
```

## 🎨 Design System

The app uses a **Zuma-inspired** aesthetic with jewel tones and solid colors (NO gradients):

- **Primary**: Deep navy (`#001F3F`) - mature, elegant background
- **Accent**: Emerald (`#50C878`) - highlights and CTAs
- **Gold**: `#FFD700` - special elements and rank 1
- **Sapphire**: `#0F52BA` - secondary accents
- **Maroon**: `#500000` - key actions

All colors are defined as HSL in `src/index.css` and used via Tailwind tokens.

## 🔗 Blockchain Integration

### Smart Contract (ChessGame.sol)

Deploy on Sepolia testnet:

- Stores game results (wins/losses/games per address)
- Verifies EIP-712 signatures
- Mints ERC721 NFTs for winners

### Thirdweb Setup

1. Connect to Sepolia in your wallet
2. Import contract ABI in `src/utils/blockchain.ts` (TODO)
3. Use Thirdweb SDK to call contract functions:

   ```typescript
   import { useContract, useContractWrite } from "thirdweb/react";

   const { contract } = useContract("YOUR_CONTRACT_ADDRESS");
   const { mutate: submitResult } = useContractWrite(
     contract,
     "submitGameResult"
   );
   ```

### Wallet Integration

RainbowKit is pre-configured in `Header.tsx`. Add providers in `App.tsx`:

```typescript
// TODO: Wrap App with RainbowKit + Wagmi providers
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { WagmiConfig, createClient } from "wagmi";
```

## 🤖 AI Integration (MCP Agent)

The NullShot AI agent runs separately (backend repo). Connect via WebSocket:

```typescript
// In ChessBoard3D.tsx after player move
if (gameMode === "ai") {
  const ws = new WebSocket("http://localhost:8787/ws");
  ws.send(JSON.stringify({ fen: game.fen() }));
  ws.onmessage = (event) => {
    const aiMove = JSON.parse(event.data);
    game.move(aiMove);
    setPosition(game.board());
  };
}
```

## 🎯 Roadmap / TODO

### Immediate (Hackathon MVP)

- [ ] Implement RainbowKit wallet connection
- [ ] Integrate Thirdweb contract calls
- [ ] Connect WebSocket to MCP agent
- [ ] Add EIP-712 signature modal after game end
- [ ] Fetch real leaderboard data from contract

### Future Enhancements

- [ ] **AR Mode**: WebXR for augmented reality chess
- [ ] **Sound Effects**: Howler.js for piece moves and captures
- [ ] **Replay Mode**: PGN recording and playback
- [ ] **Online Multiplayer**: Socket.io for remote opponents
- [ ] **AI Difficulty Levels**: Easy/Medium/Hard strategy
- [ ] **Share on X**: Tweet wins with NFT links
- [ ] **Accessibility**: Keyboard controls, color-blind modes, voice commands
- [ ] **Mobile Optimization**: Responsive 3D and lazy-loading assets

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables:
   - `VITE_THIRDWEB_CLIENT_ID`
   - `VITE_CONTRACT_ADDRESS`
4. Deploy!

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

## 🏆 Hackathon Info

- **Event**: NullShot Hacks
- **Co-Sponsor**: Thirdweb
- **Testnet**: Ethereum Sepolia
- **Category**: Web3 Gaming

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Built for every one, but contributions welcome! Open an issue or PR.

## 📞 Contact

- **Email**: georgechipaul@gmail.com
- **GitHub**: [github.com](#)
- **Twitter**: [@chisom_georgee](#)

---

**Made ♔ for all Users** 🎮✨
