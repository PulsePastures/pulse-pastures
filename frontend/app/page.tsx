"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Pickaxe, TrendingUp, BarChart3, AlertCircle, Loader2, ShoppingCart, Database, Save, Volume2, VolumeX, ShieldAlert, LayoutGrid, ArrowLeftRight, Github, User, BadgeCheck } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts, useBalance } from 'wagmi';
import { parseEther, maxUint256, formatEther } from 'viem';

// --- CONTRACT ADDRESSES ---
const FARM_ENGINE_ADDRESS = '0xd5DD3166559Eae73d2886725049dcbBECd98A972';
const FARM_NFT_ADDRESS = FARM_ENGINE_ADDRESS;
const VIRTUAL_ADDRESS = '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b';

// --- ABIs ---
const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }
] as const;

const FARM_ENGINE_ABI = [
  { name: 'buyAnimal', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'animalType', type: 'uint8' }], outputs: [] },
  { name: 'levelUpAnimal', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'animalId', type: 'uint256' }], outputs: [] },
  { name: 'expandFarm', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'harvest', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'animalId', type: 'uint256' }], outputs: [] },
  { name: 'sellProduct', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_type', type: 'uint8' }, { name: '_amount', type: 'uint256' }], outputs: [] },
  { name: 'getUserAnimals', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256[]' }] },
  { name: 'maxSlots', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'userInventory', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }, { name: 'animalType', type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'slotPrice', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'animalPrices', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'productionRates', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'baseUpgradePrices', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'setAnimalPrice', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_type', type: 'uint8' }, { name: '_price', type: 'uint256' }], outputs: [] },
  { name: 'setSlotPrice', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_price', type: 'uint256' }], outputs: [] },
  { name: 'setProductionRate', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_type', type: 'uint8' }, { name: '_rate', type: 'uint256' }], outputs: [] },
  { name: 'setProductPrice', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_type', type: 'uint8' }, { name: '_price', type: 'uint256' }], outputs: [] },
  { name: 'setBaseUpgradePrice', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_type', type: 'uint8' }, { name: '_price', type: 'uint256' }], outputs: [] },
  { name: 'setEconomy', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_slotPrice', type: 'uint256' }, { name: '_animalPrices', type: 'uint256[]' }, { name: '_productionRates', type: 'uint256[]' }, { name: '_baseUpgradePrices', type: 'uint256[]' }, { name: '_productPrices', type: 'uint256[]' }], outputs: [] },
  { name: 'withdrawVirtual', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'depositVirtual', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'getAnimal', type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'tuple', components: [{ name: 'animalType', type: 'uint8' }, { name: 'birthTime', type: 'uint256' }, { name: 'lastHarvest', type: 'uint256' }, { name: 'level', type: 'uint256' }] }] },
] as const;

const FARM_NFT_ABI = [
  { name: 'getAnimal', type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'tuple', components: [{ name: 'animalType', type: 'uint8' }, { name: 'birthTime', type: 'uint256' }, { name: 'lastHarvest', type: 'uint256' }, { name: 'level', type: 'uint256' }] }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

const ANIMAL_META: Record<number, { emoji: string; name: string; yield: string; prod: string; price: number; time: string; upgradePrice: number }> = {
  0: { emoji: "🐔", name: "CHICKEN", yield: "LOW", prod: "EGGS", price: 0.01, time: "DAILY", upgradePrice: 0.01 },
  1: { emoji: "🐑", name: "SHEEP", yield: "MEDIUM", prod: "MEAT", price: 0.01, time: "DAILY", upgradePrice: 0.01 },
  2: { emoji: "🐄", name: "COW", yield: "HIGH", prod: "MILK", price: 0.01, time: "DAILY", upgradePrice: 0.01 },
  3: { emoji: "🐐", name: "GOAT", yield: "MEDIUM", prod: "CHEESE", price: 0.01, time: "DAILY", upgradePrice: 0.01 },
  4: { emoji: "🐷", name: "PIG", yield: "HIGH", prod: "BACON", price: 0.01, time: "DAILY", upgradePrice: 0.01 },
  5: { emoji: "🐝", name: "BEE", yield: "LOW", prod: "HONEY", price: 0.01, time: "DAILY", upgradePrice: 0.01 },
};

const PRODUCT_META = [
  { type: 0, name: 'FRESH EGGS', emoji: '🥚', price: 0.01 },
  { type: 1, name: 'PRIME MEAT', emoji: '🥩', price: 0.01 },
  { type: 2, name: 'RAW MILK', emoji: '🥛', price: 0.01 },
  { type: 3, name: 'AGED CHEESE', emoji: '🧀', price: 0.01 },
  { type: 4, name: 'CRISPY BACON', emoji: '🥓', price: 0.01 },
  { type: 5, name: 'WILD HONEY', emoji: '🍯', price: 0.01 },
];

interface StoredAnimal {
    type: number;
    timestamp: number;
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
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 1500);
    }, [isMuted]);
    return { playSFX };
};

export default function FarmPage() {
  const { address: userAddress, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'farm' | 'market'>('farm');
  const [marketSubTab, setMarketSubTab] = useState<'animals' | 'products'>('animals');
  
  const [localMax, setLocalMax] = useState<number>(0);
  const [localPending, setLocalPending] = useState<StoredAnimal[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { playSFX } = useAudio(isMuted);

  useEffect(() => {
    if (userAddress) {
        const saved = localStorage.getItem(`base_farm_${userAddress}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            setLocalMax(parsed.maxSlots || 0);
            setLocalPending(parsed.pendingAnimals || []);
        } else {
            setLocalMax(0); setLocalPending([]);
        }
    }
  }, [userAddress]);

  const persist = useCallback((max: number, pending: StoredAnimal[]) => {
    if (userAddress) {
        localStorage.setItem(`base_farm_${userAddress}`, JSON.stringify({ maxSlots: max, pendingAnimals: pending }));
    }
  }, [userAddress]);

  const { data: maxSlotsRaw, refetch: refetchMax } = useReadContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'maxSlots', args: userAddress ? [userAddress] : undefined });
  const { data: animalIdsRaw, refetch: refetchIds } = useReadContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'getUserAnimals', args: userAddress ? [userAddress] : undefined });
  const { data: nftBalance, refetch: refetchBalance } = useReadContract({ address: FARM_NFT_ADDRESS as `0x${string}`, abi: FARM_NFT_ABI, functionName: 'balanceOf', args: userAddress ? [userAddress] : undefined });
  const { data: virtualBalance, refetch: refetchVirtual } = useReadContract({ address: VIRTUAL_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: userAddress ? [userAddress] : undefined });
  const { data: treasuryBalance, refetch: refetchTreasury } = useReadContract({ address: VIRTUAL_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [FARM_ENGINE_ADDRESS as `0x${string}`] });
  const { data: contractOwner } = useReadContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'owner' });
  const isAdmin = useMemo(() => userAddress && contractOwner && userAddress.toLowerCase() === (contractOwner as string).toLowerCase(), [userAddress, contractOwner]);
  
  const { data: contractPrices } = useReadContracts({
    contracts: [
      { address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'slotPrice' },
      ...[0,1,2,3,4,5].map(i => ({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'animalPrices', args: [i] })),
      ...[0,1,2,3,4,5].map(i => ({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'productionRates', args: [i] })),
      ...[0,1,2,3,4,5].map(i => ({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'baseUpgradePrices', args: [i] })),
      ...[0,1,2,3,4,5].map(i => ({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'products', args: [i] }))
    ],
    query: { refetchInterval: 60000 }
  });

  const { data: inventoryData } = useReadContracts({
    contracts: PRODUCT_META.map(p => ({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'userInventory', args: [userAddress, p.type] })),
    query: { enabled: !!userAddress, refetchInterval: 5000 }
  });

  const { data: allAnimalsDetails } = useReadContracts({
    contracts: (animalIdsRaw as bigint[] || []).map(id => ({ address: FARM_NFT_ADDRESS as `0x${string}`, abi: FARM_NFT_ABI, functionName: 'getAnimal', args: [id] })),
    query: { enabled: Array.isArray(animalIdsRaw) && animalIdsRaw.length > 0 }
  });

  const animalDistribution = useMemo(() => {
    const dist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (allAnimalsDetails) {
        (allAnimalsDetails as any[]).forEach((res) => {
            if (res.status === 'success' && res.result) {
                const data = res.result as any;
                const typeValue = data.animalType !== undefined ? data.animalType : data[0];
                dist[Number(typeValue)] = (dist[Number(typeValue)] || 0) + 1;
            }
        });
    }
    return dist;
  }, [allAnimalsDetails]);

  const animalIds = useMemo(() => Array.isArray(animalIdsRaw) ? (animalIdsRaw as bigint[]) : [], [animalIdsRaw]);
  const onChainCount = animalIds.length;
  const contractMax = Number(maxSlotsRaw || 0);
  const displayMax = Math.max(contractMax, localMax, 1);

  const prevOnChainCount = useRef(onChainCount);
  useEffect(() => {
    if (!userAddress) return;
    let upP = [...localPending];
    let upM = localMax;
    if (contractMax > 0 && localMax > contractMax + 1) { upM = contractMax; upP = []; } 
    else if (contractMax >= localMax) { upM = 0; }
    if (onChainCount > prevOnChainCount.current) { upP = upP.slice(onChainCount - prevOnChainCount.current); }
    prevOnChainCount.current = onChainCount;
    const now = Date.now();
    upP = upP.filter(a => (now - a.timestamp) < 60000); 
    if (upM !== localMax || upP.length !== localPending.length) { setLocalMax(upM); setLocalPending(upP); persist(upM, upP); }
  }, [contractMax, onChainCount, localMax, localPending, userAddress, persist]);

  const performDeepSync = useCallback(async () => {
    setIsSyncing(true);
    for (let i = 0; i < 5; i++) { refetchIds(); refetchMax(); refetchBalance(); await new Promise(r => setTimeout(r, 2000)); }
    setIsSyncing(false);
  }, [refetchIds, refetchMax, refetchBalance]);

  const { writeContract, data: hash, isError: isWriteError, isPending: isMarketPending } = useWriteContract();
  const { isSuccess, isError: isTxError } = useWaitForTransactionReceipt({ hash });

  const [optimisticMax, setOptimisticMax] = useState<number>(0);
  const [optimisticPending, setOptimisticPending] = useState<StoredAnimal | null>(null);

  const getPrice = (type?: number) => {
    if (type === undefined) return contractPrices?.[0]?.result as bigint || parseEther('0.01');
    return contractPrices?.[type + 1]?.result as bigint || parseEther('0.01');
  };

  const { data: allowance } = useReadContract({ address: VIRTUAL_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'allowance', args: userAddress ? [userAddress, FARM_ENGINE_ADDRESS as `0x${string}`] : undefined });

  const handleExpand = async () => {
    const cost = getPrice();
    if (allowance === undefined || (allowance as bigint) < cost) {
        writeContract({ address: VIRTUAL_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [FARM_ENGINE_ADDRESS as `0x${string}`, maxUint256] });
        return;
    }
    setOptimisticMax(displayMax + 1);
    writeContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'expandFarm', args: [] });
  };

  const handleBuy = async (type: number) => {
    const price = getPrice(type);
    if (allowance === undefined || (allowance as bigint) < price) {
        writeContract({ address: VIRTUAL_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [FARM_ENGINE_ADDRESS as `0x${string}`, maxUint256] });
        return;
    }
    setOptimisticPending({ type, timestamp: Date.now() });
    writeContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'buyAnimal', args: [type] });
    setActiveTab('farm');
  };

  useEffect(() => {
    if (isSuccess) {
        if (optimisticMax > 0) { setLocalMax(optimisticMax); persist(optimisticMax, localPending); setOptimisticMax(0); }
        if (optimisticPending) setOptimisticPending(null);
        performDeepSync();
    }
    if (isWriteError || isTxError) { setOptimisticMax(0); setOptimisticPending(null); }
  }, [isSuccess, isWriteError, isTxError, optimisticMax, optimisticPending, localMax, localPending, persist, performDeepSync]);

  const finalDisplayMax = optimisticMax > 0 ? optimisticMax : displayMax;
  const finalPendingArray = optimisticPending ? [...localPending, optimisticPending] : localPending;
  const isFarmFull = (onChainCount + finalPendingArray.length) >= finalDisplayMax;

  return (
    <main className="min-h-screen bg-[#7dd3fc] text-[#2b1b10] font-mono selection:bg-green-500 pb-20">
      <div className="bg-[#fefce8] border-b-2 border-[#4A2F1D] py-4 px-8 flex justify-between items-center text-[10px] uppercase font-bold sticky top-0 z-[100] shadow-2xl transition-all">
        <div className="flex gap-10">
          <span className="flex items-center gap-2"><Pickaxe size={14} /> SLOTS: {Math.min(onChainCount + finalPendingArray.length, finalDisplayMax)} / {finalDisplayMax}</span>
          {isAdmin && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-green-700">TREASURY: {treasuryBalance ? parseFloat(formatEther(treasuryBalance as bigint)).toFixed(2) : '0.00'} VIRTUAL</span>
                <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded">
                  {treasuryBalance && treasuryBalance > 0 ? 'LIQUID' : 'EMPTY (NEED FUNDING)'}
                </span>
              </div>
              <span className="text-[7px] opacity-40 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => { navigator.clipboard.writeText(FARM_ENGINE_ADDRESS); alert('Copied!'); }}>CONTRACT: {FARM_ENGINE_ADDRESS}</span>
            </div>
          )}
        </div>
        <div className="flex gap-6 items-center">
            <div className="flex gap-4 mr-4 items-center border-r-2 border-[#4A2F1D]/10 pr-8">
                 <a href="https://github.com/PulsePastures" target="_blank" rel="noreferrer" className="px-10 py-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all shadow-[3px_3px_0_black] active:translate-y-1 active:shadow-none"><Github size={18} /></a>
                 <a href="https://x.com/PulsePastures" target="_blank" rel="noreferrer" className="px-10 py-2 bg-white text-black hover:bg-black hover:text-white border-2 border-black transition-all shadow-[3px_3px_0_black] active:translate-y-1 active:shadow-none">
                    <svg width="18" height="18" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M714.163 519.284L1160.89 0H1055.03L662.322 456.452L352.612 0H0L468.492 681.821L0 1226.37H105.866L520.308 744.654L847.388 1226.37H1200L714.137 519.284H714.163ZM574.187 682.02L526.732 614.076L148.248 72.3332H310.851L616.143 510.158L663.598 578.102L1055.08 1138.83H892.476L574.187 682.046V682.02Z" fill="currentColor"/>
                    </svg>
                 </a>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className={`px-4 py-1 border-2 border-[#4A2F1D] font-black tracking-widest ${isMuted ? 'bg-red-950 text-white' : 'bg-green-400 shadow-[4px_4px_0_black]'}`}>{isMuted ? 'MUTED' : 'AUDIO'}</button>
            <span className={isSyncing ? 'animate-pulse' : ''}>{isSyncing ? 'SYNCING...' : 'LIVE'}</span>
        </div>
      </div>

      <header className="max-w-[1400px] mx-auto py-4 px-12 flex flex-col items-center justify-center gap-2 mt-4 border-b-8 border-[#4A2F1D] bg-[#76b342] shadow-[15px_15px_0_rgba(74,47,29,1)] relative transition-all overflow-visible">
        {/* WALLET BUTTON - HEADER CORNER */}
        <div className="absolute top-4 right-4 z-50">
            <ConnectButton showBalance={false} />
        </div>
        
        <div className="flex flex-col items-center w-full relative">
            <motion.div 
                initial={{ scale: 0.98 }}
                animate={{ scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-4 py-2"
            >
                <div className="relative group/logo">
                    <div className="absolute inset-x-0 bottom-[-10px] h-4 bg-black/10 rounded-full blur-lg scale-90 mx-auto w-[60px]" />
                    <img src="/new-logo.jpg" alt="Logo" className="w-[130px] h-[130px] rounded-full border-8 border-[#4A2F1D] shadow-[10px_10px_0_black] relative z-10 transition-transform group-hover/logo:scale-110 object-cover" />
                </div>
                <h1 className="text-9xl font-black italic tracking-tighter skew-x-[-15deg] text-white select-none relative z-20 scale-y-110 leading-none py-4
                    drop-shadow-[4px_4px_0_#4A2F1D]
                    [text-shadow:2px_2px_0_#4A2F1D,4px_4px_0_#4A2F1D,6px_6px_0_#4A2F1D,12px_12px_0_rgba(0,0,0,0.15)]
                    uppercase text-center">
                    PulsePastures
                </h1>
            </motion.div>
            <div className="scale-110 mt-4 z-30 transform hover:scale-125 transition-transform flex flex-col items-center gap-2">
                <UserProfile address={userAddress} balance={virtualBalance ? formatEther(virtualBalance as bigint) : '0'} hideConnect={true} />
            </div>
        </div>
      </header>


      <div className="max-w-7xl mx-auto p-12 space-y-16">
        {/* HOW TO PLAY GUIDE - VIBRANT VERSION */}
        <div className="bg-yellow-400 p-1 border-8 border-[#4A2F1D] shadow-[15px_15px_0_black] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/40 animate-pulse" />
            <div className="bg-[#facc15] border-2 border-white/20 p-10 flex flex-col md:flex-row items-center gap-12 relative z-10">
                <div className="flex flex-col gap-2 min-w-[250px] transform -rotate-1">
                    <h2 className="text-5xl font-black italic uppercase text-black tracking-tighter drop-shadow-[4px_4px_0_white]">How To Play?</h2>
                    <p className="text-[12px] font-black bg-black text-yellow-400 px-3 py-1 uppercase tracking-widest inline-block w-fit">Quick Start Protocol</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full font-black">
                    {[
                        { step: "01", title: "CONNECT WALLET", desc: "Start your mission on Base Network using VIRTUAL tokens." },
                        { step: "02", title: "BUY ANIMALS", desc: "Acquire livestock from the EXCHANGE terminal to begin." },
                        { step: "03", title: "DAILY HARVEST", desc: "Collect 24h yields and stack your inventory high." },
                        { step: "04", title: "TRADE & EARN", desc: "Sell products at the Merchant Hub for $VIRTUAL profit!" }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col gap-4 p-4 bg-black/5 border-2 border-black/10 hover:bg-white/20 hover:scale-105 transition-all cursor-default">
                            <div className="flex items-center gap-4 border-b-4 border-black/20 pb-2">
                                <span className="text-xs font-black bg-black text-white px-2 py-0.5">{item.step}</span>
                                <h4 className="text-lg italic uppercase leading-none">{item.title}</h4>
                            </div>
                            <p className="text-[11px] leading-tight opacity-80">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          <TabButton active={activeTab === 'farm'} onClick={() => setActiveTab('farm')} label="UNIT STABLES" icon={<LayoutGrid size={40} />} />
          <TabButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} label="EXCHANGE" icon={<ArrowLeftRight size={40} />} />
        </div>

        {activeTab === 'farm' ? (
          <div className="space-y-20">
            <div className="bg-[#fefce8] border-8 border-[#4A2F1D] p-12 flex flex-col md:flex-row justify-between items-center gap-12 shadow-[15px_15px_0_rgba(101,67,33,1)]">
                <div className="text-6xl font-black italic uppercase">REACH: {Math.min(onChainCount + finalPendingArray.length, finalDisplayMax)} / {finalDisplayMax}</div>
                <button onClick={handleExpand} disabled={finalDisplayMax >= 100 || isMarketPending} className="px-16 py-8 border-8 border-[#4A2F1D] font-black text-3xl uppercase italic bg-purple-800 text-white shadow-[10px_10px_0_black] hover:translate-y-2 hover:shadow-none transition-all disabled:opacity-50">
                    {isMarketPending ? 'EXPANDING...' : '+ EXPAND HUB'}
                    <span className="text-[10px] block mt-2 opacity-60">COST: {formatEther(getPrice())} VIRTUAL</span>
                </button>
            </div>

            {isAdmin && <AdminHUD contractPrices={contractPrices} treasuryBalance={treasuryBalance} writeContract={writeContract} userAddress={userAddress} contractOwner={contractOwner} />}
            
            {/* NEW TIDY IDENTITY SECTION */}
            <div className="bg-[#fefce8] border-8 border-[#4A2F1D] p-6 shadow-[10px_10px_0_black] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 opacity-5">
                   <User size={80} />
                </div>
                <div className="flex flex-col relative z-10">
                    <h3 className="font-black text-2xl italic uppercase text-amber-950 flex items-center gap-3">
                        <BadgeCheck className="text-blue-600" />
                        IDENTITY TERMINAL
                    </h3>
                    <p className="text-[10px] font-black opacity-40 tracking-widest bg-amber-950/5 px-2 py-0.5 inline-block w-fit">BASE NETWORK REGISTRY PROTOCOL v1.0</p>
                </div>
                <div className="flex flex-1 max-w-xl w-full gap-4 relative z-10">
                    <input 
                        type="text" 
                        placeholder="ENTER YOUR ON-CHAIN ALIAS..." 
                        className="flex-1 bg-white border-4 border-[#4A2F1D] px-6 py-3 font-black italic uppercase text-sm shadow-[4px_4px_0_black] outline-none hover:bg-amber-50 focus:translate-y-1 focus:shadow-none transition-all placeholder:opacity-30"
                    />
                    <button className="bg-black text-white px-10 py-3 font-black italic uppercase text-sm border-4 border-[#4A2F1D] shadow-[4px_4px_0_black] hover:bg-green-500 hover:text-black transition-all active:translate-y-1 active:shadow-none">
                        REGISTER NAME
                    </button>
                </div>
            </div>

            <VisualFarm distribution={animalDistribution} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
               {Array.from({ length: finalDisplayMax }).map((_, i) => {
                   const tid = animalIds[i];
                   if (tid !== undefined) return <AnimalSlot key={tid.toString()} tokenId={tid} allowance={allowance as bigint} contractPrices={contractPrices} onHover={() => playSFX('https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3')} />;
                   const pIdx = i - onChainCount;
                   if (pIdx >= 0 && pIdx < finalPendingArray.length) return <PendingSlot key={`p-${i}`} type={finalPendingArray[pIdx].type} />;
                   return <EmptySlot key={`e-${i}`} onClick={() => { setActiveTab('market'); setMarketSubTab('animals'); }} />;
               })}
            </div>
          </div>
        ) : (
          <div className="space-y-20">
             <div className="flex gap-8 border-b-8 border-[#4A2F1D] pb-10">
                <TabSubButton active={marketSubTab === 'animals'} onClick={() => setMarketSubTab('animals')} label="LIVESTOCK" />
                <TabSubButton active={marketSubTab === 'products'} onClick={() => setMarketSubTab('products')} label="MERCHANT" />
             </div>
             {marketSubTab === 'animals' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
                     {Object.keys(ANIMAL_META).map((tk) => (
                         <StoreItem key={tk} type={Number(tk)} balance={virtualBalance?.toString()} allowance={allowance as bigint} contractPrice={contractPrices?.[Number(tk) + 1]?.result as bigint} isFarmFull={isFarmFull} onBuy={handleBuy} />
                     ))}
                </div>
             ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
                    {PRODUCT_META.map((prod, idx) => {
                        const contractPayout = (contractPrices?.[19 + idx]?.result as any)?.[1] || parseEther('0.001');
                        return <ProductItem key={idx} product={prod} userAddress={userAddress} onSellSuccess={() => { refetchVirtual(); refetchTreasury(); }} inventoryValue={inventoryData?.[idx]?.result as bigint} price={formatEther(contractPayout)} />;
                    })}
                </div>
             )}
          </div>
        )}
      </div>
      <iframe src="https://www.youtube.com/embed/meCz727ZJ5w?autoplay=1&mute=1" className="hidden" />
    </main>
  );
}

function AdminHUD({ contractPrices, treasuryBalance, writeContract, userAddress, contractOwner }: any) {
    const [withdrawPercent, setWithdrawPercent] = useState(100);

    const handleSyncAll = () => {
        try {
            const slotEl = document.getElementById('slot-px') as HTMLInputElement;
            if (!slotEl) throw new Error("Slot price input missing");
            const slotPx = parseEther(slotEl.value || "0.01");

            const animalP = [0,1,2,3,4,5].map(i => {
                const el = document.getElementById(`set-0-${i}`) as HTMLInputElement;
                return parseEther(el?.value || "0.01");
            });
            const yieldR = [0,1,2,3,4,5].map(i => {
                const el = document.getElementById(`set-1-${i}`) as HTMLInputElement;
                return BigInt(Math.floor(Number(el?.value || 1)));
            });
            const upBase = [0,1,2,3,4,5].map(i => {
                const el = document.getElementById(`set-2-${i}`) as HTMLInputElement;
                return parseEther(el?.value || "0.01");
            });
            const prodP = [0,1,2,3,4,5].map(i => {
                const el = document.getElementById(`set-3-${i}`) as HTMLInputElement;
                return parseEther(el?.value || "0.001");
            });
            
            writeContract({
                address: FARM_ENGINE_ADDRESS as `0x${string}`,
                abi: FARM_ENGINE_ABI,
                functionName: 'setEconomy',
                args: [slotPx, animalP, yieldR, upBase, prodP],
                gas: BigInt(800000) // Explicitly providing gas to avoid estimation failure
            });
        } catch (e: any) {
            alert("Error in inputs: " + e.message);
        }
    };

    const handleIndividualSync = (col: number, idx: number, value: string) => {
        const val = col === 1 ? BigInt(Math.floor(Number(value))) : parseEther(value);
        const method = col === 0 ? 'setAnimalPrice' : col === 1 ? 'setProductionRate' : col === 2 ? 'setBaseUpgradePrice' : 'setProductPrice';
        
        writeContract({
            address: FARM_ENGINE_ADDRESS as `0x${string}`,
            abi: FARM_ENGINE_ABI,
            functionName: method,
            args: [Number(idx), val],
            gas: BigInt(200000)
        });
    };

    return (
        <div className="bg-red-600/10 border-8 border-[#4A2F1D] p-10 flex flex-col gap-8 shadow-[15px_15px_0_red]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#4A2F1D] pb-6 gap-6">
                <div className="flex flex-col gap-1">
                  <h3 className="font-black text-3xl italic uppercase text-red-600">Administrator Command</h3>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[9px] uppercase font-bold flex gap-2">
                        <span className="opacity-40">Connected:</span> 
                        <span className={userAddress?.toLowerCase() === (contractOwner as string)?.toLowerCase() ? 'text-green-600' : 'text-red-500'}>{userAddress?.slice(0,6)}...{userAddress?.slice(-4)}</span>
                        <span className="opacity-40">/ Owner:</span>
                        <span className="text-blue-600">{(contractOwner as string)?.slice(0,6)}...{(contractOwner as string)?.slice(-4)}</span>
                    </div>
                    <div className="text-[8px] opacity-30 uppercase font-black tracking-tighter">Contract: {FARM_ENGINE_ADDRESS}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <div className="flex gap-2 mb-2">
                        {[25, 50, 75, 100].map(p => (
                            <button key={p} onClick={() => setWithdrawPercent(p)} className={`px-2 py-1 text-[8px] font-black border-2 border-[#4A2F1D] ${withdrawPercent === p ? 'bg-green-500' : 'bg-white'}`}>{p}%</button>
                        ))}
                    </div>
                    <div className="flex gap-4 w-full md:w-auto items-center bg-[#4A2F1D]/5 p-1 rounded-lg border-2 border-[#4A2F1D]/10">
                        <div className="flex flex-col gap-1 items-center">
                            <span className="text-[7px] font-black opacity-40 uppercase">Slot Price</span>
                            <div className="flex gap-1 group">
                                <input id="slot-px" className="w-20 p-1 border-2 border-[#4A2F1D] font-black text-xs rounded" defaultValue={formatEther(contractPrices?.[0]?.result || parseEther('0.01'))} />
                                <button 
                                    onClick={() => {
                                        const val = parseEther((document.getElementById('slot-px') as HTMLInputElement).value);
                                        writeContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'setSlotPrice', args: [val], gas: BigInt(100000) });
                                    }}
                                    className="bg-blue-600 text-white px-2 py-1 text-[8px] font-black uppercase hover:bg-blue-500 rounded active:scale-95 transition-all">
                                    SET
                                </button>
                            </div>
                        </div>
                        <div className="w-[1px] h-8 bg-[#4A2F1D]/20 mx-2" />
                        <button 
                            disabled={!treasuryBalance || (treasuryBalance as bigint) === BigInt(0)}
                            onClick={() => {
                                const amount = (treasuryBalance as bigint || BigInt(0)) * BigInt(withdrawPercent) / BigInt(100);
                                writeContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'withdrawVirtual', args: [amount] });
                            }} 
                            className={`px-6 py-3 font-black border-4 border-[#4A2F1D] ${(!treasuryBalance || (treasuryBalance as bigint) === BigInt(0)) ? 'bg-gray-400 text-gray-700 opacity-50' : 'bg-black text-white hover:bg-gray-900 cursor-pointer shadow-[4px_4px_0_black] hover:translate-y-1 hover:shadow-none transition-all'}`}>
                            {(!treasuryBalance || (treasuryBalance as bigint) === BigInt(0)) ? 'EMPTY TREASURY' : `WITHDRAW (${withdrawPercent}%)`}
                        </button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 opacity-70 hover:opacity-100 transition-opacity text-xs italic">
                {[0,1,2,3].map(col => (
                    <div key={col} className="flex flex-col gap-4">
                        <h4 className="font-black text-[10px] mb-2 uppercase text-center bg-[#4A2F1D] text-white py-1">{col === 0 ? 'ANIMAL PRICES' : col === 1 ? 'DAILY YIELD' : col === 2 ? 'UPGRADE BASE' : 'PRODUCT PAYOUT'}</h4>
                        {Object.entries(ANIMAL_META).map(([idx, meta]) => (
                            <div key={idx} className="flex flex-col gap-1 group relative">
                                <div className="flex items-center gap-2 bg-white/10 p-1 rounded border border-transparent hover:border-green-500/50 transition-all">
                                    <span className="text-xl w-8 text-center">{meta.emoji}</span>
                                    <input 
                                        id={`set-${col}-${idx}`} 
                                        className="flex-1 min-w-0 bg-transparent text-[10px] font-bold outline-none" 
                                        defaultValue={col === 0 ? formatEther(getPrice(idx, contractPrices, 1)) : col === 1 ? Number(contractPrices?.[Number(idx) + 7]?.result || 1) : col === 2 ? formatEther(getPrice(idx, contractPrices, 13)) : formatEther((contractPrices?.[19 + Number(idx)]?.result as any)?.[1] || parseEther('0.001'))} 
                                    />
                                    <button 
                                        onClick={() => handleIndividualSync(col, Number(idx), (document.getElementById(`set-${col}-${idx}`) as HTMLInputElement).value)}
                                        className="bg-green-600 text-white px-2 py-1 text-[8px] font-black uppercase hover:bg-green-500 active:scale-95 transition-all rounded">
                                        SET
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function getPrice(idx: string, data: any, offset: number) {
    return data?.[Number(idx) + offset]?.result || parseEther('0.01');
}

function AnimalSlot({ tokenId, allowance, contractPrices, onHover }: any) {
  const { data: rawData, status, refetch } = useReadContract({ address: FARM_NFT_ADDRESS as `0x${string}`, abi: FARM_NFT_ABI, functionName: 'getAnimal', args: [tokenId] });
  const { writeContract, isPending, isSuccess } = useWriteContract();
  const [readyAmount, setReadyAmount] = useState(0);
  const animalData = status === 'success' ? (rawData as any) : null;
  
  useEffect(() => {
    if (!animalData || !contractPrices) return;
    const type = Number(animalData.animalType !== undefined ? animalData.animalType : animalData[0]);
    const itv = setInterval(() => {
        const last = Number(animalData.lastHarvest || animalData[2]) * 1000;
        const lvl = Number(animalData.level || animalData[3] || 1);
        const rate = Number(contractPrices?.[7 + type]?.result || 1);
        const ms = (86400 / rate / lvl) * 1000;
        const total = Math.floor((Date.now() - last) / ms);
        setReadyAmount(total > 30 * lvl * rate ? 30 * lvl * rate : total);
    }, 1000);
    return () => clearInterval(itv);
  }, [animalData, contractPrices]);

  useEffect(() => { if (isSuccess) refetch(); }, [isSuccess, refetch]);

  if (status === 'pending' || !animalData) return <LoadingSlot i={tokenId.toString()} />;
  const type = Number(animalData.animalType !== undefined ? animalData.animalType : animalData[0]);
  const level = Number(animalData.level || animalData[3] || 1);
  const meta = ANIMAL_META[type] || { emoji: "❓", name: "UNIT" };
  const baseUp = contractPrices?.[type + 13]?.result as bigint || parseEther('0.01');
  const upCost = baseUp * BigInt(Math.pow(2, level - 1));

  const handleUpgrade = () => {
    if (allowance < upCost) { writeContract({ address: VIRTUAL_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [FARM_ENGINE_ADDRESS as `0x${string}`, maxUint256] }); return; }
    writeContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'levelUpAnimal', args: [tokenId] });
  };

  return (
    <motion.div onMouseEnter={onHover} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#fefce8] border-8 border-[#4A2F1D] p-10 shadow-[15px_15px_0_black] flex flex-col items-center justify-center min-h-[500px] relative">
        <div className="absolute top-0 left-0 bg-green-500 p-4 font-black border-r-8 border-b-8 border-[#4A2F1D]">L{level}</div>
        <div className="text-[10rem] mb-6 drop-shadow-xl">{meta.emoji}</div>
        <h3 className="font-black text-3xl uppercase mb-10 italic">{meta.name}</h3>
        <div className="flex w-full gap-4">
            <button onClick={() => writeContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'harvest', args: [tokenId] })} disabled={readyAmount === 0 || isPending} className={`flex-1 py-4 border-8 border-[#4A2F1D] font-black text-2xl shadow-[4px_4px_0_black] ${readyAmount > 0 ? 'bg-green-600' : 'bg-black text-gray-800'}`}>{isPending ? 'SYNC' : `+${readyAmount}`}</button>
            <button onClick={handleUpgrade} disabled={level >= 10 || isPending} className="px-2 py-4 border-8 border-[#4A2F1D] font-black italic bg-yellow-400 text-black w-1/3 text-[10px]">UP ▲ <br/> {level < 10 ? `${formatEther(upCost)}V` : 'MAX'}</button>
        </div>
    </motion.div>
  );
}

function StoreItem({ type, balance, allowance, contractPrice, isFarmFull, onBuy }: any) {
    const meta = ANIMAL_META[type];
    const px = contractPrice || parseEther('0.01');
    const hasEnough = balance ? BigInt(balance) >= px : false;
    const dis = !hasEnough || isFarmFull;
    return (
        <button onClick={() => onBuy(type)} disabled={dis} className={`p-10 border-8 border-[#4A2F1D] shadow-[15px_15px_0_black] flex flex-col items-center justify-center min-h-[500px] w-full ${dis ? 'bg-black opacity-40 grayscale' : 'bg-[#fefce8] hover:bg-[#76b342]'}`}>
            <div className="text-9xl mb-10">{meta.emoji}</div>
            <div className="font-black text-3xl uppercase italic mb-6">{meta.name}</div>
            <div className="w-full bg-[#4A2F1D] text-green-400 p-4 font-black text-xl italic">{isFarmFull ? 'FULL' : `${formatEther(px)} VIRTUAL`}</div>
        </button>
    );
}

function ProductItem({ product, userAddress, onSellSuccess, inventoryValue, price }: any) {
    const { writeContract, isPending, isSuccess } = useWriteContract();
    const amt = inventoryValue || BigInt(0);
    useEffect(() => { if (isSuccess) onSellSuccess?.(); }, [isSuccess]);
    return (
        <div className="bg-[#fefce8] border-8 border-[#4A2F1D] p-10 flex flex-col items-center justify-center min-h-[500px] shadow-[15px_15px_0_black] relative">
            <div className="absolute top-4 right-4 bg-black text-white font-black px-4 py-1 text-xs">STOCK: {amt.toString()}</div>
            <div className="text-8xl mb-6">{product.emoji}</div>
            <h3 className="font-black text-2xl italic uppercase mb-2">{product.name}</h3>
            <div className="flex flex-col items-center mb-10">
                <span className="text-[8px] font-black opacity-40 uppercase tracking-tighter mb-1 select-none">Exchange Value</span>
                <div className="bg-[#4A2F1D] text-green-400 px-6 py-2 font-black text-2xl italic border-4 border-black/10 shadow-[6px_6px_0_green-600/20] transform -rotate-1">
                    {price} VIRTUAL
                </div>
            </div>
            <button onClick={() => writeContract({ address: FARM_ENGINE_ADDRESS as `0x${string}`, abi: FARM_ENGINE_ABI, functionName: 'sellProduct', args: [product.type, amt] })} disabled={amt === BigInt(0) || isPending} className="w-full py-6 bg-green-700 text-white font-black text-2xl border-8 border-[#4A2F1D] shadow-[6px_6px_0_black] disabled:bg-black disabled:opacity-40">{isPending ? 'SYNC' : `SELL ALL (${(Number(amt) * parseFloat(price)).toFixed(2)})`}</button>
        </div>
    );
}

function UserProfile({ address, balance, hideConnect }: any) {
    if (!address) return !hideConnect ? <ConnectButton /> : null;
    return (
        <div className="bg-[#4A2F1D]/10 border-4 border-[#4A2F1D] p-3 px-8 flex items-center gap-6 shadow-[5px_5px_0_rgba(74,47,29,0.3)] group transition-all">
            <div className="flex flex-col items-end leading-none">
                <span className="font-black text-2xl italic text-amber-950">{parseFloat(balance).toFixed(2)} VIRTUAL</span>
            </div>
            {!hideConnect && <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />}
        </div>
    );
}

function EmptySlot({ onClick }: any) {
    return (
      <div onClick={onClick} className="bg-black/5 border-8 border-dashed border-[#4A2F1D] flex flex-col items-center justify-center min-h-[500px] cursor-pointer hover:bg-black/10 transition-all">
        <div className="text-9xl mb-6 opacity-20">+</div>
        <span className="font-black opacity-20 text-xl uppercase italic">VACANT SLOT</span>
      </div>
    );
}

function PendingSlot({ type }: any) {
    const meta = ANIMAL_META[type] || { emoji: "❓" };
    return (
        <div className="bg-[#fefce8] border-8 border-[#4A2F1D] p-12 flex flex-col items-center justify-center min-h-[500px] shadow-[15px_15px_0_black]">
            <div className="text-9xl animate-bounce">{meta.emoji}</div>
            <div className="uppercase font-black opacity-40">INDEXING...</div>
        </div>
    );
}

function LoadingSlot({ i }: any) {
    return <div key={i} className="bg-black/5 border-8 border-[#4A2F1D] flex flex-col items-center justify-center min-h-[500px]"><div className="w-12 h-12 border-4 border-[#4A2F1D] border-t-cyan-600 rounded-full animate-spin" /></div>;
}

function VisualFarm({ distribution }: any) {
    return (
      <div className="bg-black/90 border-8 border-[#4A2F1D] p-6 shadow-[10px_10px_0_black] mb-12">
        <div className="grid grid-cols-6 gap-4">
          {PRODUCT_META.map((prod) => (
              <div key={prod.type} className="bg-white/5 p-2 border-2 border-[#4A2F1D] flex flex-col items-center justify-center">
                  <span className="text-3xl">{ANIMAL_META[prod.type]?.emoji}</span>
                  <span className="text-[8px] font-black mt-1 text-green-500">{distribution[prod.type] || 0}U</span>
              </div>
          ))}
        </div>
      </div>
    );
}

function TabButton({ active, onClick, label, icon }: any) {
    return (
      <button onClick={onClick} className={`flex-1 py-8 border-8 border-[#4A2F1D] font-black text-3xl uppercase italic flex items-center justify-center gap-6 transition-all ${active ? 'bg-green-400 translate-y-2' : 'bg-white shadow-[10px_10px_0_black] hover:translate-y-1'}`}>{icon} {label}</button>
    );
}

function TabSubButton({ active, onClick, label }: any) {
    return <button onClick={onClick} className={`px-10 py-3 font-black uppercase border-4 border-[#4A2F1D] ${active ? 'bg-green-400 translate-y-1 shadow-none' : 'bg-white shadow-[4px_4px_0_black]'}`}>{label}</button>;
}
