import Link from "next/link";
import { games } from "@/data/games";
import { Zap, ChevronRight } from "lucide-react";
import WalletDisplay from "@/components/WalletDisplay";
import BalanceDisplay from "@/components/BalanceDisplay";

export const metadata = {
  title: "Home — Armand Games",
  description: "Your gaming hub. Check your balance and jump into a game.",
};

export default function HomePage() {
  const liveGames   = games.filter((g) => g.status === "live");
  const soonGames   = games.filter((g) => g.status !== "live");

  return (
    <div className="page-shell">
      {/* ── Header ── */}
      <header className="home-header">
        <span className="home-brand">Armand Games</span>
        <WalletDisplay />
      </header>



      {/* ── Quick stats removed for general game hub ── */}

      {/* ── Live Games ── */}
      <p className="section-title">Play Now</p>
      <div className="games-grid">
        {liveGames.map((game) => (
          <Link key={game.id} href={`/lobby/${game.id}`} className="game-box">
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
      </div>

      {/* ── Coming Soon ── */}
      <p className="section-title" style={{ marginTop: 8 }}>Coming Soon</p>
      <div className="games-grid">
        {soonGames.map((game) => (
          <div key={game.id} className="game-box game-box--soon">
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

      {/* ── Browse all ── */}
      <Link href="/games" className="browse-all-btn">
        Browse all games
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
