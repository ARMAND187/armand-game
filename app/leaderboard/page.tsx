import { Trophy } from "lucide-react";

export const metadata = {
  title: "Leaderboard — Armand Games",
  description: "See who's topping the charts on Armand Games.",
};

const LEADERS = [
  { rank: 1, name: "Soran K.",  username: "soran_k",  score: 12450, games: 42 },
  { rank: 2, name: "Dilan H.",  username: "dilan_h",  score: 11200, games: 38 },
  { rank: 3, name: "Hana B.",   username: "hana_b",   score: 9870,  games: 31 },
  { rank: 4, name: "Rayan M.",  username: "rayan_m",  score: 8640,  games: 28 },
  { rank: 5, name: "Lavin A.",  username: "lavin_a",  score: 7330,  games: 24 },
  { rank: 6, name: "Kawa Z.",   username: "kawa_z",   score: 6100,  games: 19 },
  { rank: 7, name: "Narin S.",  username: "narin_s",  score: 5480,  games: 17 },
  { rank: 8, name: "Berxo P.",  username: "berxo_p",  score: 4900,  games: 14 },
  { rank: 9, name: "Zilan T.",  username: "zilan_t",  score: 3750,  games: 11 },
  { rank: 10, name: "Amed R.", username: "amed_r",   score: 2980,  games: 8  },
];

const MEDAL = ["🥇", "🥈", "🥉"];
const RANK_COLOR: Record<number, string> = { 1: "#fbbf24", 2: "#94a3b8", 3: "#b45309" };

export default function LeaderboardPage() {
  return (
    <div className="page-shell">
      <h1 className="page-header">Leaderboard</h1>
      <p className="page-subtitle">GeoKurdistan — All Time</p>

      {/* Podium */}
      <div className="podium-row">
        {[LEADERS[1], LEADERS[0], LEADERS[2]].map((p, i) => {
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
                  fontSize: i === 1 ? 18 : 14,
                  boxShadow: i === 1 ? "0 0 0 3px #09090b, 0 0 0 5px #fbbf24, 0 0 20px rgba(251,191,36,0.4)" : "none",
                }}
              >
                {p.name[0]}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginTop: 6 }}>
                {p.name}
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

      {/* Table header */}
      <div className="lb-table-header">
        <span style={{ width: 32 }}>Rank</span>
        <span style={{ flex: 1 }}>User</span>
        <span>Score</span>
      </div>

      {/* Full list */}
      {LEADERS.map((player) => (
        <div key={player.rank} className="lb-row">
          <span
            className="lb-rank"
            style={{ color: RANK_COLOR[player.rank] ?? "var(--text-muted)" }}
          >
            {MEDAL[player.rank - 1] ?? `#${player.rank}`}
          </span>
          <div className="lb-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
            {player.name[0]}
          </div>
          <div className="lb-info">
            <div className="lb-name">{player.name}</div>
            <div className="lb-score">@{player.username} · {player.games} games</div>
          </div>
          <div className="lb-balance">{player.score.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
