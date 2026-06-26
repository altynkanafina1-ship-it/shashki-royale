import { useEffect, useRef, useState, useCallback } from "react";
import type { Board, Move, PlayerColor, CellState } from "../game/types.ts";
import Piece from "./Piece.tsx";

type LastMove = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
};

type AnimatingPiece = {
  id: string;
  piece: CellState;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isCapture: boolean;
};

type CaptureParticle = {
  id: string;
  row: number;
  col: number;
};

type InvalidTap = {
  id: string;
  row: number;
  col: number;
};

type BoardProps = {
  board: Board;
  currentTurn: PlayerColor;
  myColor: PlayerColor | null;
  selectedPiece: { row: number; col: number } | null;
  legalMoves: Move[];
  onCellClick: (row: number, col: number) => void;
  flipped?: boolean;
  lastMove?: LastMove | null;
  onMoveAnimEnd?: (isCapture: boolean) => void;
};

const ANIM_DURATION_MS = 350;

/* ─── Light "wood + ivory" board palette (premium classic feel) ─── */
const DARK_SQ = "#B98863";    // warm wood mid (dark squares)
const LIGHT_SQ = "#F0E1C4";   // creamy ivory (light squares)

/* Move-hint colors — soft sage green, friendly but unmistakable */
const SELECTED_BG = "rgba(86, 129, 93, 0.32)";
const SELECTED_GLOW = "rgba(86, 129, 93, 0.45)";
const MOVE_DOT_COLOR = "rgba(86, 129, 93, 0.85)";
const MOVE_DOT_BORDER = "rgba(64, 105, 72, 0.95)";

