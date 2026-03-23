"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Pickaxe, TrendingUp, BarChart3, AlertCircle, Loader2, ShoppingCart, Database, Save, Volume2, VolumeX, ShieldAlert, LayoutGrid, ArrowLeftRight, Github } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts, useBalance } from 'wagmi';
import { parseEther } from 'viem';

// --- CONTRACT ADDRESSES ---
const FARM_ENGINE_ADDRESS = '0xc06f17DED41B859Ad0C2eED82795b5D0A2a83563'; 
const FARM_NFT_ADDRESS = '0xcD4fFAD58B567660A5EcE0408A886dA69a5732E6';
const STT_ADDRESS = '0x8544465B620436dF3029D8eB7330335AeB1f787E';

// --- ABIs ---
const STT_ABI = [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const;
const FARM_ENGINE_ABI = [
  { name: 'buyAnimal', type: 'function', stateMutability: 'payable', inputs: [{ name: 'animalType', type: 'uint8' }], outputs: [] },
  { name: 'levelUpAnimal', type: 'function', stateMutability: 'payable', inputs: [{ name: 'animalId', type: 'uint256' }], outputs: [] },
  { name: 'expandFarm', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] },
  { name: 'harvest', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'animalId', type: 'uint256' }], outputs: [] },
  { name: 'sellProduct', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_type', type: 'uint8' }, { name: '_amount', type: 'uint256' }], outputs: [] },
  { name: 'getUserAnimals', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256[]' }] },
  { name: 'maxSlots', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'userInventory', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }, { name: 'animalType', type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'withdrawSTT', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'withdrawAmount', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_amount', type: 'uint256' }], outputs: [] },
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
] as const;

const ADMIN_WALLET = '0x17A4cFbF526A12324CE6300eD4862A78FE679676';

const FARM_NFT_ABI = [
  { name: 'getAnimal', type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'tuple', components: [{ name: 'animalType', type: 'uint8' }, { name: 'birthTime', type: 'uint256' }, { name: 'productionRate', type: 'uint256' }, { name: 'lastHarvest', type: 'uint256' }, { name: 'level', type: 'uint256' }] }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

const ANIMAL_META: Record<number, { emoji: string; name: string; yield: string; prod: string; price: number; time: string; upgradePrice: number }> = {
  0: { emoji: "🐔", name: "CHICKEN", yield: "LOW", prod: "EGGS", price: 1, time: "1h", upgradePrice: 0.2 },
  1: { emoji: "🐑", name: "SHEEP", yield: "MEDIUM", prod: "MEAT", price: 3, time: "3h", upgradePrice: 0.6 },
  2: { emoji: "🐄", name: "COW", yield: "HIGH", prod: "MILK", price: 5, time: "5h", upgradePrice: 1 },
  3: { emoji: "🐐", name: "GOAT", yield: "MEDIUM", prod: "CHEESE", price: 9, time: "9h", upgradePrice: 1.8 },
  4: { emoji: "🐷", name: "PIG", yield: "HIGH", prod: "BACON", price: 13, time: "13h", upgradePrice: 2.6 },
  5: { emoji: "🐝", name: "BEE", yield: "LOW", prod: "HONEY", price: 16, time: "16h", upgradePrice: 3.2 },
};

const PRODUCT_META = [
  { type: 0, name: 'FRESH EGGS', emoji: '🥚', price: 0.1, sound: 'https://freeanimalsounds.org/wp-content/uploads/2017/07/huehner.mp3' },
  { type: 1, name: 'PRIME MEAT', emoji: '🥩', price: 0.3, sound: 'https://freeanimalsounds.org/wp-content/uploads/2017/07/schafe.mp3' },
  { type: 2, name: 'RAW MILK', emoji: '🥛', price: 0.5, sound: 'https://freeanimalsounds.org/wp-content/uploads/2017/07/Rinder_muh.mp3' },
  { type: 3, name: 'AGED CHEESE', emoji: '🧀', price: 0.9, sound: 'https://freeanimalsounds.org/wp-content/uploads/2017/07/ziege.mp3' },
  { type: 4, name: 'CRISPY BACON', emoji: '🥓', price: 1.3, sound: 'https://freeanimalsounds.org/wp-content/uploads/2017/07/schwein.mp3' },
  { type: 5, name: 'WILD HONEY', emoji: '🍯', price: 1.6, sound: 'https://freeanimalsounds.org/wp-content/uploads/2017/07/bienen.mp3' },
];


interface StoredAnimal {
    type: number;
    timestamp: number;
    txHash?: string;
}

interface StoredState {
    maxSlots: number;
    pendingAnimals: StoredAnimal[];
}

// Custom hook for audio
const useAudio = (isMuted: boolean) => {
    const playSFX = useCallback((src: string) => {
        if (isMuted) return;
        const audio = new Audio(src);
        audio.volume = 1.0;
        audio.play().catch(e => console.error("SFX Error:", e));
        
        // Shorten the effect to 1.5 seconds for a "snappy" feel
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 1500);
    }, [isMuted]);

    const toggleBGM = useCallback((enable: boolean) => {
        const bgm = document.getElementById('bgm-player') as HTMLAudioElement;
        if (!bgm) return;
        
        bgm.volume = 0.8;
        if (enable) {
            bgm.play().catch(e => {
                console.error("BGM Playback Error:", e);
                // Last resort: try playing on any window click
                const recover = () => { bgm.play(); window.removeEventListener('click', recover); };
                window.addEventListener('click', recover);
            });
        } else {
            bgm.pause();
        }
    }, []);

    return { playSFX, toggleBGM };
};

export default function FarmPage() {
  const { address: userAddress, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'farm' | 'market'>('farm');
  const [marketSubTab, setMarketSubTab] = useState<'animals' | 'products'>('animals');
  
  // Persistence States
  const [localMax, setLocalMax] = useState<number>(0);
  const [localPending, setLocalPending] = useState<StoredAnimal[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const { playSFX } = useAudio(isMuted);

  // v3.0 Feedback States
  const [floatingTexts, setFloatingTexts] = useState<{ id: number, text: string, x: number, y: number }[]>([]);

  const addFloatingText = (text: string, x: number, y: number) => {
    const id = Date.now();
    setFloatingTexts(prev => [...prev, { id, text, x, y }]);
  };

  // Hardened YouTube BGM + MediaSession Suppression (Stealth Mode)
  useEffect(() => {
    // Initial active MediaSession Suppression (Hides the browser media card)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: ' ', 
            artist: ' ',
            artwork: []
        });
        const actions: MediaSessionAction[] = ['play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack'];
        actions.forEach(action => {
            try { navigator.mediaSession.setActionHandler(action, null); } catch(e) {}
        });
    }

    const activeRescue = () => {
        if (!isMuted) {
            const iframe = document.getElementById('bgm-iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
                // Post command to play unmuted
                iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
            }
        }
        window.removeEventListener('click', activeRescue);
        window.removeEventListener('touchstart', activeRescue);
    };

    window.addEventListener('click', activeRescue);
    window.addEventListener('touchstart', activeRescue);

    return () => {
        window.removeEventListener('click', activeRescue);
        window.removeEventListener('touchstart', activeRescue);
    };
  }, [isMuted]);

  // Sync mute state with YouTube iframe
  useEffect(() => {
    const iframe = document.getElementById('bgm-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
        if (isMuted) {
            iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
        } else {
            iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
    }
  }, [isMuted]);

  // Load from LocalStorage
  useEffect(() => {
    if (userAddress) {
        const saved = localStorage.getItem(`somnia_farm_${userAddress}`);
        if (saved) {
            const parsed: StoredState = JSON.parse(saved);
            setLocalMax(parsed.maxSlots || 0);
            setLocalPending(parsed.pendingAnimals || []);
        } else {
            setLocalMax(0);
            setLocalPending([]);
        }
    }
  }, [userAddress]);

  // Save to LocalStorage
  const persist = useCallback((max: number, pending: StoredAnimal[]) => {
    if (userAddress) {
        localStorage.setItem(`somnia_farm_${userAddress}`, JSON.stringify({ maxSlots: max, pendingAnimals: pending }));
    }
  }, [userAddress]);

  // --- READS ---
  const { data: maxSlotsRaw, refetch: refetchMax } = useReadContract({
    address: FARM_ENGINE_ADDRESS as `0x${string}`,
    abi: FARM_ENGINE_ABI,
    functionName: 'maxSlots',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 5000 }
  });

  const { data: animalIdsRaw, refetch: refetchIds } = useReadContract({
    address: FARM_ENGINE_ADDRESS as `0x${string}`,
    abi: FARM_ENGINE_ABI,
    functionName: 'getUserAnimals',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 3000 }
  });

  const { data: nftBalance, refetch: refetchBalance } = useReadContract({
    address: FARM_NFT_ADDRESS as `0x${string}`,
    abi: FARM_NFT_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 5000 }
  });

  const { data: allAnimalsDetails } = useReadContracts({
    contracts: (animalIdsRaw as bigint[] || []).map(id => ({
      address: FARM_NFT_ADDRESS as `0x${string}`,
      abi: FARM_NFT_ABI,
      functionName: 'getAnimal',
      args: [id],
    })),
    query: { enabled: Array.isArray(animalIdsRaw) && animalIdsRaw.length > 0 }
  });

  const animalDistribution = useMemo(() => {
    const dist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (allAnimalsDetails) {
        (allAnimalsDetails as any[]).forEach((res) => {
            if (res.status === 'success' && res.result) {
                const data = res.result as any;
                const typeValue = data.animalType !== undefined ? data.animalType : data[0];
                const type = Number(typeValue);
                dist[type] = (dist[type] || 0) + 1;
            }
        });
    }
    return dist;
  }, [allAnimalsDetails]);

  const { data: sttBalance, refetch: refetchStt } = useBalance({ 
    address: userAddress,
    query: { enabled: !!userAddress, refetchInterval: 5000 }
  });

  const refetchAll = () => {
    refetchMax();
    refetchIds();
    refetchBalance();
    refetchStt?.();
  };

  const { data: treasuryBalance, refetch: refetchTreasury } = useBalance({ 
    address: FARM_ENGINE_ADDRESS as `0x${string}`,
    query: { refetchInterval: 5000 }
  });

  const { data: inventoryData } = useReadContracts({
    contracts: PRODUCT_META.map(p => ({
        address: FARM_ENGINE_ADDRESS as `0x${string}`,
        abi: FARM_ENGINE_ABI,
        functionName: 'userInventory',
        args: [userAddress, p.type]
    })),
    query: { enabled: !!userAddress, refetchInterval: 5000 }
  });

  const totalInventory = useMemo(() => {
    if (!inventoryData) return 0;
    return inventoryData.reduce((acc, res) => acc + Number(res.result || 0), 0);
  }, [inventoryData]);

  const animalIds = useMemo(() => Array.isArray(animalIdsRaw) ? (animalIdsRaw as bigint[]) : [], [animalIdsRaw]);
  const contractMax = Number(maxSlotsRaw || 0);
  const baseMax = contractMax === 0 ? 1 : contractMax;
  
  // Final values merging On-Chain + Local
  const displayMax = Math.max(baseMax, localMax);
  const onChainCount = animalIds.length;

  const prevOnChainCount = useRef(onChainCount);

  // Sync Logic: Prune local storage when on-chain catches up
  useEffect(() => {
    if (!userAddress) return;

    let updatedPending = [...localPending];
    let updatedMax = localMax;

    // Auto-fix corrupted local state (from previous bugs) if it's vastly larger than on-chain.
    // Since expansion is done +1 at a time, a localMax > contractMax + 1 is impossible cleanly.
    if (contractMax > 0 && localMax > contractMax + 1) {
        if (userAddress) localStorage.removeItem(`somnia_farm_${userAddress}`);
        updatedMax = contractMax;
        updatedPending = [];
    } else if (contractMax >= localMax) {
        // If on-chain max exceeds local max, clear local max
        updatedMax = 0;
    }

    // Logic: If on-chain count grew, instantly remove the oldest pending animals to match
    if (onChainCount > prevOnChainCount.current) {
        const diff = onChainCount - prevOnChainCount.current;
        updatedPending = updatedPending.slice(diff);
    }
    prevOnChainCount.current = onChainCount;

    // Prune strictly by timeout (60 seconds) in case of RPC failure
    const now = Date.now();
    updatedPending = updatedPending.filter(a => (now - a.timestamp) < 60000); 
    
    if (updatedMax !== localMax || updatedPending.length !== localPending.length) {
        setLocalMax(updatedMax);
        setLocalPending(updatedPending);
        persist(updatedMax, updatedPending);
    }
  }, [contractMax, onChainCount, localMax, localPending, userAddress, persist]);

  const performDeepSync = useCallback(async () => {
    setIsSyncing(true);
    for (let i = 0; i < 15; i++) {
        await refetchIds();
        await refetchMax();
        await refetchBalance();
        await new Promise(r => setTimeout(r, 2000));
    }
    // After deep sync, if we found new animals, we can be more aggressive in pruning
    setIsSyncing(false);
  }, [refetchIds, refetchMax, refetchBalance]);

  // Optimistic UI states for the currently active (unconfirmed) transaction
  const [optimisticMax, setOptimisticMax] = useState<number>(0);
  const [optimisticPending, setOptimisticPending] = useState<StoredAnimal | null>(null);

  // --- WRITES ---
  const { writeContract, data: hash, isError: isWriteError, isPending: isMarketPending } = useWriteContract();
  const { isSuccess, isError: isTxError } = useWaitForTransactionReceipt({ hash });

  const handleSync = () => { 
    if (userAddress) {
        localStorage.removeItem(`somnia_farm_${userAddress}`);
    }
    setLocalMax(0);
    setLocalPending([]);
    performDeepSync(); 
  };

  const handleExpand = () => {
    setOptimisticMax(displayMax + 1);
    writeContract({
      address: FARM_ENGINE_ADDRESS as `0x${string}`,
      abi: FARM_ENGINE_ABI,
      functionName: 'expandFarm',
      args: [],
      value: parseEther('100'),
    });
  };

  const handleBuy = (type: number) => {
    const price = ANIMAL_META[type]?.price || 0.1;
    setOptimisticPending({ type, timestamp: Date.now() });
    writeContract({
      address: FARM_ENGINE_ADDRESS as `0x${string}`,
      abi: FARM_ENGINE_ABI,
      functionName: 'buyAnimal',
      args: [type],
      value: parseEther(price.toString()),
    });
    setActiveTab('farm');
  };

  useEffect(() => {
    if (isSuccess) {
        if (optimisticMax > 0) {
            setLocalMax(optimisticMax);
            persist(optimisticMax, localPending);
            setOptimisticMax(0);
        }
        if (optimisticPending) {
            const nextPending = [...localPending, optimisticPending];
            setLocalPending(nextPending);
            persist(localMax, nextPending);
            setOptimisticPending(null);
        }
        performDeepSync();
    }
  }, [isSuccess, optimisticMax, optimisticPending, localMax, localPending, persist, performDeepSync]);

  useEffect(() => {
    // If user rejects MetaMask or Tx fails, revert the optimistic state immediately
    if (isWriteError || isTxError) {
        setOptimisticMax(0);
        setOptimisticPending(null);
    }
  }, [isWriteError, isTxError]);

  // Derived values for the UI that include in-flight optimistic operations
  const finalDisplayMax = optimisticMax > 0 ? optimisticMax : displayMax;
  const finalPendingArray = optimisticPending ? [...localPending, optimisticPending] : localPending;

  return (
    <>
    <main className="min-h-screen bg-[#7dd3fc] text-[#2b1b10] font-mono selection:bg-green-500 selection:text-[#2b1b10] pb-20">
      {/* PERSISTENT HUD */}
      <div className="bg-[#fefce8] backdrop-blur-2xl border-b-2 border-[#4A2F1D] py-4 px-8 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-gray-800 font-bold z-[100] sticky top-0 shadow-2xl">
        <div className="flex gap-10">
          <span className="flex items-center gap-2 text-[#2b1b10] border-l-2 border-[#4A2F1D] pl-4"><Pickaxe size={14} /> SLOTS: {Math.min(onChainCount + finalPendingArray.length, finalDisplayMax)} / {finalDisplayMax}</span>
          {userAddress === ADMIN_WALLET && (
            <span className="hidden md:flex items-center gap-2 text-green-700 border-l-2 border-[#4A2F1D] pl-4 uppercase tracking-[0.3em]"><Database size={11} className="mr-1" /> TREASURY: {Number(treasuryBalance?.formatted || 0).toFixed(2)} STT (0xc06f17DED41B859Ad0C2eED82795b5D0A2a83563)</span>
          )}
        </div>
        <div className="flex gap-6 items-center">
          {/* SOCIAL LINKS */}
          <div className="flex gap-5 mr-6 border-r-2 border-[#4A2F1D] pr-8">
            <a 
                href="https://x.com/PulsePastures" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center p-3.5 bg-[#121212] text-white border-2 border-[#4A2F1D] shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all rounded-sm"
                title="PulsePastures on X"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153ZM17.61 20.644h2.039L6.486 3.24H4.298l13.312 17.404Z" /></svg>
            </a>
            <a 
                href="https://github.com/PulsePastures" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 px-5 py-2 bg-[#fefce8] text-[#2b1b10] border-2 border-[#4A2F1D] shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-xs font-black italic tracking-widest uppercase rounded-sm"
                title="PulsePastures on GitHub"
            >
              <Github size={20} className="text-[#2b1b10]" />
              <span>SOURCE CODE</span>
            </a>
          </div>

          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className={`flex items-center gap-2 px-6 py-1 border-2 border-[#4A2F1D] transition-all ${isMuted ? 'bg-red-900 text-[#2b1b10] font-black' : 'bg-green-400 text-[#2b1b10] shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none font-black'}`}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            {isMuted ? 'AUDIO OFF' : 'AUDIO ON'}
          </button>
          
          <span className={isSyncing ? 'text-green-700 animate-pulse' : 'text-gray-600'}>
            {isSyncing ? 'SYNCING...' : 'LIVE'}
          </span>
          <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-green-500 animate-ping' : 'bg-green-900'}`} />
        </div>
      </div>

      <header className="max-w-7xl mx-auto p-6 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 mt-6 border-b-8 border-[#4A2F1D] bg-[#76b342] shadow-[12px_12px_0_0_rgba(101,67,33,1)] relative overflow-hidden group border-double">
        <div className="flex items-center gap-8 relative z-10">
          <div className="p-2 rounded-full border-4 border-[#4A2F1D] shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:scale-110 transition-transform cursor-pointer bg-gradient-to-br from-cyan-500/10 to-transparent">
             <img src="/new-logo.jpg" alt="PulsePastures Logo" className="w-[120px] h-[120px] object-cover rounded-full drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]" />
          </div>
          <div>
            <h1 className="text-7xl font-black italic tracking-tighter skew-x-[-15deg] text-white drop-shadow-[10px_10px_0_rgba(74,47,29,1)]">PULSEPASTURES</h1>
            <p className="text-[14px] text-white font-black tracking-[0.6em] uppercase mt-2 opacity-80">The Ultimate On-Chain Pasture</p>
          </div>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <UserProfile address={userAddress} balance={sttBalance?.formatted} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-16 mt-12">
        
        {/* HOW TO PLAY SECTION */}
        <div className="bg-[#fefce8] border-8 border-dashed border-[#4A2F1D] p-8 shadow-[12px_12px_0_0_rgba(101,67,33,1)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-200/5 animate-pulse pointer-events-none" />
            <div className="flex flex-col md:flex-row gap-8 relative z-10 items-center">
                <div className="flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-[#4A2F1D] pb-6 md:pb-0 md:pr-10 w-full md:w-auto">
                    <div className="bg-yellow-400 p-4 border-4 border-[#4A2F1D] shadow-[4px_4px_0_0_rgba(0,0,0,1)] -rotate-3 mb-4 group-hover:rotate-0 transition-transform">
                        <Pickaxe size={40} className="text-[#2b1b10]" />
                    </div>
                    <div className="font-black italic text-3xl text-[#2b1b10] tracking-tighter text-center leading-none">HOW TO<br/>PLAY</div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm font-bold uppercase tracking-widest text-[#2b1b10] opacity-90">
                    <div className="flex gap-3"><span className="text-green-700 font-black">1.</span> <span>Buy livestock from the <span className="bg-green-200 px-1 border border-black">EXCHANGE</span> using STT.</span></div>
                    <div className="flex gap-3"><span className="text-green-700 font-black">2.</span> <span>Wait and <span className="text-green-700 underline underline-offset-2">COLLECT</span> yield produced over time.</span></div>
                    <div className="flex gap-3"><span className="text-green-700 font-black">3.</span> <span>Sell yield in the EXCHANGE to earn STT back!</span></div>
                    <div className="flex gap-3"><span className="text-green-700 font-black">4.</span> <span>Expand <span className="bg-yellow-200 px-1 border border-black">STABLES</span> capacity (max slots: 100).</span></div>
                    
                    {/* PRO TIP CARD */}
                    <div className="md:col-span-2 mt-4 pt-6 border-t-[3px] border-dashed border-[#4A2F1D]/30">
                        <div className="bg-purple-200 border-4 border-[#4A2F1D] p-4 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-[6px_6px_0_0_rgba(101,67,33,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(101,67,33,1)] transition-all">
                            <div className="bg-purple-700 text-white px-3 py-1 font-black text-sm uppercase tracking-widest -skew-x-12 shadow-[3px_3px_0_0_rgba(0,0,0,1)] whitespace-nowrap">⚡ PRO TIP</div>
                            <div className="font-black text-[#2b1b10] opacity-90 leading-snug uppercase tracking-widest text-xs text-center md:text-left mt-1 md:mt-0">
                                Upgrade your animals using the <span className="inline-block bg-green-500 text-[#2b1b10] px-2 py-0.5 border-2 border-[#4A2F1D] mx-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">UP ▲</span> button to drastically boost their yield rate!
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          <TabButton active={activeTab === 'farm'} onClick={() => setActiveTab('farm')} label="UNIT STABLES" icon={<LayoutGrid size={40} />} />
          <TabButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} label="EXCHANGE" icon={<ArrowLeftRight size={40} />} />
        </div>

        {isConnected && (
            <div className="bg-[#fefce8] border-8 border-double border-[#4A2F1D] p-8 flex flex-wrap justify-between items-center gap-8 shadow-[12px_12px_0_0_rgba(101,67,33,1)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-green-200/5 animate-pulse" />
                <div className="flex items-center gap-6 relative z-10 border-r-4 border-[#4A2F1D] pr-10">
                   <div className="bg-yellow-600 p-4 border-2 border-[#4A2F1D] -rotate-3"><ShoppingCart size={30} className="text-[#2b1b10]" /></div>
                   <div className="font-black italic text-4xl text-[#2b1b10] tracking-tighter">GLOBAL INVENTORY</div>
                </div>
                <div className="flex flex-wrap gap-10 relative z-10">
                    {PRODUCT_META.map((prod, idx) => {
                        const res = inventoryData?.[idx]?.result;
                        const amount = res !== undefined ? BigInt(res as any) : BigInt(0);
                        return (
                            <div key={idx} className={`flex items-center gap-3 px-6 py-3 border-4 border-[#4A2F1D] shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all ${amount > BigInt(0) ? 'bg-green-900/40 border-green-700' : 'bg-gray-300 opacity-60 grayscale'}`}>
                                <span className="text-3xl">{prod.emoji}</span>
                                <span className="font-black text-2xl text-[#2b1b10]">{amount.toString()}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {activeTab === 'farm' ? (
          <div className="space-y-20">
            <div className="bg-[#fefce8] border-8 border-[#4A2F1D] p-14 flex flex-col md:flex-row justify-between items-center gap-12 shadow-[15px_15px_0_0_rgba(101,67,33,1)] hover:border-cyan-700 transition-all group overflow-hidden relative">
                {!isConnected && <div className="absolute inset-0 bg-[#4A2F1D]/40 z-20 backdrop-blur-[2px] flex items-center justify-center font-black text-2xl uppercase italic tracking-widest text-[#2b1b10]/40">CONNECT TO UPGRADE</div>}
                <div className="absolute top-0 left-0 w-2 h-full bg-green-400 group-hover:w-full transition-all opacity-10 pointer-events-none" />
                <div className="relative z-10">
                    <div className="text-6xl font-black italic text-[#2b1b10] tracking-tighter uppercase">STABLES REACH: {Math.min(onChainCount + finalPendingArray.length, finalDisplayMax)} / {finalDisplayMax}</div>
                </div>
                <button 
                  onClick={handleExpand} 
                  disabled={!isConnected || finalDisplayMax >= 100 || isMarketPending}
                  className={`px-20 py-10 border-8 border-[#4A2F1D] font-black text-4xl shadow-[12px_12px_0_0_rgba(101,67,33,1)] transition-all uppercase italic tracking-tighter relative z-10 group ${(!isConnected || finalDisplayMax >= 100) ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' : 'bg-purple-800 hover:bg-purple-700 hover:translate-x-3 hover:translate-y-3 hover:shadow-none'}`}
                >
                    <span className="group-hover:scale-110 block transition-transform">{!isConnected ? 'LOCKED' : finalDisplayMax >= 100 ? 'MAX HUB REACHED' : isMarketPending ? 'EXPANDING...' : '+ UPGRADE HUB'}</span>
                    <span className="text-xs block mt-2 opacity-50 not-italic tracking-[0.3em]">{finalDisplayMax >= 100 ? '100 SLOTS CAPACITY' : 'COST: 100 STT'}</span>
                </button>
            </div>

            {/* ADMIN PANEL (Only for Owner) */}
            {userAddress === ADMIN_WALLET && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mb-12 bg-red-600/10 border-8 border-[#4A2F1D] p-8 flex flex-col items-center gap-8 shadow-[15px_15px_0_0_rgba(150,0,0,1)]"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center w-full gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-red-600 p-4 rounded-xl border-4 border-[#4A2F1D] shadow-[5px_5px_0_0_rgba(0,0,0,1)]"><ShieldAlert className="text-[#2b1b10]" size={40} /></div>
                            <div>
                                <h3 className="text-[#2b1b10] font-black text-3xl italic tracking-tighter leading-none">ADMINISTRATOR HUD</h3>
                                <p className="text-red-500 font-bold text-xs mt-2 tracking-widest uppercase opacity-80">Protocol Treasury Management Active</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] w-full text-center md:text-right mb-2">QUICK PERCENTAGE WITHDRAW</div>
                            {[10, 25, 50, 100].map(pct => (
                                <button 
                                    key={pct}
                                    onClick={() => {
                                        const balanceWei = treasuryBalance?.value || BigInt(0);
                                        const amountWei = (balanceWei * BigInt(pct)) / BigInt(100);
                                        if (amountWei === BigInt(0)) return;
                                        writeContract({
                                            address: FARM_ENGINE_ADDRESS as `0x${string}`,
                                            abi: FARM_ENGINE_ABI,
                                            functionName: 'withdrawAmount',
                                            args: [amountWei]
                                        });
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-[#2b1b10] font-black px-6 py-4 border-4 border-[#4A2F1D] shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none transition-all uppercase italic text-xl tracking-tighter leading-none"
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            <VisualFarm distribution={animalDistribution} onHoverAnimal={() => {}} />

            <div className="bg-[#fefce8] border-8 border-[#4A2F1D] p-10 shadow-[15px_15px_0_0_rgba(101,67,33,1)] relative overflow-hidden group">
                {/* 4K Cyber-Stone Grid Texture */}
                <div className="absolute inset-0 opacity-10 blur-sm pointer-events-none bg-cover bg-center" style={{ backgroundImage: "url('/somnia_farm_v4_stone_neon_grid_frame_1774131457273.png')" }} />
                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all pointer-events-none" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20 relative z-10">
                   {Array.from({ length: finalDisplayMax }).map((_, i) => {
                       const tokenId = animalIds[i];
                       if (tokenId !== undefined) {
                           return <AnimalSlot key={tokenId.toString()} tokenId={tokenId} onHover={() => {}} />;
                       }
                       
                       // Find if we have a pending animal for this index
                       const pendingIdx = i - onChainCount;
                       if (pendingIdx >= 0 && pendingIdx < finalPendingArray.length) {
                           return <PendingSlot key={`pending-${i}`} item={finalPendingArray[pendingIdx]} />;
                       }

                       return <EmptySlot key={`empty-${i}`} onClick={() => { setActiveTab('market'); setMarketSubTab('animals'); }} />;
                   })}
                </div>
            </div>
          </div>
        ) : (
          <div className="space-y-20">
             <div className="flex gap-8 border-b-8 border-[#4A2F1D] pb-10">
                <TabSubButton active={marketSubTab === 'animals'} onClick={() => setMarketSubTab('animals')} label="LIVESTOCK UNIT" />
                <TabSubButton active={marketSubTab === 'products'} onClick={() => setMarketSubTab('products')} label="MERCHANT TERMINAL" />
             </div>

             {marketSubTab === 'animals' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
                     {Object.keys(ANIMAL_META).map((typeKey) => (
                         <StoreItem 
                            key={typeKey} 
                            type={Number(typeKey)} 
                            userAddress={userAddress} 
                            onHover={() => playSFX('https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3')}
                            onBuySuccess={refetchAll}
                         />
                     ))}
                </div>
             ) : (
                <div className="space-y-20">
                    <div className="bg-green-900/5 border-8 border-[#4A2F1D] p-12 flex items-center justify-between shadow-[15px_15px_0_0_rgba(101,67,33,1)] border-double relative overflow-hidden">
                        <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                        <div className="flex items-center gap-10 relative z-10">
                            <ShoppingCart size={80} className="text-green-800 drop-shadow-[0_0_15px_rgba(21,128,61,0.4)]" />
                            <div>
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter text-[#2b1b10]">TRADING STATION</h2>
                                <p className="text-sm text-green-900 font-black uppercase tracking-[0.6em] mt-3 italic opacity-90">Convert Agricultural Yield into STT Tokens</p>
                            </div>
                        </div>
                        <div className="text-right hidden xl:block relative z-10">
                            <div className="text-[10px] text-gray-800 uppercase font-black mb-3 tracking-[0.3em]">VALUATION INDEX</div>
                            <div className="text-green-800 font-black italic tracking-tighter text-6xl drop-shadow-[0_0_20px_rgba(21,128,61,0.5)]">BULLISH ▲</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
                        {PRODUCT_META.map((prod, idx) => (
                            <ProductItem 
                                key={idx} 
                                product={prod} 
                                userAddress={userAddress} 
                                onHover={() => {}}
                                onSellSuccess={() => { refetchStt(); refetchTreasury(); }}
                            />
                        ))}
                    </div>
                </div>
             )}
          </div>
        )}
      </div>
    </main>
    <div className="hidden pointer-events-none absolute -left-[9999px]">
        <iframe 
            id="bgm-iframe"
            width="1" 
            height="1" 
            src="https://www.youtube.com/embed/meCz727ZJ5w?enablejsapi=1&autoplay=1&loop=1&playlist=meCz727ZJ5w&mute=1&controls=0" 
            frameBorder="0" 
            allow="autoplay; encrypted-media" 
            allowFullScreen
        ></iframe>
    </div>
    </>
  );
}

function AnimalSlot({ tokenId, onHover }: { tokenId: bigint, onHover: () => void }) {
  const { data: rawData, status, error, refetch } = useReadContract({
    address: FARM_NFT_ADDRESS as `0x${string}`,
    abi: FARM_NFT_ABI,
    functionName: 'getAnimal',
    args: [tokenId],
  });

  const { writeContract, isPending, isSuccess } = useWriteContract();
  const [readyAmount, setReadyAmount] = useState(0);

  const animalData = status === 'success' ? (rawData as any) : null;
  
  useEffect(() => {
    if (!animalData) return;
    const type = Number(animalData.animalType !== undefined ? animalData.animalType : animalData[0]);
    const timeStr = ANIMAL_META[type]?.time || "1h";
    const intervalSecs = Number(timeStr.replace('h', '')) * 3600;
    
    // Calculate how many items are ready to harvest every second
    const interval = setInterval(() => {
        const lastHarvest = Number(animalData.lastHarvest) * 1000;
        const rate = (Number(animalData.productionRate) > 1000 ? Number(animalData.productionRate) : intervalSecs) * 1000;
        const passed = Date.now() - lastHarvest;
        const total = Math.floor(passed / rate);
        setReadyAmount(total > 10 ? 10 : total);
    }, 1000);
    return () => clearInterval(interval);
  }, [animalData]);

  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  const handleCollect = () => {
    if (readyAmount === 0 || isPending) return;
    writeContract({
      address: FARM_ENGINE_ADDRESS as `0x${string}`,
      abi: FARM_ENGINE_ABI,
      functionName: 'harvest',
      args: [tokenId],
    });
  };

  const handleUpgrade = () => {
    const type = Number(animalData.animalType !== undefined ? animalData.animalType : animalData[0]);
    const upgradePrice = ANIMAL_META[type]?.upgradePrice || 1;
    if (isPending || Number(animalData.level || 1) >= 10) return;
    writeContract({
      address: FARM_ENGINE_ADDRESS as `0x${string}`,
      abi: FARM_ENGINE_ABI,
      functionName: 'levelUpAnimal',
      args: [tokenId],
      value: parseEther(upgradePrice.toString())
    });
  };
  
  if (error) return (
    <div className="bg-red-950/20 border-8 border-[#4A2F1D] p-12 flex flex-col items-center justify-center min-h-[500px] shadow-[15px_15px_0_0_rgba(101,67,33,1)] relative group overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-red-600 animate-pulse" />
        <AlertCircle className="text-red-600 mb-10 group-hover:scale-125 transition-transform" size={100} />
        <span className="text-3xl font-black uppercase italic text-center text-red-500 mb-12 tracking-tighter">ENCRYPTION ERROR</span>
        <button onClick={() => refetch()} className="bg-[#4A2F1D] px-12 py-6 border-8 border-red-600 text-xs font-black uppercase italic hover:bg-red-900 transition-all shadow-[10px_10px_0_0_rgba(255,0,0,1)] active:translate-y-2 active:shadow-none">RE-SCAN HUB</button>
    </div>
  );

  if (status === 'pending' || !animalData) return <LoadingSlot i={tokenId.toString()} />;

  const typeValue = animalData.animalType !== undefined ? animalData.animalType : animalData[0];
  const levelValue = animalData.level !== undefined ? animalData.level : (animalData[4] || 1);
  const type = Number(typeValue);
  const level = Number(levelValue);
  const meta = ANIMAL_META[type] || { emoji: "❓", name: "UNKNOWN", yield: "N/A", prod: "N/A" };

  return (
    <motion.div 
      onMouseEnter={onHover}
      initial={{ scale: 0.9, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      className="bg-[#fefce8] border-8 border-[#4A2F1D] p-14 shadow-[15px_15px_0_0_rgba(101,67,33,1)] relative overflow-hidden group min-h-[500px] flex flex-col items-center justify-center hover:bg-[#151515] transition-all hover:translate-x-3 hover:translate-y-3 hover:shadow-none"
    >
      <div className="absolute top-0 left-0 bg-green-500 text-[#2b1b10] font-black px-12 py-6 uppercase text-[18px] italic tracking-tighter shadow-[8px_8px_0_0_rgba(0,0,0,1)] z-20 skew-x-[-15deg] -translate-x-4 border-r-8 border-b-8 border-[#4A2F1D]">LVL {level}</div>
      <div className="absolute top-0 right-0 bg-yellow-500 text-[#2b1b10] font-black px-10 py-5 uppercase text-[14px] italic tracking-tighter shadow-2xl z-20 skew-x-[15deg] translate-x-4">#{tokenId.toString()}</div>
      <div className="text-[12rem] mb-14 group-hover:scale-125 group-hover:-rotate-6 transition-all cursor-crosshair drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)] duration-1000 z-10">{meta.emoji}</div>
      <h3 className="text-6xl font-black uppercase mb-12 italic tracking-tighter text-[#2b1b10] drop-shadow-2xl z-10">{meta.name}</h3>
      
      <div className="flex w-full gap-4 z-10">
          <button 
            onClick={handleCollect} 
            disabled={readyAmount === 0 || isPending}
            className={`flex-1 py-6 border-8 border-[#4A2F1D] font-black text-2xl shadow-[10px_10px_0_0_rgba(0,0,0,1)] uppercase italic tracking-tighter transition-all flex items-center justify-center leading-none text-center ${readyAmount > 0 && !isPending ? 'bg-green-700 hover:bg-green-600 active:translate-y-2 active:shadow-none shadow-green-950/40' : 'bg-[#050505] text-gray-600 cursor-not-allowed'}`}
          >
            {isPending ? 'SYNC...' : readyAmount > 0 ? `COLLECT +${readyAmount}` : 'PRODUCING'}
          </button>
          <button 
            onClick={handleUpgrade}
            disabled={isPending || level >= 10}
            className={`px-4 py-6 border-8 border-[#4A2F1D] font-black text-2xl shadow-[10px_10px_0_0_rgba(0,0,0,1)] uppercase italic tracking-tighter transition-all group flex flex-col items-center justify-center leading-none text-center disabled:opacity-50 disabled:cursor-not-allowed w-1/3 ${level >= 10 ? 'bg-gray-300 text-gray-800 border-gray-900 shadow-none' : 'bg-green-500 hover:bg-green-400 active:translate-y-2 active:shadow-none shadow-green-900/40 text-[#2b1b10]'}`}
          >
            <span className={level < 10 ? "group-hover:-translate-y-2 transition-transform block" : "block"}>{level >= 10 ? 'MAX' : 'UP ▲'}</span>
            <span className="text-[12px] mt-2 tracking-widest text-[#2b1b10] bg-[#4A2F1D]/10 px-2 py-1 font-black leading-none">{level >= 10 ? 'ELITE' : `${ANIMAL_META[type]?.upgradePrice || 1} STT`}</span>
          </button>
      </div>
    </motion.div>
  );
}

function EmptySlot({ onClick }: any) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} onClick={onClick} className="bg-[#020202] border-8 border-[#4A2F1D] border-dashed p-14 flex flex-col items-center justify-center min-h-[500px] cursor-pointer hover:bg-[#050505] transition-all group shadow-[15px_15px_0_0_rgba(101,67,33,1)] active:scale-90 relative overflow-hidden">
      <div className="absolute inset-0 bg-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      <div className="text-[14rem] mb-12 opacity-5 group-hover:opacity-40 group-hover:scale-125 transition-all text-cyan-600 duration-1000 font-thin">+</div>
      <span className="text-4xl font-black uppercase italic opacity-10 group-hover:opacity-60 tracking-[0.6em] text-[#2b1b10] transition-opacity select-none">VACANT SLOT</span>
    </motion.div>
  );
}

function PendingSlot({ item }: { item: StoredAnimal }) {
    const meta = ANIMAL_META[item.type] || { emoji: "❓", name: "UNKNOWN", yield: "N/A", prod: "N/A" };
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#fefce8] border-8 border-[#4A2F1D] p-14 shadow-[15px_15px_0_0_rgba(101,67,33,1)] relative overflow-hidden group min-h-[500px] flex flex-col items-center justify-center hover:bg-[#151515] transition-all hover:translate-x-3 hover:translate-y-3 hover:shadow-none">
        <div className="absolute top-0 right-0 bg-cyan-700 text-[#2b1b10] font-black px-10 py-5 uppercase text-[14px] italic tracking-tighter shadow-2xl z-20 skew-x-[15deg] translate-x-4 animate-pulse">INDEXING...</div>
        <div className="text-[12rem] mb-14 drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)] z-10 animate-bounce cursor-wait">{meta.emoji}</div>
        <h3 className="text-6xl font-black uppercase mb-6 italic tracking-tighter text-[#2b1b10] drop-shadow-2xl z-10 opacity-70">{meta.name}</h3>
        <div className="text-[10px] text-green-700 font-bold mb-12 italic tracking-[0.4em] uppercase opacity-70 border-t-4 border-[#4A2F1D] pt-8 w-full text-center z-10">{meta.yield} EFFICIENCY // {meta.prod}</div>
        <button disabled className="z-10 w-full py-10 bg-[#050505] text-green-700 border-8 border-cyan-900 font-black text-4xl shadow-[12px_12px_0_0_rgba(101,67,33,1)] uppercase italic tracking-tighter cursor-wait">VERIFYING...</button>
      </motion.div>
    );
}

function LoadingSlot({ i }: any) {
  return (
    <div key={i} className="bg-[#050505] border-8 border-[#4A2F1D] p-14 flex flex-col items-center justify-center min-h-[500px] shadow-[15px_15px_0_0_rgba(101,67,33,1)]">
      <div className="w-32 h-32 border-[12px] border-[#4A2F1D] border-t-cyan-600 rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase italic opacity-30 mt-16 tracking-[0.6em] text-[#2b1b10] animate-pulse">ADJUSTING FREQUENCY...</span>
    </div>
  );
}

function StoreItem({ type, userAddress, onHover, onBuySuccess }: { type: number, userAddress: string | undefined, onHover: () => void, onBuySuccess?: () => void }) {
    const { isConnected } = useAccount();
    const meta = ANIMAL_META[type];
    
    // Use useBalance for native STT instead of ERC20 STT
    const { data: sttBalance } = useBalance({ 
        address: userAddress as `0x${string}`,
        query: { enabled: !!userAddress, refetchInterval: 5000 }
    });
    
    // Convert to Ether-scale BigInt (STT has 18 decimals)
    const { writeContract: writeBuy, isPending, isSuccess, isError: isBuyError, error: buyError } = useWriteContract();

    const handleBuy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isConnected) return;
        writeBuy({
            address: FARM_ENGINE_ADDRESS as `0x${string}`,
            abi: FARM_ENGINE_ABI,
            functionName: 'buyAnimal',
            args: [type],
            value: parseEther(meta.price.toString()),
        });
    };

    useEffect(() => {
        if (isSuccess) onBuySuccess?.();
    }, [isSuccess, onBuySuccess]);

    const hasEnough = sttBalance ? BigInt(sttBalance.value) >= parseEther(meta.price.toString()) : false;
    const disabled = !isConnected || isPending || !hasEnough;

    return (
        <button 
            onMouseEnter={onHover}
            onClick={handleBuy}
            disabled={disabled}
            className={`flex flex-col items-center justify-center p-8 lg:p-12 border-8 border-[#4A2F1D] shadow-[15px_15px_0_0_rgba(101,67,33,1)] hover:translate-x-4 hover:translate-y-4 hover:shadow-none transition-all group relative overflow-hidden min-h-[500px] w-full ${disabled ? 'bg-[#050505] opacity-60 grayscale cursor-not-allowed' : 'bg-[#fefce8] hover:bg-[#4A2F1D]'}`}
        >
            {!isConnected && <div className="absolute inset-0 bg-[#4A2F1D]/40 z-20 backdrop-blur-[2px] flex items-center justify-center font-black text-xl uppercase italic tracking-widest text-[#2b1b10]/40">CONNECT TO BUY</div>}
            <div className="absolute top-8 right-8 bg-[#4A2F1D] text-green-700 font-mono text-sm px-4 py-1 border-2 border-cyan-900 shadow-xl opacity-20 group-hover:opacity-100 z-10 transition-opacity tracking-widest">{type} // TIER</div>
            <div className="text-[11rem] mb-8 group-hover:scale-125 transition-transform duration-1000 group-hover:rotate-6 drop-shadow-[0_30px_60px_rgba(0,0,0,1)]">{meta.emoji}</div>
            <div className="font-black text-4xl mb-8 italic tracking-tighter uppercase text-[#2b1b10] drop-shadow-2xl">{meta.name}</div>
            <div className="bg-[#4A2F1D] border-[8px] border-double border-[#4A2F1D] px-12 py-5 w-full font-black text-green-700 text-3xl tracking-[0.2em] shadow-inner font-mono italic flex items-center justify-center leading-none rounded-xl">
                {!isConnected ? 'LOCKED' : !hasEnough ? 'INSUFFICIENT' : `${meta.price} STT`}
            </div>
        </button>
    );
}

function ProductItem({ product, userAddress, onHover, onSellSuccess }: { product: any, userAddress: string | undefined, onHover: () => void, onSellSuccess?: () => void }) {
    const { isConnected } = useAccount();
    const { data: amountRaw, refetch } = useReadContract({
        address: FARM_ENGINE_ADDRESS as `0x${string}`,
        abi: FARM_ENGINE_ABI,
        functionName: 'userInventory',
        args: userAddress ? [userAddress as `0x${string}`, product.type] : undefined,
        query: { enabled: !!userAddress, refetchInterval: 5000 }
    });
    
    const amount = BigInt((amountRaw || 0) as any);
    const [sellAmount, setSellAmount] = useState<bigint>(BigInt(0));
    const { writeContract: writeSell, isPending, isSuccess, isError: isSellError, error: sellError } = useWriteContract();

    // Sync sellAmount when inventory changes
    useEffect(() => {
        if (amount > BigInt(0) && sellAmount === BigInt(0)) {
            setSellAmount(BigInt(1));
        } else if (amount === BigInt(0)) {
            setSellAmount(BigInt(0));
        } else if (sellAmount > amount) {
            setSellAmount(amount);
        }
    }, [amount]);

    const handleSell = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (sellAmount === BigInt(0) || isPending) return;
        writeSell({
            address: FARM_ENGINE_ADDRESS as `0x${string}`,
            abi: FARM_ENGINE_ABI,
            functionName: 'sellProduct',
            args: [product.type, sellAmount],
        });
    };

    useEffect(() => {
        if (isSuccess) {
            refetch();
            onSellSuccess?.();
            setSellAmount(BigInt(0));
        }
    }, [isSuccess, refetch, onSellSuccess]);

    const canSell = isConnected && amount > BigInt(0) && !isPending;

    // Format error message to be short
    const errorMsg = sellError?.message?.includes('User rejected') ? 'DENIED' : 
                     sellError?.message?.includes('insufficient funds') ? 'GAS ERR' : 
                     sellError?.message?.slice(0, 10).toUpperCase() || 'FAIL';

    return (
        <div onMouseEnter={onHover} className="bg-[#fefce8] border-8 border-[#4A2F1D] p-12 text-center shadow-[15px_15px_0_0_rgba(101,67,33,1)] min-h-[500px] flex flex-col items-center justify-center group relative overflow-hidden hover:bg-[#151515] transition-colors">
            {!isConnected && <div className="absolute inset-0 bg-[#4A2F1D]/40 z-20 backdrop-blur-[2px] flex items-center justify-center font-black text-xl uppercase italic tracking-widest text-[#2b1b10]/40 text-center px-10">CONNECT TO SELL</div>}
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="absolute top-6 right-6 bg-green-800 text-[#2b1b10] font-black px-6 py-2 uppercase text-[12px] italic tracking-[0.2em] border-4 border-[#4A2F1D] shadow-xl skew-x-[15deg] z-20">STOCK: {amount.toString()}</div>
            <div className="text-[10rem] mb-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] z-10">{product.emoji}</div>
            <h3 className="font-black text-4xl mb-4 italic tracking-tighter uppercase text-[#2b1b10] z-10">{product.name}</h3>
            <div className="text-[10px] text-green-500 font-bold mb-8 tracking-[0.5em] uppercase opacity-70 z-10 border-b-4 border-[#4A2F1D] pb-6 w-full text-center">VALUE: {product.price} STT</div>
            
            {canSell && (
                <div className="w-full space-y-4 mb-8 z-10">
                    <div className="flex items-center gap-2 bg-[#4A2F1D]/60 p-3 border-4 border-[#4A2F1D] rounded-xl shadow-inner">
                        <button 
                            onClick={() => setSellAmount(prev => prev > BigInt(1) ? prev - BigInt(1) : prev)}
                            className="w-10 h-10 bg-red-900 border-2 border-[#4A2F1D] font-black text-xl flex items-center justify-center hover:bg-red-700 active:translate-y-1 transition-all rounded-md"
                        >-</button>
                        <div className="flex-1 font-black text-2xl text-green-700 font-mono tracking-tighter text-center">{sellAmount.toString()}</div>
                        <button 
                            onClick={() => setSellAmount(prev => prev < amount ? prev + BigInt(1) : prev)}
                            className="w-10 h-10 bg-green-900 border-2 border-[#4A2F1D] font-black text-xl flex items-center justify-center hover:bg-green-700 active:translate-y-1 transition-all rounded-md"
                        >+</button>
                        <button 
                            onClick={() => setSellAmount(amount)}
                            className="ml-2 px-3 py-2 bg-purple-900 border-2 border-[#4A2F1D] font-black text-[10px] uppercase italic hover:bg-purple-700 active:translate-y-1 transition-all rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                        >MAX</button>
                    </div>

                    <button 
                        onClick={handleSell}
                        disabled={!canSell || sellAmount === BigInt(0)}
                        className={`w-full py-6 border-8 border-[#4A2F1D] font-black uppercase text-3xl shadow-[10px_10px_0_0_rgba(0,0,0,1)] transition-all italic tracking-tight drop-shadow-2xl flex flex-col items-center justify-center leading-none text-center rounded-2xl ${isSellError ? 'bg-red-800 text-[#2b1b10]' : canSell ? 'bg-green-800 hover:bg-green-700 active:translate-y-4 active:shadow-none' : 'bg-[#050505] text-gray-600 opacity-50 cursor-not-allowed hidden'}`}
                    >
                        {isPending ? <span className="text-xl">PROCESSING...</span> : isSellError ? <span className="text-xl">{errorMsg}</span> : (
                            <>
                                <span className="block mb-1">SELL</span>
                                <span className="block text-2xl font-mono opacity-80">{(Number(sellAmount) * product.price).toFixed(2)} STT</span>
                            </>
                        )}
                    </button>
                </div>
            )}
            {!canSell && amount === BigInt(0) && <div className="z-10 w-full py-10 border-[6px] border-dashed border-gray-800 font-black uppercase text-xl text-gray-600 tracking-tighter italic flex items-center justify-center rounded-2xl">OUT OF STOCK</div>}
        </div>
    );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: any }) {
  return (
    <button onClick={onClick} className={`px-24 py-12 border-8 border-[#4A2F1D] font-black text-5xl uppercase tracking-tighter italic flex items-center justify-center gap-10 transition-all relative overflow-hidden group ${active ? 'bg-green-400 translate-y-5 shadow-none text-[#2b1b10]' : 'bg-[#fefce8] shadow-[12px_12px_0_0_rgba(101,67,33,1)] hover:translate-y-5 hover:shadow-none text-[#2b1b10]'}`}>
      <div className={`${active ? 'text-[#2b1b10]' : 'text-green-700'} group-hover:scale-125 transition-transform duration-500`}>{icon}</div> 
      <span>{label}</span>
      {active && <div className="absolute top-0 left-0 w-full h-2 bg-white/20 animate-pulse" />}
    </button>
  );
}

function TabSubButton({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`px-16 py-6 font-black text-xl uppercase skew-x-[-12deg] transition-all border-8 border-[#4A2F1D] ${active ? 'bg-green-400 shadow-none translate-y-3' : 'bg-[#fefce8] shadow-[0_12px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-3'}`}>{label}</button>
  );
}

function VisualFarm({ distribution, onHoverAnimal }: { distribution: Record<number, number>, onHoverAnimal: (type: number) => void }) {
  return (
    <div className="bg-[#0a0a0a] border-8 border-[#4A2F1D] p-12 shadow-[15px_15px_0_0_rgba(101,67,33,1)] relative overflow-hidden group mb-12">
      <div className="absolute inset-0 bg-green-200/5 group-hover:bg-green-200/10 transition-colors pointer-events-none" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
        {PRODUCT_META.map((prod) => {
            const count = distribution[prod.type] || 0;
            const animalName = ANIMAL_META[prod.type]?.name || "UNKNOWN";
            const animalEmoji = ANIMAL_META[prod.type]?.emoji || "❓";
            
            return (
            <div 
                key={prod.type} 
                onMouseEnter={() => onHoverAnimal(prod.type)}
                className="bg-[#fefce8] border-4 border-[#4A2F1D] p-8 flex flex-col items-center justify-center relative min-h-[180px] overflow-hidden group/plot cursor-crosshair hover:bg-[#4A2F1D] transition-all"
            >
                <div className="flex gap-4 items-center mb-4">
                    <span className="text-6xl drop-shadow-lg group-hover/plot:scale-125 transition-transform">{animalEmoji}</span>
                </div>
                <div className="text-[12px] font-black uppercase italic tracking-tighter text-green-700 group-hover/plot:text-[#2b1b10] transition-colors">{animalName} STATION</div>
                <div className={`mt-4 px-8 py-2 text-[14px] font-black italic rounded-full border-2 border-[#4A2F1D] ${count > 0 ? 'bg-green-400 text-[#2b1b10]' : 'bg-[#4A2F1D] text-gray-700'}`}>
                    {count} {count === 1 ? 'UNIT' : 'UNITS'} HOUSED
                </div>
            </div>
            );
        })}
      </div>
    </div>
  );
}
function UserProfile({ address, balance }: any) {
    const [nickname, setNickname] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState("");

    useEffect(() => {
        if (address) {
            const saved = localStorage.getItem(`somnia_nick_${address}`);
            setNickname(saved || `AGENT_${address.slice(-4).toUpperCase()}`);
        }
    }, [address]);

    if (!address) return <ConnectButton />;

    const handleSave = () => {
        if (tempName.trim()) {
            localStorage.setItem(`somnia_nick_${address}`, tempName.trim().toUpperCase());
            setNickname(tempName.trim().toUpperCase());
        }
        setIsEditing(false);
    };

    return (
        <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end text-right">
                {isEditing ? (
                    <div className="flex items-center gap-3">
                        <input 
                            autoFocus
                            className="bg-[#4A2F1D] border-2 border-cyan-600 text-[#2b1b10] font-black text-xl px-4 py-1 uppercase italic tracking-tighter w-40 outline-none"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <button 
                            onClick={handleSave}
                            className="bg-green-400 text-[#2b1b10] font-black px-4 py-1 uppercase italic tracking-tighter text-sm hover:bg-white transition-colors border-2 border-[#4A2F1D] shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none"
                        >
                            SAVE
                        </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => { setTempName(nickname); setIsEditing(true); }}
                        className="text-2xl font-black text-[#2b1b10] italic tracking-tighter uppercase leading-tight cursor-pointer hover:text-green-700 transition-colors border-b-2 border-transparent hover:border-cyan-600 pb-1"
                    >
                        {nickname}
                    </div>
                )}
            </div>
            
            <div className="bg-[#4A2F1D]/40 border-4 border-[#4A2F1D] p-5 flex items-center gap-8 group hover:bg-[#4A2F1D]/60 transition-all">
                <div className="flex flex-col items-end border-r-2 border-[#4A2F1D] pr-8">
                    <span className="text-[#2b1b10] font-black text-2xl italic tracking-tighter leading-none">{Number(balance || 0).toFixed(2)} STT</span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-2">AVAILABLE LIQ</span>
                </div>
                <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
            </div>
        </div>
    );
}
