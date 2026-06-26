import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, TrendingUp, TrendingDown, Gift, Lock, Unlock, Coins } from "lucide-react";
import { getWallet, getWalletTransactions } from "../services/stakes";
import { usePlayerId } from "../hooks/usePlayerId";
import { toast } from "sonner";
import type { Wallet, WalletTransaction } from "../services/stakes";

const TRANSACTION_ICONS: Record<string, React.ReactNode> = {
  deposit: <Gift className="w-5 h-5" style={{ color: "#56815D" }} />,
  withdrawal: <TrendingDown className="w-5 h-5" style={{ color: "#A74740" }} />,
  fee_lock: <Lock className="w-5 h-5" style={{ color: "#BC8B33" }} />,
  fee_refund: <Unlock className="w-5 h-5" style={{ color: "#3b82f6" }} />,
  prize_payout: <TrendingUp className="w-5 h-5" style={{ color: "#BC8B33" }} />,
  starting_bonus: <Gift className="w-5 h-5" style={{ color: "#a78bfa" }} />,
  loss: <TrendingDown className="w-5 h-5" style={{ color: "#A74740" }} />,
};

const TRANSACTION_LABELS: Record<string, string> = {
  deposit: "Бонус",
  withdrawal: "Расход",
  fee_lock: "Ставка в турнире",
  fee_refund: "Возврат ставки",
  prize_payout: "Выигрыш турнира",
  starting_bonus: "Стартовый бонус",
  loss: "Проигрыш",
};

export default function WalletPage() {
  const navigate = useNavigate();
  const { playerId, isLoading: authLoading } = usePlayerId();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const loadWallet = async () => {
      try {
        const [walletData, transactionsData] = await Promise.all([
          getWallet(playerId),
          getWalletTransactions(playerId, 100),
        ]);
        setWallet(walletData);
        setTransactions(transactionsData);
      } catch (err) {
        console.error("Error loading wallet:", err);
        toast.error("Ошибка загрузки баланса");
      } finally {
        setLoading(false);
      }
    };
    loadWallet();
  }, [playerId, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-4 animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--sr-border)", borderTopColor: "var(--sr-wood-deep)" }}
          />
          <p style={{ color: "var(--sr-text-muted)" }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-sm" style={{ borderBottom: "1px solid var(--sr-border)" }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="p-2 rounded-lg transition-colors"
            style={{ background: "var(--sr-surface)" }}
          >
            <ChevronLeft className="w-6 h-6" style={{ color: "var(--sr-wood-deep)" }} />
          </motion.button>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6" style={{ color: "var(--sr-wood-deep)" }} />
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--sr-wood-deep)", fontFamily: "Cinzel, serif" }}
            >
              Монеты
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl backdrop-blur-sm"
            style={{
              background: "var(--sr-surface)",
              border: "1px solid var(--sr-border-strong)",
            }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--sr-text-muted)" }}>
              Доступные монеты
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-bold"
                style={{ color: "var(--sr-wood-deep)", fontFamily: "Inter, sans-serif" }}
              >
                {wallet?.crypto_balance.toFixed(0) ?? "0"}
              </span>
              <span style={{ color: "var(--sr-text-muted)" }}>🪙</span>
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--sr-text-muted)" }}>
              Доступны для турниров
            </p>
          </motion.div>

          {/* Locked Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl backdrop-blur-sm"
            style={{
              background: "var(--sr-surface)",
              border: "1px solid var(--sr-border-strong)",
            }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--sr-text-muted)" }}>
              В активных играх
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-bold"
                style={{ color: "#BC8B33", fontFamily: "Inter, sans-serif" }}
              >
                {wallet?.locked_balance.toFixed(0) ?? "0"}
              </span>
              <span style={{ color: "var(--sr-warning)" }}>🔒</span>
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--sr-text-muted)" }}>
              Заблокированы до конца партии
            </p>
          </motion.div>
        </div>

        {/* Total Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl backdrop-blur-sm text-center"
          style={{
            background: "linear-gradient(135deg, var(--sr-border) 0%, var(--sr-surface) 100%)",
            border: "1px solid var(--sr-border-strong)",
          }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--sr-text-muted)" }}>
            Всего монет
          </p>
          <p className="text-5xl font-bold" style={{ color: "var(--sr-wood-deep)", fontFamily: "Cinzel, serif" }}>
            {((wallet?.crypto_balance ?? 0) + (wallet?.locked_balance ?? 0)).toFixed(0)}
          </p>
          <p className="text-xs mt-3" style={{ color: "var(--sr-text-muted)" }}>
            Все монеты виртуальные и не имеют реальной ценности
          </p>
        </motion.div>

        {/* Transactions */}
        <div>
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: "var(--sr-wood-deep)", fontFamily: "Cinzel, serif" }}
          >
            История
          </h2>

          {transactions.length === 0 ? (
            <div
              className="p-8 rounded-2xl text-center backdrop-blur-sm"
              style={{
                background: "var(--sr-surface-2)",
                border: "1px solid var(--sr-border)",
              }}
            >
              <p style={{ color: "var(--sr-text-muted)" }}>Нет операций</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, idx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg backdrop-blur-sm flex items-center justify-between"
                  style={{
                    background: "var(--sr-surface-2)",
                    border: "1px solid var(--sr-border)",
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--sr-surface)" }}
                    >
                      {TRANSACTION_ICONS[tx.type] || <Gift className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: "var(--sr-wood-deep)" }}>
                        {TRANSACTION_LABELS[tx.type] || tx.type}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--sr-text-muted)" }}>
                        {new Date(tx.created_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-bold"
                      style={{
                        color:
                          tx.type === "withdrawal" || tx.type === "fee_lock" || tx.type === "loss"
                            ? "#A74740"
                            : "#56815D",
                      }}
                    >
                      {tx.type === "withdrawal" || tx.type === "fee_lock" || tx.type === "loss" ? "-" : "+"}
                      {tx.amount.toFixed(0)} 🪙
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
