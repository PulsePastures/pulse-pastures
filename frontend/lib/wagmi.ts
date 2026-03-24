import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';

export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { 
      http: ['https://api.infra.testnet.somnia.network'],
      webSocket: ['wss://api.infra.testnet.somnia.network/ws']
    },
  },
  blockExplorers: {
    default: { name: 'SomniaScan', url: 'https://shannon-explorer.somnia.network' },
  },
  testnet: true,
});

export const somniaMainnet = defineChain({
  id: 50313, // Standard ID if known, using placeholder if same as reported
  name: 'Somnia Mainnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.infra.mainnet.somnia.network/'] },
  },
  blockExplorers: {
    default: { name: 'SomniaScan', url: 'https://explorer.somnia.network' },
  },
  testnet: false,
});

export const config = getDefaultConfig({
  appName: 'PulsePastures',
  projectId: '311985c54daed1c77700911a8741dcd2', // Example project ID
  chains: [somniaMainnet, somniaTestnet],
  transports: {
    [somniaMainnet.id]: http(),
    [somniaTestnet.id]: http(),
  },
  ssr: true,
});
