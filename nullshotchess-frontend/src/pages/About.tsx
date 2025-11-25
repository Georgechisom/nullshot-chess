import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Sparkles, Shield, Code, Trophy } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="md:container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-2xl md:text-5xl font-bold mb-4 mt-5">
              About <span className="text-gold">NullShot</span> Chess
            </h1>
            <p className="text-xl text-muted-foreground">
              Where ancient strategy meets blockchain technology
            </p>
          </motion.div>

          <div className="space-y-12">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card p-8 rounded-2xl border border-border shadow-luxury"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
                <Sparkles className="text-accent" />
                The Vision
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                NullShot Chess reimagines the timeless game of chess for the
                Web3 era. Built on the NullShot MCP, our dApp combines immersive
                3D gameplay with blockchain verification to create a truly
                modern chess experience. Every game is a journey through
                luxurious inspired themes, where victories are immortalized as
                NFT badges on the lisk Sepolia testnet.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card p-8 rounded-2xl border border-border shadow-luxury"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
                <Code className="text-sapphire" />
                Technology Stack
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-accent">
                    Frontend
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• React + TypeScript</li>
                    <li>• React Three Fiber (Three.js)</li>
                    <li>• Framer Motion animations</li>
                    <li>• Tailwind CSS styling</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-accent">
                    Blockchain
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Lisk Sepolia Testnet</li>
                    <li>• RainbowKit wallet integration</li>
                    <li>• Thirdweb SDK</li>
                    <li>• EIP-712 signatures</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-accent">
                    Game Logic
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• chess.js validation</li>
                    <li>• NullShot AI agent (MCP)</li>
                    <li>• WebSocket communication</li>
                    <li>• Real time move processing</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-accent">
                    Smart Contracts
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• foundry (Solidity)</li>
                    <li>• ERC721 NFT minting</li>
                    <li>• On-chain leaderboard</li>
                    <li>• Signature verification</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card p-8 rounded-2xl border border-border shadow-luxury"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
                <Shield className="text-gold" />
                Fair Play Guarantee
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
                We leverage cryptographic signatures (EIP-712) to ensure every
                game result is authentic and tamper proof. When you play against
                another human, both players sign the result. Against our AI,
                only your signature is required the AI's moves are verified
                server side.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                This approach eliminates cheating while maintaining a smooth,
                enjoyable experience. Your victories are yours alone,
                permanently recorded on-chain for all to see.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card p-8 rounded-2xl border border-border shadow-luxury"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
                <Trophy className="text-gold" />
                NFT Rewards
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Every victory earns you an ERC721 NFT badge minted directly to
                your wallet. These tokens aren't just collectibles, they're
                proof of your strategic mastery. Build your collection, showcase
                your wins on the leaderboard, and compete for the top spot.
                Future updates may bring special rewards for milestone
                achievements!
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-muted p-8 rounded-2xl border border-border"
            >
              <h2 className="text-2xl font-bold mb-4 text-center">
                Project Details
              </h2>
              <div className="text-center text-muted-foreground">
                <p className="mb-2">
                  Built on{" "}
                  <span className="text-accent font-semibold">
                    NullShot MCP
                  </span>
                </p>
                <p className="mb-2">
                  Used{" "}
                  <span className="text-sapphire font-semibold">Thirdweb</span>
                </p>
                <p>
                  Testnet:{" "}
                  <span className="text-gold font-semibold">Lisk Sepolia</span>
                </p>
              </div>
            </motion.section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
