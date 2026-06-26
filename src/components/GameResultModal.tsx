import { motion, AnimatePresence } from "motion/react";
import { Trophy, Gift, Zap, Home } from "lucide-react";

export type GameResult = {
  winner: "white" | "black" | "draw";
  whitePlayer: string;
  blackPlayer: string;
  entryFee: number;
  pot: number;
  payout?: number;
  commission?: number;
};

interface GameResultModalProps {
  result: GameResult | null;
  onClose: () => void;
  isLoading?: boolean;
}

export function GameResultModal({ result, onClose, isLoading = false }: GameResultModalProps) {
  if (!result) return null;

  const isWinner = result.winner !== "draw";
  const isDraw = result.winner === "draw";
  const payout = result.payout ?? 0;
  const commission = result.commission ?? 0;

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center"
          style={{
            background: "rgba(43, 27, 10, 0.35)",
            backdropFilter: "blur(8px)",
            paddingTop: "max(env(safe-area-inset-top, 0px), 16px)",
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
            paddingLeft: "max(env(safe-area-inset-left, 0px), 12px)",
            paddingRight: "max(env(safe-area-inset-right, 0px), 12px)",
            overscrollBehavior: "contain",
          }}
          onClick={onClose}
          data-testid="game-result-overlay"
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12 }}
            transition={{ type: "spring", damping: 22 }}
            className="rounded-3xl w-full shadow-2xl flex flex-col relative"
            style={{
              background: "linear-gradient(180deg, #FFFDF8 0%, #FAF3E6 100%)",
              border: "1px solid var(--sr-border-strong)",
              boxShadow: "0 24px 60px rgba(80,55,30,0.28), 0 4px 14px rgba(80,55,30,0.12)",
              maxWidth: "28rem",
              maxHeight:
                "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px)",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid="game-result-modal"
          >
            <div
              className="px-6 pt-8 pb-4 flex-1 min-h-0 overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
              data-testid="game-result-scroll"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring" }}
                  className="flex justify-center mb-3"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
                      border: "1px solid var(--sr-border-strong)",
                      boxShadow: "var(--sr-shadow-sm)",
                    }}
                  >
                    {isDraw ? (
                      <Zap className="w-8 h-8" style={{ color: "var(--sr-wood-deep)" }} />
                    ) : (
                      <Trophy className="w-8 h-8" style={{ color: "var(--sr-wood-deep)" }} />
                    )}
                  </div>
                </motion.div>

                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: "var(--sr-wood-deep)", fontFamily: "Cinzel, serif" }}
                  data-testid="game-result-title"
                >
                  {isDraw ? "Ничья!" : "Игра завершена!"}
                </h2>
                <p style={{ color: "var(--sr-text-muted)", fontSize: "0.875rem" }}>
                  {isDraw
                    ? "Обе стороны сыграли вничью"
                    : result.winner === "white"
                      ? "Белые победили!"
                      : "Чёрные победили!"}
                </p>
              </div>

              <div className="space-y-2 mb-5">
                <div
                  className="flex justify-between items-center p-2.5 rounded-lg"
                  style={{ background: "var(--sr-surface-2)", border: "1px solid var(--sr-border)" }}
                >
                  <span className="text-sm font-medium" style={{ color: "var(--sr-text)" }}>
                    {result.whitePlayer}
                  </span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: result.winner === "white" ? "var(--sr-wood-deep)" : "var(--sr-text-muted)" }}
                  >
                    ♟ Белые
                  </span>
                </div>
                <div
                  className="flex justify-between items-center p-2.5 rounded-lg"
                  style={{ background: "var(--sr-surface-2)", border: "1px solid var(--sr-border)" }}
                >
                  <span className="text-sm font-medium" style={{ color: "var(--sr-text)" }}>
                    {result.blackPlayer}
                  </span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: result.winner === "black" ? "var(--sr-wood-deep)" : "var(--sr-text-muted)" }}
                  >
                    ♟ Чёрные
                  </span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl p-3 mb-5"
                style={{
                  background: "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
                  border: "1px solid var(--sr-border-strong)",
                }}
              >
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--sr-text-muted)" }}>Ставка за игрока:</span>
                    <span style={{ color: "var(--sr-text)", fontWeight: 600 }}>
                      {result.entryFee.toFixed(2)} Coin
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--sr-text-muted)" }}>Общий пул:</span>
                    <span style={{ color: "var(--sr-wood-deep)", fontWeight: 700 }}>{result.pot.toFixed(2)} Coin</span>
                  </div>
                  {commission > 0 && (
                    <div
                      className="flex justify-between pt-1.5 border-t"
                      style={{ borderColor: "var(--sr-border)" }}
                    >
                      <span style={{ color: "var(--sr-text-muted)" }}>Комиссия (5%):</span>
                      <span style={{ color: "var(--sr-danger)", fontWeight: 600 }}>-{commission.toFixed(2)} Coin</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {isWinner && payout > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl p-3 mb-4 text-center"
                  style={{
                    background: "linear-gradient(135deg, #EAF3EA 0%, #DCEEDF 100%)",
                    border: "1px solid rgba(86,129,93,0.45)",
                  }}
                  data-testid="payout-block"
                >
                  <p style={{ color: "#3D5F45", fontSize: "0.8rem", fontWeight: 600 }}>Ваш выигрыш</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Gift className="w-5 h-5" style={{ color: "#56815D" }} />
                    <p className="text-2xl font-bold" style={{ color: "#3D5F45", fontFamily: "Cinzel, serif" }}>
                      +{payout.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              )}

              {isDraw && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl p-3 mb-4 text-center"
                  style={{
                    background: "linear-gradient(135deg, #E3EDF5 0%, #D5E2EE 100%)",
                    border: "1px solid rgba(63,110,148,0.45)",
                  }}
                  data-testid="refund-block"
                >
                  <p style={{ color: "#365A78", fontSize: "0.8rem", fontWeight: 600 }}>Ставка возвращена</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Gift className="w-5 h-5" style={{ color: "#3F6E94" }} />
                    <p className="text-2xl font-bold" style={{ color: "#365A78", fontFamily: "Cinzel, serif" }}>
                      +{result.entryFee.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <div
              className="px-6 pt-3 rounded-b-3xl"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
                background: "linear-gradient(0deg, #FAF3E6 0%, rgba(250,243,230,0.85) 80%, rgba(250,243,230,0) 100%)",
                borderTop: "1px solid var(--sr-border)",
                flexShrink: 0,
              }}
            >
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #C39A48 0%, #E0BD6A 50%, #A77E2E 100%)",
                  color: "#2B1B0A",
                  fontFamily: "Inter, sans-serif",
                  border: "1px solid rgba(167,126,46,0.55)",
                  boxShadow: "0 4px 14px rgba(167,126,46,0.22)",
                }}
                data-testid="game-result-home-btn"
              >
                <Home className="w-4 h-4" />
                {isLoading ? "Обработка..." : "На главный экран"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
