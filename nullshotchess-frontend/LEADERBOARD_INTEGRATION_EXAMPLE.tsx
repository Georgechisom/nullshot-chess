// Example Leaderboard.tsx Integration
// This is a reference implementation showing how to fetch and display leaderboard data

import { useState, useEffect } from 'react';
import { useGetWinners, useGetWins, useGetLosses, useGetDraws, useGetGamesPlayed } from '../hooks/useChessContract';

interface PlayerStats {
  address: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
}

export default function Leaderboard() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'wins' | 'winRate' | 'totalGames'>('wins');

  // Get list of all winners (players who have played)
  const { data: winners, isLoading: winnersLoading } = useGetWinners();

  // Fetch stats for all players
  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (!winners || winners.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const stats: PlayerStats[] = [];

        for (const address of winners) {
          // In a real implementation, you'd want to batch these calls
          // or use a multicall contract to reduce RPC calls
          const wins = await useGetWins(address).data || 0;
          const losses = await useGetLosses(address).data || 0;
          const draws = await useGetDraws(address).data || 0;
          const totalGames = await useGetGamesPlayed(address).data || 0;
          
          const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

          stats.push({
            address,
            wins: Number(wins),
            losses: Number(losses),
            draws: Number(draws),
            totalGames: Number(totalGames),
            winRate,
          });
        }

        setPlayerStats(stats);
      } catch (error) {
        console.error('Error fetching player stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerStats();
  }, [winners]);

  // Sort players
  const sortedPlayers = [...playerStats].sort((a, b) => {
    switch (sortBy) {
      case 'wins':
        return b.wins - a.wins;
      case 'winRate':
        return b.winRate - a.winRate;
      case 'totalGames':
        return b.totalGames - a.totalGames;
      default:
        return 0;
    }
  });

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (winnersLoading || isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8">Leaderboard</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-xl">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (playerStats.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8">Leaderboard</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-xl">No games played yet. Be the first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Leaderboard</h1>

      {/* Sort controls */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setSortBy('wins')}
          className={`px-4 py-2 rounded ${
            sortBy === 'wins' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Sort by Wins
        </button>
        <button
          onClick={() => setSortBy('winRate')}
          className={`px-4 py-2 rounded ${
            sortBy === 'winRate' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Sort by Win Rate
        </button>
        <button
          onClick={() => setSortBy('totalGames')}
          className={`px-4 py-2 rounded ${
            sortBy === 'totalGames' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Sort by Total Games
        </button>
      </div>

      {/* Leaderboard table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Rank</th>
              <th className="px-4 py-2 border">Player</th>
              <th className="px-4 py-2 border">Wins</th>
              <th className="px-4 py-2 border">Losses</th>
              <th className="px-4 py-2 border">Draws</th>
              <th className="px-4 py-2 border">Total Games</th>
              <th className="px-4 py-2 border">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => (
              <tr key={player.address} className="hover:bg-gray-50">
                <td className="px-4 py-2 border text-center font-bold">
                  {index + 1}
                </td>
                <td className="px-4 py-2 border">
                  <a
                    href={`https://sepolia-blockscout.lisk.com/address/${player.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {formatAddress(player.address)}
                  </a>
                </td>
                <td className="px-4 py-2 border text-center text-green-600 font-semibold">
                  {player.wins}
                </td>
                <td className="px-4 py-2 border text-center text-red-600 font-semibold">
                  {player.losses}
                </td>
                <td className="px-4 py-2 border text-center text-gray-600">
                  {player.draws}
                </td>
                <td className="px-4 py-2 border text-center">
                  {player.totalGames}
                </td>
                <td className="px-4 py-2 border text-center">
                  {player.winRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

