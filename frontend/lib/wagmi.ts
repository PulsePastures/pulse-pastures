import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { fallback, http } from 'wagmi';
import { base } from 'viem/chains';
import '@rainbow-me/rainbowkit/styles.css';

const baseRpc = 'https://mainnet.base.org';
const secondaryRpc = 'https://base.llamarpc.com';

export const config = getDefaultConfig({
  appName: 'PulsePastures',
  projectId: '311985c54daed1c77700911a8741dcd2',
  chains: [base],
  transports: {
    [base.id]: fallback([
        http(secondaryRpc),
        http(baseRpc),
        http('https://base.gateway.tenderly.co')
    ]),
  },
  ssr: true,
});
