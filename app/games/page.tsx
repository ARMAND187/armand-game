import { games } from "@/data/games";
import Link from "next/link";
import { Zap, Lock, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Games — Armand Games",
  description: "Browse and play all Armand Games titles.",
};

export default function GamesPage() {
  return (
    <div className="page-shell">
      <h1 className="page-header">Games</h1>
      <p className="page-subtitle">Choose your game and enter the lobby</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {games.map((game) => {
          const isLive = game.status === "live";
          const Wrapper = isLive ? Link : "div";
          const wrapperProps = isLive ? { href: `/lobby/${game.id}` } : {};

          return (
            <Wrapper
              key={game.id}
              {...(wrapperProps as Record<string, unknown>)}
              className={`game-list-row${!isLive ? " game-list-row--soon" : ""}`}
            >
              {/* Icon */}
              <div
                className="game-list-icon"
                style={{
                  background: `linear-gradient(135deg, ${game.accentFrom}${isLive ? "" : "44"}, ${game.accentTo}${isLive ? "" : "22"})`,
                }}
              >
                <span style={{ fontSize: 26 }}>{game.emoji}</span>
              </div>

              {/* Info */}
              <div className="game-list-info">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="game-list-name">{game.name}</span>
                  {isLive ? (
                    <span className="tag-live"><Zap size={9} />Live</span>
                  ) : (
                    <span className="tag-soon"><Lock size={9} />Soon</span>
                  )}
                </div>
                <span className="game-list-tagline">{game.tagline}</span>
                <span className="game-list-category">{game.category}</span>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={18}
                color={isLive ? "var(--neon)" : "var(--border)"}
                style={{ flexShrink: 0 }}
              />
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
