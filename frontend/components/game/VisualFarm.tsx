"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Animal {
  type: string;
  emoji: string;
}

export default function VisualFarm({ animals }: { animals: Animal[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-64 bg-[#5da130] border-8 border-[#3d251e]" />;

  return (
    <div className="relative w-full h-64 bg-[#5da130] border-8 border-[#3d251e] overflow-hidden shadow-[inset_0_8px_0_0_rgba(0,0,0,0.2)]">
      {/* Grass Tufts */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2d5a1e 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
      
      {/* Fence */}
      <div className="absolute bottom-0 w-full h-4 bg-[#8b4513] border-t-4 border-black" />
      <div className="absolute top-0 w-full h-2 bg-[#8b4513] border-b-2 border-black opacity-30" />

      {/* Render Animals */}
      {animals.map((animal, i) => (
        <WanderingAnimal key={`${animal.type}-${i}`} emoji={animal.emoji} delay={i * 0.5} />
      ))}

      {/* Farm Decor */}
      <div className="absolute top-4 left-[10%] text-4xl opacity-40">🌳</div>
      <div className="absolute bottom-[20%] right-[15%] text-3xl opacity-30">🌻</div>
      <div className="absolute top-[10%] right-[30%] text-2xl opacity-25">🪵</div>
    </div>
  );
}

function WanderingAnimal({ emoji, delay }: { emoji: string; delay: number }) {
  const [target, setTarget] = useState({ 
    x: Math.random() * 80 + 10, 
    y: Math.random() * 60 + 20 
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTarget({
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20
      });
    }, 3000 + Math.random() * 3000); // New target every 3-6 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      animate={{
        left: `${target.x}%`,
        top: `${target.y}%`,
        rotate: [0, -5, 5, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        left: { duration: 4 + Math.random() * 2, ease: "easeInOut" },
        top: { duration: 4 + Math.random() * 2, ease: "easeInOut" },
        rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 2 + Math.random() * 3 },
        scale: { duration: 2, repeat: Infinity }
      }}
      className="absolute text-5xl cursor-pointer drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] select-none z-10 -translate-x-1/2 -translate-y-1/2"
      whileHover={{ scale: 1.4, zIndex: 100 }}
    >
      {emoji}
    </motion.div>
  );
}
