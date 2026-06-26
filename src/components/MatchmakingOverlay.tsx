import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, X } from "lucide-react";

interface MatchmakingOverlayProps {
  stake: number | null;
  onCancel: () => void;
  cancelling: boolean;
}

export default function MatchmakingOverlay({
  stake,
  onCancel,
  cancelling,
}: MatchmakingOverlayProps) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");

  const showLongWaitHint = elapsedSec >= 30;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(255,253,248,0.96) 0%, rgba(245,239,230,0.97) 70%, rgba(232,220,200,0.98) 100%)",
        backdropFilter: "blur(8px)",
      }}
      data-testid="matchmaking-overlay"
    >
      <div className="w-full max-w-sm text-center">
        {/* Animated coin */}
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mx-auto mb-6"
          style={{
            width: 96,
            height: 96,
            filter: "drop-shadow(0 8px 22px rgba(167,126,46,0.28))",
          }}
        >
          <svg viewBox="0 0 100 100" width="96" height="96">
            <defs>
              <radialGradient id="mm-coin-grad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#F3DEA0" />
                <stop offset="50%" stopColor="#E0BD6A" />
                <stop offset="100%" stopColor="#A77E2E" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#mm-coin-grad)" stroke="#9C7530" strokeWidth="2" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <text x="50" y="68" textAnchor="middle" fontSize="44" fontWeight="900" fill="#5C3F18" fontFamily="serif">
              ₡
            </text>
          </svg>
        </motion.div>

        <h2
          className="text-2xl font-black tracking-[0.12em] mb-2"
          style={{
            fontFamily: "Cinzel, serif",
            color: "var(--sr-wood-deep)",
          }}
        >
          Ищем соперника
        </h2>

        <div className="flex items-center justify-center gap-1.5 mb-4">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--sr-wood-mid)" }} />
          <span className="text-sm font-medium tracking-wider" style={{ color: "var(--sr-text-muted)" }}>
            {mm}:{ss}
          </span>
        </div>

        {stake != null && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6"
            style={{
              background: "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
              border: "1px solid var(--sr-border-strong)",
              boxShadow: "var(--sr-shadow-sm)",
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <defs>
                <radialGradient id="mm-stake-coin" cx="40%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#F3DEA0" />
                  <stop offset="50%" stopColor="#E0BD6A" />
                  <stop offset="100%" stopColor="#A77E2E" />
                </radialGradient>
              </defs>
              <circle cx="12" cy="12" r="11" fill="url(#mm-stake-coin)" stroke="#9C7530" strokeWidth="0.8" />
              <text x="12" y="16.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#5C3F18" fontFamily="serif">
                ₡
              </text>
            </svg>
            <span className="text-sm font-bold" style={{ color: "var(--sr-wood-deep)", fontFamily: "Inter, sans-serif" }}>
              Ставка: {stake} Coin
            </span>
          </div>
        )}

        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--sr-text-muted)" }}>
          {showLongWaitHint
            ? "Пока не нашли соперника на эту ставку. Можно подождать или отменить."
            : "Как только найдётся игрок — игра начнётся автоматически."}
        </p>

        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          data-testid="matchmaking-cancel-btn"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "var(--sr-surface)",
            border: "1px solid rgba(167, 71, 64, 0.5)",
            color: "var(--sr-danger)",
            fontFamily: "Inter, sans-serif",
            minWidth: 180,
            boxShadow: "var(--sr-shadow-sm)",
          }}
        >
          {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          {cancelling ? "Отмена…" : "Отменить поиск"}
        </button>

        <p className="text-xs mt-4" style={{ color: "var(--sr-text-subtle)" }}>
          Ставка вернётся на ваш баланс
        </p>
      </div>
    </motion.div>
  );
}
