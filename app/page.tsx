import Link from "next/link";
import { games } from "@/data/games";
import { Zap, Bell } from "lucide-react";
import WalletDisplay from "@/components/WalletDisplay";

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
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <span style={{ fontSize: "20px", fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>Armand Games</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/notifications" style={{ 
            display: "flex", alignItems: "center", justifyContent: "center", 
            width: "36px", height: "36px", borderRadius: "10px", 
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" 
          }}>
            <Bell size={18} />
          </Link>
          <WalletDisplay />
        </div>
      </header>

      {/* ── Arcade Container ── */}
      <div style={{
        background: "#18181b", // zinc-900
        border: "1px solid #27272a", // zinc-800
        borderRadius: "24px",
        padding: "24px",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "20px", marginTop: 0 }}>The Arcade</h2>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
          gap: "16px" 
        }}>
          {/* Live Games */}
          {liveGames.map((game) => (
            <Link key={game.id} href={`/lobby/${game.id}`} className="game-box" style={{ margin: 0, height: "100%" }}>
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
              className="game-box game-box--soon" 
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
