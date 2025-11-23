// Example Arena.tsx Integration
// This is a reference implementation showing how to integrate all the pieces

import { useState, useEffect } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getMCPClient } from '../services/mcpClient';
import { useGetNonce, useSubmitAIGame } from '../hooks/useChessContract';
import { EIP712_DOMAIN, EIP712_TYPES } from '../contracts/ChessGameABI';

export default function Arena() {
  const { address, isConnected } = useAccount();
  const [game, setGame] = useState(new Chess());
  const [gameId] = useState(uuidv4());
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [mcpClient] = useState(() => getMCPClient());

  // Contract hooks
  const { data: nonce, refetch: refetchNonce } = useGetNonce(address);
  const { signTypedDataAsync } = useSignTypedData();
  const { mutateAsync: submitAIGame, isPending: isSubmitting } = useSubmitAIGame();

  // Connect to MCP server on mount
  useEffect(() => {
    if (!mcpClient.isConnected()) {
      mcpClient.connect().catch((error) => {
        console.error('Failed to connect to MCP server:', error);
        toast.error('Failed to connect to AI server');
      });
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, [mcpClient]);

  // Make AI move
  const makeAIMove = async () => {
    if (game.isGameOver() || isAIThinking) return;

    setIsAIThinking(true);
    try {
      const fen = game.fen();
      const aiMove = await mcpClient.getAIMove(fen, 'black');
      
      const newGame = new Chess(game.fen());
      newGame.move(aiMove.move);
      setGame(newGame);

      // Check if game is over after AI move
      if (newGame.isGameOver()) {
        handleGameOver(newGame);
      }
    } catch (error) {
      console.error('AI move error:', error);
      toast.error('AI failed to make a move');
    } finally {
      setIsAIThinking(false);
    }
  };

  // Handle player move
  const handlePlayerMove = (move: string) => {
    try {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      setGame(newGame);

      // Check if game is over after player move
      if (newGame.isGameOver()) {
        handleGameOver(newGame);
      } else {
        // AI's turn
        setTimeout(() => makeAIMove(), 500);
      }
    } catch (error) {
      console.error('Invalid move:', error);
      toast.error('Invalid move');
    }
  };

  // Handle game over
  const handleGameOver = (finalGame: Chess) => {
    setGameOver(true);

    const isCheckmate = finalGame.isCheckmate();
    const isDraw = finalGame.isDraw() || finalGame.isStalemate() || finalGame.isThreefoldRepetition();
    
    let humanWon = false;
    if (isCheckmate) {
      // If it's checkmate, the current turn is the loser
      humanWon = finalGame.turn() === 'b'; // If it's black's turn, white (human) won
    }

    // Show result
    if (isDraw) {
      toast('Game ended in a draw!', { icon: '🤝' });
    } else if (humanWon) {
      toast.success('Congratulations! You won! 🎉');
    } else {
      toast.error('AI wins! Better luck next time.');
    }

    // Submit to blockchain if wallet is connected
    if (isConnected && address) {
      submitGameResult(humanWon, isDraw);
    }
  };

  // Submit game result to blockchain
  const submitGameResult = async (humanWon: boolean, isDraw: boolean) => {
    if (!address || nonce === undefined) {
      toast.error('Please connect your wallet to submit results');
      return;
    }

    try {
      toast.loading('Preparing transaction...', { id: 'submit' });

      // Create message for signing
      const message = {
        gameId,
        player1: address,
        player2: '0x0000000000000000000000000000000000000000', // AI address
        winner: humanWon ? address : '0x0000000000000000000000000000000000000000',
        isDraw,
        nonce,
      };

      // Sign with EIP-712
      const signature = await signTypedDataAsync({
        domain: EIP712_DOMAIN,
        types: EIP712_TYPES,
        primaryType: 'GameResult',
        message,
      });

      toast.loading('Submitting to blockchain...', { id: 'submit' });

      // Submit to contract
      await submitAIGame({
        args: [gameId, address, humanWon, isDraw, signature],
      });

      toast.success('Game result submitted! NFT minted! 🎉', { id: 'submit' });
      
      // Refetch nonce for next game
      refetchNonce();
    } catch (error: any) {
      console.error('Error submitting game:', error);
      toast.error(error?.message || 'Failed to submit game result', { id: 'submit' });
    }
  };

  // Reset game
  const resetGame = () => {
    setGame(new Chess());
    setGameOver(false);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-8">NullShot Chess Arena</h1>
        <p className="text-xl mb-8">Connect your wallet to play against the AI</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Chess Arena</h1>
        <ConnectButton />
      </div>

      {/* Your existing chess board component here */}
      {/* Pass handlePlayerMove as a callback */}

      <div className="mt-4 flex gap-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Game
        </button>
        
        {gameOver && (
          <button
            onClick={() => submitGameResult(false, true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Result'}
          </button>
        )}
      </div>

      {isAIThinking && (
        <div className="mt-4 text-center">
          <p className="text-lg">AI is thinking...</p>
        </div>
      )}
    </div>
  );
}

