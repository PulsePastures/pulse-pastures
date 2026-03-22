"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  msg: string;
  type: "attack" | "status" | "win";
}

export default function BattleArena() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Simulation for the vision - in reality, this would be a WebSocket listener for Somnia events
  const addLog = (msg: string, type: LogEntry["type"]) => {
    setLogs(prev => [{ id: Math.random().toString(), msg, type }, ...prev].slice(0, 5));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Arena Header */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col">
          <span className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
            Live Arena Session
          </span>
          <h2 className="text-2xl font-black text-white italic">SOMNIA TESTNET ARENA</h2>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-cyan-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Swords size={18} />
          FIND MATCH
        </button>
      </div>

      {/* Battle Status Logs */}
      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-sm shadow-inner">
        <div className="mb-4 flex items-center gap-2 text-gray-400">
          <Terminal size={14} />
          <span className="text-[10px] uppercase font-bold tracking-widest">Real-Time Battle Feed</span>
        </div>
        
        <div className="flex flex-col gap-2 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {logs.length === 0 ? (
              <span className="text-gray-600 italic">Waiting for on-chain trigger...</span>
            ) : (
              logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "flex gap-2 rounded border-l-2 p-2",
                    log.type === "attack" ? "border-red-500 bg-red-500/5 text-red-100" :
                    log.type === "win" ? "border-yellow-500 bg-yellow-500/5 text-yellow-100" :
                    "border-blue-500 bg-blue-500/5 text-blue-100"
                  )}
                >
                  <span className="text-gray-500">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                  <span>{log.msg}</span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
