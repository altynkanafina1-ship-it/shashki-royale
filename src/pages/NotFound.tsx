import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "transparent" }}
    >
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1
            className="text-7xl font-bold"
            style={{
              color: "var(--sr-wood-deep)",
              fontFamily: "Cinzel, serif",
            }}
          >
            404
          </h1>
          <h2
            className="text-2xl font-semibold"
            style={{ color: "var(--sr-text)", fontFamily: "Cinzel, serif" }}
          >
            Страница не найдена
          </h2>
        </div>
        <p
          className="text-lg max-w-md mx-auto"
          style={{ color: "var(--sr-text-muted)" }}
        >
          Страница, которую вы ищете, не существует.
        </p>
        <div className="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3.5 rounded-xl font-bold cursor-pointer active:scale-[0.98] transition-transform"
            style={{
              background: "linear-gradient(135deg, #C39A48 0%, #E0BD6A 50%, #A77E2E 100%)",
              color: "#2B1B0A",
              fontFamily: "Inter, sans-serif",
              border: "1px solid rgba(167,126,46,0.55)",
              boxShadow: "0 4px 14px rgba(167,126,46,0.22)",
            }}
          >
            На главный экран
          </button>
          <Link
            to="/local"
            className="w-full py-3 rounded-xl text-center font-semibold"
            style={{
              background: "var(--sr-surface)",
              border: "1px solid var(--sr-border)",
              color: "var(--sr-text)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Играть локально
          </Link>
        </div>
      </div>
    </div>
  );
}
