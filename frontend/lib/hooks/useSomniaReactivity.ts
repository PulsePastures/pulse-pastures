"use client";

import { useEffect, useState } from 'react';

interface SomniaEvent {
  battleId: string;
  attacker: string;
  damage: number;
  remainingHp: number;
}

export function useSomniaReactivity(battleId: string | null, onEvent: (event: SomniaEvent) => void) {
  useEffect(() => {
    if (!battleId) return;

    // Somnia Reactivity WebSocket Endpoint (Mock for Testnet)
    // In production, this would be: wss://testnet.somnia.network/reactivity
    const ws = new WebSocket('wss://testnet.somnia.network/reactivity');

    ws.onopen = () => {
      console.log('Connected to Somnia Reactivity');
      // Subscribe to the specific battle events
      ws.send(JSON.stringify({
        type: 'subscribe',
        contract: process.env.NEXT_PUBLIC_ARENA_CONTRACT,
        topics: ['TurnResolved'],
        filters: { battleId }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.topic === 'TurnResolved') {
          onEvent({
            battleId: data.args.battleId,
            attacker: data.args.attacker,
            damage: data.args.damage,
            remainingHp: data.args.remainingHp
          });
        }
      } catch (err) {
        console.error('Error parsing Somnia event', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [battleId, onEvent]);
}
