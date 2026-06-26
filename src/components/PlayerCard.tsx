import { motion } from "motion/react";
import type { Profile } from "../services/profiles";

const AVATARS = ["♟", "♛", "⚔️", "👑", "🎯", "⭐", "🏆", "💎"];

type PlayerCardProps = {
  profile: Profile | null;
  color: "white" | "black";
  isActive: boolean;
  timeRemaining?: number;
};

export default function PlayerCard({
  profile,
  color,
  isActive,
  timeRemaining,
}: PlayerCardProps) {
  const displayName = profile?.display_name || profile?.nickname || "Игрок";
  const avatarUrl = profile?.avatar_url;
  const avatarIndex = profile?.avatar_index ?? 0;
  const symbolAvatar = AVATARS[avatarIndex % AVATARS.length];
  const rating = profile?.rating ?? 0;
  const winStreak = profile?.win_streak ?? 0;

  const isWhite = color === "white";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{
        background: isActive
          ? "linear-gradient(135deg, #FFFDF8 0%, #FAF3E6 100%)"
          : "var(--sr-surface-2)",
        border: `1px solid ${isActive ? "var(--sr-border-strong)" : "var(--sr-border-soft)"}`,
        opacity: isActive ? 1 : 0.7,
        boxShadow: isActive ? "var(--sr-shadow-sm)" : "none",
      }}
    >
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-11 h-11 rounded-full object-cover"
            style={{ border: "1.5px solid var(--sr-border-strong)" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {!avatarUrl && (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg"
            style={{
              background: isWhite
                ? "radial-gradient(circle at 35% 32%, #FFFFFF 0%, #F4E8D0 45%, #D9C39E 100%)"
                : "radial-gradient(circle at 35% 32%, #5A5048 0%, #2E2620 50%, #1A1410 100%)",
              border: `1.5px solid ${isWhite ? "#BFA078" : "#3A2F26"}`,
              color: isWhite ? "#5C3F18" : "#E8CC85",
            }}
          >
            {symbolAvatar}
          </div>
        )}
        {isActive && (
          <motion.div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              background: "#56815D",
              border: "2px solid #FFFDF8",
              boxShadow: "0 0 8px rgba(86,129,93,0.6)",
            }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold truncate"
          style={{ color: "var(--sr-text)", fontFamily: "Inter, sans-serif" }}
        >
          {displayName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p
            className="text-xs font-medium"
            style={{ color: "var(--sr-text-muted)" }}
          >
            Рейтинг: {rating}
          </p>
          {winStreak >= 2 && (
            <span
              data-testid="win-streak-badge"
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(232, 142, 64, 0.15)",
                border: "1px solid rgba(232, 142, 64, 0.45)",
                color: "#A85A1F",
                fontFamily: "Inter, sans-serif",
                lineHeight: 1,
              }}
              title={`Серия побед: ${winStreak}`}
            >
              🔥 {winStreak}
            </span>
          )}
        </div>
      </div>

      {timeRemaining !== undefined && isActive && (
        <div
          className="text-sm font-bold"
          style={{ color: timeRemaining > 10 ? "#56815D" : "var(--sr-danger)" }}
        >
          {Math.ceil(timeRemaining)}s
        </div>
      )}
    </motion.div>
  );
}
