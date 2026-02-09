import { defineChain } from "viem";

const gnosis = defineChain({
  id: 100,
  name: "Gnosis",
  nativeCurrency: { decimals: 18, name: "xDAI", symbol: "XDAI" },
  rpcUrls: { default: { http: ["https://rpc.gnosischain.com"] } },
  blockExplorers: {
    default: { name: "Gnosisscan", url: "https://gnosisscan.io" },
  },
});

const sepolia = defineChain({
  id: 11_155_111,
  name: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.sepolia.org"] } },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
});

export { gnosis, sepolia };
