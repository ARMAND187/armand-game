import Link from "next/link";
import { games } from "@/data/games";
import { Zap, Play } from "lucide-react";
import WalletDisplay from "@/components/WalletDisplay";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import NewsBoard from "@/components/NewsBoard";
import { createClient } from "@/utils/supabase/server";
import { getRankFromRP } from "@/utils/RankSystem";

export const metadata = {
  title: "Home — Armand Games",
  description: "Your competitive gaming hub.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  let rp = 0;
  if (userData?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rp")
      .eq("id", userData.user.id)
      .single();
    if (profile) rp = profile.rp || 0;
  }

  const rankInfo = getRankFromRP(rp);
  
  // We'll keep the Arcade Grid underneath for secondary navigation
  const liveGames   = games.filter((g) => g.status === "live");
  const soonGames   = games.filter((g) => g.status !== "live");

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", padding: "16px", paddingBottom: "100px" }}>
      {/* ── Header ── */}
      <header className="flex items-center justify-between w-full mb-8 relative pt-[max(env(safe-area-inset-top),1rem)]">
        <UserAvatar />
        <div className="flex items-center gap-3">
          <NotificationBell />
          <WalletDisplay />
        </div>
      </header>

      {/* ── ESPORTS DASHBOARD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-12" style={{ minHeight: "450px" }}>
        
        {/* Left Column (Player Hub) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Subtle background glow based on Rank */}
          <div 
            className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 0% 0%, ${rankInfo.color}, transparent 60%)`
            }}
          />

          <div className="relative z-10">
            <h2 className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-6">Player Hub</h2>
            
            <div className="flex items-end gap-4 mb-2">
              <span className="text-6xl drop-shadow-lg">{rankInfo.icon}</span>
              <div className="flex flex-col">
                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Current Rank</span>
                <span 
                  className="text-4xl font-black uppercase tracking-wider"
                  style={{ color: rankInfo.color, textShadow: `0 0 20px ${rankInfo.glow}` }}
                >
                  {rankInfo.tier}
                </span>
              </div>
            </div>
            
            <div className="text-zinc-300 font-mono text-2xl mb-8 flex items-center gap-2">
              {rp.toLocaleString()} <span className="text-zinc-500 text-sm font-sans uppercase font-bold mt-1">RP</span>
            </div>
          </div>

          <div className="mt-auto relative z-10">
            <Link 
              href="/lobby/geokurdistan" 
              className="w-full py-6 rounded-2xl flex items-center justify-center gap-3 font-black text-2xl tracking-widest uppercase transition-all duration-300 relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, var(--neon), #8b5cf6)",
                boxShadow: "0 0 30px var(--neon-glow)",
                color: "white"
              }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Play className="fill-white" size={28} />
              <span>Find Match</span>
            </Link>
          </div>
        </div>

        {/* Right Column (News & Updates Board) */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <NewsBoard />
        </div>

      </div>

      {/* ── Arcade Container (Kept for other games) ── */}
      <div className="w-full opacity-60 hover:opacity-100 transition-opacity duration-500">
        <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Other Game Modes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Live Games */}
          {liveGames.map((game) => (
            <Link key={game.id} href={`/lobby/${game.id}`} className="game-box w-full" style={{ margin: 0, height: "100%" }}>
              <div
                className="game-box-banner"
                style={{ background: `linear-gradient(135deg, ${game.accentFrom}, ${game.accentTo})` }}
              >
                <span className="game-box-emoji">{game.emoji}</span>
                <span className="game-box-live-dot" />
              </div>
              <div className="game-box-body">
                <div className="game-box-badge">
                  <Zap size={9} />
                  Live
                </div>
                <div className="game-box-title">{game.name}</div>
                <div className="game-box-desc">{game.tagline}</div>
              </div>
            </Link>
          ))}

          {/* Coming Soon Games */}
          {soonGames.map((game) => (
            <div 
              key={game.id} 
              className="game-box game-box--soon w-full" 
              style={{ margin: 0, height: "100%", filter: "grayscale(100%)", opacity: 0.6 }}
            >
              <div
                className="game-box-banner"
                style={{ background: `linear-gradient(135deg, ${game.accentFrom}55, ${game.accentTo}33)` }}
              >
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
