import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Wallet, Gamepad2, Trophy, FileSignature } from "lucide-react";

const HowToPlay = () => {
  const steps = [
    {
      icon: <Wallet className="w-12 h-12" />,
      title: "Connect Your Wallet",
      description:
        "Use RainbowKit to connect MetaMask or any compatible Web3 wallet. Make sure you're on the Sepolia testnet.",
      details: [
        'Click "Connect Wallet" in the header',
        "Select your preferred wallet provider",
        "Approve the connection request",
        "Ensure you have Sepolia testnet selected",
      ],
    },
    {
      icon: <Gamepad2 className="w-12 h-12" />,
      title: "Configure Your Game",
      description:
        "Choose your game mode, side, theme, and board design. Customize your experience to match your style.",
      details: [
        'Select "VS Another Player" for local multiplayer',
        'Or "VS NullShot AI" to challenge our MCP powered agent',
        "Pick your side (White, Black, or Random)",
        "Choose from 10 luxurious themes and board designs",
      ],
    },
    {
      icon: <Trophy className="w-12 h-12" />,
      title: "Play to Win",
      description:
        "Use the 3D interface to play chess. Click pieces to select them, then click destination squares to move.",
      details: [
        "Green indicators show legal moves",
        "Rotate the board by dragging",
        "Zoom with your mouse wheel",
        "Captured pieces appear off-board",
      ],
    },
    {
      icon: <FileSignature className="w-12 h-12" />,
      title: "Submit & Mint NFT",
      description:
        "When the game ends, sign the result with your wallet. Winners can mint an ERC721 NFT badge on-chain.",
      details: [
        "Approve the EIP-712 signature in your wallet",
        "Result is submitted to our smart contract",
        "Winners mint an NFT badge automatically",
        "View your collection on the leaderboard",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold mb-4">
              How to <span className="text-accent">Play</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Four simple steps to decentralized chess glory
            </p>
          </motion.div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="bg-card p-8 rounded-2xl border border-border shadow-luxury"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                      {step.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl font-bold text-gold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-2xl font-bold">{step.title}</h2>
                    </div>
                    <p className="text-lg text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-muted-foreground"
                        >
                          <span className="text-accent mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 bg-muted p-8 rounded-2xl border border-border"
          >
            <h2 className="text-2xl font-bold mb-4">Chess Rules Refresher</h2>
            <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Basic Moves
                </h3>
                <ul className="space-y-1">
                  <li>
                    • <strong>Pawn:</strong> Forward 1 square (2 on first move)
                  </li>
                  <li>
                    • <strong>Knight:</strong> L-shape (2+1 squares)
                  </li>
                  <li>
                    • <strong>Bishop:</strong> Diagonal any distance
                  </li>
                  <li>
                    • <strong>Rook:</strong> Straight any distance
                  </li>
                  <li>
                    • <strong>Queen:</strong> Any direction any distance
                  </li>
                  <li>
                    • <strong>King:</strong> 1 square any direction
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Win Conditions
                </h3>
                <ul className="space-y-1">
                  <li>
                    • <strong>Checkmate:</strong> King under attack, no escape
                  </li>
                  <li>
                    • <strong>Resignation:</strong> Opponent gives up
                  </li>
                  <li>
                    • <strong>Draw:</strong> Stalemate, insufficient material,
                    or 50-move rule
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HowToPlay;
