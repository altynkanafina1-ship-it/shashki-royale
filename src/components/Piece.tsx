import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import type { CellState } from "../game/types.ts";

type PieceProps = {
  piece: CellState;
  isSelected: boolean;
  isLastMoveTo?: boolean;
  isLastMoveFrom?: boolean;
  onClick?: () => void;
};

/**
 * Premium light-theme checker piece.
 *  - Off-white "ivory" piece for the white side (clearly different from
 *    creamy light squares).
 *  - Warm graphite-charcoal piece for the black side (clearly different
 *    from the wooden dark squares, never feels like a black hole).
 *  - A thin warm bronze rim (no neon gold) gives the premium feel.
 *  - King = subtle inlaid crown, no aggressive flares.
 */
export default function Piece({
  piece,
  isSelected,
  isLastMoveTo = false,
  isLastMoveFrom = false,
  onClick,
}: PieceProps) {
  const [showPromoteFlash, setShowPromoteFlash] = useState(false);
  const [wasKing, setWasKing] = useState(piece?.type === "king");

  useEffect(() => {
    if (!piece) return;
    if (piece.type === "king" && !wasKing) {
      setShowPromoteFlash(true);
      const t = setTimeout(() => setShowPromoteFlash(false), 1200);
      return () => clearTimeout(t);
    }
    setWasKing(piece.type === "king");
  }, [piece, wasKing]);

  if (!piece) return null;

  const isWhite = piece.color === "white";
  const isKing = piece.type === "king";

  /* Soft 3D feel via radial gradient. White = ivory, Black = warm graphite. */
  const baseGradient = isWhite
    ? "radial-gradient(circle at 35% 32%, #FFFFFF 0%, #F4E8D0 45%, #D9C39E 100%)"
    : "radial-gradient(circle at 35% 32%, #5A5048 0%, #2E2620 50%, #1A1410 100%)";

  /* Soft shadows — readable on both light & dark squares, no harsh glow */
  const shadowBase = isWhite
    ? "0 2px 6px rgba(80,55,30,0.28), inset 0 1.5px 3px rgba(255,255,255,0.85), inset 0 -1.5px 3px rgba(140,100,60,0.18)"
    : "0 2px 6px rgba(0,0,0,0.45), inset 0 1.5px 3px rgba(255,255,255,0.18), inset 0 -1.5px 3px rgba(0,0,0,0.4)";

  const selectedShadow =
    "0 0 0 4px rgba(86,129,93,0.45), 0 4px 12px rgba(64,105,72,0.35), 0 2px 6px rgba(80,55,30,0.28)";

  const innerHighlight = isWhite
    ? "radial-gradient(ellipse at 30% 22%, rgba(255,255,255,0.85) 0%, transparent 55%)"
    : "radial-gradient(ellipse at 30% 22%, rgba(255,255,255,0.14) 0%, transparent 55%)";

  /* Rim color — warm bronze (not neon gold) */
  const rim = isWhite ? "#BFA078" : "#3A2F26";

  return (
    <div className="relative w-full h-full">
      {/* Last-move "from" soft ghost */}
      {isLastMoveFrom && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={{ opacity: 0.45 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.8 }}
          style={{ background: "radial-gradient(circle, rgba(195,154,72,0.55) 0%, transparent 70%)" }}
        />
      )}

      {/* Last-move "to" arrival pulse */}
      {isLastMoveTo && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={{ scale: 1.5, opacity: 0.85 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.7 }}
          style={{ background: "radial-gradient(circle, rgba(195,154,72,0.75) 0%, transparent 70%)" }}
        />
      )}

      {/* Promotion flash */}
      <AnimatePresence>
        {showPromoteFlash && (
          <motion.div
            className="absolute -inset-4 rounded-full pointer-events-none z-30"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 2.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(circle, rgba(195,154,72,0.85) 0%, rgba(227,201,123,0.45) 45%, transparent 75%)",
              boxShadow: "0 0 28px 8px rgba(195,154,72,0.45)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Main piece body */}
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.93 }}
        animate={
          isSelected
            ? { scale: 1.1, y: -3 }
            : { scale: 1, y: 0 }
        }
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="w-full h-full rounded-full relative overflow-hidden cursor-pointer"
        style={{
          background: baseGradient,
          border: `1.5px solid ${rim}`,
          boxShadow: isSelected ? selectedShadow : shadowBase,
          outline: "none",
        }}
        aria-label={isKing ? (isWhite ? "Белая дамка" : "Чёрная дамка") : (isWhite ? "Белая шашка" : "Чёрная шашка")}
      >
        {/* Inner shine highlight */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: innerHighlight }}
        />

        {/* Bottom rim depth */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-full pointer-events-none"
          style={{
            background: isWhite
              ? "linear-gradient(to bottom, transparent 0%, rgba(165,118,72,0.15) 100%)"
              : "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* Subtle inner concentric ring — classic checker disc */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: "16%",
            border: `1px solid ${isWhite ? "rgba(140,100,60,0.25)" : "rgba(255,255,255,0.10)"}`,
          }}
        />

        {/* King crown — refined bronze, no neon */}
        {isKing && (
          <motion.div
            initial={wasKing ? false : { scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <svg
              viewBox="0 0 24 16"
              style={{
                width: "52%",
                height: "52%",
                filter: isWhite
                  ? "drop-shadow(0 1px 2px rgba(140,100,60,0.5))"
                  : "drop-shadow(0 1px 2px rgba(0,0,0,0.7)) drop-shadow(0 0 3px rgba(195,154,72,0.65))",
              }}
            >
              <defs>
                <linearGradient id={`kc-${isWhite ? "w" : "b"}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isWhite ? "#C39A48" : "#E0BD6A"} />
                  <stop offset="100%" stopColor={isWhite ? "#9C7530" : "#B58633"} />
                </linearGradient>
              </defs>
              <path
                d="M2 14 L4 5 L8 10 L12 2 L16 10 L20 5 L22 14 Z"
                fill={`url(#kc-${isWhite ? "w" : "b"})`}
                stroke={isWhite ? "#9C7530" : "#E0BD6A"}
                strokeWidth="0.45"
              />
              <circle cx="2" cy="14" r="1.4" fill={isWhite ? "#9C7530" : "#E0BD6A"} />
              <circle cx="22" cy="14" r="1.4" fill={isWhite ? "#9C7530" : "#E0BD6A"} />
              <circle cx="12" cy="2" r="1.4" fill={isWhite ? "#C39A48" : "#E0BD6A"} />
              <circle cx="4" cy="5" r="1.1" fill={isWhite ? "#C39A48" : "#E0BD6A"} />
              <circle cx="20" cy="5" r="1.1" fill={isWhite ? "#C39A48" : "#E0BD6A"} />
            </svg>
          </motion.div>
        )}

        {/* Selected pulsing ring — sage green */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{ opacity: [0.55, 0.95, 0.55] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            style={{
              border: "2px solid rgba(86,129,93,0.9)",
              boxShadow: "inset 0 0 8px rgba(86,129,93,0.4), 0 0 10px rgba(86,129,93,0.35)",
            }}
          />
        )}
      </motion.button>
    </div>
  );
}
