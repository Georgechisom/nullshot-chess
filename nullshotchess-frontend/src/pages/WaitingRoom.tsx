import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface GameRoom {
  id: string;
  player1: string;
  player2: string | null;
  theme: string;
  board: string;
  createdAt: number;
  status: "waiting" | "active" | "completed";
}

const WaitingRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(24 * 60 * 60); // 24 hours in seconds

  useEffect(() => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      navigate("/arena");
      return;
    }

    // Get room data from location state or localStorage
    const roomData = location.state?.room;
    if (roomData) {
      setRoom(roomData);
      // Save to localStorage
      localStorage.setItem(`game_room_${roomData.id}`, JSON.stringify(roomData));
    } else {
      // Try to load from localStorage
      const rooms = getAllRooms();
      const myRoom = rooms.find((r) => r.player1 === address && r.status === "waiting");
      if (myRoom) {
        setRoom(myRoom);
      } else {
        navigate("/arena");
      }
    }
  }, [address, isConnected, location.state, navigate]);

  // Check for opponent joining
  useEffect(() => {
    if (!room) return;

    const checkForOpponent = setInterval(() => {
      const updatedRoom = getRoom(room.id);
      if (updatedRoom && updatedRoom.player2 && updatedRoom.status === "active") {
        toast.success("Opponent found! Starting game...");
        navigate("/game", {
          state: {
            gameMode: "human",
            playerSide: "white", // Player 1 is always white
            theme: room.theme,
            board: room.board,
            roomId: room.id,
            opponentAddress: updatedRoom.player2,
          },
        });
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkForOpponent);
  }, [room, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!room) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - room.createdAt) / 1000);
      const remaining = 24 * 60 * 60 - elapsed;

      if (remaining <= 0) {
        // Delete room after 24 hours
        deleteRoom(room.id);
        toast.error("Game room expired after 24 hours");
        navigate("/arena");
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [room, navigate]);

  const handleCancel = () => {
    if (room) {
      deleteRoom(room.id);
      toast.success("Game cancelled");
    }
    navigate("/arena");
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8 text-center"
          >
            <div className="mb-8">
              <Loader2 className="w-16 h-16 animate-spin text-gold mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Waiting for Opponent</h1>
              <p className="text-muted-foreground">
                Your game room is ready. Waiting for another player to join...
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center gap-2 text-lg">
                <Users className="w-5 h-5 text-accent" />
                <span>Room ID: {room.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-gold" />
                <span>Time remaining: {formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                ⏰ If no opponent joins within 24 hours, this game room will be automatically deleted.
              </p>
            </div>

            <Button onClick={handleCancel} variant="outline" className="w-full">
              Cancel and Return to Arena
            </Button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Helper functions for localStorage management
const getAllRooms = (): GameRoom[] => {
  const rooms: GameRoom[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("game_room_")) {
      const room = JSON.parse(localStorage.getItem(key) || "{}");
      rooms.push(room);
    }
  }
  return rooms;
};

const getRoom = (id: string): GameRoom | null => {
  const data = localStorage.getItem(`game_room_${id}`);
  return data ? JSON.parse(data) : null;
};

const deleteRoom = (id: string) => {
  localStorage.removeItem(`game_room_${id}`);
};

export default WaitingRoom;
export { getAllRooms, getRoom, deleteRoom };
export type { GameRoom };

