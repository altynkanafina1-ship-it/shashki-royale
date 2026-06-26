import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "../hooks/use-profile";
import { usePlayerId } from "../hooks/usePlayerId";
import { fetchStakeTables, createStakeGame, joinStakeGame, cancelStakeGame } from "../services/stakes";
import { saveActiveGame } from "../lib/storage";
import { createInitialBoard } from "../game/initialBoard";
import { supabaseConfigured } from "../lib/supabase";

export const QUICK_STAKES = [1, 5, 10, 25, 50] as const;
export type QuickStake = (typeof QUICK_STAKES)[number];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function GoldCoin({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ filter: "drop-shadow(0 1px 2px rgba(167,126,46,0.35))", flexShrink: 0 }}
    >
      <defs>
        <radialGradient id="qsb-gc" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F3DEA0" />
          <stop offset="50%" stopColor="#E0BD6A" />
          <stop offset="100%" stopColor="#A77E2E" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#qsb-gc)" stroke="#9C7530" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#5C3F18" fontFamily="serif">
        ₡
      </text>
    </svg>
  );
}

type StakeRow = { entry_fee: number; pot_amount: number; escrow_status: string };
type StakeTable = {
  id: string;
  room_code: string;
  status: string;
  match_type: string;
  white_player_id?: string | null;
  white_profile_id?: string | null;
  game_stakes: StakeRow | StakeRow[] | null;
};

