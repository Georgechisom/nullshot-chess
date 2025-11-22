// import Header from "@/components/layout/Header";
// import Footer from "@/components/layout/Footer";
// import { motion } from "framer-motion";
// import { Trophy, Medal, Award, RefreshCw } from "lucide-react";
// import { useAccount } from "wagmi";
// import { Button } from "@/components/ui/button";
// import { useState, useEffect } from "react";
// import toast from "react-hot-toast";
// import { useLocation } from "react-router-dom";
// import {
//   useGetWins,
//   useGetLosses,
//   useGetDraws,
//   useGetGamesPlayed,
//   useGetWinners,
//   useGetNonce,
//   useChessGameContract,
// } from "@/hooks/useChessContract";
// import { readContract } from "thirdweb";

// const Leaderboard = () => {
//   const { address, isConnected } = useAccount();
//   const location = useLocation();
//   const [isMinting, setIsMinting] = useState(false);
//   const [leaders, setLeaders] = useState<any[]>([]);
//   const [totalGames, setTotalGames] = useState(0);
//   const [totalNFTs, setTotalNFTs] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const contract = useChessGameContract();

//   // Get player stats from blockchain
//   const { data: playerWins, refetch: refetchWins } = useGetWins(address);
//   const { data: playerLosses, refetch: refetchLosses } = useGetLosses(address);
//   const { data: playerDraws, refetch: refetchDraws } = useGetDraws(address);
//   const { data: playerGamesPlayed, refetch: refetchGamesPlayed } =
//     useGetGamesPlayed(address);
//   const { data: playerNonce, refetch: refetchNonce } = useGetNonce(address);
//   const { data: winnersData, refetch: refetchWinners } = useGetWinners();

