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

      {/* ── Modes ── */}
      {game.modes.length > 0 && (
        <>
          <div className="lobby-section-header">
            <Play size={14} color="var(--neon)" />
            <span>Game Modes</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {game.modes.map((mode, i) => (
              <div
                key={mode.id}
                className={`mode-card${i === 0 ? " mode-card--selected" : ""}`}
              >
                <div className="mode-card-emoji">{mode.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="mode-card-name">{mode.name}</div>
                  <div className="mode-card-desc">{mode.description}</div>
                </div>
                {i === 0 && (
                  <span className="mode-selected-badge">Selected</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Settings ── */}
      {game.settings.length > 0 && (
        <>
          <div className="lobby-section-header">
            <Settings size={14} color="var(--neon)" />
            <span>Settings</span>
          </div>
          <div className="settings-card" style={{ marginBottom: 24 }}>
            {game.settings.map((setting, i) => (
              <div
                key={setting.id}
                className="settings-row"
                style={{
                  borderBottom: i < game.settings.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span className="settings-row-label">{setting.label}</span>
                <div className="settings-row-options">
                  {setting.options.map((opt) => (
                    <button
                      key={opt}
                      className={`settings-option-btn${opt === setting.default ? " active" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bottom CTA Removed */}
    </div>
  );
}