function pickStake(raw: StakeRow | StakeRow[] | null | undefined): StakeRow | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export default function QuickStakeBar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, wallet, isLoading: profileLoading, refresh: refreshProfile } = useProfile();
  const { playerId } = usePlayerId();
  const [busyStake, setBusyStake] = useState<QuickStake | null>(null);

  const balance = wallet?.crypto_balance ?? 0;
  const balanceKnown = !!wallet;

  const startQuickMatch = async (stake: QuickStake) => {
    if (!supabaseConfigured) {
      toast.error(t("supabaseNotConfigured", { defaultValue: "Онлайн временно недоступен" }));
      return;
    }
    if (profileLoading || !profile) {
      toast.info(t("preparingProfile", { defaultValue: "Готовим профиль…" }));
      await refreshProfile().catch(() => {});
      return;
    }
    if (balance < stake) {
      toast.error(t("notEnoughCoins", { defaultValue: "Недостаточно Coin для этой ставки" }));
      return;
    }

    setBusyStake(stake);
    try {
      const tables = (await fetchStakeTables()) as unknown as StakeTable[];

      const myStaleTables = tables.filter((tbl) => {
        const isMine =
          (tbl.white_player_id != null && tbl.white_player_id === playerId) ||
          (tbl.white_profile_id != null && profile?.id != null && tbl.white_profile_id === profile.id);
        return isMine && tbl.status === "waiting";
      });

      const reusableSelf = myStaleTables.find(
        (tbl) => Number(pickStake(tbl.game_stakes)?.entry_fee ?? 0) === Number(stake),
      );

      if (reusableSelf) {
        saveActiveGame({
          gameId: reusableSelf.id,
          roomCode: reusableSelf.room_code,
          playerId,
          playerColor: "white",
          savedAt: Date.now(),
        });
        navigate("/online-game", { state: { gameId: reusableSelf.id, myColor: "white", stake } });
        return;
      }

      for (const stale of myStaleTables) {
        try {
          await cancelStakeGame(playerId, stale.id);
        } catch (e) {
          console.warn("[QuickMatch] failed to cancel stale table", stale.id, e);
        }
      }
      await refreshProfile().catch(() => {});

      const candidate = tables.find((tbl) => {
        const stakeRow = pickStake(tbl.game_stakes);
        const fee = Number(stakeRow?.entry_fee ?? 0);
        const isMine =
          (tbl.white_player_id != null && tbl.white_player_id === playerId) ||
          (tbl.white_profile_id != null && profile?.id != null && tbl.white_profile_id === profile.id);
        return fee === Number(stake) && tbl.status === "waiting" && !isMine;
      });

      if (candidate) {
        const result = await joinStakeGame(playerId, candidate.id);
        if (result.error) throw new Error(result.error);
        saveActiveGame({
          gameId: candidate.id,
          roomCode: candidate.room_code,
          playerId,
          playerColor: "black",
          savedAt: Date.now(),
        });
        await refreshProfile();
        toast.success(`⚔️ ${t("opponentFound", { defaultValue: "Соперник найден!" })} (${stake} Coin)`);
        navigate("/online-game", { state: { gameId: candidate.id, myColor: "black", stake } });
        return;
      }

      const roomCode = generateRoomCode();
      const board = createInitialBoard();
      const result = await createStakeGame(playerId, stake, roomCode, board);
      if (result.error) throw new Error(result.error);
      saveActiveGame({
        gameId: result.game_id,
        roomCode: result.room_code,
        playerId,
        playerColor: "white",
        savedAt: Date.now(),
      });
      await refreshProfile();
      navigate("/online-game", { state: { gameId: result.game_id, myColor: "white", stake } });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Error";
      const friendly = mapErrorToRussian(raw);
      toast.error(friendly);
    } finally {
      setBusyStake(null);
    }
  };

  return (
    <motion.div
      data-testid="quick-stake-bar"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.4 }}
      className="w-full max-w-sm rounded-2xl px-3 py-2.5"
      style={{
        background: "linear-gradient(135deg, #FFFDF8 0%, #FAF3E6 100%)",
        border: "1px solid var(--sr-border-strong)",
        boxShadow: "var(--sr-shadow-card)",
      }}
    >
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: "var(--sr-wood-deep)" }} />
          <span
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: "var(--sr-wood-deep)", fontFamily: "Inter, sans-serif" }}
          >
            {t("quickMatch", { defaultValue: "Быстрый матч" })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <GoldCoin size={12} />
          {balanceKnown ? (
            <span
              className="text-xs font-black"
              style={{ color: "var(--sr-wood-deep)", fontFamily: "Inter, sans-serif" }}
              data-testid="qsb-balance"
            >
              {balance.toLocaleString()}
            </span>
          ) : (
            <span
              className="inline-block h-3 w-10 rounded animate-pulse"
              style={{ background: "var(--sr-surface-muted)" }}
              data-testid="qsb-balance-loading"
            />
          )}
        </div>
      </div>

      <div
        className="grid grid-cols-5 gap-1.5"
        role="group"
        aria-label={t("quickMatch", { defaultValue: "Быстрый матч" })}
      >
        {QUICK_STAKES.map((stake) => {
          const affordable = balanceKnown && balance >= stake;
          const isBusy = busyStake === stake;
          const disabled = isBusy || busyStake !== null || (!balanceKnown && !profileLoading) || !affordable;
          return (
            <button
              key={stake}
              type="button"
              data-testid={`qsb-stake-${stake}`}
              onClick={() => void startQuickMatch(stake)}
              disabled={disabled}
              className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: !affordable
                  ? "var(--sr-surface-2)"
                  : isBusy
                  ? "linear-gradient(135deg, #F3DEA0 0%, #E0BD6A 100%)"
                  : "linear-gradient(135deg, #FFFDF8 0%, #F0E1C4 100%)",
                border: !affordable
                  ? "1px solid var(--sr-border-soft)"
                  : "1px solid var(--sr-border-strong)",
                color: !affordable ? "var(--sr-text-subtle)" : "var(--sr-wood-deep)",
                boxShadow: affordable && !isBusy ? "var(--sr-shadow-sm)" : "none",
                minHeight: 50,
              }}
              title={!affordable ? t("notEnoughCoins", { defaultValue: "Не хватает Coin" }) : `${stake} Coin`}
            >
              <GoldCoin size={14} />
              <span
                className="text-xs font-black leading-none"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {stake}
              </span>
            </button>
          );
        })}
      </div>

      <p
        className="text-[10px] text-center mt-2 leading-snug font-medium"
        style={{ color: "var(--sr-text-muted)" }}
      >
        {balanceKnown && balance < 1
          ? t("freeModeHint", { defaultValue: "Нулевой баланс? Играйте локально или онлайн без ставки" })
          : t("quickMatchHint", { defaultValue: "Выбери ставку — найдём соперника" })}
      </p>
    </motion.div>
  );
}

function mapErrorToRussian(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("profile not found") || lower.includes("профиль не найден")) {
    return "Готовим профиль… Попробуйте через пару секунд";
  }
  if (lower.includes("choose the best candidate function") || lower.includes("pgrst203")) {
    return "Сервер перенастраивается, попробуйте позже";
  }
  if (lower.includes("entry_fee") || lower.includes("check constraint")) {
    return "Эта ставка сейчас недоступна";
  }
  if (lower.includes("недостаточно")) return "Недостаточно Coin";
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Ошибка сети. Проверьте интернет";
  }
  return raw;
}
