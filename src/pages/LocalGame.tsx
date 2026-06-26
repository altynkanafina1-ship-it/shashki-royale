import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Flag, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import BoardView from "../components/Board.tsx";
import GameOverModal from "../components/GameOverModal.tsx";
import { createInitialGameState, selectPiece, applyMoveToState } from "../game/gameLogic.ts";
import { generateLegalMoves } from "../game/rules.ts";
import { useAudio } from "../hooks/use-audio.ts";
import type { GameState, PlayerColor } from "../game/types.ts";

export default function LocalGame() {
  const navigate = useNavigate();
  const { play } = useAudio();
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameState.gameOver) return;
      const { board, currentTurn, selectedPiece, legalMoves } = gameState;

      if (selectedPiece) {
        const matchingMove = legalMoves.find(
          (m) => m.finalRow === row && m.finalCol === col,
        );
        if (matchingMove) {
          if (matchingMove.isCapture) play("capture");
          else play("move");
          if (matchingMove.promoted) setTimeout(() => play("promote"), 150);
          setGameState((prev) => applyMoveToState(prev, matchingMove));
          return;
        }
      }

      const piece = board[row][col];
      if (piece && piece.color === currentTurn) {
        setGameState((prev) => selectPiece(prev, row, col));
        return;
      }

      setGameState((prev) => ({
        ...prev,
        selectedPiece: null,
        legalMoves: generateLegalMoves(prev.board, prev.currentTurn),
      }));
    },
    [gameState, play],
  );

  const handleResign = (color: PlayerColor) => {
    const winner: PlayerColor = color === "white" ? "black" : "white";
    setGameState((prev) => ({
      ...prev,
      gameOver: true,
      winner,
      winReason: `${color === "white" ? "Белые" : "Чёрные"} сдались`,
    }));
    setShowResignConfirm(false);
  };

  const handleRematch = () => {
    setGameState(createInitialGameState());
    setShowResignConfirm(false);
  };

  const hasMandatory =
    !gameState.gameOver &&
    gameState.legalMoves.some((m) => m.isCapture) &&
    gameState.legalMoves.length > 0;

  const isWhiteTurn = gameState.currentTurn === "white";

  return (
    <div
      data-testid="local-game"
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: "transparent" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--sr-border-soft)",
          background: "rgba(255,253,248,0.65)",
          backdropFilter: "blur(8px)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          className="p-2 cursor-pointer rounded-xl active:scale-95"
          style={{
            background: "var(--sr-surface)",
            border: "1px solid var(--sr-border)",
            boxShadow: "var(--sr-shadow-sm)",
            minWidth: 40,
            minHeight: 40,
          }}
          aria-label="Назад"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: "var(--sr-wood-deep)" }} />
        </button>
        <div className="text-center">
          <p
            className="text-[11px] uppercase tracking-[0.2em] font-bold"
            style={{ color: "var(--sr-text-muted)", fontFamily: "Inter, sans-serif" }}
          >
            Локальная игра
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--sr-text-subtle)" }}>
            Ход {gameState.moveNumber}
          </p>
        </div>
        <button
          onClick={() => setShowResignConfirm(true)}
          className="p-2 cursor-pointer rounded-xl active:scale-95"
          style={{
            background: "var(--sr-surface)",
            border: "1px solid rgba(167,71,64,0.35)",
            boxShadow: "var(--sr-shadow-sm)",
            minWidth: 40,
            minHeight: 40,
          }}
          aria-label="Сдаться"
        >
          <Flag className="w-5 h-5" style={{ color: "var(--sr-danger)" }} />
        </button>
      </div>

      {/* Player labels */}
      <div className="px-4 pt-3 pb-0 flex-shrink-0 flex justify-between items-center">
        {/* Black (top) */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
          style={{
            border: !isWhiteTurn ? "1px solid var(--sr-border-strong)" : "1px solid transparent",
            background: !isWhiteTurn ? "var(--sr-surface)" : "transparent",
            opacity: isWhiteTurn ? 0.45 : 1,
            boxShadow: !isWhiteTurn ? "var(--sr-shadow-sm)" : "none",
          }}
        >
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{
              background: "radial-gradient(circle at 35% 32%, #5A5048 0%, #2E2620 50%, #1A1410 100%)",
              border: "1.5px solid #3A2F26",
            }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: !isWhiteTurn ? "var(--sr-text)" : "var(--sr-text-subtle)" }}
          >
            Чёрные{!isWhiteTurn && " ◀"}
          </span>
        </div>

        {/* White (bottom) */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
          style={{
            border: isWhiteTurn ? "1px solid var(--sr-border-strong)" : "1px solid transparent",
            background: isWhiteTurn ? "var(--sr-surface)" : "transparent",
            opacity: !isWhiteTurn ? 0.45 : 1,
            boxShadow: isWhiteTurn ? "var(--sr-shadow-sm)" : "none",
          }}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: isWhiteTurn ? "var(--sr-text)" : "var(--sr-text-subtle)" }}
          >
            {isWhiteTurn && "▶ "}Белые
          </span>
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{
              background: "radial-gradient(circle at 35% 32%, #FFFFFF 0%, #F4E8D0 45%, #D9C39E 100%)",
              border: "1.5px solid #BFA078",
            }}
          />
        </div>
      </div>

      {/* Turn banner */}
      <div className="px-4 pt-2 pb-1 flex-shrink-0">
        <motion.div
          key={gameState.currentTurn}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
            border: "1px solid var(--sr-border-strong)",
            boxShadow: "var(--sr-shadow-sm)",
          }}
        >
          <motion.div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{ background: "var(--sr-gold)" }}
          />
          <span
            className="font-bold text-sm tracking-[0.05em]"
            style={{ color: "var(--sr-wood-deep)", fontFamily: "Inter, sans-serif" }}
          >
            {isWhiteTurn ? "Ваш ход — белые" : "Ваш ход — чёрные"}
          </span>
        </motion.div>

        <AnimatePresence>
          {hasMandatory && (
            <motion.div
              data-testid="capture-hint"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center gap-2 py-1.5 px-2.5 rounded-md"
              style={{
                background: "rgba(195, 154, 72, 0.14)",
                border: "1px solid rgba(167, 126, 46, 0.4)",
              }}
            >
              <AlertCircle
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "var(--sr-wood-deep)" }}
              />
              <span
                className="text-[11px] leading-tight font-medium"
                style={{ color: "var(--sr-wood-deep)" }}
              >
                Доступно обязательное взятие
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center px-2 py-2 min-h-0">
        <BoardView
          board={gameState.board}
          currentTurn={gameState.currentTurn}
          myColor={null}
          selectedPiece={gameState.selectedPiece}
          legalMoves={gameState.legalMoves}
          onCellClick={handleCellClick}
          lastMove={gameState.lastMove}
        />
      </div>

      {/* Captured piece counts — compact pill */}
      <div className="px-4 pb-4 flex-shrink-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        <div className="flex justify-center gap-2">
          {(["white", "black"] as PlayerColor[]).map((color) => {
            const remaining = gameState.board.flat().filter((c) => c?.color === color).length;
            const captured = 12 - remaining;
            return (
              <div
                key={color}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  background: "var(--sr-surface)",
                  border: "1px solid var(--sr-border)",
                  boxShadow: "var(--sr-shadow-sm)",
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background:
                      color === "white"
                        ? "radial-gradient(circle at 35% 32%, #FFFFFF 0%, #F4E8D0 45%, #D9C39E 100%)"
                        : "radial-gradient(circle at 35% 32%, #5A5048 0%, #2E2620 50%, #1A1410 100%)",
                    border: `1px solid ${color === "white" ? "#BFA078" : "#3A2F26"}`,
                  }}
                />
                <span
                  className="text-[12px] font-bold"
                  style={{
                    color: captured > 0 ? "var(--sr-wood-deep)" : "var(--sr-text-subtle)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {captured}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resign confirm */}
      <AnimatePresence>
        {showResignConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(43, 27, 10, 0.35)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              className="mx-6 p-6 rounded-2xl"
              style={{
                background: "var(--sr-surface)",
                border: "1px solid var(--sr-border-strong)",
                boxShadow: "var(--sr-shadow-lg)",
                maxWidth: 320,
                width: "100%",
              }}
            >
              <h3
                className="text-lg font-bold text-center mb-2"
                style={{ fontFamily: "Cinzel, serif", color: "var(--sr-wood-deep)" }}
              >
                Сдаться?
              </h3>
              <p className="text-sm text-center mb-5" style={{ color: "var(--sr-text-muted)" }}>
                Чьи шашки сдаются?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleResign("white")}
                  className="py-3 cursor-pointer active:scale-[0.98] transition-transform"
                  style={{
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
                    border: "1px solid var(--sr-border-strong)",
                    color: "var(--sr-text)",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Белые сдаются
                </button>
                <button
                  onClick={() => handleResign("black")}
                  className="py-3 cursor-pointer active:scale-[0.98] transition-transform"
                  style={{
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #A74740 0%, #B45049 100%)",
                    border: "1px solid rgba(132, 53, 46, 0.6)",
                    color: "#FBF6EC",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Чёрные сдаются
                </button>
                <button
                  onClick={() => setShowResignConfirm(false)}
                  className="py-2.5 cursor-pointer"
                  style={{ color: "var(--sr-text-muted)", fontWeight: 500 }}
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {gameState.gameOver && (
        <GameOverModal
          winner={gameState.winner}
          reason={gameState.winReason}
          myColor={null}
          onHome={() => navigate("/")}
          onRematch={handleRematch}
          moveCount={gameState.moveNumber}
        />
      )}
    </div>
  );
}
