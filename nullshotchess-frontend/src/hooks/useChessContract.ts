import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { usePublicClient, useWriteContract } from "wagmi";
import { useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import {
  prepareContractCall,
  sendTransaction as useSendTransaction,
} from "thirdweb";

const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "",
});

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as string;

// Define Lisk Sepolia chain with RPC
const liskSepolia = defineChain({
  id: 4202,
  rpc: "https://rpc.sepolia-api.lisk.com",
});

export const useChessGameContract = () => {
  return getContract({
    client,
    chain: liskSepolia,
    address: contractAddress,
  });
};

export const useGetNonce = (playerAddress?: string) => {
  const contract = useChessGameContract();

  return useReadContract({
    contract,
    method: "function getNonce(address player) view returns (uint256)",
    params: playerAddress ? [playerAddress] : undefined,
  });
};

export const useGetWins = (playerAddress?: string) => {
  const contract = useChessGameContract();

  return useReadContract({
    contract,
    method: "function getWins(address player) view returns (uint256)",
    params: playerAddress ? [playerAddress] : undefined,
  });
};

export const useGetLosses = (playerAddress?: string) => {
  const contract = useChessGameContract();

  return useReadContract({
    contract,
    method: "function getLosses(address player) view returns (uint256)",
    params: playerAddress ? [playerAddress] : undefined,
  });
};

export const useGetDraws = (playerAddress?: string) => {
  const contract = useChessGameContract();

  return useReadContract({
    contract,
    method: "function getDraws(address player) view returns (uint256)",
    params: playerAddress ? [playerAddress] : undefined,
  });
};

export const useGetGamesPlayed = (playerAddress?: string) => {
  const contract = useChessGameContract();

  return useReadContract({
    contract,
    method: "function getGamesPlayed(address player) view returns (uint256)",
    params: playerAddress ? [playerAddress] : undefined,
  });
};

export const useGetWinners = () => {
  const contract = useChessGameContract();

  return useReadContract({
    contract,
    method: "function getWinners() view returns (address[])",
    params: [],
  });
};

export const useGetNFTBalance = (playerAddress?: string) => {
  const contract = useChessGameContract();

  return useReadContract({
    contract,
    method: "function balanceOf(address owner) view returns (uint256)",
    params: playerAddress ? [playerAddress] : undefined,
  });
};

export const useSubmitAIGame = () => {
  const { writeContractAsync } = useWriteContract();

  const submitAIGame = async ({
    args,
  }: {
    args: [string, `0x${string}`, boolean, boolean, `0x${string}`];
  }) => {
    const hash = await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: [
        {
          name: "submitAIGame",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "gameId", type: "string" },
            { name: "humanPlayer", type: "address" },
            { name: "humanWon", type: "bool" },
            { name: "isDraw", type: "bool" },
            { name: "signature", type: "bytes" },
          ],
          outputs: [],
        },
      ] as const,
      functionName: "submitAIGame",
      args,
    });

    return { transactionHash: hash };
  };

  return { mutateAsync: submitAIGame };
};

export const useSubmitTwoPlayerGame = () => {
  const contract = useChessGameContract();
  const { mutateAsync: sendTransactionAsync } = useSendTransaction();

  const submitTwoPlayerGame = async ({
    args,
  }: {
    args: [
      string,
      `0x${string}`,
      `0x${string}`,
      `0x${string}`,
      boolean,
      `0x${string}`,
      `0x${string}`
    ];
  }) => {
    const transaction = prepareContractCall({
      contract,
      method:
        "function submitTwoPlayerGame(string memory gameId, address player1, address player2, address winner, bool isDraw, bytes memory signature1, bytes memory signature2) external",
      params: args,
    });

    return sendTransactionAsync(transaction);
  };

  return { mutateAsync: submitTwoPlayerGame };
};

export const useMintNFT = () => {
  const { writeContractAsync } = useWriteContract();

  const mintNFT = async () => {
    const hash = await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: [
        {
          name: "mintNFT",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [],
          outputs: [],
        },
      ] as const,
      functionName: "mintNFT",
      args: [],
    });

    return { transactionHash: hash };
  };

  return { mutateAsync: mintNFT };
};

const DEPLOYMENT_BLOCK = 29176013n;
const MAX_BLOCK_RANGE = 99000n; // Lisk RPC limit is 100k, using 99k to be safe

export const TotalGamesStats = () => {
  const contract = useChessGameContract();
  const publicClient = usePublicClient({ chainId: liskSepolia.id });
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalGames, setTotalGames] = useState(0);

  const fetchEvents = async () => {
    console.log("🔍 Starting fetchEvents...");
    setIsLoading(true);
    setError(null);

    if (!publicClient) {
      console.error("❌ No publicClient available");
      setIsLoading(false);
      return;
    }

    if (!contract.address) {
      console.error("❌ No contract address");
      setIsLoading(false);
      return;
    }

    try {
      console.log("📡 Fetching current block number...");
      const currentBlock = await publicClient.getBlockNumber();
      console.log("Current block:", currentBlock.toString());
      console.log("Deployment block:", DEPLOYMENT_BLOCK.toString());
      console.log("Contract Address:", contract.address);

      // Calculate number of chunks needed
      const totalBlocks = currentBlock - DEPLOYMENT_BLOCK;
      const numChunks = Math.ceil(
        Number(totalBlocks) / Number(MAX_BLOCK_RANGE)
      );
      console.log(`📦 Fetching ${numChunks} chunks of logs...`);

      const allLogs: any[] = [];

      // Fetch logs in chunks
      for (let i = 0; i < numChunks; i++) {
        const fromBlock = DEPLOYMENT_BLOCK + BigInt(i) * MAX_BLOCK_RANGE;
        const toBlock =
          i === numChunks - 1
            ? currentBlock
            : DEPLOYMENT_BLOCK + BigInt(i + 1) * MAX_BLOCK_RANGE - 1n;

        console.log(
          `Fetching chunk ${
            i + 1
          }/${numChunks}: blocks ${fromBlock.toString()} to ${toBlock.toString()}`
        );

        const logs = await publicClient.getLogs({
          address: contract.address as `0x${string}`,
          event: parseAbiItem(
            "event GameSubmitted(string indexed gameId, address indexed player1, address indexed player2, address winner, bool isAIGame, bool isDraw, uint256 timestamp)"
          ),
          fromBlock,
          toBlock,
        });

        console.log(`✅ Chunk ${i + 1} fetched: ${logs.length} events`);
        allLogs.push(...logs);
      }

      console.log("✅ Total logs fetched:", allLogs.length);
      console.log("Sample events:", allLogs.slice(0, 2));

      setEvents(allLogs);
      setTotalGames(allLogs.length);
    } catch (err) {
      console.error("❌ Error fetching events:", err);
      setError(err as Error);
      setEvents([]);
      setTotalGames(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("🚀 TotalGamesStats hook mounted");
    if (publicClient && contract.address) {
      fetchEvents();
    } else {
      console.warn("⚠️ Waiting for publicClient or contract address...");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, contract.address]);

  return {
    totalGamesPlayedByEveryone: totalGames,
    isLoading,
    error,
    events,
    refetchEvents: fetchEvents,
  };
};