export default function BoardView({
  board,
  currentTurn,
  myColor,
  selectedPiece,
  legalMoves,
  onCellClick,
  flipped = false,
  lastMove,
  onMoveAnimEnd,
}: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animating, setAnimating] = useState<AnimatingPiece | null>(null);
  const prevBoardRef = useRef<Board>(board);
  const prevLastMoveRef = useRef<LastMove | null | undefined>(null);
  const [captureParticles, setCaptureParticles] = useState<CaptureParticle[]>([]);
  const [invalidTaps, setInvalidTaps] = useState<InvalidTap[]>([]);

  const [highlightLastMove, setHighlightLastMove] = useState(false);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect board change to trigger smooth animation
  useEffect(() => {
    if (
      lastMove &&
      lastMove !== prevLastMoveRef.current &&
      containerRef.current
    ) {
      const prev = prevBoardRef.current;
      const movingPiece = prev[lastMove.fromRow]?.[lastMove.fromCol];

      // Update refs immediately so next render has correct state
      prevLastMoveRef.current = lastMove;
      prevBoardRef.current = board;

      if (movingPiece) {
        const prevCount = prev.flat().filter(Boolean).length;
        const nextCount = board.flat().filter(Boolean).length;
        const wasCapture = nextCount < prevCount;

        const anim: AnimatingPiece = {
          id: `${lastMove.fromRow}-${lastMove.fromCol}-${Date.now()}`,
          piece: board[lastMove.toRow][lastMove.toCol] ?? movingPiece,
          fromRow: lastMove.fromRow,
          fromCol: lastMove.fromCol,
          toRow: lastMove.toRow,
          toCol: lastMove.toCol,
          isCapture: wasCapture,
        };
        setAnimating(anim);

        const timer = setTimeout(() => {
          setAnimating(null);
          onMoveAnimEnd?.(wasCapture);
          if (wasCapture) {
            const particleId = `p-${Date.now()}`;
            setCaptureParticles((prev2) => [...prev2, { id: particleId, row: lastMove.toRow, col: lastMove.toCol }]);
            setTimeout(() => {
              setCaptureParticles((prev2) => prev2.filter((p) => p.id !== particleId));
            }, 700);
          }
        }, ANIM_DURATION_MS + 30);
        return () => clearTimeout(timer);
      }

      setHighlightLastMove(true);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => setHighlightLastMove(false), 3000);
    } else {
      prevBoardRef.current = board;
    }
  }, [board, lastMove, onMoveAnimEnd]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Handle invalid tap — show soft amber flash
  const handleInvalidTap = useCallback((row: number, col: number) => {
    const tapId = `tap-${row}-${col}-${Date.now()}`;
    setInvalidTaps((prev) => [...prev, { id: tapId, row, col }]);
    setTimeout(() => {
      setInvalidTaps((prev) => prev.filter((t) => t.id !== tapId));
    }, 400);
  }, []);

  const handleCellClickInternal = useCallback((row: number, col: number) => {
    const isDark = (row + col) % 2 === 1;
    const piece = board[row][col];
    const isLegalTarget = legalMoves.some((m) => m.finalRow === row && m.finalCol === col);
    const canSelect = piece && piece.color === currentTurn;

    // If it's not a legal target and not a selectable piece — show invalid tap
    if (!isDark || (!isLegalTarget && !canSelect)) {
      handleInvalidTap(row, col);
    }

    onCellClick(row, col);
  }, [board, currentTurn, legalMoves, onCellClick, handleInvalidTap]);

  const legalTargets = new Set(legalMoves.map((m) => `${m.finalRow},${m.finalCol}`));
  const legalFromPieces = new Set(legalMoves.map((m) => `${m.fromRow},${m.fromCol}`));

  const rows = flipped
    ? [...Array(8)].map((_, i) => 7 - i)
    : [...Array(8)].map((_, i) => i);
  const cols = flipped
    ? [...Array(8)].map((_, i) => 7 - i)
    : [...Array(8)].map((_, i) => i);

  // Track whether animation has started
  const [animStarted, setAnimStarted] = useState(false);

  useEffect(() => {
    if (animating && !animStarted) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimStarted(true);
        });
      });
    }
    if (!animating) {
      setAnimStarted(false);
    }
  }, [animating, animStarted]);

  function getCellSlideStyle(
    anim: AnimatingPiece,
    cellSize: number,
    started: boolean,
  ): React.CSSProperties {
    if (!started) {
      return {
        transform: `translate(0px, 0px)`,
        position: "relative",
        zIndex: 30,
      };
    }
    const dr = anim.toRow - anim.fromRow;
    const dc = anim.toCol - anim.fromCol;
    const displayDr = flipped ? -dr : dr;
    const displayDc = flipped ? -dc : dc;
    return {
      transform: `translate(${displayDc * cellSize}px, ${displayDr * cellSize}px)`,
      transition: `transform ${ANIM_DURATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      position: "relative",
      zIndex: 30,
    };
  }

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        aspectRatio: "1",
        width: "100%",
        maxWidth: "min(100vw, calc(100vh - 180px))",
        margin: "0 auto",
        /* Soft wooden frame — light, layered, premium */
        border: "6px solid #A9794E",
        outline: "2px solid #D7B48A",
        outlineOffset: "0px",
        borderRadius: "10px",
        boxShadow:
          "0 18px 40px rgba(80,55,30,0.18), 0 4px 10px rgba(80,55,30,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
        background: "#C99D6E",
      }}
    >
      {rows.flatMap((row) =>
        cols.map((col) => {
          const isDark = (row + col) % 2 === 1;
          const piece = board[row][col];
          const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
          const isLegalTarget = legalTargets.has(`${row},${col}`);
          const isLegalFrom = legalFromPieces.has(`${row},${col}`);
          const isLastTo = lastMove?.toRow === row && lastMove?.toCol === col;
          const isLastFrom = lastMove?.fromRow === row && lastMove?.fromCol === col;
          const isAnimOrigin = animating?.fromRow === row && animating?.fromCol === col;
          const isAnimDest = animating?.toRow === row && animating?.toCol === col;
          const hasInvalidTap = invalidTaps.some((t) => t.row === row && t.col === col);

          const canInteract =
            myColor === null
              ? piece?.color === currentTurn
              : myColor === currentTurn;

          const isMoveDot = isDark && isLegalTarget && !piece;
          const isCaptureTarget = isDark && isLegalTarget && !!piece && piece.color !== currentTurn;

          // Cell background — light premium palette
          const cellBg = isDark ? DARK_SQ : LIGHT_SQ;

          return (
            <div
              key={`${row}-${col}`}
              onClick={() => handleCellClickInternal(row, col)}
              className="relative flex items-center justify-center overflow-visible"
              style={{
                aspectRatio: "1",
                background: cellBg,
                cursor: (isDark && isLegalTarget) || (piece && canInteract && isLegalFrom) ? "pointer" : "default",
              }}
            >
              {/* Selected-square sage-green highlight (light theme) */}
              {isSelected && isDark && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: SELECTED_BG,
                    boxShadow: `inset 0 0 12px ${SELECTED_GLOW}`,
                    zIndex: 5,
                  }}
                />
              )}

              {/* Soft amber "invalid tap" flash */}
              {hasInvalidTap && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "rgba(220, 150, 60, 0.45)",
                    animation: "invalidTapFlash 0.4s ease-out forwards",
                    zIndex: 40,
                  }}
                />
              )}

              {/* Last-move "to" warm golden tint */}
              {isDark && isLastTo && highlightLastMove && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "rgba(195, 154, 72, 0.28)",
                    transition: "opacity 0.5s ease",
                    zIndex: 5,
                  }}
                />
              )}

              {/* Last-move "from" subtle tint */}
              {isDark && isLastFrom && highlightLastMove && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "rgba(195, 154, 72, 0.12)", zIndex: 5 }}
                />
              )}

              {/* Legal-move marker — solid sage dot on empty square */}
              {isMoveDot && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                  <div
                    className="rounded-full"
                    style={{
                      width: "30%",
                      height: "30%",
                      background: MOVE_DOT_COLOR,
                      border: `2px solid ${MOVE_DOT_BORDER}`,
                      boxShadow: `0 0 6px ${MOVE_DOT_COLOR}`,
                      animation: "srSelectedPulse 1.5s ease-in-out infinite",
                    }}
                  />
                </div>
              )}

              {/* Capture target — sage ring around enemy piece */}
              {isCaptureTarget && (
                <div
                  className="absolute inset-[6%] rounded-full pointer-events-none"
                  style={{
                    border: `3px solid ${MOVE_DOT_BORDER}`,
                    boxShadow: `0 0 8px ${MOVE_DOT_COLOR}, inset 0 0 6px ${MOVE_DOT_COLOR}`,
                    animation: "srRingPulse 1.2s ease-in-out infinite",
                    zIndex: 10,
                  }}
                />
              )}

              {/* Piece (hidden at origin and destination during animation) */}
              {piece && isDark && !isAnimOrigin && !isAnimDest && (
                <div
                  className="absolute inset-[8%]"
                  style={{
                    zIndex: 20,
                    cursor:
                      canInteract && piece.color === currentTurn && isLegalFrom
                        ? "pointer"
                        : "default",
                  }}
                >
                  <Piece
                    piece={piece}
                    isSelected={isSelected}
                    isLastMoveTo={isLastTo}
                    isLastMoveFrom={false}
                    onClick={() => handleCellClickInternal(row, col)}
                  />
                </div>
              )}

              {/* Sliding animated piece — SMOOTH MOVEMENT */}
              {animating && animating.fromRow === row && animating.fromCol === col && (
                <div
                  className="absolute inset-[8%]"
                  style={{
                    ...getCellSlideStyle(
                      animating,
                      containerRef.current
                        ? containerRef.current.clientWidth / 8
                        : 50,
                      animStarted,
                    ),
                    zIndex: 40,
                  }}
                >
                  <Piece
                    piece={animating.piece}
                    isSelected={false}
                    isLastMoveTo={false}
                    isLastMoveFrom={true}
                    onClick={() => {}}
                  />
                </div>
              )}

              {/* Capture particle explosion — softer warm palette */}
              {captureParticles.some((p) => p.row === row && p.col === col) && (
                <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 50 }}>
                  {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * 360;
                    const dist = 60 + Math.random() * 30;
                    const dx = Math.cos((angle * Math.PI) / 180) * dist;
                    const dy = Math.sin((angle * Math.PI) / 180) * dist;
                    return (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: i % 2 === 0 ? "#C39A48" : "#56815D",
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          animation: `captureParticle 0.65s ease-out forwards`,
                          ["--dx" as string]: `${dx}%`,
                          ["--dy" as string]: `${dy}%`,
                          animationDelay: `${i * 0.03}s`,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
}
