# NullShot Chess Project

## Project Overview

NullShot Chess is a decentralized chess dApp developed with the NullShot MCP. It combines immersive gameplay with cutting edge blockchain technology and AI to provide a unique chess experience. Players can compete against other players locally or challenge the NullShot AI powered by a Model Context Protocol (MCP) agent. Every victory is recorded on the lisk Sepolia testnet with verified results, allowing winners to mint exclusive ERC721 NFTs as badges of honor.

The project integrates several components including an MCP server for AI logic, a smart contract managing game results and rewards, and a sophisticated React based frontend delivering a stunning, interactive chessboard.

---

## MCP Create (AI Agent Server)

The MCP server is implemented using the `my-chess-agent/mcp-server` repository. It is based on the NullShot Typescript MCP Template designed to bootstrap MCPs (Model Context Protocols) using the null-shot/typescript-agent-framework.

### Key Features:

- Real time communication through WebSocket and Server Sent Events (SSE) clients.
- MCP Inspector for debugging and monitoring during development.
- Cloudflare Workers integration for edge deployment.
- Comprehensive testing tools enabling local integration tests without mocking.
- Extensible server logic allowing custom routes, tools, resources, and prompts.

### Usage Overview:

- Setup via NullShot CLI, Cloudflare deployment, or GitHub template.
- Server implementation leverages `McpHonoServerDO` for clean routing, or `McpServerDO` for custom routing.
- Core functionalities are modularized in TypeScript files enabling extensions or customizations.
- The MCP server powers the backend AI moves and orchestrates real time interactions with connected clients.

---

## Smart Contract (ChessGame.sol)

The smart contract is deployed on the Lisk Sepolia testnet, residing in `smartcontract/nullshotChess/src/ChessGame.sol`. It is a Solidity contract extending ERC721 and using OpenZeppelin libraries to ensure security and functionality.

### Main Features:

- **Game Tracking**: Manages game records for player vs. player and player vs. AI matches, storing results and timestamps.
- **EIP-712 Signature Verification**: Securely verifies game results submitted by players to prevent tampering.
- **NFT Rewards**: Mints ERC721 tokens called "ChessVictory" to winning players as collectible badges.
- **Statistics Tracking**: Maintains counts of wins, losses, draws, and total games played for each player.
- **Events**: Emits events for game submissions and NFT minting facilitating easy off-chain monitoring and leaderboard updates.

Key functions include:

- `submitTwoPlayerGame`: Validates and submits results for human player matches.
- `submitAIGame`: Handles AI games and rewards accordingly.
- Internal logic to record games, update stats, and mint NFTs securely.

---

## Frontend (nullshotchess-frontend)

The frontend is a React and TypeScript-powered decentralized application that brings the chess experience to life with immersive 3D graphics and smooth interactions.

### Features:

- **3D Chess Gameplay**: Built with React Three Fiber and Three.js for realistic rendering of chess pieces and boards.
- **Game Modes**: Play against another player locally or against the NullShot AI powered by the MCP server.
- **Theme and Board Customization**: 10 luxurious themes and 10 different board designs to personalize the game.
- **Blockchain Integration**: Submits game results with EIP-712 typed signatures to the smart contract, enabling NFT minting on wins.
- **Wallet Connection**: Seamless user wallet connection using RainbowKit and Wagmi, supporting MetaMask and WalletConnect.
- **Live Leaderboard**: Displays on-chain rankings fetched from the ChessGame smart contract.
- **AI Opponent Integration**: Real time move communication with the MCP server via WebSockets.

### Tech Stack:

- React + TypeScript for frontend logic.
- React Three Fiber and @react-three/drei for 3D rendering.
- TailwindCSS with shadcn UI components for styling.
- Lisk Sepolia testnet, RainbowKit, Thirdweb SDK for blockchain functionalities.
- Chess.js for chess rules and validations.

### Project Structure Highlights:

- `src/components/chess/ChessBoard3D.tsx`: Main 3D chessboard and game logic.
- `src/pages/Arena.tsx`: Game interface allowing game configuration and play.
- `src/components/layout/Header.tsx`: Navigation and wallet integration.
- `src/utils/blockchain.ts`: Contract interaction logic.

### Usage and Deployment:

- Install dependencies and run development server locally.
- Deploy frontend easily with Vercel or Netlify.
- Environment configuration supports Thirdweb client ID and contract address.

---
