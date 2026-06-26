import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import type { PlayerColor } from "../game/types.ts";

type GameOverModalProps = {
  winner: PlayerColor | "draw" | null;
  reason: string | null;
  myColor: PlayerColor | null;
  onHome: () => void;
  onRematch?: () => void;
  moveCount?: number;
  shareEnabled?: boolean;
  playerId?: string;
};

type Particle = { id: number; x: number; color: string; delay: number; duration: number };

function generateParticles(count: number): Particle[] {
  const colors = ["#C39A48", "#E0BD6A", "#A77E2E", "#A74740", "#56815D", "#E8CC85"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.8,
    duration: 1.2 + Math.random() * 0.8,
  }));
}

export default function GameOverModal({
  winner,
  reason,
  myColor,
  onHome,
  onRematch,
  moveCount,
  shareEnabled,
  playerId,
}: GameOverModalProps) {
  const [particles] = useState(() => generateParticles(20));
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const isMyWin = myColor !== null && winner === myColor;
  const isDraw = winner === "draw";
  const isWinnerWhite = myColor === null && winner === "white";
  const isWinnerBlack = myColor === null && winner === "black";
  const isVictory = isMyWin || isWinnerWhite || isWinnerBlack;

  useEffect(() => {
    if (isVictory && !isDraw) {
      const t = setTimeout(() => setShowConfetti(true), 100);
      return () => clearTimeout(t);
    }
  }, [isVictory, isDraw]);

  const handleShare = async () => {
    const refSuffix = playerId ? `?ref=${encodeURIComponent(playerId)}` : "";
    const shareUrl = `https://shashki-royale.pages.dev/${refSuffix}`;
    const shareText = isMyWin
      ? `🏆 Я выиграл партию в Шашки Рояль! Сыграй со мной: ${shareUrl}`
      : `♟ Играю в Шашки Рояль — присоединяйся: ${shareUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Шашки Рояль", text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  const titleText = isDraw
    ? "Ничья"
    : myColor !== null
    ? isMyWin
      ? "ПОБЕДА!"
      : "Поражение"
    : winner === "white"
    ? "Белые победили"
    : "Чёрные победили";

  const titleColor = isDraw
    ? "#815B43"
    : isVictory
    ? "#815B43"
    : "#A74740";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto"
      style={{
        background: "rgba(43, 27, 10, 0.35)",
        backdropFilter: "blur(8px)",
        paddingTop: "max(env(safe-area-inset-top, 0px), 16px)",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 12px)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 12px)",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
      data-testid="game-over-overlay"
    >
      <AnimatePresence>
        {showConfetti &&
          particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute top-0 w-2 h-2 rounded-sm pointer-events-none"
              style={{ left: `${p.x}%`, background: p.color }}
              initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
              animate={{ y: "110vh", opacity: 0, rotate: 720, scale: 0.5 }}
              transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
            />
          ))}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="p-6 rounded-3xl text-center relative my-auto w-full"
        style={{
          background: "linear-gradient(160deg, #FFFDF8 0%, #FAF3E6 100%)",
          border: `1px solid ${isVictory ? "var(--sr-border-strong)" : "rgba(167, 71, 64, 0.4)"}`,
          boxShadow:
            "0 24px 60px rgba(80,55,30,0.28), 0 4px 14px rgba(80,55,30,0.12)",
          maxWidth: 340,
          maxHeight:
            "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px)",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
        data-testid="game-over-modal"
      >
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 18 }}
          className="mb-4 leading-none flex justify-center"
        >
          {isDraw ? (
            <span style={{ fontSize: 56 }}>⚖️</span>
          ) : isVictory ? (
            <svg viewBox="0 0 80 52" width="72" height="46" style={{ filter: "drop-shadow(0 4px 12px rgba(167,126,46,0.4))" }}>
              <defs>
                <linearGradient id="winCrownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E0BD6A" />
                  <stop offset="100%" stopColor="#A77E2E" />
                </linearGradient>
              </defs>
              <path d="M8 44 L14 16 L26 32 L40 4 L54 32 L66 16 L72 44 Z" fill="url(#winCrownGrad)" stroke="#E8CC85" strokeWidth="1" />
              <rect x="8" y="40" width="64" height="10" rx="3" fill="url(#winCrownGrad)" stroke="#E8CC85" strokeWidth="0.8" />
              <circle cx="40" cy="6" r="4" fill="#A74740" stroke="#E0BD6A" strokeWidth="0.8" />
              <circle cx="14" cy="17" r="3" fill="#A74740" stroke="#E0BD6A" strokeWidth="0.8" />
              <circle cx="66" cy="17" r="3" fill="#A74740" stroke="#E0BD6A" strokeWidth="0.8" />
              <circle cx="40" cy="45" r="2.5" fill="#A74740" />
            </svg>
          ) : (
            <span style={{ fontSize: 56 }}>💭</span>
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-3xl font-black mb-1 tracking-[0.08em]"
          style={{ fontFamily: "Cinzel, serif", color: titleColor }}
        >
          {titleText}
        </motion.h2>

        {reason && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-sm mb-1"
            style={{ color: "var(--sr-text-muted)" }}
          >
            {reason}
          </motion.p>
        )}

        {moveCount !== undefined && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs mb-5"
            style={{ color: "var(--sr-text-subtle)" }}
          >
            Сыграно ходов: {moveCount}
          </motion.p>
        )}

        {!reason && !moveCount && <div className="mb-5" />}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col gap-2.5"
        >
          {onRematch && (
            <button
              onClick={onRematch}
              data-testid="game-over-rematch-btn"
              className="w-full py-3.5 font-bold text-sm cursor-pointer transition-all active:scale-[0.98]"
              style={{
                borderRadius: "12px",
                background: "linear-gradient(135deg, #C39A48 0%, #E0BD6A 50%, #A77E2E 100%)",
                color: "#2B1B0A",
                fontFamily: "Inter, sans-serif",
                border: "1px solid rgba(167,126,46,0.55)",
                boxShadow: "0 6px 18px rgba(167,126,46,0.25)",
              }}
            >
              Сыграть снова
            </button>
          )}
          {shareEnabled && (
            <button
              onClick={handleShare}
              data-testid="game-over-share-btn"
              className="w-full py-3 font-semibold text-sm cursor-pointer transition-all active:scale-[0.98]"
              style={{
                borderRadius: "12px",
                background: "#EAF3EA",
                border: "1px solid rgba(86,129,93,0.4)",
                color: "#3D5F45",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {shareCopied ? "✓ Скопировано в буфер" : isMyWin ? "🏆 Поделиться победой" : "♟ Поделиться игрой"}
            </button>
          )}
          <button
            onClick={onHome}
            data-testid="game-over-home-btn"
            className="w-full py-3.5 font-semibold text-sm cursor-pointer transition-all active:scale-[0.98]"
            style={{
              borderRadius: "12px",
              background: "var(--sr-surface)",
              border: "1px solid var(--sr-border)",
              color: "var(--sr-text)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            На главный экран
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
