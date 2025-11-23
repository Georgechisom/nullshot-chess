import { defineChain } from "viem";

export const liskSepolia = defineChain({
  id: 4202,
  name: "Lisk Sepolia Testnet",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_RPC_URL || "https://rpc.sepolia-api.lisk.com",
      ],
    },
    public: {
      http: [
        import.meta.env.VITE_RPC_URL || "https://rpc.sepolia-api.lisk.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://sepolia-blockscout.lisk.com",
    },
  },
  testnet: true,
});
