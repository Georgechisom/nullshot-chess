import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { usePublicClient, useWriteContract } from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { getContractEvents } from "thirdweb";
import { parseAbiItem } from "viem";

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

const DEPLOYMENT_BLOCK = 29176013;

export const TotalGamesStats = () => {
  const contract = useChessGameContract();
  const publicClient = usePublicClient({ chainId: liskSepolia.id });
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    if (!publicClient || !contract.address) {
      setIsLoading(false);
      return;
    }

    try {
      const logs = await publicClient.getLogs({
        address: contract.address as `0x${string}`,
        event: parseAbiItem(
          "event GameSubmitted(string indexed gameId, address indexed player1, address indexed player2, address winner, bool isAIGame, bool isDraw, uint256 timestamp)"
        ),
        fromBlock: BigInt(DEPLOYMENT_BLOCK),
        toBlock: "latest",
      });
      setEvents(logs);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [publicClient, contract.address]);

  const totalGamesPlayedByEveryone = useMemo(
    () => events?.length ?? 0,
    [events]
  );

  return {
    totalGamesPlayedByEveryone,
    isLoading,
    error,
    events,
    refetchEvents: fetchEvents,
  };
};
