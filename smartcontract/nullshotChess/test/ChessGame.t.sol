// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/ChessGame.sol";

contract ChessGameTest is Test {
    ChessGame public chessGame;

    uint256 public player1PrivateKey = 0xA11CE;
    uint256 public player2PrivateKey = 0xB0B;
    uint256 public player3PrivateKey = 0xC0C;

    address public player1;
    address public player2;
    address public player3;

    function setUp() public {
        chessGame = new ChessGame();

        // Derive addresses from private keys
        player1 = vm.addr(player1PrivateKey);
        player2 = vm.addr(player2PrivateKey);
        player3 = vm.addr(player3PrivateKey);

        // Fund test accounts
        vm.deal(player1, 100 ether);
        vm.deal(player2, 100 ether);
        vm.deal(player3, 100 ether);
    }

    function testSubmitTwoPlayerGame() public {
        string memory gameId = "game1";
        address winner = player1;
        bool isDraw = false;

        // Get nonce
        uint256 nonce = chessGame.getNonce(player1);

        // Create signature hash
        bytes32 structHash = keccak256(abi.encode(
            chessGame.GAME_RESULT_TYPEHASH(),
            keccak256(bytes(gameId)),
            player1,
            player2,
            winner,
            isDraw,
            nonce
        ));

        bytes32 hash = chessGame.hashTypedDataV4(structHash);

        // Sign with both players
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(player1PrivateKey, hash);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(player2PrivateKey, hash);

        bytes memory signature1 = abi.encodePacked(r1, s1, v1);
        bytes memory signature2 = abi.encodePacked(r2, s2, v2);

        // Submit game
        chessGame.submitTwoPlayerGame(
            gameId,
            player1,
            player2,
            winner,
            isDraw,
            signature1,
            signature2
        );

        // Verify game details
        (
            address p1,
            address p2,
            address w,
            uint256 timestamp,
            bool isAI,
            bool draw,
            bool submitted
        ) = chessGame.getGameDetails(gameId);

        assertEq(p1, player1);
        assertEq(p2, player2);
        assertEq(w, winner);
        assertTrue(submitted);
        assertFalse(isAI);
        assertFalse(draw);
        assertGt(timestamp, 0);

        // Verify stats
        assertEq(chessGame.getWins(player1), 1);
        assertEq(chessGame.getLosses(player2), 1);
        assertEq(chessGame.getGamesPlayed(player1), 1);
        assertEq(chessGame.getGamesPlayed(player2), 1);
        
        // Verify NFT minted
        assertEq(chessGame.balanceOf(player1), 1);
        assertEq(chessGame.totalSupply(), 1);
    }

    function testSubmitAIGameHumanWins() public {
        string memory gameId = "ai-game1";
        address humanPlayer = player1;
        bool humanWon = true;
        bool isDraw = false;

        uint256 nonce = chessGame.getNonce(humanPlayer);
        address winner = humanWon ? humanPlayer : address(chessGame);

        bytes32 structHash = keccak256(abi.encode(
            chessGame.GAME_RESULT_TYPEHASH(),
            keccak256(bytes(gameId)),
            humanPlayer,
            address(0),
            winner,
            isDraw,
            nonce
        ));

        bytes32 hash = chessGame.hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(player1PrivateKey, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        chessGame.submitAIGame(gameId, humanPlayer, humanWon, isDraw, signature);

        // Verify
        assertEq(chessGame.getWins(humanPlayer), 1);
        assertEq(chessGame.getGamesPlayed(humanPlayer), 1);
        assertEq(chessGame.balanceOf(humanPlayer), 1);
    }

    function testSubmitAIGameAIWins() public {
        string memory gameId = "ai-game2";
        address humanPlayer = player1;
        bool humanWon = false;
        bool isDraw = false;

        uint256 nonce = chessGame.getNonce(humanPlayer);
        address winner = humanWon ? humanPlayer : address(chessGame);

        bytes32 structHash = keccak256(abi.encode(
            chessGame.GAME_RESULT_TYPEHASH(),
            keccak256(bytes(gameId)),
            humanPlayer,
            address(0),
            winner,
            isDraw,
            nonce
        ));

        bytes32 hash = chessGame.hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(player1PrivateKey, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        chessGame.submitAIGame(gameId, humanPlayer, humanWon, isDraw, signature);

        // Verify - AI wins don't mint NFT
        assertEq(chessGame.getWins(humanPlayer), 0);
        assertEq(chessGame.getLosses(humanPlayer), 1);
        assertEq(chessGame.getGamesPlayed(humanPlayer), 1);
        assertEq(chessGame.balanceOf(humanPlayer), 0);
    }

    function testRevertDuplicateGameSubmission() public {
        string memory gameId = "duplicate-game";
        bool isDraw = false;

        // Submit first time
        uint256 nonce = chessGame.getNonce(player1);
        bytes32 structHash = keccak256(abi.encode(
            chessGame.GAME_RESULT_TYPEHASH(),
            keccak256(bytes(gameId)),
            player1,
            player2,
            player1,
            isDraw,
            nonce
        ));

        bytes32 hash = chessGame.hashTypedDataV4(structHash);
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(player1PrivateKey, hash);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(player2PrivateKey, hash);

        chessGame.submitTwoPlayerGame(
            gameId,
            player1,
            player2,
            player1,
            isDraw,
            abi.encodePacked(r1, s1, v1),
            abi.encodePacked(r2, s2, v2)
        );

        // Try to submit again - should revert
        vm.expectRevert("Game already submitted");
        chessGame.submitTwoPlayerGame(
            gameId,
            player1,
            player2,
            player1,
            isDraw,
            abi.encodePacked(r1, s1, v1),
            abi.encodePacked(r2, s2, v2)
        );
    }

    function testRevertInvalidSignature() public {
        string memory gameId = "invalid-sig";
        uint256 nonce = chessGame.getNonce(player1);
        bool isDraw = false;

        bytes32 structHash = keccak256(abi.encode(
            chessGame.GAME_RESULT_TYPEHASH(),
            keccak256(bytes(gameId)),
            player1,
            player2,
            player1,
            isDraw,
            nonce
        ));

        bytes32 hash = chessGame.hashTypedDataV4(structHash);
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(player1PrivateKey, hash);
        (uint8 v3, bytes32 r3, bytes32 s3) = vm.sign(player3PrivateKey, hash); // Wrong signer

        vm.expectRevert("Invalid player2 signature");
        chessGame.submitTwoPlayerGame(
            gameId,
            player1,
            player2,
            player1,
            isDraw,
            abi.encodePacked(r1, s1, v1),
            abi.encodePacked(r3, s3, v3) // Wrong signature
        );
    }

    function testRevertInvalidWinner() public {
        string memory gameId = "invalid-winner";
        uint256 nonce = chessGame.getNonce(player1);
        bool isDraw = false;

        bytes32 structHash = keccak256(abi.encode(
            chessGame.GAME_RESULT_TYPEHASH(),
            keccak256(bytes(gameId)),
            player1,
            player2,
            player3, // Invalid winner
            isDraw,
            nonce
        ));

        bytes32 hash = chessGame.hashTypedDataV4(structHash);
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(player1PrivateKey, hash);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(player2PrivateKey, hash);

        vm.expectRevert("Winner must be one of the players");
        chessGame.submitTwoPlayerGame(
            gameId,
            player1,
            player2,
            player3,
            isDraw,
            abi.encodePacked(r1, s1, v1),
            abi.encodePacked(r2, s2, v2)
        );
    }

    function testMultipleGamesAndStats() public {
        // Player1 wins game1
        _submitGame("game1", player1, player2, player1);

        // Player2 wins game2
        _submitGame("game2", player1, player2, player2);

        // Player1 wins game3 against player3
        _submitGame("game3", player1, player3, player1);

        // Verify stats
        assertEq(chessGame.getWins(player1), 2);
        assertEq(chessGame.getLosses(player1), 1);
        assertEq(chessGame.getGamesPlayed(player1), 3);

        assertEq(chessGame.getWins(player2), 1);
        assertEq(chessGame.getLosses(player2), 1);
        assertEq(chessGame.getGamesPlayed(player2), 2);

        assertEq(chessGame.getWins(player3), 0);
        assertEq(chessGame.getLosses(player3), 1);
        assertEq(chessGame.getGamesPlayed(player3), 1);

        // Verify NFTs
        assertEq(chessGame.balanceOf(player1), 2);
        assertEq(chessGame.balanceOf(player2), 1);
        assertEq(chessGame.totalSupply(), 3);

        // Verify winners list
        address[] memory winnersList = chessGame.getWinners();
        assertEq(winnersList.length, 3);
    }

    function testTwoPlayerDraw() public {
        string memory gameId = "draw-game1";
        address winner = address(0);
        bool isDraw = true;

        uint256 nonce = chessGame.getNonce(player1);

        bytes32 structHash = keccak256(abi.encode(
            chessGame.GAME_RESULT_TYPEHASH(),
            keccak256(bytes(gameId)),
            player1,
            player2,
            winner,
            isDraw,
            nonce
        ));

        bytes32 hash = chessGame.hashTypedDataV4(structHash);
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(player1PrivateKey, hash);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(player2PrivateKey, hash);

        chessGame.submitTwoPlayerGame(
            gameId,
            player1,
            player2,
            winner,
            isDraw,
            abi.encodePacked(r1, s1, v1),
            abi.encodePacked(r2, s2, v2)
        );

        // Verify no NFT minted
        assertEq(chessGame.balanceOf(player1), 0);
        assertEq(chessGame.balanceOf(player2), 0);
        assertEq(chessGame.totalSupply(), 0);

        // Verify draw stats
        assertEq(chessGame.getDraws(player1), 1);
        assertEq(chessGame.getDraws(player2), 1);
        assertEq(chessGame.getTotalDraws(), 1);
        assertEq(chessGame.getGamesPlayed(player1), 1);
        assertEq(chessGame.getGamesPlayed(player2), 1);

        // Verify no wins/losses
        assertEq(chessGame.getWins(player1), 0);
        assertEq(chessGame.getWins(player2), 0);
        assertEq(chessGame.getLosses(player1), 0);
        assertEq(chessGame.getLosses(player2), 0);
    }

    function testAIGameDraw() public {
        string memory gameId = "ai-draw-game";
        address humanPlayer = player1;
        bool humanWon = false; // Ignored when isDraw is true
        bool isDraw = true;

        uint256 nonce = chessGame.getNonce(humanPlayer);

        bytes32 structHash = keccak256(abi.encode(
            chessGame.GAME_RESULT_TYPEHASH(),
            keccak256(bytes(gameId)),
            humanPlayer,
            address(0),
            address(0), // Winner is address(0) for draws
            isDraw,
            nonce
        ));

        bytes32 hash = chessGame.hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(player1PrivateKey, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        chessGame.submitAIGame(gameId, humanPlayer, humanWon, isDraw, signature);

        // Verify no NFT minted
        assertEq(chessGame.balanceOf(humanPlayer), 0);
        assertEq(chessGame.totalSupply(), 0);

        // Verify draw stats
        assertEq(chessGame.getDraws(humanPlayer), 1);
        assertEq(chessGame.getTotalDraws(), 1);
        assertEq(chessGame.getGamesPlayed(humanPlayer), 1);

        // Verify no wins/losses
        assertEq(chessGame.getWins(humanPlayer), 0);
        assertEq(chessGame.getLosses(humanPlayer), 0);
    }

    // Helper function
    function _submitGame(string memory gameId, address p1, address p2, address winner) internal {
        uint256 nonce = chessGame.getNonce(p1);
        bool isDraw = false;

        bytes32 structHash = keccak256(abi.encode(
            chessGame.GAME_RESULT_TYPEHASH(),
            keccak256(bytes(gameId)),
            p1,
            p2,
            winner,
            isDraw,
            nonce
        ));

        bytes32 hash = chessGame.hashTypedDataV4(structHash);

        uint256 pk1 = (p1 == player1) ? player1PrivateKey : (p1 == player2) ? player2PrivateKey : player3PrivateKey;
        uint256 pk2 = (p2 == player1) ? player1PrivateKey : (p2 == player2) ? player2PrivateKey : player3PrivateKey;

        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(pk1, hash);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(pk2, hash);

        chessGame.submitTwoPlayerGame(
            gameId,
            p1,
            p2,
            winner,
            isDraw,
            abi.encodePacked(r1, s1, v1),
            abi.encodePacked(r2, s2, v2)
        );
    }
}

