import { useState } from "react";
import { cn } from "@/lib/utils.ts";

type PrimaryButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "gold" | "red" | "ghost";
  disabled?: boolean;
  className?: string;
};

/**
 * Premium light-theme primary button.
 *  - "gold"  → warm brass gradient on ivory (main brand CTA)
 *  - "red"   → soft terracotta (warning / online play)
 *  - "ghost" → ivory card with brass border (secondary actions)
 */
export default function PrimaryButton({
  onClick,
  children,
  variant = "gold",
  disabled = false,
  className,
}: PrimaryButtonProps) {
  const [hovered, setHovered] = useState(false);

  const getBoxShadow = () => {
    if (disabled) return "0 1px 3px rgba(80,55,30,0.08)";
    if (variant === "gold") {
      return hovered
        ? "0 8px 22px rgba(167,126,46,0.32), 0 2px 6px rgba(80,55,30,0.18)"
        : "0 4px 14px rgba(167,126,46,0.22), 0 1px 3px rgba(80,55,30,0.10)";
    }
    if (variant === "red") {
      return hovered
        ? "0 8px 22px rgba(167,71,64,0.30), 0 2px 6px rgba(80,55,30,0.18)"
        : "0 4px 14px rgba(167,71,64,0.22), 0 1px 3px rgba(80,55,30,0.10)";
    }
    return hovered
      ? "0 4px 14px rgba(120,90,50,0.18)"
      : "0 1px 3px rgba(80,55,30,0.08)";
  };

  const styles: Record<"gold" | "red" | "ghost", React.CSSProperties> = {
    gold: {
      background: disabled
        ? "linear-gradient(135deg, #E5D5B0 0%, #D9C8A2 100%)"
        : hovered
          ? "linear-gradient(135deg, #D4AA52 0%, #E8C870 50%, #B98A32 100%)"
          : "linear-gradient(135deg, #C39A48 0%, #E0BD6A 50%, #A77E2E 100%)",
      color: "#2B1B0A",
      border: "1px solid rgba(167,126,46,0.5)",
      boxShadow: getBoxShadow(),
    },
    red: {
      background: disabled
        ? "#D9C2BE"
        : hovered
          ? "linear-gradient(135deg, #B6534B 0%, #C36058 100%)"
          : "linear-gradient(135deg, #A74740 0%, #B45049 100%)",
      color: "#FBF6EC",
      border: "1px solid rgba(132,53,46,0.6)",
      boxShadow: getBoxShadow(),
    },
    ghost: {
      background: hovered ? "#FAF3E6" : "#FFFDF8",
      color: "#2B241E",
      border: "1px solid #D9C9B7",
      boxShadow: getBoxShadow(),
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "w-full py-4 font-semibold text-base cursor-pointer transition-all duration-200 active:scale-[0.98]",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      style={{
        borderRadius: "14px",
        fontFamily: "Inter, ui-sans-serif, sans-serif",
        letterSpacing: "0.02em",
        transform: hovered && !disabled ? "translateY(-1px)" : "translateY(0)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}
