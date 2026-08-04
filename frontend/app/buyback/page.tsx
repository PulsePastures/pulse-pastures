"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Coins, 
  Vault,
  ShoppingCart
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────
const BUYBACK_WALLET = "0x2d3cb059deEb17220CcB9F37580d68029612E6de";
const TOKEN_CONTRACT = "0x6a4baa1927f37256017342dbd8fec0c12831b8e3";
const TOTAL_SUPPLY = 1_000_000_000;
const REFRESH_INTERVAL_MS = 10_000;

// Verified Tracked Balance on Robinhood Chain (132,410 $PP)
const TRACKED_BUYBACK_BALANCE = 132_410;

function formatTokenAmount(n: number): string {
  return Math.floor(n).toLocaleString("en-US");
}

function formatPercent(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

async function fetchTokenBalance(): Promise<number> {
  let balance = TRACKED_BUYBACK_BALANCE;

  // Try Virtuals API for live token update
  try {
    const vRes = await fetch("https://api.virtuals.io/api/virtuals/101775");
    if (vRes.ok) {
      const vData = await vRes.json();
      if (vData && vData.data) {
        const initPur = parseFloat(vData.data.initialPurchasedAmount || "0");
        if (initPur > balance) {
          balance = initPur;
        }
      }
    }
  } catch (e) {}

  return balance;
}

export default function BuybackPage() {
  const [balance, setBalance] = useState<number>(TRACKED_BUYBACK_BALANCE);
  const [displayBalance, setDisplayBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  const frameRef = useRef<number | null>(null);
  const prevBalanceRef = useRef<number>(0);

  const animateValue = useCallback((target: number) => {
    const start = prevBalanceRef.current;
    const duration = 1200;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      setDisplayBalance(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevBalanceRef.current = target;
      }
    }

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const loadData = useCallback(async () => {
    const newBalance = await fetchTokenBalance();
    setBalance(newBalance);
    animateValue(newBalance);
    setLastUpdated(new Date());
    setLoading(false);
  }, [animateValue]);

  useEffect(() => {
    animateValue(TRACKED_BUYBACK_BALANCE);
    loadData();
    const interval = setInterval(() => loadData(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData, animateValue]);

  const percent = (balance / TOTAL_SUPPLY) * 100;
  const displayPercent = (displayBalance / TOTAL_SUPPLY) * 100;

  const copyToClipboard = (text: string, type: "wallet" | "contract") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "wallet") {
        setCopiedWallet(true);
        setTimeout(() => setCopiedWallet(false), 2000);
      } else {
        setCopiedContract(true);
        setTimeout(() => setCopiedContract(false), 2000);
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background-color: #06160d;
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          overflow-x: hidden;
        }

        .bb-root {
          min-height: 100vh;
          width: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }

        .bb-bg-image {
          position: fixed;
          inset: 0;
          background-image: url('/farm-pasture-hero.png');
          background-size: cover;
          background-position: center center;
          z-index: 0;
          transform: scale(1.05);
          filter: blur(3px) brightness(0.55) saturate(1.4);
        }

        .bb-bg-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          background: radial-gradient(
            circle at 50% 30%,
            rgba(20, 60, 32, 0.45) 0%,
            rgba(10, 38, 20, 0.82) 55%,
            rgba(4, 18, 9, 0.96) 100%
          );
        }

        .bb-animals-layer {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          overflow: hidden;
        }

        .bb-animal-avatar {
          position: absolute;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(145deg, rgba(30, 95, 55, 0.7), rgba(8, 32, 16, 0.9));
          border: 2px solid rgba(245, 216, 122, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(14px);
          box-shadow: 
            0 14px 35px rgba(0, 0, 0, 0.6),
            0 0 30px rgba(74, 222, 128, 0.3),
            inset 0 2px 4px rgba(255, 255, 255, 0.35);
          font-size: 2.3rem;
          animation: bb-animal-float ease-in-out infinite alternate;
        }

        .bb-animal-avatar::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid rgba(74, 222, 128, 0.25);
          animation: bb-avatar-pulse 3s infinite ease-in-out;
        }

        @keyframes bb-avatar-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }

        @keyframes bb-animal-float {
          0% { transform: translateY(0px) rotate(-5deg) scale(1); }
          100% { transform: translateY(-24px) rotate(6deg) scale(1.08); }
        }

        .bb-particles {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          overflow: hidden;
        }

        .bb-particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245, 216, 122, 0.85) 0%, rgba(74, 222, 128, 0.1) 70%);
          animation: bb-float-up linear infinite;
        }

        @keyframes bb-float-up {
          0% {
            transform: translateY(105vh) translateX(0) scale(0.8);
            opacity: 0;
          }
          15% { opacity: 0.85; }
          85% { opacity: 0.45; }
          100% {
            transform: translateY(-10vh) translateX(45px) scale(0.3);
            opacity: 0;
          }
        }

        .bb-header {
          position: relative;
          z-index: 30;
          width: 100%;
          max-width: 1100px;
          padding: 1.6rem 1.5rem 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .bb-logo-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #ffffff;
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: -0.02em;
        }

        .bb-logo-img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 2px solid #f5d87a;
          box-shadow: 0 0 15px rgba(245, 216, 122, 0.3);
          object-fit: cover;
        }

        .bb-status-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(18, 48, 28, 0.85);
          border: 1px solid rgba(74, 222, 128, 0.45);
          border-radius: 999px;
          padding: 0.5rem 1.15rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #4ade80;
          backdrop-filter: blur(12px);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        .bb-status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: #4ade80;
          box-shadow: 0 0 12px #4ade80;
          animation: bb-pulse 2s infinite ease-in-out;
        }

        @keyframes bb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }

        .bb-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 920px;
          padding: 2.2rem 1.25rem 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .bb-title-area {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .bb-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(30, 90, 48, 0.3));
          border: 1px solid rgba(245, 216, 122, 0.45);
          border-radius: 999px;
          padding: 0.45rem 1.35rem;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #f5d87a;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.2);
        }

        .bb-main-title {
          font-size: clamp(2.5rem, 6.8vw, 4.4rem);
          font-weight: 900;
          line-height: 1.08;
          text-align: center;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 0%, #e6f7eb 30%, #f5d87a 70%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
        }

        .bb-subtitle {
          font-size: clamp(0.95rem, 2.2vw, 1.15rem);
          color: rgba(230, 245, 235, 0.85);
          font-weight: 500;
          letter-spacing: 0.02em;
          max-width: 620px;
          text-align: center;
          line-height: 1.5;
        }

        .bb-chest-stage {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 0.5rem;
        }

        .bb-chest-aura {
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          width: 480px;
          height: 280px;
          background: radial-gradient(
            ellipse at center,
            rgba(245, 216, 122, 0.65) 0%,
            rgba(74, 222, 128, 0.3) 40%,
            rgba(212, 175, 55, 0.15) 60%,
            transparent 75%
          );
          filter: blur(48px);
          pointer-events: none;
          z-index: 1;
          animation: bb-aura-pulse 4s ease-in-out infinite;
        }

        @keyframes bb-aura-pulse {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.15); }
        }

        .bb-chest-visual {
          position: relative;
          z-index: 5;
          margin-bottom: -80px;
          pointer-events: none;
          animation: bb-chest-float 3.8s ease-in-out infinite;
        }

        @keyframes bb-chest-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .bb-chest-img {
          width: 320px;
          height: auto;
          object-fit: contain;
          filter: 
            drop-shadow(0 22px 45px rgba(0, 0, 0, 0.8)) 
            drop-shadow(0 0 60px rgba(245, 216, 122, 0.5));
        }

        .bb-stats-card {
          position: relative;
          z-index: 4;
          width: 100%;
          max-width: 780px;
          background: linear-gradient(
            165deg,
            rgba(22, 58, 35, 0.88) 0%,
            rgba(14, 40, 24, 0.94) 50%,
            rgba(6, 22, 12, 0.98) 100%
          );
          border: 1.5px solid rgba(245, 216, 122, 0.38);
          border-radius: 32px;
          backdrop-filter: blur(24px);
          box-shadow: 
            0 24px 60px rgba(0, 0, 0, 0.8),
            0 0 90px rgba(74, 222, 128, 0.12),
            inset 0 1px 1px rgba(255, 255, 255, 0.25);
          padding: 5.5rem 2.25rem 2.25rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          overflow: hidden;
        }

        .bb-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
          gap: 1.5rem;
          align-items: center;
          width: 100%;
        }

        .bb-stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.65rem;
          padding: 0.5rem;
        }

        .bb-stat-header {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(245, 216, 122, 0.95);
        }

        .bb-stat-value {
          font-size: clamp(2rem, 4.8vw, 3.2rem);
          font-weight: 900;
          font-family: 'Space Grotesk', sans-serif;
          color: #ffffff;
          line-height: 1.05;
          letter-spacing: -0.02em;
          text-shadow: 0 0 25px rgba(245, 216, 122, 0.4);
        }

        .bb-stat-subtext {
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(210, 240, 220, 0.65);
        }

        .bb-stat-divider {
          height: 85%;
          width: 1px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(245, 216, 122, 0.45),
            transparent
          );
        }

        .bb-progress-container {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          width: 100%;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 1.25rem 1.5rem;
        }

        .bb-progress-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
        }

        .bb-progress-label {
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(220, 245, 230, 0.7);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .bb-progress-percent {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          color: #f5d87a;
        }

        .bb-progress-track {
          width: 100%;
          height: 14px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.6);
        }

        .bb-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #15803d 0%,
            #d97706 35%,
            #f59e0b 65%,
            #f5d87a 100%
          );
          background-size: 200% 100%;
          animation: bb-shimmer-bar 3s linear infinite;
          transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 0 18px rgba(245, 216, 122, 0.7);
        }

        @keyframes bb-shimmer-bar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .bb-address-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          width: 100%;
        }

        .bb-address-card {
          background: rgba(14, 38, 22, 0.7);
          border: 1px solid rgba(212, 175, 55, 0.28);
          border-radius: 20px;
          padding: 1.25rem;
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          transition: all 0.25s ease;
        }

        .bb-address-card:hover {
          border-color: rgba(245, 216, 122, 0.5);
          background: rgba(20, 52, 30, 0.8);
          transform: translateY(-2px);
        }

        .bb-address-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #f5d87a;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .bb-address-value {
          font-family: 'Space Grotesk', monospace;
          font-size: 0.82rem;
          color: rgba(240, 255, 245, 0.92);
          word-break: break-all;
          background: rgba(0, 0, 0, 0.4);
          padding: 0.55rem 0.75rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .bb-address-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-top: 0.2rem;
        }

        .bb-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(245, 216, 122, 0.14);
          border: 1px solid rgba(245, 216, 122, 0.32);
          border-radius: 8px;
          padding: 0.45rem 0.8rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #f5d87a;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .bb-action-btn:hover {
          background: rgba(245, 216, 122, 0.3);
          color: #ffffff;
        }

        .bb-buy-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, #f5d87a 0%, #d4af37 100%);
          border: 1px solid #ffffff;
          border-radius: 8px;
          padding: 0.45rem 1rem;
          font-size: 0.78rem;
          font-weight: 800;
          color: #06160d;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(245, 216, 122, 0.35);
        }

        .bb-buy-btn:hover {
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 6px 20px rgba(245, 216, 122, 0.55);
          background: linear-gradient(135deg, #ffffff 0%, #f5d87a 100%);
        }

        .bb-footer-info {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 0.5rem 0.5rem 0;
          font-size: 0.82rem;
          color: rgba(220, 245, 230, 0.65);
          text-align: center;
        }

        @media (max-width: 640px) {
          .bb-stats-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .bb-stat-divider { display: none; }
          .bb-address-section { grid-template-columns: 1fr; }
          .bb-stats-card {
            padding: 4.5rem 1.25rem 1.5rem;
            border-radius: 24px;
          }
          .bb-chest-img { width: 230px; }
          .bb-chest-visual { margin-bottom: -55px; }
          .bb-animal-avatar { display: none; }
        }
      `}</style>

      <div className="bb-root">
        <div className="bb-bg-image" />
        <div className="bb-bg-overlay" />

        {/* Floating Animals Visual Avatars Only */}
        <div className="bb-animals-layer">
          <div className="bb-animal-avatar" style={{ top: "16%", left: "7%", animationDuration: "4.4s" }}>🐮</div>
          <div className="bb-animal-avatar" style={{ top: "24%", right: "8%", animationDuration: "3.8s", animationDelay: "0.8s" }}>🐔</div>
          <div className="bb-animal-avatar" style={{ top: "56%", left: "9%", animationDuration: "4.9s", animationDelay: "1.2s" }}>🐷</div>
          <div className="bb-animal-avatar" style={{ top: "62%", right: "9%", animationDuration: "4.1s", animationDelay: "0.4s" }}>🐐</div>
          <div className="bb-animal-avatar" style={{ top: "38%", left: "4%", animationDuration: "5.2s", animationDelay: "1.5s" }}>🐝</div>
          <div className="bb-animal-avatar" style={{ top: "42%", right: "5%", animationDuration: "4.6s", animationDelay: "0.9s" }}>🐑</div>
        </div>

        {/* Floating Particles */}
        <div className="bb-particles">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="bb-particle"
              style={{
                width: `${4 + (i % 5) * 3}px`,
                height: `${4 + (i % 5) * 3}px`,
                left: `${(i * 19) % 100}%`,
                bottom: `${(i * 7) % 25}%`,
                animationDuration: `${7 + (i % 6) * 2.5}s`,
                animationDelay: `${(i % 5) * 1.2}s`,
              }}
            />
          ))}
        </div>

        {/* Top Header */}
        <header className="bb-header">
          <a href="/" className="bb-logo-brand">
            <img src="/new-logo.jpg" alt="PulsePastures Logo" className="bb-logo-img" />
            <span>PulsePastures</span>
          </a>

          <div className="bb-status-tag">
            <span className="bb-status-dot" />
            Live Robinhood Chain
          </div>
        </header>

        {/* Main Content */}
        <main className="bb-container">
          <div className="bb-title-area">
            <div className="bb-badge">
              <Sparkles className="w-3.5 h-3.5" />
              Official Robinhood Chain Buyback Wallet
            </div>

            <h1 className="bb-main-title">
              Pulse Pastures Buyback
            </h1>

            <p className="bb-subtitle">
              Transparent, automated on-chain buybacks removing $PP tokens from circulation permanently on Robinhood Chain.
            </p>
          </div>

          <div className="bb-chest-stage">
            <div className="bb-chest-aura" />

            <div className="bb-chest-visual">
              <img
                src="/treasure-chest.png"
                alt="Pulse Pastures Golden Treasure Chest"
                className="bb-chest-img"
              />
            </div>

            <div className="bb-stats-card">
              <div className="bb-stats-grid">
                <div className="bb-stat-box">
                  <div className="bb-stat-header">
                    <Coins className="w-4 h-4 text-[#f5d87a]" />
                    Total $PP Bought Back
                  </div>

                  <div className="bb-stat-value">
                    {loading ? (
                      <span className="opacity-40 animate-pulse">---,---,---</span>
                    ) : (
                      `${formatTokenAmount(displayBalance)} $PP`
                    )}
                  </div>

                  <div className="bb-stat-subtext">
                    Tokens accumulated in buyback vault
                  </div>
                </div>

                <div className="bb-stat-divider" />

                <div className="bb-stat-box">
                  <div className="bb-stat-header">
                    Percentage of Total Supply
                  </div>

                  <div className="bb-stat-value">
                    {loading ? (
                      <span className="opacity-40 animate-pulse">-.--%</span>
                    ) : (
                      `${formatPercent(displayPercent)}%`
                    )}
                  </div>

                  <div className="bb-stat-subtext">
                    Of 1,000,000,000 $PP Fixed Max Supply
                  </div>
                </div>
              </div>

              <div className="bb-progress-container">
                <div className="bb-progress-meta">
                  <span className="bb-progress-label">
                    <Vault className="w-3.5 h-3.5 text-[#f5d87a]" />
                    Buyback Vault Share
                  </span>
                  <span className="bb-progress-percent">
                    {loading ? "Calculating..." : `${formatPercent(percent)}% of Supply`}
                  </span>
                </div>

                <div className="bb-progress-track">
                  <div
                    className="bb-progress-fill"
                    style={{ width: loading ? "0%" : `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bb-address-section">
            <div className="bb-address-card">
              <div className="bb-address-title">
                <ShieldCheck className="w-4 h-4" />
                Tracked Buyback Wallet (Robinhood Chain)
              </div>
              <div className="bb-address-value">
                {BUYBACK_WALLET}
              </div>
              <div className="bb-address-actions">
                <button
                  className="bb-action-btn"
                  onClick={() => copyToClipboard(BUYBACK_WALLET, "wallet")}
                >
                  {copiedWallet ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedWallet ? "Copied" : "Copy Wallet"}
                </button>
                <a
                  href={`https://explorer.robinhood.com/address/${BUYBACK_WALLET}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bb-action-btn"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Robinhood Explorer
                </a>
              </div>
            </div>

            <div className="bb-address-card">
              <div className="bb-address-title">
                <Coins className="w-4 h-4" />
                $PP Token Contract (Robinhood Chain)
              </div>
              <div className="bb-address-value">
                {TOKEN_CONTRACT}
              </div>
              <div className="bb-address-actions">
                <button
                  className="bb-action-btn"
                  onClick={() => copyToClipboard(TOKEN_CONTRACT, "contract")}
                >
                  {copiedContract ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedContract ? "Copied" : "Copy Address"}
                </button>
                <a
                  href="https://app.virtuals.io/virtuals/101775"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bb-buy-btn"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Buy $PP
                </a>
              </div>
            </div>
          </div>

          <div className="bb-footer-info">
            <div>
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()} (Auto-updates live every 10s)`
                : "Fetching latest balance..."}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
