import { Chess } from "chess.js";

export interface AIMove {
  move: string;
  fen: string;
}

export interface MCPClientConfig {
  url: string;
  sessionId?: string;
}

export class MCPClient {
  private sessionId: string;
  private url: string;
  private connected: boolean = false;

  constructor(config: MCPClientConfig) {
    this.url =
      config.url || import.meta.env.VITE_MCP_URL || "http://localhost:8787";
    this.sessionId = config.sessionId || this.generateSessionId();
  }

  private generateSessionId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }

  async connect(): Promise<void> {
    try {
      // Test connection with a simple fetch
      const response = await fetch(this.url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      this.connected = true;
      console.log("✅ MCP Client connected to:", this.url);
    } catch (error) {
      console.warn("⚠️ MCP Server not available, AI will use fallback");
      this.connected = false;
      // Don't throw error - allow graceful degradation
    }
  }

  async getAIMove(fen: string, side: "white" | "black"): Promise<AIMove> {
    try {
      // Try to make a request to the MCP server
      const response = await fetch(`${this.url}/api/chess/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fen,
          side,
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        move: data.move,
        fen: data.newFen || data.fen,
      };
    } catch (error) {
      console.warn("MCP server unavailable, using random move fallback");
      // Fallback: generate a random legal move using chess.js
      return this.getRandomMove(fen);
    }
  }

  private getRandomMove(fen: string): AIMove {
    // Use minimax algorithm for smarter AI
    const game = new Chess(fen);
    const bestMove = this.getBestMove(game, 3); // Depth 3 for hard difficulty

    if (!bestMove) {
      throw new Error("No legal moves available");
    }

    game.move(bestMove);

    return {
      move: bestMove,
      fen: game.fen(),
    };
  }

  // Minimax algorithm with alpha-beta pruning for hard AI
  private getBestMove(game: Chess, depth: number): string | null {
    const moves = game.moves();
    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestValue = -Infinity;

    for (const move of moves) {
      game.move(move);
      const value = this.minimax(game, depth - 1, -Infinity, Infinity, false);
      game.undo();

      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private minimax(
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    if (depth === 0 || game.isGameOver()) {
      return this.evaluateBoard(game);
    }

    const moves = game.moves();

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        game.move(move);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        game.move(move);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return minEval;
    }
  }

  private evaluateBoard(game: Chess): number {
    if (game.isCheckmate()) {
      return game.turn() === "w" ? -10000 : 10000;
    }
    if (game.isDraw() || game.isStalemate()) {
      return 0;
    }

    const pieceValues: { [key: string]: number } = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 20000,
    };

    let score = 0;
    const board = game.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          score += piece.color === "b" ? value : -value;
        }
      }
    }

    // Add positional bonuses
    score += this.getPositionalScore(game);

    return score;
  }

  private getPositionalScore(game: Chess): number {
    let score = 0;
    const board = game.board();

    // Center control bonus
    const centerSquares = [
      [3, 3],
      [3, 4],
      [4, 3],
      [4, 4],
    ];
    for (const [row, col] of centerSquares) {
      const piece = board[row][col];
      if (piece) {
        score += piece.color === "b" ? 30 : -30;
      }
    }

    // Piece development bonus (knights and bishops)
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && (piece.type === "n" || piece.type === "b")) {
          // Bonus for developed pieces (not on back rank)
          if (piece.color === "b" && i > 0) {
            score += 10;
          } else if (piece.color === "w" && i < 7) {
            score -= 10;
          }
        }
      }
    }

    return score;
  }

  disconnect(): void {
    this.connected = false;
    console.log("MCP Client disconnected");
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
let mcpClientInstance: MCPClient | null = null;

export const getMCPClient = (): MCPClient => {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient({
      url: import.meta.env.VITE_MCP_URL || "http://localhost:8787",
    });
  }
  return mcpClientInstance;
};

export const resetMCPClient = (): void => {
  if (mcpClientInstance) {
    mcpClientInstance.disconnect();
    mcpClientInstance = null;
  }
};
