import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Clock, Copy, Lock, Unlock } from "lucide-react";
import toast from "react-hot-toast";

export interface GameRoom {
  id: string;
  player1: string;
  player2: string | null;
  theme: string;
  board: string;
  createdAt: number;
  status: "waiting" | "active" | "completed";
  isPrivate?: boolean;
  player1Side: "white" | "black";
}

const WaitingRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(24 * 60 * 60);

  useEffect(() => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      navigate("/arena");
      return;
    }

    const roomData = location.state?.room;
    if (roomData) {
      setRoom(roomData);
      localStorage.setItem(
        `game_room_${roomData.id}`,
        JSON.stringify(roomData)
      );
    } else {
      const rooms = getAllRooms();
      const myRoom = rooms.find(
        (r) => r.player1 === address && r.status === "waiting"
      );
      if (myRoom) {
        setRoom(myRoom);
      } else {
        navigate("/arena");
      }
    }
  }, [address, isConnected, location.state, navigate]);

  useEffect(() => {
    if (!room) return;

    const checkForOpponent = setInterval(() => {
      const updatedRoom = getRoom(room.id);
      if (
        updatedRoom &&
        updatedRoom.player2 &&
        updatedRoom.status === "active"
      ) {
        toast.success("Opponent found! Starting game...");

        const gameData = {
          gameMode: "human" as any,
          playerSide: room.player1Side,
          theme: room.theme,
          board: room.board,
          roomId: room.id,
          opponentAddress: updatedRoom.player2,
          actualPlayerColor: room.player1Side,
        };

        // Store game data in localStorage for reliable retrieval
        localStorage.setItem(`game_data_${room.id}`, JSON.stringify(gameData));

        navigate("/game", { state: gameData });
      }
    }, 2000);

    return () => clearInterval(checkForOpponent);
  }, [room, navigate, address]);

  useEffect(() => {
    if (!room) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - room.createdAt) / 1000);
      const remaining = 24 * 60 * 60 - elapsed;

      if (remaining <= 0) {
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

  const handleCopyRoomId = () => {
    if (room) {
      navigator.clipboard.writeText(room.id);
      toast.success("Room ID copied to clipboard!");
    }
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
        <div className="md:container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8 text-center"
          >
            <div className="mb-8">
              <Loader2 className="w-16 h-16 animate-spin text-gold mx-auto mb-4" />
              <h1 className="text-lg md:text-3xl font-bold mb-2">
                Waiting for Opponent
              </h1>
              <p className="text-muted-foreground">
                Your game room is ready. Waiting for another player to join...
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg">
                <div className="flex items-center gap-2">
                  {room.isPrivate ? (
                    <Lock className="w-5 h-5 text-gold" />
                  ) : (
                    <Unlock className="w-5 h-5 text-accent" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {room.isPrivate ? "Private Room" : "Public Room"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm md:text-base font-semibold">
                    {room.id}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyRoomId}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {room.isPrivate && (
                  <p className="text-xs text-muted-foreground">
                    Share this Room ID with your opponent
                  </p>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-base md:text-lg p-4 bg-background rounded-lg">
                <Users className="w-5 h-5 text-accent" />
                <span>
                  You are playing as:{" "}
                  <strong className="capitalize">{room.player1Side}</strong>
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-base md:text-lg p-4 bg-background rounded-lg">
                <Clock className="w-5 h-5 text-gold" />
                <span>Time remaining: {formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                ⏰ If no opponent joins within 24 hours, this game room will be
                automatically deleted.
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

export const getAllRooms = (): GameRoom[] => {
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

export const getRoom = (id: string): GameRoom | null => {
  const data = localStorage.getItem(`game_room_${id}`);
  return data ? JSON.parse(data) : null;
};

export const deleteRoom = (id: string) => {
  localStorage.removeItem(`game_room_${id}`);
};

export default WaitingRoom;
