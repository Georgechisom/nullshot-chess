import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import { useState, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import { ChessTheme, BoardDesign, GameMode } from "@/pages/Arena";
import ChessPiece from "./ChessPiece";
import CapturedPiece from "./CapturedPiece";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getMCPClient } from "@/services/mcpClient";
import toast from "react-hot-toast";
import GameResultModal from "./GameResultModal";
import { v4 as uuidv4 } from "uuid";

interface ChessBoard3DProps {
  theme: ChessTheme;
  boardDesign: BoardDesign;
  gameMode: GameMode;
  playerSide: "white" | "black";
}

const ChessBoard3D = ({
  theme,
  boardDesign,
  gameMode,
  playerSide,
}: ChessBoard3DProps) => {
  const [game] = useState(new Chess());
  const [position, setPosition] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{
    white: Array<{ type: string; index: number }>;
    black: Array<{ type: string; index: number }>;
  }>({ white: [], black: [] });
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameResult, setGameResult] = useState<"win" | "loss" | "draw" | null>(
    null
  );
  const [showResultModal, setShowResultModal] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [gameId] = useState(uuidv4()); // Generate unique game ID
  const [isResetting, setIsResetting] = useState(false); // Track reset state
  const mcpClientRef = useRef(getMCPClient());
  const navigate = useNavigate();
  const location = useLocation();
  const { toast: uiToast } = useToast();

  // Connect to MCP server on mount if playing against AI
  useEffect(() => {
    if (gameMode === "ai") {
      const connectMCP = async () => {
        await mcpClientRef.current.connect();
        // Connection status is logged in mcpClient
      };
      connectMCP();
    }

    return () => {
      if (gameMode === "ai") {
        mcpClientRef.current.disconnect();
      }
    };
  }, [gameMode]);

  // Handle AI's first move if AI plays white
  useEffect(() => {
    if (gameMode === "ai" && !hasGameStarted) {
      setHasGameStarted(true);
      const aiSide = playerSide === "white" ? "b" : "w";
      if (game.turn() === aiSide) {
        // AI goes first
        setTimeout(() => makeAIMove(), 1000);
      }
    }
  }, [gameMode, playerSide, hasGameStarted]);

  // Warn user before leaving page during active game
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!game.isGameOver() && hasGameStarted) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [game, hasGameStarted]);

  // Warn user when navigating away during active game
  useEffect(() => {
    const unblock = () => {
      if (
        !game.isGameOver() &&
        hasGameStarted &&
        location.pathname.includes("/game")
      ) {
        const confirmLeave = window.confirm(
          "Do you want to exit the game? Your progress will be lost."
        );
        return confirmLeave;
      }
      return true;
    };

    // This is a simple implementation - for production, use a proper router blocker
    return () => {
      unblock();
    };
  }, [location, game, hasGameStarted]);

  // Board colors based on design
  const getBoardColors = () => {
    const designs = {
      walnut: { light: "#C19A6B", dark: "#654321" },
      oak: { light: "#F5DEB3", dark: "#D2B48C" },
      marble: { light: "#E8E8E8", dark: "#1A1A1A" },
      jade: { light: "#A8E6CF", dark: "#00563F" },
      lapis: { light: "#87CEEB", dark: "#191970" },
      mahogany: { light: "#CD5C5C", dark: "#420420" },
      ebony: { light: "#696969", dark: "#0A0A0A" },
      bamboo: { light: "#E3DAC9", dark: "#6B8E23" },
      rosewood: { light: "#B87333", dark: "#3B0918" },
      onyx: { light: "#DCDCDC", dark: "#353839" },
    };
    return designs[boardDesign];
  };

  // Theme lighting configuration
  const getThemeLighting = () => {
    const themes = {
      classic: { ambient: 0.5, point: "#FFFFFF", intensity: 1 },
      marble: { ambient: 0.6, point: "#E0E0E0", intensity: 1.2 },
      mystic: { ambient: 0.3, point: "#228B22", intensity: 0.8 },
      gold: { ambient: 0.5, point: "#FFD700", intensity: 1 },
      sapphire: { ambient: 0.4, point: "#4169E1", intensity: 0.9 },
      jade: { ambient: 0.5, point: "#50C878", intensity: 1 },
      ruby: { ambient: 0.4, point: "#E0115F", intensity: 0.9 },
      obsidian: { ambient: 0.2, point: "#2F4F4F", intensity: 0.7 },
      pearl: { ambient: 0.7, point: "#FFDAB9", intensity: 1.3 },
      emerald: { ambient: 0.5, point: "#50C878", intensity: 1 },
    };
    return themes[theme];
  };

  const colors = getBoardColors();
  const lighting = getThemeLighting();

  // AI move function
  const makeAIMove = async () => {
    if (isAIThinking || game.isGameOver() || isResetting) return;

    setIsAIThinking(true);
    toast.loading("AI is thinking...");

    try {
      const currentFen = game.fen();
      const aiSide = playerSide === "white" ? "black" : "white";

      console.log("🤖 Requesting AI move...");
      console.log("Current FEN:", currentFen);
      console.log("AI playing as:", aiSide);

      const aiMove = await mcpClientRef.current.getAIMove(currentFen, aiSide);

      console.log("✅ AI has made a move:", aiMove.move);
      console.log("New FEN:", aiMove.fen);

      // Check again if resetting before applying move
      if (isResetting) {
        toast.dismiss();
        return;
      }

      // Make the AI's move
      const move = game.move(aiMove.move);

      if (move) {
        // Check if piece was captured
        if (move.captured) {
          const capturingPlayer = move.color === "w" ? "white" : "black";
          setCapturedPieces((prev) => ({
            ...prev,
            [capturingPlayer]: [
              ...prev[capturingPlayer],
              { type: move.captured, index: prev[capturingPlayer].length },
            ],
          }));
        }

        setPosition(game.board());
        toast.dismiss();
        toast.success(`AI played: ${aiMove.move}`);

        // Check for game end
        checkGameOver();
      }
    } catch (error) {
      console.error("AI move error:", error);
      toast.dismiss();
      toast.error("AI failed to make a move. Please try again.");
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleSquareClick = (square: Square) => {
    if (selectedSquare) {
      // Try to make a move
      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: "q", // Always promote to queen for simplicity
        });

        if (move) {
          // Check if piece was captured
          if (move.captured) {
            // The capturing player's color is move.color
            // The captured piece belongs to the opponent
            const capturingPlayer = move.color === "w" ? "white" : "black";
            setCapturedPieces((prev) => ({
              ...prev,
              [capturingPlayer]: [
                ...prev[capturingPlayer],
                { type: move.captured, index: prev[capturingPlayer].length },
              ],
            }));
          }

          setPosition(game.board());
          setSelectedSquare(null);
          setLegalMoves([]);

          // Check for game end
          if (checkGameOver()) {
            return; // Game is over, don't trigger AI move
          }

          // Trigger AI move after player's move
          if (gameMode === "ai") {
            const aiSide = playerSide === "white" ? "b" : "w";
            if (game.turn() === aiSide) {
              setTimeout(() => makeAIMove(), 500); // Small delay for better UX
            }
          }
        } else {
          // Invalid move, select new piece if it's player's piece
          selectSquare(square);
        }
      } catch {
        // Invalid move, try selecting new piece
        selectSquare(square);
      }
    } else {
      selectSquare(square);
    }
  };

  const selectSquare = (square: Square) => {
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map((m) => m.to));
    }
  };

  const checkGameOver = (): boolean => {
    if (game.isGameOver()) {
      let result: "win" | "loss" | "draw";

      if (game.isCheckmate()) {
        // Determine winner
        const winner = game.turn() === "w" ? "black" : "white";
        if (winner === playerSide) {
          result = "win";
        } else {
          result = "loss";
        }
      } else {
        // Draw (stalemate, insufficient material, etc.)
        result = "draw";
      }

      setGameResult(result);
      setShowResultModal(true);
      return true;
    }
    return false;
  };

  const handleReset = () => {
    // Set resetting flag to stop AI immediately
    setIsResetting(true);
    setIsAIThinking(false);
    toast.dismiss(); // Dismiss any AI thinking toasts

    if (!game.isGameOver() && hasGameStarted) {
      const confirmReset = window.confirm(
        "Resetting will count as a loss. Do you want to continue?"
      );
      if (!confirmReset) {
        setIsResetting(false);
        return;
      }

      // Count as loss and show modal
      setGameResult("loss");
      setShowResultModal(true);
    }

    // Reset the game state
    game.reset();
    setPosition(game.board());
    setSelectedSquare(null);
    setLegalMoves([]);
    setCapturedPieces({ white: [], black: [] });
    setHasGameStarted(false);
    setIsResetting(false); // Reset the flag
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 3D Canvas */}
      <Canvas shadows className="touch-none">
        <PerspectiveCamera makeDefault position={[0, 12, 12]} />
        <OrbitControls
          enableZoom={true}
          minDistance={8}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
        />

        <ambientLight intensity={lighting.ambient} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={lighting.intensity}
          castShadow
        />
        <pointLight
          position={[-5, 8, -5]}
          intensity={0.5}
          color={lighting.point}
        />
        <Environment preset="sunset" />

        {/* Board base */}
        <mesh position={[0, -0.3, 0]} receiveShadow>
          <boxGeometry args={[9, 0.5, 9]} />
          <meshStandardMaterial
            color="#1A1A1A"
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Squares */}
        {position.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const file = String.fromCharCode(97 + colIndex); // a-h
            const rank = (8 - rowIndex).toString(); // 8-1
            const square = `${file}${rank}` as Square;
            const isSelected = square === selectedSquare;
            const isLegalMove = legalMoves.includes(square);

            return (
              <group key={square}>
                {/* Square */}
                <mesh
                  position={[colIndex - 3.5, 0, rowIndex - 3.5]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  receiveShadow
                  onClick={() => handleSquareClick(square)}
                >
                  <planeGeometry args={[0.95, 0.95]} />
                  <meshStandardMaterial
                    color={
                      isSelected
                        ? "#50C878"
                        : isLight
                        ? colors.light
                        : colors.dark
                    }
                    metalness={0.2}
                    roughness={0.8}
                  />
                </mesh>

                {/* Legal move indicator */}
                {isLegalMove && (
                  <mesh position={[colIndex - 3.5, 0.1, rowIndex - 3.5]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
                    <meshStandardMaterial
                      color="#50C878"
                      transparent
                      opacity={0.6}
                      emissive="#50C878"
                      emissiveIntensity={0.5}
                    />
                  </mesh>
                )}

                {/* Piece */}
                {piece && (
                  <ChessPiece
                    type={piece.type}
                    color={piece.color}
                    position={[colIndex - 3.5, 0.5, rowIndex - 3.5]}
                  />
                )}
              </group>
            );
          })
        )}

        {/* Captured pieces - White's captures (left side) */}
        {capturedPieces.white.map((piece, idx) => (
          <CapturedPiece
            key={`captured-white-${idx}`}
            type={piece.type as any}
            color="b"
            position={[
              -5.5,
              0.5 + Math.floor(idx / 4) * 0.6,
              -3 + (idx % 4) * 0.8,
            ]}
            index={piece.index}
          />
        ))}

        {/* Captured pieces - Black's captures (right side) */}
        {capturedPieces.black.map((piece, idx) => (
          <CapturedPiece
            key={`captured-black-${idx}`}
            type={piece.type as any}
            color="w"
            position={[
              5.5,
              0.5 + Math.floor(idx / 4) * 0.6,
              -3 + (idx % 4) * 0.8,
            ]}
            index={piece.index}
          />
        ))}
      </Canvas>

      {/* Game Result Modal */}
      <GameResultModal
        isOpen={showResultModal}
        result={gameResult}
        onClose={() => {
          setShowResultModal(false);
          // Reset game state when closing modal without submitting
          game.reset();
          setPosition(game.board());
          setSelectedSquare(null);
          setLegalMoves([]);
          setCapturedPieces({ white: [], black: [] });
          setHasGameStarted(false);
          setGameResult(null);
        }}
        playerSide={playerSide}
        gameId={gameId}
      />

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex flex-col md:flex-row justify-between items-start gap-3">
        <div className="bg-card/90 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-xl border border-border">
          <div className="text-xs md:text-sm text-muted-foreground mb-1">
            Current Turn
          </div>
          {(() => {
            const currentTurn = game.turn();
            const isPlayerTurn =
              (currentTurn === "w" && playerSide === "white") ||
              (currentTurn === "b" && playerSide === "black");

            if (gameMode === "ai") {
              if (isPlayerTurn) {
                return (
                  <div
                    className={`text-lg md:text-2xl font-bold ${
                      playerSide === "white" ? "text-white" : "text-black"
                    }`}
                  >
                    {playerSide === "white" ? "♔" : "♚"} Your Turn
                  </div>
                );
              } else {
                return (
                  <div className="text-lg md:text-2xl font-bold text-gold">
                    🤖 NullShot AI
                  </div>
                );
              }
            } else {
              return (
                <div
                  className={`text-lg md:text-2xl font-bold ${
                    currentTurn === "w" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {currentTurn === "w" ? "♔ White" : "♚ Black"}
                </div>
              );
            }
          })()}
        </div>

        <div className="flex gap-2 md:gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-card/90 backdrop-blur-sm text-xs md:text-sm"
            size="sm"
          >
            <RotateCcw className="mr-1 md:mr-2 w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            onClick={() => navigate("/arena")}
            variant="outline"
            className="bg-card/90 backdrop-blur-sm text-xs md:text-sm"
            size="sm"
          >
            <Home className="mr-1 md:mr-2 w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
      </div>

      {/* Game Info */}
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-card/90 backdrop-blur-sm px-4 py-3 md:px-6 md:py-4 rounded-xl border border-border">
        <div className="text-xs md:text-sm text-muted-foreground mb-2">
          Game Mode
        </div>
        <div className="font-semibold text-sm md:text-base">
          {gameMode === "ai" ? "🤖 VS NullShot AI" : "👥 VS Human"}
        </div>
        <div className="text-xs md:text-sm text-muted-foreground mt-2">
          Playing as:{" "}
          <span className="text-foreground font-medium">
            {playerSide === "white" ? "♔ White" : "♚ Black"}
          </span>
        </div>
      </div>

      {/* Instructions - Hidden on mobile */}
      <div className="hidden md:block absolute bottom-6 right-6 bg-card/90 backdrop-blur-sm px-6 py-4 rounded-xl border border-border max-w-xs">
        <div className="text-sm">
          <div className="font-semibold mb-2">Controls:</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Click piece to select</li>
            <li>• Green dots show legal moves</li>
            <li>• Drag to rotate view</li>
            <li>• Scroll to zoom</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard3D;
