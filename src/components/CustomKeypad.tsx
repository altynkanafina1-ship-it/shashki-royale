import { motion } from "motion/react";

const KEY_ROWS = [
  ["A", "B", "C", "D", "E", "F", "G", "H"],
  ["J", "K", "L", "M", "N", "P", "Q", "R"],
  ["S", "T", "U", "V", "W", "X", "Y", "Z"],
  ["2", "3", "4", "5", "6", "7", "8", "9"],
];

type CustomKeypadProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
};

export default function CustomKeypad({
  value,
  onChange,
  maxLength = 6,
}: CustomKeypadProps) {
  const handleKey = (key: string) => {
    if (value.length < maxLength) onChange(value + key);
  };
  const handleDelete = () => onChange(value.slice(0, -1));
  const handleClear = () => onChange("");

  return (
    <div className="w-full select-none">
      <div className="flex justify-center gap-1.5 mb-4">
        {Array.from({ length: maxLength }).map((_, i) => (
          <motion.div
            key={i}
            animate={
              value[i]
                ? { scale: [1, 1.15, 1], transition: { duration: 0.15 } }
                : {}
            }
            className="w-10 h-12 flex items-center justify-center rounded-lg text-xl font-bold"
            style={{
              background: value[i] ? "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)" : "var(--sr-surface-2)",
              border: `1px solid ${value[i] ? "var(--sr-border-strong)" : "var(--sr-border)"}`,
              color: "var(--sr-text)",
              fontFamily: "Cinzel, serif",
              boxShadow: value[i] ? "var(--sr-shadow-sm)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {value[i] ?? ""}
          </motion.div>
        ))}
      </div>

      <div className="space-y-1">
        {KEY_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1 justify-center">
            {row.map((key) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.88 }}
                onClick={() => handleKey(key)}
                disabled={value.length >= maxLength}
                className="flex-1 h-9 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-35 transition-colors"
                style={{
                  background: "var(--sr-surface)",
                  border: "1px solid var(--sr-border)",
                  color: "var(--sr-text)",
                  fontFamily: "Inter, sans-serif",
                  maxWidth: "42px",
                  minWidth: "30px",
                }}
              >
                {key}
              </motion.button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-2.5">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleClear}
          disabled={value.length === 0}
          className="flex-1 h-10 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-35 transition-colors"
          style={{
            background: "rgba(167, 71, 64, 0.10)",
            border: "1px solid rgba(167, 71, 64, 0.4)",
            color: "var(--sr-danger)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Очистить
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleDelete}
          disabled={value.length === 0}
          className="flex-1 h-10 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-35 transition-colors"
          style={{
            background: "var(--sr-surface)",
            border: "1px solid var(--sr-border-strong)",
            color: "var(--sr-text)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          ← Удалить
        </motion.button>
      </div>
    </div>
  );
}
