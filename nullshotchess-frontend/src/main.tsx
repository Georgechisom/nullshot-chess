import { createRoot } from "react-dom/client";
import { ThirdwebProvider } from "thirdweb/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import App from "./App.tsx";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";
import { liskSepolia } from "./contracts/chains";

// Create Wagmi config
const config = getDefaultConfig({
  appName: "NullShot Chess",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [liskSepolia],
  ssr: false,
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#D4AF37",
          accentColorForeground: "black",
          borderRadius: "medium",
          fontStack: "system",
        })}
        modalSize="compact"
        showRecentTransactions={true}
      >
        <ThirdwebProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1A1A1A",
                color: "#fff",
                border: "1px solid #D4AF37",
              },
            }}
          />
        </ThirdwebProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
