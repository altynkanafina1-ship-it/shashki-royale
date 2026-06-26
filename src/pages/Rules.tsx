import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, Shield, Move, Crown, Swords, Trophy, Star } from "lucide-react";

const RULES = [
  {
    icon: <Star className="w-5 h-5" />,
    title: "Начало игры",
    text: "На доске 8×8 у каждого игрока по 12 шашек. Шашки расставляются на тёмных клетках трёх ближайших рядов. Белые играют снизу и ходят первыми.",
  },
  {
    icon: <Move className="w-5 h-5" />,
    title: "Ходы простой шашки",
    text: "Простые шашки ходят по диагонали на одну клетку только вперёд. Ход делается на свободную тёмную клетку. Назад простые шашки не ходят.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Обязательное взятие",
    text: "Взятие обязательно! Если есть возможность побить шашку соперника — нужно бить. Простая шашка бьёт через вражескую шашку вперёд и назад.",
  },
  {
    icon: <Swords className="w-5 h-5" />,
    title: "Серия взятий",
    text: "Если после взятия можно побить ещё одну шашку — бить обязательно. Цепочка взятий выполняется одной шашкой за один ход. Продолжайте до конца!",
  },
  {
    icon: <Crown className="w-5 h-5" />,
    title: "Превращение в Дамку",
    text: "Шашка, дошедшая до последней горизонтали, немедленно становится Дамкой (♛). В этот ход она больше не бьёт — даже если есть возможность.",
  },
  {
    icon: <Crown className="w-5 h-5" />,
    title: "Ходы Дамки",
    text: "Дамка ходит на любое количество клеток по диагонали во всех 4 направлениях. Это «летающая дамка» — стандарт русских шашек.",
  },
  {
    icon: <Swords className="w-5 h-5" />,
    title: "Взятие Дамкой",
    text: "Дамка бьёт на любом расстоянии, перепрыгивая через шашку соперника, и встаёт на любую свободную клетку за ней по той же диагонали.",
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: "Победа",
    text: "Вы побеждаете, если у соперника не осталось шашек или он не может сделать ни одного хода. Также можно сдаться — флаг в правом верхнем углу.",
  },
];

const TIPS = [
  "⬜ Белые играют снизу и двигаются вверх",
  "⬛ Чёрные играют сверху и двигаются вниз",
  "👑 Дамка в центре доски — самая сильная фигура",
  "⚔️ Держите шашки вместе — одиночки легко бьются",
];

export default function Rules() {
  const navigate = useNavigate();

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: "transparent" }}
    >
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0"
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
          }}
          aria-label="Назад"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: "var(--sr-wood-deep)" }} />
        </button>
        <div>
          <h1
            className="text-xl font-bold"
            style={{
              fontFamily: "Cinzel, serif",
              color: "var(--sr-wood-deep)",
            }}
          >
            Правила игры
          </h1>
          <p className="text-xs" style={{ color: "var(--sr-text-muted)" }}>
            Русские шашки — классические правила
          </p>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        {RULES.map((rule, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            className="rounded-2xl p-4"
            style={{
              background: "var(--sr-surface)",
              border: "1px solid var(--sr-border)",
              boxShadow: "var(--sr-shadow-sm)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
                  border: "1px solid var(--sr-border-strong)",
                  color: "var(--sr-wood-deep)",
                }}
              >
                {rule.icon}
              </div>
              <div className="min-w-0">
                <h3
                  className="font-bold text-sm mb-1.5"
                  style={{ color: "var(--sr-text)", fontFamily: "Inter, sans-serif" }}
                >
                  {rule.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--sr-text-muted)" }}>
                  {rule.text}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-4 mt-2"
          style={{
            background: "linear-gradient(135deg, #FFFDF8 0%, #FAF3E6 100%)",
            border: "1px solid var(--sr-border-strong)",
            boxShadow: "var(--sr-shadow-sm)",
          }}
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--sr-wood-deep)", fontFamily: "Inter, sans-serif" }}
          >
            Советы
          </p>
          {TIPS.map((tip, i) => (
            <p key={i} className="text-sm py-1" style={{ color: "var(--sr-text)" }}>
              {tip}
            </p>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
