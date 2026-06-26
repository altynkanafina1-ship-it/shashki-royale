import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { getWallet } from "../services/stakes";
import { usePlayerId } from "../hooks/usePlayerId";
import type { Wallet } from "../services/stakes";

function Coin({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <defs>
        <radialGradient id="wd-coin" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F3DEA0" />
          <stop offset="50%" stopColor="#E0BD6A" />
          <stop offset="100%" stopColor="#A77E2E" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#wd-coin)" stroke="#9C7530" strokeWidth="0.8" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#5C3F18" fontFamily="serif">₡</text>
    </svg>
  );
}

export function WalletDisplay() {
  const { playerId, isLoading: authLoading } = usePlayerId();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const loadWallet = async () => {
      try {
        const walletData = await getWallet(playerId);
        if (!cancelled) setWallet(walletData);
      } catch (err) {
        console.error("Error loading wallet:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setAttempted(true);
        }
      }
    };

    void loadWallet();

    const interval = setInterval(loadWallet, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [playerId, authLoading]);

  if (loading && !attempted) {
    return (
      <div
        className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5"
        style={{
          background: "var(--sr-surface)",
          border: "1px solid var(--sr-border)",
          boxShadow: "var(--sr-shadow-sm)",
        }}
      >
        <Coin size={14} />
        <span
          className="inline-block h-3 w-8 rounded animate-pulse"
          style={{ background: "var(--sr-surface-muted)" }}
          aria-label="loading balance"
        />
      </div>
    );
  }

  const balance = wallet?.crypto_balance ?? 0;
  const locked = wallet?.locked_balance ?? 0;

  return (
    <Link to="/wallet" aria-label="Coin wallet">
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
          border: "1px solid var(--sr-border-strong)",
          boxShadow: "var(--sr-shadow-sm)",
        }}
      >
        <Coin size={14} />
        <span
          className="text-sm font-bold leading-none"
          style={{ color: "var(--sr-wood-deep)", fontFamily: "Inter, sans-serif" }}
          data-testid="wallet-balance"
        >
          {balance.toLocaleString()}
        </span>
        {locked > 0 && (
          <span className="text-[10px] font-medium" style={{ color: "var(--sr-warning)" }}>
            🔒{locked}
          </span>
        )}
      </motion.div>
    </Link>
  );
}