//   // Fetch leaderboard data
//   const fetchLeaderboard = async () => {
//     if (!winnersData || winnersData.length === 0) {
//       setLeaders([]);
//       setTotalGames(0);
//       setTotalNFTs(0);
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const leaderboardPromises = winnersData.map(async (addr: string) => {
//         const wins = await readContract({
//           contract,
//           method: "function getWins(address player) view returns (uint256)",
//           params: [addr],
//         });
//         const losses = await readContract({
//           contract,
//           method: "function getLosses(address player) view returns (uint256)",
//           params: [addr],
//         });
//         const draws = await readContract({
//           contract,
//           method: "function getDraws(address player) view returns (uint256)",
//           params: [addr],
//         });
//         const nfts = await readContract({
//           contract,
//           method: "function balanceOf(address owner) view returns (uint256)",
//           params: [addr],
//         });

//         return {
//           address: addr,
//           wins: Number(wins),
//           losses: Number(losses),
//           draws: Number(draws),
//           nfts: Number(nfts),
//         };
//       });

//       const leaderboardData = await Promise.all(leaderboardPromises);

//       // Sort by wins (descending)
//       const sorted = leaderboardData
//         .sort((a, b) => b.wins - a.wins)
//         .map((item, index) => ({
//           ...item,
//           rank: index + 1,
//         }));

//       setLeaders(sorted);

//       // Calculate totals
//       const totalGamesCount = sorted.reduce(
//         (sum, item) => sum + item.wins + item.losses + item.draws,
//         0
//       );
//       const totalNFTsCount = sorted.reduce((sum, item) => sum + item.nfts, 0);

//       setTotalGames(totalGamesCount);
//       setTotalNFTs(totalNFTsCount);
//     } catch (error) {
//       console.error("Error fetching leaderboard:", error);
//       toast.error("Failed to fetch leaderboard data");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Manual refresh function
//   const handleRefresh = async () => {
//     const loadingToast = toast.loading("Refreshing data from blockchain...");

//     try {
//       // Refetch all data
//       await Promise.all([
//         refetchWinners(),
//         refetchWins(),
//         refetchLosses(),
//         refetchDraws(),
//         refetchGamesPlayed(),
//         refetchNonce(),
//       ]);

//       // Fetch leaderboard
//       await fetchLeaderboard();

//       toast.success("Data refreshed successfully!", { id: loadingToast });
//     } catch (error) {
//       toast.error("Failed to refresh data", { id: loadingToast });
//     }
//   };

//   // Only fetch on mount - no automatic refresh
//   useEffect(() => {
//     let mounted = true;

//     if (winnersData && winnersData.length > 0 && mounted) {
//       fetchLeaderboard();
//     }

//     return () => {
//       mounted = false;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // Empty dependency array - only run once on mount

//   // Listen for refresh trigger from navigation state
//   useEffect(() => {
//     if (location.state?.refresh) {
//       handleRefresh();
//       // Clear the state to prevent refresh on subsequent visits
//       window.history.replaceState({}, document.title);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [location.state]);

//   // Player stats
//   const playerStats =
//     isConnected && address
//       ? {
//           wins: Number(playerWins || 0),
//           losses: Number(playerLosses || 0),
//           draws: Number(playerDraws || 0),
//           gamesPlayed: Number(playerGamesPlayed || 0),
//           nfts: Number(playerWins || 0), // NFTs = wins
//           nonce: Number(playerNonce || 0),
//         }
//       : null;

//   const handleMintNFT = async () => {
//     if (!isConnected) {
//       toast.error("Please connect your wallet first");
//       return;
//     }

//     setIsMinting(true);
//     try {
//       // TODO: Implement actual NFT minting logic
//       toast.success("NFT minting functionality coming soon!");
//     } catch (error) {
//       console.error("Minting error:", error);
//       toast.error("Failed to mint NFT");
//     } finally {
//       setIsMinting(false);
//     }
//   };

//   const getRankIcon = (rank: number) => {
//     switch (rank) {
//       case 1:
//         return <Trophy className="w-6 h-6 text-gold" />;
//       case 2:
//         return <Medal className="w-6 h-6 text-gray-400" />;
//       case 3:
//         return <Award className="w-6 h-6 text-amber-700" />;
//       default:
//         return <span className="text-muted-foreground">#{rank}</span>;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <Header />

//       <div className="pt-32 pb-20 px-6">
//         <div className="container mx-auto max-w-5xl">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-center mb-16"
//           >
//             <div className="flex items-center justify-center gap-4 mb-4">
//               <h1 className="text-5xl font-bold">
//                 <span className="text-gold">Leaderboard</span>
//               </h1>
//               <Button
//                 onClick={handleRefresh}
//                 disabled={isLoading}
//                 variant="outline"
//                 size="icon"
//                 className="border-gold text-gold hover:bg-gold/10"
//                 title="Refresh data from blockchain"
//               >
//                 <RefreshCw
//                   className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
//                 />
//               </Button>
//             </div>
//             <p className="text-xl text-muted-foreground">
//               Top players ranked by victories on-chain
//             </p>
//           </motion.div>

//           {/* Player Stats Card (if connected) */}
//           {isConnected && playerStats && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="bg-gradient-to-br from-gold/20 to-accent/20 p-8 rounded-2xl border-2 border-gold/50 mb-12"
//             >
//               <div className="flex justify-between items-start mb-6">
//                 <div>
//                   <h2 className="text-2xl font-bold mb-2">Your Stats</h2>
//                   <p className="text-sm text-muted-foreground font-mono">
//                     {address}
//                   </p>
//                 </div>
//                 <Button
//                   onClick={handleMintNFT}
//                   disabled={isMinting || !playerStats || playerStats.wins === 0}
//                   className="bg-gold text-gold-foreground hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
//                   title={
//                     !playerStats || playerStats.wins === 0
//                       ? "You need to win at least one game to mint an NFT"
//                       : "Mint NFT for your victories"
//                   }
//                 >
//                   {isMinting
//                     ? "Minting..."
//                     : playerStats && playerStats.wins > 0
//                     ? "Mint NFT"
//                     : "No Wins Yet"}
//                 </Button>
//               </div>

//               <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
//                 <div className="text-center">
//                   <div className="text-3xl font-bold text-accent">
//                     {playerStats.wins}
//                   </div>
//                   <div className="text-xs text-muted-foreground">Wins</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-3xl font-bold text-muted-foreground">
//                     {playerStats.losses}
//                   </div>
//                   <div className="text-xs text-muted-foreground">Losses</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-3xl font-bold text-sapphire">
//                     {playerStats.draws}
//                   </div>
//                   <div className="text-xs text-muted-foreground">Draws</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-3xl font-bold text-foreground">
//                     {playerStats.gamesPlayed}
//                   </div>
//                   <div className="text-xs text-muted-foreground">Games</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-3xl font-bold text-gold">
//                     {playerStats.nfts}
//                   </div>
//                   <div className="text-xs text-muted-foreground">NFTs</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-3xl font-bold text-foreground">
//                     {playerStats.nonce}
//                   </div>
//                   <div className="text-xs text-muted-foreground">Nonce</div>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {/* Stats Overview */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             className="grid md:grid-cols-3 gap-6 mb-12"
//           >
//             <div className="bg-card p-6 rounded-xl border border-border text-center">
//               <div className="text-4xl font-bold text-gold mb-2">
//                 {totalGames}
//               </div>
//               <div className="text-sm text-muted-foreground">Total Games</div>
//             </div>
//             <div className="bg-card p-6 rounded-xl border border-border text-center">
//               <div className="text-4xl font-bold text-accent mb-2">
//                 {totalNFTs}
//               </div>
//               <div className="text-sm text-muted-foreground">NFTs Minted</div>
//             </div>
//             <div className="bg-card p-6 rounded-xl border border-border text-center">
//               <div className="text-4xl font-bold text-sapphire mb-2">
//                 {leaders.length}
//               </div>
//               <div className="text-sm text-muted-foreground">
//                 Active Players
//               </div>
//             </div>
//           </motion.div>

//           {/* Leaderboard Table */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             className="bg-card rounded-2xl border border-border shadow-luxury overflow-hidden"
//           >
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-muted">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-sm font-semibold">
//                       Rank
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold">
//                       Player
//                     </th>
//                     <th className="px-6 py-4 text-center text-sm font-semibold">
//                       Wins
//                     </th>
//                     <th className="px-6 py-4 text-center text-sm font-semibold">
//                       Losses
//                     </th>
//                     <th className="px-6 py-4 text-center text-sm font-semibold">
//                       Win Rate
//                     </th>
//                     <th className="px-6 py-4 text-center text-sm font-semibold">
//                       NFTs
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {leaders.map((leader, index) => {
//                     const winRate = (
//                       (leader.wins / (leader.wins + leader.losses)) *
//                       100
//                     ).toFixed(1);
//                     return (
//                       <motion.tr
//                         key={leader.rank}
//                         initial={{ opacity: 0, x: -20 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: 0.3 + index * 0.05 }}
//                         className="border-t border-border hover:bg-muted/50 transition-colors"
//                       >
//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-3">
//                             {getRankIcon(leader.rank)}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="font-mono text-sm">
//                             {leader.address}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 text-center">
//                           <span className="font-semibold text-accent">
//                             {leader.wins}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 text-center">
//                           <span className="text-muted-foreground">
//                             {leader.losses}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 text-center">
//                           <span
//                             className={`font-semibold ${
//                               parseFloat(winRate) > 60
//                                 ? "text-accent"
//                                 : "text-foreground"
//                             }`}
//                           >
//                             {winRate}%
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 text-center">
//                           <span className="inline-flex items-center gap-1 px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-semibold">
//                             <Trophy className="w-3 h-3" />
//                             {leader.nfts}
//                           </span>
//                         </td>
//                       </motion.tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* Note */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.8 }}
//             className="mt-8 text-center text-sm text-muted-foreground"
//           >
//             <p>
//               Leaderboard updates in real-time as games are submitted on-chain.
//             </p>
//             <p className="mt-2">
//               Data fetched from{" "}
//               <span className="text-accent font-mono"> smart contract </span> on
//               lisk testnet.
//             </p>
//           </motion.div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// };

// export default Leaderboard;
