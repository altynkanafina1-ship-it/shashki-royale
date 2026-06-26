import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { readDailyLogin } from "../services/engagement.ts";
import { useProfile } from "../hooks/use-profile.ts";

export default function EngagementStrip() {
  const { profile } = useProfile();
  const [loginDays, setLoginDays] = useState(0);

  useEffect(() => {
    const s = readDailyLogin();
    setLoginDays(s.streak);
  }, []);

  const winStreak = profile?.win_streak ?? 0;
  const bestStreak = profile?.best_win_streak ?? 0;
  const challengeWins = (() => {
    const date = profile?.daily_challenge_date;
    if (!date) return 0;
    const today = new Date().toISOString().slice(0, 10);
    return date === today ? profile?.daily_challenge_wins ?? 0 : 0;
  })();
  const challengeGoal = 3;
  const challengeDone = challengeWins >= challengeGoal;

  if (winStreak === 0 && loginDays <= 1 && challengeWins === 0) return null;

  return (
    <motion.div
      data-testid="engagement-strip"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      className="w-full max-w-sm flex gap-2"
    >
      {winStreak > 0 && (
        <div
          data-testid="strip-win-streak"
          className="flex-1 px-2.5 py-2 rounded-xl text-center"
          style={{
            background: "linear-gradient(135deg, #FBE8D6 0%, #F5D8B8 100%)",
            border: "1px solid rgba(232, 142, 64, 0.4)",
            boxShadow: "var(--sr-shadow-sm)",
          }}
          title={bestStreak > 0 ? `Рекорд: ${bestStreak}` : ""}
        >
          <div
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "#A85A1F" }}
          >
            Серия 🔥
          </div>
          <div
            className="text-lg font-bold leading-tight"
            style={{ color: "#A85A1F", fontFamily: "Cinzel, serif" }}
          >
            {winStreak}
          </div>
        </div>
      )}

      {loginDays >= 2 && (
        <div
          data-testid="strip-daily-login"
          className="flex-1 px-2.5 py-2 rounded-xl text-center"
          style={{
            background: "linear-gradient(135deg, #DCEEDF 0%, #C7E4CC 100%)",
            border: "1px solid rgba(86,129,93,0.4)",
            boxShadow: "var(--sr-shadow-sm)",
          }}
        >
          <div
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "#3D5F45" }}
          >
            Дней подряд
          </div>
          <div
            className="text-lg font-bold leading-tight"
            style={{ color: "#3D5F45", fontFamily: "Cinzel, serif" }}
          >
            {loginDays}
          </div>
        </div>
      )}

      <div
        data-testid="strip-daily-challenge"
        className="flex-1 px-2.5 py-2 rounded-xl text-center"
        style={{
          background: challengeDone
            ? "linear-gradient(135deg, #F3DEA0 0%, #E0BD6A 100%)"
            : "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
          border: challengeDone
            ? "1px solid var(--sr-wood-deep)"
            : "1px solid var(--sr-border-strong)",
          boxShadow: "var(--sr-shadow-sm)",
        }}
        title={challengeDone ? "Чемпион дня — выполнен!" : "Выиграй 3 партии за сегодня → титул «Чемпион дня»"}
      >
        <div
          className="text-[10px] uppercase tracking-wider font-semibold"
          style={{ color: challengeDone ? "#5C3F18" : "var(--sr-text-muted)" }}
        >
          {challengeDone ? "Чемпион 👑" : "Цель дня"}
        </div>
        <div
          className="text-lg font-bold leading-tight"
          style={{ color: challengeDone ? "#5C3F18" : "var(--sr-wood-deep)", fontFamily: "Cinzel, serif" }}
        >
          {Math.min(challengeWins, challengeGoal)}/{challengeGoal}
        </div>
      </div>
    </motion.div>
  );
}
