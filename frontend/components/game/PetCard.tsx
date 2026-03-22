"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface PetProps {
  name: string;
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    hp: number;
    level: number;
  };
  image: string;
  active?: boolean;
}

export default function PetCard({ name, stats, image, active }: PetProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "relative rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl transition-all",
        active ? "ring-2 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]" : ""
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-cyan-900/40 to-purple-900/40">
        <img src={image} alt={name} className="h-full w-full object-cover mix-blend-lighten" />
        <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-cyan-400">
          Lv. {stats.level}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <h3 className="text-lg font-bold text-white">{name}</h3>
        
        {/* Health Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider">
            <span>HP Status</span>
            <span>{stats.hp}/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.hp}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox icon={<Zap size={12} />} label="STR" value={stats.strength} color="text-orange-400" />
          <StatBox icon={<Shield size={12} />} label="AGI" value={stats.agility} color="text-green-400" />
          <StatBox icon={<Brain size={12} />} label="INT" value={stats.intelligence} color="text-purple-400" />
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white/5 p-2">
      <div className={cn("mb-1", color)}>{icon}</div>
      <span className="text-[10px] text-gray-500 font-bold">{label}</span>
      <span className="text-xs text-white font-mono">{value}</span>
    </div>
  );
}
