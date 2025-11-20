// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChessGame is ERC721, EIP712, Ownable {
    using ECDSA for bytes32;

    // Game struct to track game details
    struct Game {
        address player1;
        address player2; // address(0) for AI games
        address winner; // address(0) for draws
        uint256 timestamp;
        bool isAIGame;
        bool isDraw;
        bool submitted;
    }

    // EIP-712 type hash for game result signatures
    bytes32 public constant GAME_RESULT_TYPEHASH =
        keccak256("GameResult(string gameId,address player1,address player2,address winner,bool isDraw,uint256 nonce)");

    // State variables
    mapping(string => Game) public games;
    mapping(address => uint256) public wins;
    mapping(address => uint256) public losses;
    mapping(address => uint256) public draws;
    mapping(address => uint256) public gamesPlayed;
    mapping(address => uint256) public nonces;

    address[] public winners;
    uint256 private _tokenIdCounter;
    uint256 private _totalDraws;

    // Events
    event GameSubmitted(
        string indexed gameId,
        address indexed player1,
        address indexed player2,
        address winner,
        bool isAIGame,
        bool isDraw,
        uint256 timestamp
    );
    
    event NFTMinted(
        address indexed winner,
        uint256 indexed tokenId,
        string gameId
    );

    constructor() 
        ERC721("ChessVictory", "CHESS") 
        EIP712("ChessGame", "1")
        Ownable(msg.sender)
    {}

    function submitTwoPlayerGame(
        string memory gameId,
        address player1,
        address player2,
        address winner,
        bool isDraw,
        bytes memory signature1,
        bytes memory signature2
    ) external {
        require(!games[gameId].submitted, "Game already submitted");
        require(player1 != address(0) && player2 != address(0), "Invalid player addresses");

        if (isDraw) {
            require(winner == address(0), "Winner must be address(0) for draws");
        } else {
            require(winner == player1 || winner == player2, "Winner must be one of the players");
        }

        // Verify both signatures
        bytes32 structHash = keccak256(abi.encode(
            GAME_RESULT_TYPEHASH,
            keccak256(bytes(gameId)),
            player1,
            player2,
            winner,
            isDraw,
            nonces[player1]
        ));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer1 = hash.recover(signature1);
        address signer2 = hash.recover(signature2);

        require(signer1 == player1, "Invalid player1 signature");
        require(signer2 == player2, "Invalid player2 signature");

        // Increment nonces to prevent replay attacks
        nonces[player1]++;
        nonces[player2]++;

        // Record game
        _recordGame(gameId, player1, player2, winner, false, isDraw);
    }

    function submitAIGame(
        string memory gameId,
        address humanPlayer,
        bool humanWon,
        bool isDraw,
        bytes memory signature
    ) external {
        require(!games[gameId].submitted, "Game already submitted");
        require(humanPlayer != address(0), "Invalid player address");

        address winner;
        if (isDraw) {
            winner = address(0);
        } else {
            winner = humanWon ? humanPlayer : address(this);
        }

        // Verify human signature
        bytes32 structHash = keccak256(abi.encode(
            GAME_RESULT_TYPEHASH,
            keccak256(bytes(gameId)),
            humanPlayer,
            address(0), // AI represented as address(0)
            winner,
            isDraw,
            nonces[humanPlayer]
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        require(signer == humanPlayer, "Invalid signature");

        // Increment nonce
        nonces[humanPlayer]++;

        // Record game
        _recordGame(gameId, humanPlayer, address(0), winner, true, isDraw);
    }

    function _recordGame(
        string memory gameId,
        address player1,
        address player2,
        address winner,
        bool isAIGame,
        bool isDraw
    ) private {
        // Create game record
        games[gameId] = Game({
            player1: player1,
            player2: player2,
            winner: winner,
            timestamp: block.timestamp,
            isAIGame: isAIGame,
            isDraw: isDraw,
            submitted: true
        });

        // Update stats
        if (isDraw) {
            // Both players get a draw
            draws[player1]++;
            gamesPlayed[player1]++;

            if (player2 != address(0)) {
                draws[player2]++;
                gamesPlayed[player2]++;
            }

            _totalDraws++;
        } else {
            // Regular win/loss logic
            address loser = (winner == player1) ? player2 : player1;

            if (winner != address(this)) {
                wins[winner]++;
                gamesPlayed[winner]++;
                winners.push(winner);

                // Mint NFT to winner
                _mintNFT(winner, gameId);
            }

            if (loser != address(0) && loser != address(this)) {
                losses[loser]++;
                gamesPlayed[loser]++;
            }
        }

        emit GameSubmitted(gameId, player1, player2, winner, isAIGame, isDraw, block.timestamp);
    }

    function _mintNFT(address winner, string memory gameId) private {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(winner, tokenId);

        emit NFTMinted(winner, tokenId, gameId);
    }

    // View functions

    function getWinners() external view returns (address[] memory) {
        return winners;
    }

    function getWins(address player) external view returns (uint256) {
        return wins[player];
    }

    function getLosses(address player) external view returns (uint256) {
        return losses[player];
    }

    function getDraws(address player) external view returns (uint256) {
        return draws[player];
    }

    function getTotalDraws() external view returns (uint256) {
        return _totalDraws;
    }

    function getGamesPlayed(address player) external view returns (uint256) {
        return gamesPlayed[player];
    }

    function getGameDetails(string memory gameId) external view returns (
        address player1,
        address player2,
        address winner,
        uint256 timestamp,
        bool isAIGame,
        bool isDraw,
        bool submitted
    ) {
        Game memory game = games[gameId];
        return (
            game.player1,
            game.player2,
            game.winner,
            game.timestamp,
            game.isAIGame,
            game.isDraw,
            game.submitted
        );
    }

    function getNonce(address player) external view returns (uint256) {
        return nonces[player];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function hashTypedDataV4(bytes32 structHash) external view returns (bytes32) {
        return _hashTypedDataV4(structHash);
    }
}

