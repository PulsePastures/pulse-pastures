"use client";

import { useEffect } from 'react';
import { createPublicClient, http, keccak256, toHex, decodeEventLog } from 'viem';
import { somniaTestnet } from '../wagmi';
import { SDK } from '@somnia-chain/reactivity';

/**
 * PulsePastures Reactivity Event Schema
 */
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

const FARM_ENGINE_ABI = [
  "event Harvested(address indexed user, uint256 animalId, uint8 animalType, uint256 amount)",
  "event Sold(address indexed user, uint8 animalType, uint256 amount, uint256 totalPrice)",
  "event FarmExpanded(address indexed user, uint256 newMaxSlots)",
  "event AnimalBought(address indexed user, uint8 animalType, uint256 tokenId)"
] as const;

const FARM_ENGINE_ADDRESS = '0x98F4C21281Bc268d439A667C8A07b94FF9f999e9';

// MultiCall3 address on Somnia Testnet if available, or just direct calls
// For now, we'll use direct calls in ethCalls

/**
 * useSomniaReactivity Hook
 * Formal integration with @somnia-chain/streams SDK
 */
export function useSomniaReactivity(userAddress: string | null, onEvent: (event: SomniaFarmingEvent) => void) {
  useEffect(() => {
    if (!userAddress) return;

    // Initialize the official Somnia Reactivity SDK
    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http()
    });
    const sdk = new SDK({ public: publicClient });

    let subscription: any;

    const initSubscription = async () => {
      try {
        subscription = await sdk.subscribe({
          eventContractSources: [FARM_ENGINE_ADDRESS],
          // Advanced: Bundle state queries with the event
          ethCalls: [
            {
              to: FARM_ENGINE_ADDRESS,
              // usedSlots(address) selector: 0x82f4e0c4
              data: `0x82f4e0c4000000000000000000000000${userAddress.slice(2).padStart(64, '0')}`
            },
            {
              to: FARM_ENGINE_ADDRESS,
              // maxSlots(address) selector: 0xcd199b41
              data: `0xcd199b41000000000000000000000000${userAddress.slice(2).padStart(64, '0')}`
            }
          ],
          onlyPushChanges: true,
          onData: (data: any) => {
            try {
              const { topics, data: eventData, simulationResults } = data.result;
              
              // simulationResults contains the results of ethCalls in order
              const usedSlotsResult = simulationResults[0];
              const maxSlotsResult = simulationResults[1];

              const decoded = decodeEventLog({
                abi: [
                  { type: 'event', name: 'Harvested', inputs: [{ indexed: true, name: 'user', type: 'address' }, { name: 'animalId', type: 'uint256' }, { name: 'animalType', type: 'uint8' }, { name: 'amount', type: 'uint256' }] },
                  { type: 'event', name: 'Sold', inputs: [{ indexed: true, name: 'user', type: 'address' }, { name: 'animalType', type: 'uint8' }, { name: 'amount', type: 'uint256' }, { name: 'totalPrice', type: 'uint256' }] },
                  { type: 'event', name: 'FarmExpanded', inputs: [{ indexed: true, name: 'user', type: 'address' }, { name: 'newMaxSlots', type: 'uint256' }] },
                  { type: 'event', name: 'AnimalBought', inputs: [{ indexed: true, name: 'user', type: 'address' }, { name: 'animalType', type: 'uint8' }, { name: 'tokenId', type: 'uint256' }] }
                ],
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
              } else if (decoded.eventName === 'Sold') {
                const args = decoded.args as any;
                if (args.user.toLowerCase() === userAddress.toLowerCase()) {
                  onEvent({
                    type: 'Sold',
                    user: args.user,
                    details: {
                      animalType: args.animalType,
                      amount: args.amount,
                      price: args.totalPrice
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
              console.error('Error decoding Somnia reactivity event', err);
            }
          },
          onError: (err: any) => {
            console.error('Somnia Reactivity Subscription Error:', err);
          }
        });
        console.log('Connected to Somnia Network Reactivity via SDK');
      } catch (err) {
        console.error('Failed to initialize Somnia Reactivity', err);
      }
    };

    initSubscription();

    return () => {
      // Re-check how to unsubscribe in SDK, usually it's subscription.unsubscribe() or similar
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [userAddress, onEvent]);
}
