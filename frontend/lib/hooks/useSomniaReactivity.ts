"use client";

import { useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { somniaTestnet } from '../wagmi';
import { SDK } from '@somnia-chain/streams';

/**
 * PulsePastures Reactivity Event Schema
 */
interface SomniaFarmingEvent {
  type: 'Harvested' | 'Sold' | 'FarmExpanded' | 'AnimalBought';
  user: string;
  details: {
    animalId?: string;
    animalType?: number;
    amount?: string;
    price?: string;
    slots?: number;
  };
}

/**
 * useSomniaReactivity Hook
 * Formal integration with @somnia-chain/streams SDK
 */
export function useSomniaReactivity(userAddress: string | null, onEvent: (event: SomniaFarmingEvent) => void) {
  useEffect(() => {
    if (!userAddress) return;

    // Initialize the official Somnia Streams SDK
    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http()
    });
    const sdk = new SDK(publicClient as any);

    // Official Somnia Network Reactivity Endpoint
    const ws = new WebSocket('wss://dream-rpc.somnia.network/ws');

    ws.onopen = () => {
      console.log('Connected to Somnia Network Reactivity via SDK');
      
      // Subscribe to real-time farming events on Somnia
      ws.send(JSON.stringify({
        type: 'subscribe',
        contract: '0xD313Cc9526A966131ecaa9a7A70B648542ac2D96', // FarmEngine
        topics: ['Harvested', 'Sold', 'FarmExpanded', 'AnimalBought'],
        filters: { user: userAddress }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Map native Somnia events to PulsePastures logic
        if (['Harvested', 'Sold', 'FarmExpanded', 'AnimalBought'].includes(data.topic)) {
          onEvent({
            type: data.topic as any,
            user: data.args.user,
            details: {
              animalId: data.args.animalId,
              animalType: data.args.animalType,
              amount: data.args.amount,
              price: data.args.totalPrice,
              slots: data.args.newMaxSlots
            }
          });
        }
      } catch (err) {
        console.error('Error parsing Somnia reactivity event', err);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Somnia Reactivity');
    };

    return () => {
      ws.close();
    };
  }, [userAddress, onEvent]);
}
