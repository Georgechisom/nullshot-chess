// import { useReadContract } from "thirdweb/react";
// import { getContract } from "thirdweb";
// import { createThirdwebClient } from "thirdweb";
// import { defineChain } from "thirdweb/chains";
// import { useWriteContract } from "wagmi";

// const client = createThirdwebClient({
//   clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "",
// });

// const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as string;

// // Define Lisk Sepolia chain with RPC
// const liskSepolia = defineChain({
//   id: 4202,
//   rpc: "https://rpc.sepolia-api.lisk.com",
// });

// export const useChessGameContract = () => {
//   return getContract({
//     client,
//     chain: liskSepolia,
//     address: contractAddress,
//   });
// };

// export const useGetNonce = (playerAddress?: string) => {
//   const contract = useChessGameContract();

//   return useReadContract({
//     contract,
//     method: "function getNonce(address player) view returns (uint256)",
//     params: playerAddress ? [playerAddress] : undefined,
//   });
// };

// export const useGetWins = (playerAddress?: string) => {
//   const contract = useChessGameContract();

//   return useReadContract({
//     contract,
//     method: "function getWins(address player) view returns (uint256)",
//     params: playerAddress ? [playerAddress] : undefined,
//   });
// };

// export const useGetLosses = (playerAddress?: string) => {
//   const contract = useChessGameContract();

//   return useReadContract({
//     contract,
//     method: "function getLosses(address player) view returns (uint256)",
//     params: playerAddress ? [playerAddress] : undefined,
//   });
// };

// export const useGetDraws = (playerAddress?: string) => {
//   const contract = useChessGameContract();

//   return useReadContract({
//     contract,
//     method: "function getDraws(address player) view returns (uint256)",
//     params: playerAddress ? [playerAddress] : undefined,
//   });
// };

// export const useGetGamesPlayed = (playerAddress?: string) => {
//   const contract = useChessGameContract();

//   return useReadContract({
//     contract,
//     method: "function getGamesPlayed(address player) view returns (uint256)",
//     params: playerAddress ? [playerAddress] : undefined,
//   });
// };

// export const useGetWinners = () => {
//   const contract = useChessGameContract();

//   return useReadContract({
//     contract,
//     method: "function getWinners() view returns (address[])",
//     params: [],
//   });
// };

// export const useSubmitAIGame = () => {
//   const { writeContractAsync } = useWriteContract();

//   const submitAIGame = async ({
//     args,
//   }: {
//     args: [string, `0x${string}`, boolean, boolean, `0x${string}`];
//   }) => {
//     const hash = await writeContractAsync({
//       address: contractAddress as `0x${string}`,
//       abi: [
//         {
//           name: "submitAIGame",
//           type: "function",
//           stateMutability: "nonpayable",
//           inputs: [
//             { name: "gameId", type: "string" },
//             { name: "humanPlayer", type: "address" },
//             { name: "humanWon", type: "bool" },
//             { name: "isDraw", type: "bool" },
//             { name: "signature", type: "bytes" },
//           ],
//           outputs: [],
//         },
//       ] as const,
//       functionName: "submitAIGame",
//       args,
//     });

//     return { transactionHash: hash };
//   };

//   return { mutateAsync: submitAIGame };
// };

// export const useSubmitTwoPlayerGame = () => {
//   const contract = useChessGameContract();
//   const { mutateAsync: sendTransactionAsync } = useSendTransaction();

//   const submitTwoPlayerGame = async ({
//     args,
//   }: {
//     args: [
//       string,
//       `0x${string}`,
//       `0x${string}`,
//       `0x${string}`,
//       boolean,
//       `0x${string}`,
//       `0x${string}`
//     ];
//   }) => {
//     const transaction = prepareContractCall({
//       contract,
//       method:
//         "function submitTwoPlayerGame(string memory gameId, address player1, address player2, address winner, bool isDraw, bytes memory signature1, bytes memory signature2) external",
//       params: args,
//     });

//     return sendTransactionAsync(transaction);
//   };

//   return { mutateAsync: submitTwoPlayerGame };
// };
