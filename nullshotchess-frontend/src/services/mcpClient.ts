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
    // console.log("🎯 MCP Client initialized with URL:", this.url);
  }

  private generateSessionId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.url}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        this.connected = true;
        // console.log("✅ MCP Server connected:", this.url);
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ MCP Server connection failed:", error);
      this.connected = false;
      throw new Error(
        "MCP Server is not available. Please ensure the server is running."
      );
    }
  }

  async getAIMove(
    fen: string,
    side: "white" | "black",
    difficulty: "easy" | "medium" | "hard" = "hard"
  ): Promise<AIMove> {
    console.log("🤖 Requesting AI move from MCP server...");
    // console.log("URL:", `${this.url}/api/chess/move`);
    console.log("FEN:", fen);
    console.log("Side:", side);
    console.log("Difficulty:", difficulty);

    try {
      const response = await fetch(`${this.url}/api/chess/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fen,
          side,
          difficulty,
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("✅ AI move received:", data.move);

      return {
        move: data.move,
        fen: data.newFen || data.fen,
      };
    } catch (error: any) {
      console.error("❌ MCP Server error:", error);

      // Show error to user instead of silently falling back
      throw new Error(
        `Failed to get AI move from server: ${error.message}. ` +
          `Please check that the MCP server is running at ${this.url}`
      );
    }
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
