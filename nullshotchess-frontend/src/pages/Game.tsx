import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChessBoard3D from "@/components/chess/ChessBoard3D";
import Header from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get game data from location state first
    if (location.state) {
      setGameData(location.state);
      setLoading(false);
      return;
    }

    // If no state, try to get from URL params or localStorage
    const urlParams = new URLSearchParams(location.search);
    const roomId = urlParams.get("roomId");

    if (roomId) {
      // Try to load from localStorage
      const storedGameData = localStorage.getItem(`game_data_${roomId}`);
      if (storedGameData) {
        const parsedData = JSON.parse(storedGameData);
        setGameData(parsedData);
        setLoading(false);
        return;
      }
    }

    // If we still don't have game data, redirect to arena
    toast.error("Missing game data. Please start a new game.");
    navigate("/arena");
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!gameData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 px-6 pb-6">
        <ChessBoard3D
          theme={gameData.theme}
          boardDesign={gameData.board}
          gameMode={gameData.gameMode}
          playerSide={gameData.playerSide}
          roomId={gameData.roomId}
          opponentAddress={gameData.opponentAddress}
          actualPlayerColor={gameData.actualPlayerColor}
        />
      </div>
    </div>
  );
};

export default Game;
