import Link from "next/link";
import { games } from "@/data/games";
import { Zap } from "lucide-react";
import WalletDisplay from "@/components/WalletDisplay";
import NotificationBell from "@/components/NotificationBell";

export const metadata = {
  title: "Home — Armand Games",
  description: "Your gaming hub. Check your balance and jump into a game.",
};

export default function HomePage() {
  const liveGames   = games.filter((g) => g.status === "live");
  const soonGames   = games.filter((g) => g.status !== "live");

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", padding: "16px", paddingBottom: "100px" }}>
      {/* ── Header ── */}
      <header className="flex items-center justify-between w-full mb-8 relative">
        <span className="whitespace-nowrap text-xl sm:text-2xl font-extrabold text-white tracking-tight">Armand Games</span>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <WalletDisplay />
        </div>
      </header>

      {/* ── Arcade Container ── */}
      <div className="mt-8 md:mt-12 overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6 lg:p-8 w-full">
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "20px", marginTop: 0 }}>The Arcade</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
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
