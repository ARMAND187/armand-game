import { Trophy } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Leaderboard — Armand Games",
  description: "See who's topping the charts on Armand Games.",
};

const MEDAL = ["🥇", "🥈", "🥉"];
const RANK_COLOR: Record<number, string> = { 1: "#fbbf24", 2: "#94a3b8", 3: "#b45309" };

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, wins, avatar_url")
    .order("wins", { ascending: false, nullsFirst: false })
    .limit(50);

  const leaders = (profiles || []).map((p: { username: string | null; wins: number | null; avatar_url: string | null }, i: number) => ({
    rank: i + 1,
    username: p.username || "anonymous",
    score: p.wins || 0,
    games: 0,
    avatarUrl: p.avatar_url,
  }));

  return (
    <div className="page-shell">
      <h1 className="page-header">Leaderboard</h1>
      <p className="page-subtitle">GeoKurdistan — All Time</p>

      {leaders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          <Trophy size={32} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
          <p>No players on the leaderboard yet!</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {leaders.length >= 3 && (
            <div className="podium-row">
              {[leaders[1], leaders[0], leaders[2]].map((p, i) => {
                const heights = ["96px", "120px", "76px"];
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                return (
                  <div key={p.rank} className="podium-col">
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{MEDAL[actualRank - 1]}</div>
                    <div
                      className="lb-avatar"
                      style={{
                        width: i === 1 ? 52 : 42,
                        height: i === 1 ? 52 : 42,
                        boxShadow: i === 1 ? "0 0 0 3px #09090b, 0 0 0 5px #fbbf24, 0 0 20px rgba(251,191,36,0.4)" : "none",
                        overflow: "hidden",
                        border: "none",
                        background: "none"
                      }}
                    >
                      <img 
                        src={p.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${p.username}`} 
                        alt="Avatar" 
                        style={{ width: "100%", height: "100%", objectFit: "cover", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "50%" }}
                      />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginTop: 6, width: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
                      @{p.username}
                    </div>
                    <div
                      className="podium-block"
                      style={{
                        height: heights[i],
                        background: i === 1 ? "linear-gradient(180deg,rgba(167,139,250,0.18) 0%,rgba(167,139,250,0.04) 100%)" : "var(--bg-surface)",
                        borderColor: i === 1 ? "rgba(167,139,250,0.3)" : "var(--border)",
                        color: i === 1 ? "#a78bfa" : "var(--text-muted)",
                      }}
                    >
                      #{actualRank}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table header */}
          <div className="lb-table-header">
            <span style={{ width: 32 }}>Rank</span>
            <span style={{ flex: 1 }}>User</span>
            <span>Score</span>
          </div>

          {/* Full list */}
          {leaders.map((player: { rank: number, username: string, score: number, games: number, avatarUrl: string | null }) => (
            <div key={player.rank} className="lb-row">
              <span
                className="lb-rank"
                style={{ color: RANK_COLOR[player.rank] ?? "var(--text-muted)" }}
              >
                {MEDAL[player.rank - 1] ?? `#${player.rank}`}
              </span>
              <div className="lb-avatar" style={{ width: 36, height: 36, overflow: "hidden", border: "none", background: "none" }}>
                <img 
                  src={player.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${player.username}`} 
                  alt="Avatar" 
                  style={{ width: "100%", height: "100%", objectFit: "cover", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "50%" }}
                />
              </div>
              <div className="lb-info">
                <div className="lb-name" style={{ textTransform: "none" }}>@{player.username}</div>
              </div>
              <div className="lb-balance">{player.score.toLocaleString()}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
