import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameModeSelector from "@/components/game/GameModeSelector";
import ThemeSelector from "@/components/game/ThemeSelector";
import BoardSelector from "@/components/game/BoardSelector";
import ChessBoard3D from "@/components/chess/ChessBoard3D";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getAllRooms, GameRoom } from "./WaitingRoom";
import toast from "react-hot-toast";

export type GameMode = "human" | "ai" | null;
export type PlayerSide = "white" | "black" | "random" | null;
export type ChessTheme =
  | "classic"
  | "marble"
  | "mystic"
  | "gold"
  | "sapphire"
  | "jade"
  | "ruby"
  | "obsidian"
  | "pearl"
  | "emerald";
export type BoardDesign =
  | "walnut"
  | "oak"
  | "marble"
  | "jade"
  | "lapis"
  | "mahogany"
  | "ebony"
  | "bamboo"
  | "rosewood"
  | "onyx";

type Step = "mode" | "side" | "theme" | "board" | "confirm";

const Arena = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("mode");
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [playerSide, setPlayerSide] = useState<PlayerSide>(null);
  const [theme, setTheme] = useState<ChessTheme>("classic");
  const [board, setBoard] = useState<BoardDesign>("walnut");
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [showJoinWithId, setShowJoinWithId] = useState(false);

  const canStartGame = gameMode && playerSide;

  const handleNext = () => {
    if (currentStep === "mode" && gameMode) setCurrentStep("side");
    else if (currentStep === "side" && playerSide) setCurrentStep("theme");
    else if (currentStep === "theme") setCurrentStep("board");
    else if (currentStep === "board") setCurrentStep("confirm");
  };

  const handleBack = () => {
    if (currentStep === "side") setCurrentStep("mode");
    else if (currentStep === "theme") setCurrentStep("side");
    else if (currentStep === "board") setCurrentStep("theme");
    else if (currentStep === "confirm") setCurrentStep("board");
  };

  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const handleStartGame = () => {
    if (!canStartGame) return;

    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    const finalSide =
      playerSide === "random"
        ? Math.random() > 0.5
          ? "white"
          : "black"
        : playerSide;

    if (gameMode === "human") {
      const room: GameRoom = {
        id: uuidv4(),
        player1: address,
        player2: null,
        theme,
        board,
        createdAt: Date.now(),
        status: "waiting",
        isPrivate: isPrivateRoom,
        player1Side: finalSide as "white" | "black",
      };

      localStorage.setItem(`game_room_${room.id}`, JSON.stringify(room));

      navigate("/waiting-room", { state: { room } });
    } else {
      setPlayerSide(finalSide as "white" | "black");
      setGameStarted(true);
    }
  };

  const handleJoinGame = () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    const rooms = getAllRooms();
    const availableRooms = rooms.filter(
      (r) => r.status === "waiting" && r.player1 !== address && !r.isPrivate // Only show public rooms
    );

    if (availableRooms.length === 0) {
      toast.error("No public games available. Try joining with a room ID!");
      return;
    }

    const roomToJoin = availableRooms[0];
    const player2Side = roomToJoin.player1Side === "white" ? "black" : "white";

    roomToJoin.player2 = address;
    roomToJoin.status = "active";

    localStorage.setItem(
      `game_room_${roomToJoin.id}`,
      JSON.stringify(roomToJoin)
    );

    toast.success("Joined game! Starting...");

    navigate("/game", {
      state: {
        gameMode: "human",
        playerSide: player2Side,
        theme: roomToJoin.theme,
        board: roomToJoin.board,
        roomId: roomToJoin.id,
        opponentAddress: roomToJoin.player1,
        actualPlayerColor: player2Side,
      },
    });
  };

  const handleJoinWithId = () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!roomIdToJoin.trim()) {
      toast.error("Please enter a room ID");
      return;
    }

    const roomData = localStorage.getItem(`game_room_${roomIdToJoin.trim()}`);

    if (!roomData) {
      toast.error("Room not found!");
      return;
    }

    const room: GameRoom = JSON.parse(roomData);

    if (room.status === "completed") {
      toast.error("This game has already ended");
      return;
    }

    // Allow player 1 to rejoin their own waiting room
    if (room.player1 === address && room.status === "waiting") {
      toast.success("Rejoining your waiting room...");
      navigate("/waiting-room", { state: { room } });
      return;
    }

    // Allow player 1 to rejoin their active game
    if (room.player1 === address && room.status === "active") {
      toast.success("Rejoining your active game...");
      navigate("/game", {
        state: {
          gameMode: "human",
          playerSide: room.player1Side,
          theme: room.theme,
          board: room.board,
          roomId: room.id,
          opponentAddress: room.player2,
          actualPlayerColor: room.player1Side,
        },
      });
      return;
    }

    // Allow player 2 to rejoin their active game
    if (room.player2 === address && room.status === "active") {
      const player2Side = room.player1Side === "white" ? "black" : "white";
      toast.success("Rejoining your active game...");
      navigate("/game", {
        state: {
          gameMode: "human",
          playerSide: player2Side,
          theme: room.theme,
          board: room.board,
          roomId: room.id,
          opponentAddress: room.player1,
          actualPlayerColor: player2Side,
        },
      });
      return;
    }

    // New player joining
    if (room.status !== "waiting") {
      toast.error("This game is no longer available");
      return;
    }

    if (room.player1 === address) {
      toast.error("You cannot join your own game!");
      return;
    }

    const player2Side = room.player1Side === "white" ? "black" : "white";

    room.player2 = address;
    room.status = "active";

    localStorage.setItem(`game_room_${room.id}`, JSON.stringify(room));

    toast.success("Joined private game! Starting...");

    navigate("/game", {
      state: {
        gameMode: "human",
        playerSide: player2Side,
        theme: room.theme,
        board: room.board,
        roomId: room.id,
        opponentAddress: room.player1,
        actualPlayerColor: player2Side,
      },
    });
  };

  const canProceed = () => {
    if (currentStep === "mode") return gameMode !== null;
    if (currentStep === "side") return playerSide !== null;
    return true;
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-6 pb-6">
          <ChessBoard3D
            theme={theme}
            boardDesign={board}
            gameMode={gameMode!}
            playerSide={playerSide as "white" | "black"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="md:container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Enter the <span className="text-gold">Arena</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground">
              Configure your game settings and prepare for battle
            </p>
          </motion.div>

          <div className="relative min-h-[1000px] md:min-h-[800px] flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {currentStep === "mode" && (
                <motion.div
                  key="mode"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute w-full md:max-w-4xl"
                >
                  <div className="bg-card p-8 rounded-3xl rounded-tl-none border-2 border-gold/50 shadow-2xl">
                    <h2 className="text-lg md:text-3xl text-nowrap font-bold mb-6 md:text-center py-5">
                      <span className="text-gold">Step 1:</span> Choose Game
                      Mode
                    </h2>
                    <GameModeSelector
                      selected={gameMode}
                      onSelect={(mode) => {
                        setGameMode(mode);
                        setDirection(1);
                      }}
                    />

                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-card text-muted-foreground">
                            OR
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <Button
                          onClick={handleJoinGame}
                          variant="outline"
                          className="w-full border-accent text-accent hover:bg-accent/10"
                        >
                          <Unlock className="mr-2 w-4 h-4" />
                          Join Any Available Game
                        </Button>

                        <div className="relative">
                          <Button
                            onClick={() => setShowJoinWithId(!showJoinWithId)}
                            variant="outline"
                            className="w-full border-gold text-gold hover:bg-gold/10"
                          >
                            <Lock className="mr-2 w-4 h-4" />
                            Join with Room ID
                          </Button>
                        </div>

                        {showJoinWithId && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <Input
                              placeholder="Enter Room ID"
                              value={roomIdToJoin}
                              onChange={(e) => setRoomIdToJoin(e.target.value)}
                              className="w-full"
                            />
                            <Button
                              onClick={handleJoinWithId}
                              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                            >
                              Join Private Game
                            </Button>
                          </motion.div>
                        )}

                        <p className="text-xs text-center text-muted-foreground py-2">
                          Join an existing multiplayer game or enter a room ID
                          for private games
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <Button
                        onClick={() => {
                          setDirection(1);
                          handleNext();
                        }}
                        disabled={!canProceed()}
                        className="bg-gold text-gold-foreground hover:bg-gold/90"
                      >
                        Next <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === "side" && (
                <motion.div
                  key="side"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute w-full max-w-4xl"
                >
                  <div className="bg-card p-8 rounded-2xl rounded-tl-none border-2 border-gold/50 shadow-2xl">
                    <h2 className="text-lg md:text-3xl font-bold mb-6 text-center">
                      <span className="text-gold">Step 2:</span> Select Your
                      Side
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6 py-5">
                      {[
                        { value: "white", label: "White", icon: "♔" },
                        { value: "black", label: "Black", icon: "♚" },
                        { value: "random", label: "Random", icon: "🎲" },
                      ].map((side) => (
                        <button
                          key={side.value}
                          onClick={() =>
                            setPlayerSide(side.value as PlayerSide)
                          }
                          className={`p-8 rounded-xl border-2 transition-all ${
                            playerSide === side.value
                              ? "border-accent bg-accent/10 shadow-glow-emerald"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          <div className="text-4xl md:text-6xl mb-3">
                            {side.icon}
                          </div>
                          <div className="font-semibold text-base md:text-xl">
                            {side.label}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-8">
                      <Button
                        onClick={() => {
                          setDirection(-1);
                          handleBack();
                        }}
                        variant="outline"
                      >
                        <ChevronLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button
                        onClick={() => {
                          setDirection(1);
                          handleNext();
                        }}
                        disabled={!canProceed()}
                        className="bg-gold text-gold-foreground hover:bg-gold/90"
                      >
                        Next <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === "theme" && (
                <motion.div
                  key="theme"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute w-full max-w-4xl"
                >
                  <div className="bg-card p-8 rounded-2xl rounded-tl-none border-2 border-gold/50 shadow-2xl">
                    <h2 className="text-xl md:text-3xl font-bold mb-6 text-center">
                      <span className="text-gold">Step 3:</span> Choose Theme
                    </h2>
                    <ThemeSelector selected={theme} onSelect={setTheme} />
                    <div className="flex justify-between mt-8">
                      <Button
                        onClick={() => {
                          setDirection(-1);
                          handleBack();
                        }}
                        variant="outline"
                      >
                        <ChevronLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button
                        onClick={() => {
                          setDirection(1);
                          handleNext();
                        }}
                        className="bg-gold text-gold-foreground hover:bg-gold/90"
                      >
                        Next <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === "board" && (
                <motion.div
                  key="board"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute w-full max-w-4xl"
                >
                  <div className="bg-card p-8 rounded-2xl rounded-tl-none border-2 border-gold/50 shadow-2xl">
                    <h2 className="text-lg md:text-3xl font-bold mb-6 text-center">
                      <span className="text-gold">Step 4:</span> Select Board
                      Design
                    </h2>
                    <BoardSelector selected={board} onSelect={setBoard} />
                    <div className="flex justify-between mt-8">
                      <Button
                        onClick={() => {
                          setDirection(-1);
                          handleBack();
                        }}
                        variant="outline"
                      >
                        <ChevronLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button
                        onClick={() => {
                          setDirection(1);
                          handleNext();
                        }}
                        className="bg-gold text-gold-foreground hover:bg-gold/90"
                      >
                        Next <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === "confirm" && (
                <motion.div
                  key="confirm"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute w-full max-w-4xl"
                >
                  <div className="bg-card p-8 rounded-2xl rounded-tl-none border-2 border-gold/50 shadow-2xl">
                    <h2 className="text-xl py-5 md:text-3xl font-bold mb-6 text-center">
                      <span className="text-gold">Ready to Play!</span>
                    </h2>
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                        <span className="text-muted-foreground">
                          Game Mode:
                        </span>
                        <span className="font-semibold capitalize">
                          {gameMode}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                        <span className="text-muted-foreground">
                          Playing As:
                        </span>
                        <span className="font-semibold capitalize">
                          {playerSide}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                        <span className="text-muted-foreground">Theme:</span>
                        <span className="font-semibold capitalize">
                          {theme}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                        <span className="text-muted-foreground">Board:</span>
                        <span className="font-semibold capitalize">
                          {board}
                        </span>
                      </div>

                      {gameMode === "human" && (
                        <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                          <div className="flex items-center gap-2">
                            {isPrivateRoom ? (
                              <Lock className="w-4 h-4 text-gold" />
                            ) : (
                              <Unlock className="w-4 h-4 text-accent" />
                            )}
                            <span className="text-muted-foreground">
                              {isPrivateRoom ? "Private Room:" : "Public Room:"}
                            </span>
                          </div>
                          <Switch
                            checked={isPrivateRoom}
                            onCheckedChange={setIsPrivateRoom}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <Button
                        onClick={() => {
                          setDirection(-1);
                          handleBack();
                        }}
                        variant="outline"
                      >
                        <ChevronLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button
                        onClick={handleStartGame}
                        className="bg-gold text-gold-foreground hover:bg-gold/90 px-8"
                      >
                        Start Game
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Arena;
