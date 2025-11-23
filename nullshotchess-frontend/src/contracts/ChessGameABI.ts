export const CHESS_GAME_ABI = [
  // Read Functions
  "function getNonce(address player) view returns (uint256)",
  "function getWins(address player) view returns (uint256)",
  "function getLosses(address player) view returns (uint256)",
  "function getDraws(address player) view returns (uint256)",
  "function getGamesPlayed(address player) view returns (uint256)",
  "function getTotalDraws() view returns (uint256)",
  "function getWinners() view returns (address[])",
  "function getGameDetails(string memory gameId) view returns (address player1, address player2, address winner, uint256 timestamp, bool isAIGame, bool isDraw, bool submitted)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",

  // Write Functions
  "function submitAIGame(string memory gameId, address humanPlayer, bool humanWon, bool isDraw, bytes memory signature) external",
  "function submitTwoPlayerGame(string memory gameId, address player1, address player2, address winner, bool isDraw, bytes memory signature1, bytes memory signature2) external",

  // Events
  "event GameSubmitted(string indexed gameId, address indexed player1, address indexed player2, address winner, bool isAIGame, bool isDraw, uint256 timestamp)",
  "event NFTMinted(address indexed winner, uint256 indexed tokenId, string gameId)",
] as const;

export const GAME_RESULT_TYPEHASH =
  "GameResult(string gameId,address player1,address player2,address winner,bool isDraw,uint256 nonce)";

export const EIP712_DOMAIN = {
  name: "ChessGame",
  version: "1",
  chainId: Number(import.meta.env.VITE_CHAIN_ID || 4202),
  verifyingContract: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
};

export const EIP712_TYPES = {
  GameResult: [
    { name: "gameId", type: "string" },
    { name: "player1", type: "address" },
    { name: "player2", type: "address" },
    { name: "winner", type: "address" },
    { name: "isDraw", type: "bool" },
    { name: "nonce", type: "uint256" },
  ],
};
