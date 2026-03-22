import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';

export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'SomniaScan', url: 'https://shannon-explorer.somnia.network' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'PulsePastures',
  projectId: '311985c54daed1c77700911a8741dcd2', // Example project ID
  chains: [somniaTestnet],
  transports: {
    [somniaTestnet.id]: http(),
  },
  ssr: true,
});
