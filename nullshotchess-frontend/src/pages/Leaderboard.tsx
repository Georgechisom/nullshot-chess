import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import {
  useGetWins,
  useGetLosses,
  useGetDraws,
  useGetGamesPlayed,
  useGetNonce,
  useChessGameContract,
  TotalGamesStats,
  useGetNFTBalance,
  useMintNFT,
} from "@/hooks/useChessContract";
import { readContract } from "thirdweb";

const Leaderboard = () => {
  const { address, isConnected } = useAccount();
  const location = useLocation();
  const [isMinting, setIsMinting] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const contract = useChessGameContract();
  const { totalGamesPlayedByEveryone, events, refetchEvents } =
    TotalGamesStats();
  console.log("totalgameplayedbyeveryone", totalGamesPlayedByEveryone);

  // Get player stats from blockchain
  const { data: playerWins, refetch: refetchWins } = useGetWins(address);
  const { data: playerLosses, refetch: refetchLosses } = useGetLosses(address);
  const { data: playerDraws, refetch: refetchDraws } = useGetDraws(address);
  const { data: playerGamesPlayed, refetch: refetchGamesPlayed } =
    useGetGamesPlayed(address);
  const { data: playerNonce, refetch: refetchNonce } = useGetNonce(address);
  const { data: playerNFTBalance, refetch: refetchNFTBalance } =
    useGetNFTBalance(address);

  const { mutateAsync: mintNFT } = useMintNFT();

  // SOLUTION 2: Calculate unique players inside fetchLeaderboard
  const fetchLeaderboard = async () => {
    // Calculate unique players fresh each time
    if (!events || events.length === 0) {
      setLeaders([]);
      setTotalNFTs(0);
      return;
    }

    const playersSet = new Set<string>();
    events.forEach((event: any) => {
      const args = event.args || {};
      const player1 = args.player1;
      const player2 = args.player2;
      if (player1 && player1 !== "0x0000000000000000000000000000000000000000") {
        playersSet.add(player1.toLowerCase());
      }
      if (player2 && player2 !== "0x0000000000000000000000000000000000000000") {
        playersSet.add(player2.toLowerCase());
      }
    });
    const currentUniquePlayers = Array.from(playersSet);

    if (currentUniquePlayers.length === 0) {
      setLeaders([]);
      setTotalNFTs(0);
      return;
    }

    setIsLoading(true);

    try {
      const leaderboardPromises = currentUniquePlayers.map(
        async (addr: string) => {
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

          return {
            address: addr,
            wins: Number(wins),
            losses: Number(losses),
            draws: Number(draws),
            nfts: Number(nfts),
          };
        }
      );

      const leaderboardData = await Promise.all(leaderboardPromises);

      // Sort by wins (descending)
      const sorted = leaderboardData
        .sort((a, b) => b.wins - a.wins)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
        }));

      setLeaders(sorted);

      // Calculate totals
      const totalNFTsCount = sorted.reduce((sum, item) => sum + item.nfts, 0);

      setTotalNFTs(totalNFTsCount);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to fetch leaderboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    const loadingToast = toast.loading("Refreshing data from blockchain...");

    try {
      // Refetch all data
      await Promise.all([
        refetchWins(),
        refetchLosses(),
        refetchDraws(),
        refetchGamesPlayed(),
        refetchNonce(),
        refetchEvents(),
        refetchNFTBalance(),
      ]);

      // Trigger fetchLeaderboard via refreshKey
      setRefreshKey((prev) => prev + 1);

      toast.success("Data refreshed successfully!", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to refresh data", { id: loadingToast });
    }
  };

  // Fetch leaderboard when events change or refresh is triggered
  useEffect(() => {
    if (events && events.length > 0) {
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, refreshKey]);

  // Listen for refresh trigger from navigation state
  useEffect(() => {
    if (location.state?.refresh) {
      handleRefresh();
      // Clear the state to prevent refresh on subsequent visits
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Player stats
  const playerStats =
    isConnected && address
      ? {
          wins: Number(playerWins || 0),
          losses: Number(playerLosses || 0),
          draws: Number(playerDraws || 0),
          gamesPlayed: Number(playerGamesPlayed || 0),
          nfts: Number(playerNFTBalance || 0),
          nonce: Number(playerNonce || 0),
        }
      : null;

  const handleMintNFT = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsMinting(true);
    try {
      const { transactionHash } = await mintNFT();
      toast.success(
        <>
          NFT minted successfully!{" "}
          <a
            href={`https://sepolia-blockscout.lisk.com/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View on Blockscout
          </a>
        </>,
        { duration: 5000 }
      );
      await handleRefresh();
    } catch (error) {
      console.error("Minting error:", error);
      toast.error("Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-gold" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="md:container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-3xl md:text-5xl font-bold">
                <span className="text-gold">Leaderboard</span>
              </h1>
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                size="icon"
                className="border-gold text-gold hover:bg-gold/10"
                title="Refresh data from blockchain"
              >
                <RefreshCw
                  className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            <p className="text-base md:text-xl text-muted-foreground">
              Top players ranked by victories on-chain
            </p>
          </motion.div>

          {/* Player Stats Card (if connected) */}
          {isConnected && playerStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gold/20 to-accent/20 p-8 rounded-2xl border-2 border-gold/50 mb-12"
            >
              <div className="flex flex-col md:flex-row gap-x-5 md:gap-1 justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-5 md:mb-2">
                    Your Stats
                  </h2>
                  <p className="hidden md:flex text-sm text-muted-foreground font-mono mb-5 md:mb-2">
                    {address}
                  </p>
                  <p className="flex md:hidden lg:hidden text-sm text-muted-foreground font-mono mb-5 md:mb-2">
                    {address.slice(0, 6)}...{address.slice(-5)}
                  </p>
                </div>
                <Button
                  onClick={handleMintNFT}
                  disabled={
                    isMinting ||
                    !playerStats ||
                    playerStats.nfts >= playerStats.wins
                  }
                  className="bg-gold text-gold-foreground hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    !playerStats || playerStats.nfts >= playerStats.wins
                      ? "All NFTs minted"
                      : "Mint NFT for your victories"
                  }
                >
                  {isMinting
                    ? "Minting..."
                    : playerStats && playerStats.nfts < playerStats.wins
                    ? "Mint NFT"
                    : "All Minted"}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">
                    {playerStats.wins}
                  </div>
                  <div className="text-xs text-muted-foreground">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground">
                    {playerStats.losses}
                  </div>
                  <div className="text-xs text-muted-foreground">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-sapphire">
                    {playerStats.draws}
                  </div>
                  <div className="text-xs text-muted-foreground">Draws</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {playerStats.gamesPlayed}
                  </div>
                  <div className="text-xs text-muted-foreground">Games</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold">
                    {playerStats.nfts}
                  </div>
                  <div className="text-xs text-muted-foreground">NFTs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {playerStats.nonce}
                  </div>
                  <div className="text-xs text-muted-foreground">Nonce</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-card p-6 rounded-xl border border-border text-center">
              <div className="text-4xl font-bold text-gold mb-2">
                {totalGamesPlayedByEveryone}
              </div>
              <div className="text-sm text-muted-foreground">Total Games</div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border text-center">
              <div className="text-4xl font-bold text-accent mb-2">
                {totalNFTs}
              </div>
              <div className="text-sm text-muted-foreground">NFTs Minted</div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border text-center">
              <div className="text-4xl font-bold text-sapphire mb-2">
                {leaders.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Players
              </div>
            </div>
          </motion.div>

          {/* Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border shadow-luxury overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Player
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Wins
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Losses
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Draws
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Win Rate
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      NFTs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((leader, index) => {
                    const total = leader.wins + leader.losses;
                    const winRate =
                      total > 0
                        ? ((leader.wins / total) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <motion.tr
                        key={leader.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="border-t border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getRankIcon(leader.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm">
                            {leader.address}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-accent">
                            {leader.wins}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-muted-foreground">
                            {leader.losses}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sapphire">{leader.draws}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-semibold ${
                              parseFloat(winRate) > 60
                                ? "text-accent"
                                : "text-foreground"
                            }`}
                          >
                            {winRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-semibold">
                            <Trophy className="w-3 h-3" />
                            {leader.nfts}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center text-sm md:text-base text-muted-foreground"
          >
            <p>
              Leaderboard updates in real-time as games are submitted on-chain.
            </p>
            <p className="mt-2">
              Data fetched from{" "}
              <span className="text-accent font-mono"> smart contract </span> on
              lisk testnet.
            </p>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Leaderboard;
