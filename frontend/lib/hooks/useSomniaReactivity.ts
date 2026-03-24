import { useEffect } from 'react';
import { createPublicClient, http, decodeEventLog, encodeFunctionData, parseAbi } from 'viem';
import { somniaTestnet } from '../wagmi';
import { SDK } from '@somnia-chain/reactivity';

interface SomniaFarmingEvent {
  type: 'Harvested' | 'Sold' | 'FarmExpanded' | 'AnimalBought';
  user: string;
  details: {
    animalId?: bigint;
    animalType?: number;
    amount?: bigint;
    price?: bigint;
    slots?: bigint;
  };
}

const FARM_ENGINE_ADDRESS = '0x016338acec43720e4444e3c86340ac83567ef7e8';

const MINIMAL_ABI = parseAbi([
  "function maxSlots(address user) view returns (uint256)",
  "function getUserAnimals(address user) view returns (uint256[])",
  "function userInventory(address user, uint8 animalType) view returns (uint256)",
  "event Harvested(address indexed user, uint256 animalId, uint8 animalType, uint256 amount)",
  "event FarmExpanded(address indexed user, uint256 newMaxSlots)",
  "event AnimalBought(address indexed user, uint8 animalType, uint256 tokenId)"
]);

export function useSomniaReactivity(userAddress: string | null, onEvent: (event: SomniaFarmingEvent) => void) {
  useEffect(() => {
    if (!userAddress) return;

    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http()
    });
    const sdk = new SDK({ public: publicClient });

    let subscription: any;

    const initSubscription = async () => {
      try {
        // Pre-calculate ethCalls for inventory and slots
        const inventoryCalls = [0, 1, 2, 3, 4, 5].map(type => ({
          to: FARM_ENGINE_ADDRESS as `0x${string}`,
          data: encodeFunctionData({
            abi: MINIMAL_ABI,
            functionName: 'userInventory',
            args: [userAddress as `0x${string}`, type]
          })
        }));

        const slotCalls = [
          {
            to: FARM_ENGINE_ADDRESS as `0x${string}`,
            data: encodeFunctionData({
              abi: MINIMAL_ABI,
              functionName: 'maxSlots',
              args: [userAddress as `0x${string}`]
            })
          },
          {
            to: FARM_ENGINE_ADDRESS as `0x${string}`,
            data: encodeFunctionData({
              abi: MINIMAL_ABI,
              functionName: 'getUserAnimals',
              args: [userAddress as `0x${string}`]
            })
          }
        ];

        subscription = await sdk.subscribe({
          eventContractSources: [FARM_ENGINE_ADDRESS],
          ethCalls: [...slotCalls, ...inventoryCalls],
          onlyPushChanges: true,
          onData: (data: any) => {
            try {
              const { topics, data: eventData } = data.result;
              
              const decoded = decodeEventLog({
                abi: MINIMAL_ABI,
                data: eventData,
                topics: topics
              });

              if (decoded.eventName === 'Harvested') {
                const args = decoded.args as any;
                if (args.user.toLowerCase() === userAddress.toLowerCase()) {
                  onEvent({
                    type: 'Harvested',
                    user: args.user,
                    details: {
                      animalId: args.animalId,
                      animalType: args.animalType,
                      amount: args.amount
                    }
                  });
                }
              } else if (decoded.eventName === 'FarmExpanded') {
                const args = decoded.args as any;
                if (args.user.toLowerCase() === userAddress.toLowerCase()) {
                  onEvent({
                    type: 'FarmExpanded',
                    user: args.user,
                    details: {
                      slots: args.newMaxSlots
                    }
                  });
                }
              } else if (decoded.eventName === 'AnimalBought') {
                const args = decoded.args as any;
                if (args.user.toLowerCase() === userAddress.toLowerCase()) {
                  onEvent({
                    type: 'AnimalBought',
                    user: args.user,
                    details: {
                      animalId: args.tokenId,
                      animalType: args.animalType
                    }
                  });
                }
              }
            } catch (err) {
              // Silently catch decoding errors for unrelated events
            }
          },
          onError: (err: any) => {
            console.error('Somnia Reactivity Subscription Error:', err);
          }
        });
        console.log('✅ Connected to Somnia Network Reactivity (V2 Standard SDK)');
      } catch (err: any) {
        console.error('❌ Failed to initialize Somnia Reactivity:', err.message);
      }
    };

    initSubscription();

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [userAddress, onEvent]);
}
