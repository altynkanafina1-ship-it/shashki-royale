import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, User, Trophy, ListChecks, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import PrimaryButton from "../components/PrimaryButton.tsx";
import DebugPanel from "../components/DebugPanel.tsx";
import QuickStakeBar from "../components/QuickStakeBar.tsx";
import { loadActiveGame, clearActiveGame, type ActiveGame } from "../lib/storage.ts";
import { fetchGame } from "../services/gameRooms.ts";
import { supabaseConfigured } from "../lib/supabase.ts";
import { useProfile } from "../hooks/use-profile.ts";
import { WalletDisplay } from "../components/WalletDisplay.tsx";
import EngagementStrip from "../components/EngagementStrip.tsx";

const SOUND_KEY = "shashki_sound_enabled";

export default function Index() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    if (typeof localStorage === "undefined") return true;
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? true : v === "1";
  });

  useEffect(() => {
    const saved = loadActiveGame();
    if (saved && supabaseConfigured) setActiveGame(saved);
  }, []);

  const toggleSound = () => {
    setSoundOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleResume = async () => {
    if (!activeGame) return;
    setResumeLoading(true);
    setResumeError(null);
    try {
      const game = await fetchGame(activeGame.gameId);
      if (!game) {
        clearActiveGame();
        setActiveGame(null);
        setResumeError("Партия не найдена");
        return;
      }
      if (game.status === "finished") {
        clearActiveGame();
        setActiveGame(null);
        setResumeError("Партия уже завершена");
        return;
      }
      navigate("/online-game", {
        state: { gameId: activeGame.gameId, myColor: activeGame.playerColor },
      });
    } catch {
      setResumeError("Ошибка подключения. Проверьте интернет.");
    } finally {
      setResumeLoading(false);
    }
  };

  return (
    <div
      data-testid="home-screen"
      className="min-h-[100dvh] flex flex-col items-center px-4 sm:px-5 safe-pt safe-pb safe-px relative"
      style={{
        paddingTop: "max(env(safe-area-inset-top, 0px), 12px)",
        gap: "12px",
      }}
    >
      {/* Header: profile + wallet · sound + leaderboard */}
      <div className="w-full max-w-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0 sr-icon-btn"
            style={{
              background: "var(--sr-surface)",
              border: "1px solid var(--sr-border)",
              boxShadow: "var(--sr-shadow-sm)",
            }}
            data-testid="home-profile-btn"
            title={t("profile")}
          >
            <User className="w-3.5 h-3.5" style={{ color: "var(--sr-wood-deep)" }} />
            <span
              className="text-xs max-w-[80px] truncate font-medium"
              style={{ color: "var(--sr-text)" }}
            >
              {profile ? profile.nickname.slice(0, 10) : t("profile")}
            </span>
          </button>
          <WalletDisplay />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-xl cursor-pointer active:scale-95"
            style={{
              background: "var(--sr-surface)",
              border: "1px solid var(--sr-border)",
              boxShadow: "var(--sr-shadow-sm)",
            }}
            title={soundOn ? "Sound on" : "Sound off"}
            aria-label={soundOn ? "Sound on" : "Sound off"}
            data-testid="home-sound-btn"
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4" style={{ color: "var(--sr-wood-deep)" }} />
            ) : (
              <VolumeX className="w-4 h-4" style={{ color: "var(--sr-text-subtle)" }} />
            )}
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className="p-1.5 rounded-xl cursor-pointer active:scale-95"
            style={{
              background: "var(--sr-surface)",
              border: "1px solid var(--sr-border)",
              boxShadow: "var(--sr-shadow-sm)",
            }}
            title={t("leaderboard")}
            data-testid="home-leaderboard-btn"
          >
            <Trophy className="w-4 h-4" style={{ color: "var(--sr-wood-deep)" }} />
          </button>
        </div>
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center mt-2"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ filter: "drop-shadow(0 4px 10px rgba(167,126,46,0.28))" }}
        >
          <svg viewBox="0 0 80 52" width="64" height="42" className="sm:w-[80px] sm:h-[50px]">
            <defs>
              <linearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0BD6A" />
                <stop offset="50%" stopColor="#C39A48" />
                <stop offset="100%" stopColor="#A77E2E" />
              </linearGradient>
            </defs>
            <path
              d="M8 44 L14 16 L26 32 L40 4 L54 32 L66 16 L72 44 Z"
              fill="url(#crownGrad)"
              stroke="#E8CC85"
              strokeWidth="0.8"
            />
            <rect x="8" y="40" width="64" height="10" rx="3" fill="url(#crownGrad)" stroke="#E8CC85" strokeWidth="0.7" />
            <circle cx="40" cy="6" r="4" fill="#A74740" stroke="#E0BD6A" strokeWidth="0.7" />
            <circle cx="14" cy="17" r="3" fill="#A74740" stroke="#E0BD6A" strokeWidth="0.7" />
            <circle cx="66" cy="17" r="3" fill="#A74740" stroke="#E0BD6A" strokeWidth="0.7" />
            <circle cx="28" cy="45" r="2" fill="#E0BD6A" />
            <circle cx="52" cy="45" r="2" fill="#E0BD6A" />
            <circle cx="40" cy="45" r="2.5" fill="#A74740" />
          </svg>
        </motion.div>

        <div className="text-center mt-2">
          <h1
            className="text-3xl sm:text-4xl font-black tracking-[0.18em] leading-none"
            style={{
              fontFamily: "Cinzel, serif",
              background: "linear-gradient(180deg, #C39A48 0%, #815B43 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ШАШКИ
          </h1>
          <h1
            className="text-3xl sm:text-4xl font-black tracking-[0.18em] leading-none mt-0.5"
            style={{
              fontFamily: "Cinzel, serif",
              background: "linear-gradient(180deg, #C39A48 0%, #815B43 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            РОЯЛЬ
          </h1>
          <p
            className="text-[11px] tracking-[0.32em] mt-1.5 font-medium"
            style={{ color: "var(--sr-text-muted)", fontFamily: "Inter, sans-serif" }}
          >
            {t("subtitle", { defaultValue: "РУССКИЕ ШАШКИ" })}
          </p>
        </div>
      </motion.div>

      {/* Resume banner (if any) */}
      <AnimatePresence>
        {activeGame && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="w-full max-w-sm overflow-hidden"
          >
            <div
              className="rounded-2xl p-3.5"
              style={{
                background: "linear-gradient(135deg, #FAF3E6 0%, #F4EAD7 100%)",
                border: "1px solid var(--sr-border-strong)",
                boxShadow: "var(--sr-shadow-card)",
              }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] font-semibold"
                    style={{ color: "var(--sr-text-muted)" }}
                  >
                    Активная партия
                  </p>
                  {activeGame.roomCode && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--sr-text-muted)" }}>
                      <span style={{ color: "var(--sr-wood-deep)", letterSpacing: "0.15em", fontWeight: 700 }}>
                        {activeGame.roomCode}
                      </span>
                      {" · "}
                      <span style={{ color: "var(--sr-text)" }}>
                        {activeGame.playerColor === "white" ? "белые" : "чёрные"}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    clearActiveGame();
                    setActiveGame(null);
                  }}
                  className="p-1.5 cursor-pointer rounded-lg active:scale-95"
                  style={{
                    background: "var(--sr-surface)",
                    border: "1px solid var(--sr-border)",
                  }}
                  title="Сбросить партию"
                >
                  <RotateCcw className="w-3.5 h-3.5" style={{ color: "var(--sr-text-muted)" }} />
                </button>
              </div>
              <button
                onClick={() => void handleResume()}
                disabled={resumeLoading}
                className="w-full py-2.5 text-sm font-semibold cursor-pointer transition-all active:scale-[0.98]"
                style={{
                  borderRadius: "12px",
                  fontFamily: "Inter, sans-serif",
                  border: "1px solid rgba(167,126,46,0.55)",
                  background: resumeLoading
                    ? "linear-gradient(135deg, #E5D5B0, #D9C8A2)"
                    : "linear-gradient(135deg, #C39A48 0%, #E0BD6A 50%, #A77E2E 100%)",
                  color: resumeLoading ? "rgba(43,27,10,0.55)" : "#2B1B0A",
                  boxShadow: resumeLoading ? "none" : "0 4px 14px rgba(167,126,46,0.22)",
                }}
              >
                {resumeLoading ? "Подключение..." : "Продолжить партию"}
              </button>
              {resumeError && (
                <p className="text-xs text-center mt-1.5" style={{ color: "var(--sr-danger)" }}>
                  {resumeError}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play online — primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <PrimaryButton onClick={() => navigate("/lobby")} variant="red">
          {t("playOnline")}
        </PrimaryButton>
      </motion.div>

      {/* Engagement strip — streak/daily/challenge */}
      <EngagementStrip />

      {/* Quick Match (Coin) */}
      {supabaseConfigured && <QuickStakeBar />}

      {/* All tables / custom stake */}
      {supabaseConfigured && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          onClick={() => navigate("/stake-lobby")}
          className="w-full max-w-sm flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
          style={{
            background: "var(--sr-surface)",
            border: "1px solid var(--sr-border)",
            color: "var(--sr-wood-deep)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            boxShadow: "var(--sr-shadow-sm)",
          }}
          data-testid="all-tables-btn"
        >
          <ListChecks className="w-4 h-4" />
          <span className="text-sm">
            {t("allTablesCustom", { defaultValue: "Все столы / своя ставка" })}
          </span>
        </motion.button>
      )}

      {/* Secondary CTAs */}
      <motion.div
        data-testid="home-secondary"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-full max-w-sm flex flex-col gap-2.5"
      >
        <PrimaryButton onClick={() => navigate("/local")} variant="ghost">
          {t("playLocal")}
        </PrimaryButton>
        <PrimaryButton onClick={() => navigate("/rules")} variant="ghost">
          {t("rules")}
        </PrimaryButton>
      </motion.div>

      {/* Footer */}
      <div className="flex flex-col items-center pt-2 pb-1">
        <p className="text-[10px] font-medium" style={{ color: "var(--sr-text-subtle)" }}>
          © Шашки Рояль 2026 · Coin — внутренняя игровая валюта
        </p>
      </div>

      <DebugPanel realtimeConnected={false} />
    </div>
  );
}
