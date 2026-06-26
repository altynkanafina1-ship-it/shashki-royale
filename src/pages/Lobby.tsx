import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Copy, Check, Share2, Users, Zap } from "lucide-react";
import CustomKeypad from "../components/CustomKeypad.tsx";
import { motion, AnimatePresence } from "motion/react";
import { supabase, supabaseConfigured } from "../lib/supabase.ts";
import { saveActiveGame } from "../lib/storage.ts";
import { usePlayerId } from "../hooks/usePlayerId";
import { createRoom, joinRoom, fetchGame, extractRoomCode, findAndJoinRandomRoom, type GameRow } from "../services/gameRooms.ts";
import PrimaryButton from "../components/PrimaryButton.tsx";
import { toast } from "sonner";

type LobbyMode = "menu" | "quickplay" | "creating" | "waiting" | "friend_menu" | "joining" | "error";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
}

export default function Lobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { playerId } = usePlayerId();

  const [mode, setMode] = useState<LobbyMode>("menu");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [useMobile] = useState(() => isMobileDevice());

  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const autoJoinStartedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const navigateToGame = useCallback(
    (gameId: string, color: "white" | "black", code: string) => {
      cleanup();
      saveActiveGame({
        gameId,
        roomCode: code,
        playerId,
        playerColor: color,
        savedAt: Date.now(),
      });
      navigate("/online-game", { state: { gameId, myColor: color } });
    },
    [cleanup, navigate, playerId],
  );

  const handleQuickPlay = async () => {
    if (!supabaseConfigured) {
      setErrorMsg("Сервер не подключён. Попробуйте позже.");
      setMode("error");
      return;
    }
    setMode("quickplay");

    try {
      const found = await findAndJoinRandomRoom(playerId);

      if (found) {
        toast.success("Соперник найден!");
        navigateToGame(found.id, "black", found.room_code);
        return;
      }

      const game = await createRoom(playerId);
      gameIdRef.current = game.id;
      setRoomCode(game.room_code);
      setMode("waiting");

      if (!supabase) return;

      const ch = supabase
        .channel(`lobby_wait:${game.id}`, { config: { broadcast: { self: false } } })
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${game.id}` },
          (payload) => {
            const updated = payload.new as GameRow;
            if (updated.status === "playing" && updated.black_player_id) {
              toast.success("Соперник найден!");
              navigateToGame(game.id, "white", game.room_code);
            }
          },
        )
        .subscribe();
      channelRef.current = ch;

      pollRef.current = setInterval(async () => {
        const fresh = await fetchGame(game.id);
        if (!fresh) return;
        if (fresh.status === "playing" && fresh.black_player_id) {
          toast.success("Соперник найден!");
          navigateToGame(game.id, "white", game.room_code);
        }
      }, 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка подключения";
      setErrorMsg(russianError(msg));
      setMode("error");
    }
  };

  const handleCreateRoom = async () => {
    if (!supabaseConfigured) {
      setErrorMsg("Сервер не подключён.");
      setMode("error");
      return;
    }
    setMode("creating");
    try {
      const game = await createRoom(playerId);
      gameIdRef.current = game.id;
      setRoomCode(game.room_code);
      setMode("waiting");

      if (!supabase) return;

      const ch = supabase
        .channel(`lobby_wait:${game.id}`, { config: { broadcast: { self: false } } })
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${game.id}` },
          (payload) => {
            const updated = payload.new as GameRow;
            if (updated.status === "playing" && updated.black_player_id) {
              navigateToGame(game.id, "white", game.room_code);
            }
          },
        )
        .subscribe();
      channelRef.current = ch;

      pollRef.current = setInterval(async () => {
        const fresh = await fetchGame(game.id);
        if (!fresh) return;
        if (fresh.status === "playing" && fresh.black_player_id) {
          navigateToGame(game.id, "white", game.room_code);
        }
      }, 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка создания комнаты";
      setErrorMsg(russianError(msg));
      setMode("error");
    }
  };

  const handleJoinRoom = useCallback(
    async (rawCode?: string) => {
      if (!supabaseConfigured) {
        setErrorMsg("Сервер не подключён.");
        setMode("error");
        return;
      }
      const code = extractRoomCode(rawCode ?? joinCode);
      if (code.length < 6) {
        setErrorMsg("Введите 6-значный код комнаты");
        setMode("error");
        return;
      }
      setJoinCode(code);
      setMode("joining");
      try {
        const game = await joinRoom(code, playerId);
        navigateToGame(game.id, "black", game.room_code);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ошибка подключения";
        setErrorMsg(russianError(msg));
        setMode("error");
      }
    },
    [joinCode, navigateToGame, playerId],
  );

  useEffect(() => {
    const roomFromLink = searchParams.get("room") ?? searchParams.get("code");
    if (!supabaseConfigured || !roomFromLink || autoJoinStartedRef.current) return;
    const code = extractRoomCode(roomFromLink);
    if (code.length !== 6) return;
    autoJoinStartedRef.current = true;
    setJoinCode(code);
    void handleJoinRoom(code);
  }, [handleJoinRoom, searchParams]);

  const getInviteLink = useCallback((code: string) => {
    if (typeof window === "undefined") return code;
    const url = new URL("/lobby", window.location.origin);
    url.searchParams.set("room", code);
    return url.toString();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    toast.success("Код скопирован ✓");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareInvite = async () => {
    const inviteLink = getInviteLink(roomCode);
    const text = `Играй со мной в Шашки Рояль! Код: ${roomCode}\n${inviteLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Шашки Рояль", text, url: inviteLink });
        return;
      } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(text).catch(() => {});
    setInviteCopied(true);
    toast.success("Приглашение скопировано ✓");
    setTimeout(() => setInviteCopied(false), 2200);
  };

  const goBack = () => {
    cleanup();
    setMode("menu");
    setJoinCode("");
  };

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: "transparent" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--sr-border-soft)",
          background: "rgba(255,253,248,0.65)",
          backdropFilter: "blur(8px)",
        }}
      >
        <button
          onClick={() => { cleanup(); navigate("/"); }}
          className="p-2 cursor-pointer rounded-xl active:scale-95"
          style={{
            background: "var(--sr-surface)",
            border: "1px solid var(--sr-border)",
            boxShadow: "var(--sr-shadow-sm)",
            minWidth: 40,
            minHeight: 40,
          }}
          aria-label="Назад"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: "var(--sr-wood-deep)" }} />
        </button>
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "Cinzel, serif", color: "var(--sr-wood-deep)" }}
        >
          Онлайн игра
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto py-6">
        <AnimatePresence mode="wait">

          {mode === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm space-y-4"
            >
              <div className="text-center mb-4">
                <motion.div
                  className="mx-auto mb-3 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
                      border: "1px solid var(--sr-border-strong)",
                      boxShadow: "var(--sr-shadow-sm)",
                    }}
                  >
                    <Zap className="w-8 h-8" style={{ color: "var(--sr-wood-deep)" }} />
                  </div>
                </motion.div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--sr-text-muted)" }}
                >
                  Выберите режим
                </p>
              </div>

              <motion.button
                onClick={handleQuickPlay}
                whileTap={{ scale: 0.97 }}
                className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #C39A48 0%, #E0BD6A 50%, #A77E2E 100%)",
                  color: "#2B1B0A",
                  border: "1px solid rgba(167,126,46,0.55)",
                  boxShadow: "0 8px 24px rgba(167,126,46,0.28), 0 2px 6px rgba(80,55,30,0.14)",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.02em",
                }}
              >
                <Zap className="w-6 h-6" />
                Быстрая игра
              </motion.button>
              <p className="text-center text-xs" style={{ color: "var(--sr-text-muted)" }}>
                Автоматический поиск соперника — без кодов
              </p>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px" style={{ background: "var(--sr-border)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--sr-text-subtle)" }}>или</span>
                <div className="flex-1 h-px" style={{ background: "var(--sr-border)" }} />
              </div>

              <motion.button
                onClick={() => setMode("friend_menu")}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: "var(--sr-surface)",
                  border: "1px solid var(--sr-border-strong)",
                  color: "var(--sr-text)",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "var(--sr-shadow-sm)",
                }}
              >
                <Users className="w-5 h-5" />
                Играть с другом
              </motion.button>
              <p className="text-center text-xs" style={{ color: "var(--sr-text-subtle)" }}>
                Создайте комнату и отправьте код другу
              </p>
            </motion.div>
          )}

          {mode === "quickplay" && (
            <motion.div
              key="quickplay"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm text-center space-y-5"
            >
              <motion.div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FAF3E6 0%, #F0E1C4 100%)",
                  border: "1px solid var(--sr-border-strong)",
                  boxShadow: "var(--sr-shadow-sm)",
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              >
                <Zap className="w-10 h-10" style={{ color: "var(--sr-wood-deep)" }} />
              </motion.div>
              <div>
                <p className="text-lg font-bold" style={{ color: "var(--sr-wood-deep)", fontFamily: "Cinzel, serif" }}>
                  Поиск соперника...
                </p>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: "var(--sr-gold)" }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--sr-text-muted)" }}>
                Подключим к первому свободному сопернику
              </p>
              <button
                onClick={goBack}
                className="text-sm cursor-pointer py-2 px-4 rounded-lg"
                style={{
                  color: "var(--sr-text-muted)",
                  background: "var(--sr-surface)",
                  border: "1px solid var(--sr-border)",
                }}
              >
                Отмена
              </button>
            </motion.div>
          )}

          {mode === "friend_menu" && (
            <motion.div
              key="friend_menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm space-y-4"
            >
              <div className="text-center mb-2">
                <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--sr-wood-deep)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--sr-text-muted)" }}>
                  Создайте комнату или войдите по коду
                </p>
              </div>

              <PrimaryButton onClick={handleCreateRoom} variant="gold">
                Создать комнату
              </PrimaryButton>

              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: "var(--sr-surface)",
                  border: "1px solid var(--sr-border)",
                  boxShadow: "var(--sr-shadow-sm)",
                }}
              >
                <p className="text-xs text-center font-semibold" style={{ color: "var(--sr-text-muted)" }}>
                  Войти по коду друга
                </p>
                {useMobile ? (
                  <CustomKeypad value={joinCode} onChange={setJoinCode} maxLength={120} />
                ) : (
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(extractRoomCode(e.target.value))}
                    placeholder="КОД ИЛИ ССЫЛКА"
                    maxLength={120}
                    className="w-full text-center text-2xl font-black tracking-[0.35em] py-3 outline-none"
                    style={{
                      background: "var(--sr-surface-2)",
                      border: "1px solid var(--sr-border-strong)",
                      borderRadius: "12px",
                      color: "var(--sr-text)",
                      fontFamily: "Cinzel, serif",
                      caretColor: "var(--sr-wood-deep)",
                    }}
                    autoFocus
                  />
                )}
                <PrimaryButton
                  onClick={() => handleJoinRoom()}
                  variant="ghost"
                  disabled={joinCode.trim().length < 6}
                >
                  Войти в комнату
                </PrimaryButton>
              </div>

              <button
                onClick={goBack}
                className="w-full text-sm cursor-pointer py-2"
                style={{ color: "var(--sr-text-muted)", fontWeight: 500 }}
              >
                ← Назад
              </button>
            </motion.div>
          )}

          {mode === "creating" && (
            <motion.div
              key="creating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-3"
            >
              <div
                className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: "var(--sr-border-strong)", borderTopColor: "transparent" }}
              />
              <p style={{ color: "var(--sr-text-muted)", fontWeight: 500 }}>Создание комнаты...</p>
            </motion.div>
          )}

          {mode === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm space-y-5 text-center"
            >
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #FFFDF8 0%, #FAF3E6 100%)",
                  border: "1px solid var(--sr-border-strong)",
                  boxShadow: "var(--sr-shadow-card)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-[0.3em] mb-2 font-semibold"
                  style={{ color: "var(--sr-text-muted)" }}
                >
                  Код комнаты
                </p>
                <p
                  className="text-5xl font-black tracking-[0.3em] mb-4"
                  style={{ fontFamily: "Cinzel, serif", color: "var(--sr-wood-deep)" }}
                >
                  {roomCode}
                </p>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 mx-auto py-2.5 px-6 cursor-pointer text-sm font-semibold transition-all active:scale-95"
                  style={{
                    borderRadius: "12px",
                    background: copied ? "#EAF3EA" : "var(--sr-surface)",
                    border: `1px solid ${copied ? "rgba(86,129,93,0.5)" : "var(--sr-border-strong)"}`,
                    color: copied ? "#3D5F45" : "var(--sr-text)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {copied ? <><Check className="w-4 h-4" /> Скопировано</> : <><Copy className="w-4 h-4" /> Скопировать код</>}
                </button>
                <button
                  onClick={handleShareInvite}
                  className="mt-3 flex items-center gap-2 mx-auto py-2.5 px-6 cursor-pointer text-sm font-semibold transition-all active:scale-95"
                  style={{
                    borderRadius: "12px",
                    background: inviteCopied ? "#EAF3EA" : "var(--sr-surface-2)",
                    border: `1px solid ${inviteCopied ? "rgba(86,129,93,0.5)" : "var(--sr-border)"}`,
                    color: inviteCopied ? "#3D5F45" : "var(--sr-text-muted)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {inviteCopied ? <><Check className="w-4 h-4" /> Готово</> : <><Share2 className="w-4 h-4" /> Поделиться</>}
                </button>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: "var(--sr-gold)" }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--sr-text-muted)" }}>
                    Ожидание соперника...
                  </p>
                </div>
                <p className="text-xs" style={{ color: "var(--sr-text-subtle)" }}>
                  Друг может войти по коду или по ссылке
                </p>
              </div>

              <button
                onClick={goBack}
                className="text-sm cursor-pointer"
                style={{ color: "var(--sr-text-muted)", fontWeight: 500 }}
              >
                Отмена
              </button>
            </motion.div>
          )}

          {mode === "joining" && (
            <motion.div
              key="joining"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-3"
            >
              <div
                className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: "var(--sr-border-strong)", borderTopColor: "transparent" }}
              />
              <p style={{ color: "var(--sr-text-muted)", fontWeight: 500 }}>Подключение к комнате...</p>
            </motion.div>
          )}

          {mode === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm space-y-4 text-center"
            >
              <div
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "var(--sr-danger-soft)", border: "1px solid var(--sr-danger)" }}
              >
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--sr-danger)" }}>
                {errorMsg}
              </p>
              <button
                onClick={goBack}
                className="py-2.5 px-6 rounded-xl text-sm cursor-pointer font-semibold"
                style={{
                  background: "var(--sr-surface)",
                  border: "1px solid var(--sr-border-strong)",
                  color: "var(--sr-text)",
                  boxShadow: "var(--sr-shadow-sm)",
                }}
              >
                Попробовать снова
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

function russianError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("комната не найдена") || lower.includes("no rows") || lower.includes("invalid input")) {
    return "Комната не найдена. Проверьте код.";
  }
  if (lower.includes("уже занята") || lower.includes("already")) {
    return "Комната уже занята. Создайте новую.";
  }
  if (lower.includes("уже в этой")) {
    return "Вы уже в этой комнате.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed")) {
    return "Ошибка сети. Проверьте интернет.";
  }
  if (lower.includes("timeout")) {
    return "Время ожидания вышло.";
  }
  if (lower.includes("не настроен") || lower.includes("not configured")) {
    return "Сервер не подключён. Попробуйте позже.";
  }
  return msg;
}
