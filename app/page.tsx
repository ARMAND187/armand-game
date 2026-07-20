import Link from "next/link";
import { games } from "@/data/games";
import { Zap, Play, Swords, TrendingUp, Trophy, Flame } from "lucide-react";
import WalletDisplay from "@/components/WalletDisplay";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import NewsCarousel from "@/components/NewsCarousel";
import { createClient } from "@/utils/supabase/server";
import { getRankFromRP } from "@/utils/RankSystem";
import ShopLockerButtons from "@/components/ShopLockerButtons";

export const metadata = {
  title: "Home — Armand Games",
  description: "Your competitive gaming hub.",
};

// Maps each rank tier to its RP floor and ceiling for progress bar
const RANK_BOUNDS: Record<string, { min: number; max: number }> = {
  Bronze:   { min: 0,    max: 999  },
  Silver:   { min: 1000, max: 1799 },
  Gold:     { min: 1800, max: 2799 },
  Platinum: { min: 2800, max: 3599 },
  Diamond:  { min: 3600, max: 9999 },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  let rp = 0;
  let wins = 0;
  let avatarUrl: string | null = null;
  let username = "Player";

  if (userData?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rp, wins, avatar_url, username")
      .eq("id", userData.user.id)
      .single();
    if (profile) {
      rp       = profile.rp    || 0;
      wins     = profile.wins  || 0;
      avatarUrl = profile.avatar_url || null;
      username  = profile.username
        || userData.user.user_metadata?.username
        || "Player";
    }
  }

  const rankInfo  = getRankFromRP(rp);
  const bounds    = RANK_BOUNDS[rankInfo.tier];
  const progress  = Math.min(100, Math.max(0,
    Math.round(((rp - bounds.min) / (bounds.max - bounds.min)) * 100)
  ));
  const rpToNext  = rankInfo.tier === "Diamond"
    ? "MAX"
    : `${(bounds.max + 1 - rp).toLocaleString()} RP to next`;

  const liveGames = games.filter((g) => g.status === "live");
  const soonGames = games.filter((g) => g.status !== "live");

  // Stat cards data
  const stats = [
    { icon: <Swords  size={14} />, label: "Total Wins",    value: wins.toLocaleString() },
    { icon: <TrendingUp size={14} />, label: "Current RP", value: rp.toLocaleString()   },
    { icon: <Trophy  size={14} />, label: "Rank Tier",     value: rankInfo.tier          },
    { icon: <Flame   size={14} />, label: "Progress",      value: `${progress}%`         },
  ];

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", padding: "16px", paddingBottom: "100px" }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-end w-full relative" style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)", marginBottom: "40px" }}>
        <div className="flex items-center" style={{ gap: "10px" }}>
          <ShopLockerButtons />
          <NotificationBell />
          <WalletDisplay />
        </div>
      </header>

      {/* ── ESPORTS DASHBOARD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-12">

        {/* ── Left Column: Pro Player Identity Card ── */}
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col shadow-2xl relative overflow-hidden isolate"
          style={{ padding: "24px", minHeight: 450 }}
        >
          {/* Rank-coloured background glow */}
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ background: `radial-gradient(circle at 10% 10%, ${rankInfo.color}22, transparent 65%)` }}
          />

          {/* ── 1. Player Identity Header ── */}
          <div className="relative z-10 flex items-center" style={{ gap: "16px", marginBottom: "36px" }}>
            {/* Avatar with online dot */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${rankInfo.color}66` }}
                />
              ) : (
                <div
                  style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${rankInfo.color}55, #1e1040)`,
                    border: `2px solid ${rankInfo.color}66`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900, color: rankInfo.color,
                  }}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online dot */}
              <span
                style={{
                  position: "absolute", bottom: 2, right: 2,
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#4ade80", border: "2px solid #09090b",
                  boxShadow: "0 0 6px #4ade80",
                }}
              />
            </div>

            {/* Username + hub label */}
            <div className="min-w-0">
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(167,139,250,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
                Player Hub
              </p>
              <h1
                className="truncate"
                style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}
              >
                {username}
              </h1>
            </div>
          </div>

          {/* ── 2. Rank & Progress Tracker ── */}
          <div
            className="relative z-10 rounded-2xl mb-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px" }}
          >
            {/* Rank row */}
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: 32, lineHeight: 1 }}>{rankInfo.icon}</span>
              <div className="flex-1 min-w-0">
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Current Rank
                </p>
                <p
                  style={{ margin: 0, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", color: rankInfo.color, textShadow: `0 0 16px ${rankInfo.glow}` }}
                  className="truncate"
                >
                  {rankInfo.tier}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>
                  {rp.toLocaleString()}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>RP</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div
                style={{
                  height: 7, borderRadius: 6, background: "rgba(255,255,255,0.08)",
                  overflow: "hidden", marginBottom: 5,
                }}
              >
                <div
                  style={{
                    height: "100%", borderRadius: 6,
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${rankInfo.color}99, ${rankInfo.color})`,
                    boxShadow: `0 0 8px ${rankInfo.glow}`,
                    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{progress}%</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{rpToNext}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Removed per request */}

          {/* ── Find Match Button ── */}
          <div className="relative z-10 mt-auto">
            <Link
              href="/lobby/geokurdistan"
              className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xl tracking-widest uppercase transition-all duration-300 relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, var(--neon), #8b5cf6)",
                boxShadow: "0 0 28px var(--neon-glow)",
                color: "white",
              }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Play className="fill-white shrink-0" size={22} />
              <span>Find Match</span>
            </Link>
          </div>
        </div>

        {/* ── Right Column: News Carousel ── */}
        <div className="w-full flex flex-col isolate relative" style={{ height: "100%", minHeight: 450 }}>
          <NewsCarousel />
        </div>

      </div>

      {/* ── Arcade Grid ── */}
      <div className="w-full opacity-60 hover:opacity-100 transition-opacity duration-500">
        <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Other Game Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {liveGames.map((game) => (
            <Link key={game.id} href={`/lobby/${game.id}`} className="game-box w-full" style={{ margin: 0, height: "100%" }}>
              <div className="game-box-banner" style={{ background: `linear-gradient(135deg, ${game.accentFrom}, ${game.accentTo})` }}>
                <span className="game-box-emoji">{game.emoji}</span>
                <span className="game-box-live-dot" />
              </div>
              <div className="game-box-body">
                <div className="game-box-badge"><Zap size={9} />Live</div>
                <div className="game-box-title">{game.name}</div>
                <div className="game-box-desc">{game.tagline}</div>
              </div>
            </Link>
          ))}
          {soonGames.map((game) => (
            <div key={game.id} className="game-box game-box--soon w-full" style={{ margin: 0, height: "100%", filter: "grayscale(100%)", opacity: 0.6 }}>
              <div className="game-box-banner" style={{ background: `linear-gradient(135deg, ${game.accentFrom}55, ${game.accentTo}33)` }}>
                <span className="game-box-emoji" style={{ opacity: 0.5 }}>{game.emoji}</span>
              </div>
              <div className="game-box-body">
                <div className="game-box-badge game-box-badge--muted">Soon</div>
                <div className="game-box-title" style={{ opacity: 0.55 }}>{game.name}</div>
                <div className="game-box-desc" style={{ opacity: 0.4 }}>{game.tagline}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

