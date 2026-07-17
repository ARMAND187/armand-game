import { getGameById } from "@/data/games";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Settings, ChevronRight, ArrowLeft, Zap } from "lucide-react";
import MatchmakingClient from "@/components/MatchmakingClient";

interface Props {
  params: Promise<{ gameId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { gameId } = await params;
  const game = getGameById(gameId);
  return {
    title: game ? `${game.name} Lobby — Armand Games` : "Lobby — Armand Games",
  };
}

export default async function LobbyPage({ params }: Props) {
  const { gameId } = await params;
  const game = getGameById(gameId);

  if (!game) notFound();

  const isLive = game.status === "live";

  return (
    <div className="page-shell">
      {/* ── Back ── */}
      <div style={{ marginBottom: 16 }}>
        <Link href="/games" className="back-link">
          <ArrowLeft size={16} />
          Games
        </Link>
      </div>

      {/* ── Hero ── */}
      <div
        className="lobby-hero"
        style={{
          background: `linear-gradient(135deg, ${game.accentFrom}33 0%, ${game.accentTo}22 100%)`,
          borderColor: `${game.accentFrom}44`,
        }}
      >
        <div className="lobby-hero-emoji">{game.emoji}</div>
        <h1 className="lobby-hero-title">{game.name}</h1>
        <p className="lobby-hero-tagline">{game.tagline}</p>
        <p className="lobby-hero-desc">{game.description}</p>

        {isLive ? (
          <div style={{ marginTop: 16 }}>
            <MatchmakingClient gameId={game.id} playRoute={game.playRoute!} />
          </div>
        ) : (
          <div className="btn-lobby-soon">
            <Zap size={16} />
            Coming Soon
          </div>
        )}
      </div>


      {/* Bottom CTA Removed */}
    </div>
  );
}
