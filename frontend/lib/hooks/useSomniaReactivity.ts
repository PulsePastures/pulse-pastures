"use client";

import { useEffect } from 'react';

/**
 * Somnia Reactivity Event Interface for PulsePastures
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
 * Listens to on-chain events via Somnia's Reactivity Layer (WebSocket)
 */
export function useSomniaReactivity(userAddress: string | null, onEvent: (event: SomniaFarmingEvent) => void) {
  useEffect(() => {
    if (!userAddress) return;

    // Official Somnia Reactivity WebSocket Endpoint
    const ws = new WebSocket('wss://dream-rpc.somnia.network/ws');

    ws.onopen = () => {
      console.log('Connected to Somnia Network Reactivity');
      
      // Subscribe to FarmEngine events for the current user
      ws.send(JSON.stringify({
        type: 'subscribe',
        contract: '0xD313Cc9526A966131ecaa9a7A70B648542ac2D96', // FarmEngine Address
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
