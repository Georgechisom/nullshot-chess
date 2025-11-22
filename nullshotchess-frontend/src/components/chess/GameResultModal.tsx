import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, X, Minus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useAccount,
  useSignTypedData,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useGetNonce, useSubmitAIGame } from "@/hooks/useChessContract";
import { EIP712_DOMAIN, EIP712_TYPES } from "@/contracts/ChessGameABI";
import { v4 as uuidv4 } from "uuid";

interface GameResultModalProps {
  isOpen: boolean;
  result: "win" | "loss" | "draw" | null;
  onClose: () => void;
  playerSide: "white" | "black";
  gameId?: string;
}

const GameResultModal = ({
  isOpen,
  result,
  onClose,
  playerSide,
  gameId,
}: GameResultModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: nonce } = useGetNonce(address);
  const { signTypedDataAsync } = useSignTypedData();
  const { mutateAsync: submitAIGame } = useSubmitAIGame();

  const getResultInfo = () => {
    switch (result) {
      case "win":
        return {
          title: "🎉 Victory!",
          message: "Congratulations! You defeated NullShot AI!",
          color: "text-gold",
          bgColor: "bg-gold/20",
          borderColor: "border-gold",
        };
      case "loss":
        return {
          title: "💀 Defeat",
          message: "NullShot AI has defeated you. Better luck next time!",
          color: "text-red-500",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500",
        };
      case "draw":
        return {
          title: "🤝 Draw",
          message: "The game ended in a draw. Well played!",
          color: "text-blue-500",
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-500",
        };
      default:
        return {
          title: "",
          message: "",
          color: "",
          bgColor: "",
          borderColor: "",
        };
    }
  };

  const handleSubmitResult = async () => {
    console.log("🎮 Starting game submission...");
    console.log("Wallet connected:", isConnected);
    console.log("Wallet address:", address);
    console.log("Nonce:", nonce);

    if (!isConnected || !address) {
      toast.error("❌ Please connect your wallet first");
      console.error("Wallet not connected!");
      return;
    }

    if (nonce === undefined) {
      toast.error("❌ Unable to fetch nonce. Please refresh and try again.");
      console.error("Nonce is undefined!");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Preparing transaction...");

    try {
      const finalGameId = gameId || uuidv4();

      // Determine winner and draw status
      let humanWon = false;
      let isDraw = false;

      if (result === "win") {
        humanWon = true;
        isDraw = false;
      } else if (result === "draw") {
        humanWon = false;
        isDraw = true;
      } else {
        // loss
        humanWon = false;
        isDraw = false;
      }

      // Determine winner address
      // - Draw: address(0)
      // - Human wins: human address
      // - AI wins: contract address (this is how the contract expects it)
      const contractAddress = import.meta.env
        .VITE_CONTRACT_ADDRESS as `0x${string}`;
      const winner = isDraw
        ? ("0x0000000000000000000000000000000000000000" as `0x${string}`)
        : humanWon
        ? (address as `0x${string}`)
        : contractAddress; // AI wins = contract address

      // Create message for EIP-712 signing
      const message = {
        gameId: finalGameId,
        player1: address as `0x${string}`,
        player2: "0x0000000000000000000000000000000000000000" as `0x${string}`, // AI address
        winner,
        isDraw,
        nonce: BigInt(nonce),
      };

      console.log("📝 EIP-712 Domain:", EIP712_DOMAIN);
      console.log("📝 EIP-712 Types:", EIP712_TYPES);
      console.log("📝 Message to sign:", message);

      toast.loading("Please sign the transaction in your wallet...", {
        id: toastId,
      });

      // Sign with EIP-712
      const signature = await signTypedDataAsync({
        account: address as `0x${string}`,
        domain: EIP712_DOMAIN,
        types: EIP712_TYPES,
        primaryType: "GameResult",
        message,
      });

      console.log("✅ Signature obtained:", signature);

      toast.loading("Submitting to blockchain...", { id: toastId });

      // Submit to contract
      const txResult = await submitAIGame({
        args: [finalGameId, address, humanWon, isDraw, signature],
      });

      console.log("✅ Transaction submitted:", txResult);
      console.log("Transaction hash:", txResult.transactionHash);

      if (!txResult.transactionHash) {
        throw new Error(
          "Transaction hash not returned. Please check your wallet and try again."
        );
      }

      // Show success with transaction hash
      const txHash = txResult.transactionHash;
      const explorerUrl = `https://sepolia-blockscout.lisk.com/tx/${txHash}`;

      toast.success(
        `✅ Transaction submitted! Hash: ${txHash.slice(0, 10)}...`,
        { id: toastId, duration: 8000 }
      );

      console.log("🔗 View on Explorer:", explorerUrl);

      // Show clickable link in a separate toast
      toast.success(
        <div>
          <p className="font-semibold mb-1">View on Block Explorer:</p>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs break-all"
          >
            {explorerUrl}
          </a>
        </div>,
        { duration: 15000 }
      );

      // Wait a bit before redirecting
      setTimeout(() => {
        navigate("/leaderboard", { state: { refresh: true } });
      }, 3000);
    } catch (error: unknown) {
      console.error("❌ Blockchain submission error:", error);

      let errorMessage = "Failed to submit result. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else if (typeof error === "object" && error !== null) {
        const err = error as {
          reason?: string;
          message?: string;
          code?: string;
        };
        errorMessage = err.reason || err.message || errorMessage;
        console.error("Error details:", err);
      }

      // Check for specific error types
      if (
        errorMessage.includes("user rejected") ||
        errorMessage.includes("User rejected")
      ) {
        errorMessage = "❌ Transaction rejected by user";
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage = "❌ Insufficient funds for gas";
      } else if (errorMessage.includes("nonce")) {
        errorMessage = "❌ Nonce error. Please refresh and try again.";
      }

      toast.error(errorMessage, { id: toastId, duration: 8000 });
      setIsSubmitting(false);
    }
  };

  const info = getResultInfo();

  return (
    <AnimatePresence>
      {isOpen && result && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={`bg-card border-2 ${info.borderColor} rounded-2xl rounded-tl-none shadow-2xl max-w-md w-full p-8`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div
                className={`${info.bgColor} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6`}
              >
                {result === "win" && (
                  <Trophy className={`w-10 h-10 ${info.color}`} />
                )}
                {result === "loss" && (
                  <X className={`w-10 h-10 ${info.color}`} />
                )}
                {result === "draw" && (
                  <Minus className={`w-10 h-10 ${info.color}`} />
                )}
              </div>

              {/* Title */}
              <h2
                className={`text-3xl font-bold text-center mb-4 ${info.color}`}
              >
                {info.title}
              </h2>

              {/* Message */}
              <p className="text-center text-muted-foreground mb-6">
                {info.message}
              </p>

              {/* Player Info */}
              <div className="bg-background rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    You played as:
                  </span>
                  <span className="font-semibold capitalize">
                    {playerSide === "white" ? "♔ White" : "♚ Black"}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                <Button
                  onClick={handleSubmitResult}
                  className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit to Blockchain"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GameResultModal;
