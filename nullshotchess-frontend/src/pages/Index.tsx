import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gamepad2, Trophy, Sparkles, Shield } from "lucide-react";
import ChessBoardPreview from "@/components/chess/ChessBoardPreview";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import {
  useGetWinners,
  useChessGameContract,
  TotalGamesStats,
} from "@/hooks/useChessContract";
import { readContract } from "thirdweb";

const Index = () => {
  const [totalGames, setTotalGames] = useState(0);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const { data: winnersData } = useGetWinners();
  const contract = useChessGameContract();
  const { totalGamesPlayedByEveryone } = TotalGamesStats();

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      if (!winnersData || winnersData.length === 0) {
        setTotalGames(0);
        setTotalNFTs(0);
        return;
      }

      try {
        let gamesCount = 0;
        let nftsCount = 0;

        for (const addr of winnersData) {
          const wins = await readContract({
            contract,
            method: "function getWins(address player) view returns (uint256)",
            params: [addr],
          });
          const losses = await readContract({
            contract,
            method: "function getLosses(address player) view returns (uint256)",
            params: [addr],
          });
          const draws = await readContract({
            contract,
            method: "function getDraws(address player) view returns (uint256)",
            params: [addr],
          });
          const nfts = await readContract({
            contract,
            method: "function balanceOf(address owner) view returns (uint256)",
            params: [addr],
          });

          gamesCount += Number(wins) + Number(losses) + Number(draws);
          nftsCount += Number(nfts);
        }

        if (mounted) {
          setTotalGames(gamesCount);
          setTotalNFTs(nftsCount);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    if (winnersData && winnersData.length > 0) {
      fetchStats();
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-muted/30" />

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl font-bold mb-6 leading-tight">
                <span className="text-gold">Decentralized</span> Chess
                <br />
                <span className="text-accent">On-Chain</span> Glory
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Play immersive 3D chess against humans or NullShot AI. Every
                victory is immortalized on-chain with an ERC721 NFT badge. Fair
                play guaranteed through cryptographic signatures.
              </p>

              <div className="flex gap-4 flex-wrap">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 shadow-luxury"
                >
                  <Link to="/arena">
                    <Gamepad2 className="mr-2" />
                    Enter Arena
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  <Link to="/how-to-play">Learn Rules</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold">
                    {totalGamesPlayedByEveryone}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Games Played
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">
                    {totalNFTs}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    NFTs Minted
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-sapphire">Lisk</div>
                  <div className="text-sm text-muted-foreground">Sepolia</div>
                </div>
              </div>
            </motion.div>

            {/* Right: 3D Chess Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[600px] rounded-2xl overflow-hidden border border-border shadow-luxury"
            >
              <Canvas>
                <PerspectiveCamera makeDefault position={[0, 8, 8]} />
                <OrbitControls
                  enableZoom={false}
                  autoRotate
                  autoRotateSpeed={0.5}
                  minPolarAngle={Math.PI / 4}
                  maxPolarAngle={Math.PI / 2.5}
                />
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight
                  position={[-10, 10, -5]}
                  intensity={0.5}
                  color="#50C878"
                />
                <ChessBoardPreview />
              </Canvas>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Why <span className="text-accent">NullShot Chess</span>?
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Sparkles className="w-8 h-8 text-gold" />,
                title: "3D Immersive Play",
                description:
                  "Hyper-realistic chess pieces, dynamic lighting, and multiple luxurious themes",
              },
              {
                icon: <Shield className="w-8 h-8 text-accent" />,
                title: "Blockchain Verified",
                description:
                  "EIP-712 signatures ensure fair play. Results stored on Ethereum Sepolia",
              },
              {
                icon: <Trophy className="w-8 h-8 text-gold" />,
                title: "NFT Rewards",
                description:
                  "Mint an ERC721 badge for every victory. Build your collection of wins",
              },
              {
                icon: <Gamepad2 className="w-8 h-8 text-sapphire" />,
                title: "AI Opponent",
                description:
                  "Challenge NullShot AI agent powered by MCP for strategic gameplay",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card p-8 rounded-xl border border-border shadow-luxury card-3d"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto bg-card p-12 rounded-2xl border border-border shadow-luxury"
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Claim <span className="text-gold">Victory</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Connect your wallet, choose your strategy, and let the blockchain
              remember your triumphs.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow-emerald"
            >
              <Link to="/arena">Start Playing Now</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
