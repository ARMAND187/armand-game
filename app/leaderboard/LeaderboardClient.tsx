"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { getRankFromRP } from "@/utils/RankSystem";

const MEDAL = ["🥇", "🥈", "🥉"];
const RANK_COLOR: Record<number, string> = { 1: "#fbbf24", 2: "#94a3b8", 3: "#b45309" };

import PlayerNameFlair from "@/components/PlayerNameFlair";

export default function LeaderboardClient({ initialData }: { initialData: any[] }) {
  const [limit, setLimit] = useState(10);
  
  const leaders = initialData.slice(0, limit);

  return (
    <div className="page-shell">
      <h1 className="page-header">Leaderboard</h1>
      <p className="page-subtitle">GeoKurdistan — All Time</p>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
        {[10, 50, 100].map(val => (
          <button 
            key={val}
            onClick={() => setLimit(val)}
            style={{
              padding: "8px 20px",
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              background: limit === val ? "var(--neon)" : "var(--bg-elevated)",
              color: limit === val ? "#fff" : "var(--text-muted)",
              border: `1px solid ${limit === val ? "var(--neon)" : "var(--border)"}`,
              transition: "all 0.2s"
            }}
          >
            Top {val}
          </button>
        ))}
      </div>

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
                        border: `2px solid ${getRankFromRP(p.rp).color}66`,
                        background: "none"
                      }}
                    >
                      <img 
                        src={p.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${p.username}`} 
                        alt="Avatar" 
                        style={{ width: "100%", height: "100%", objectFit: "cover", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "50%" }}
                      />
                    </div>
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 6, width: "100%", overflow: "hidden", flexDirection: "column", alignItems: "center" }}>
                        <PlayerNameFlair username={p.username} flair={p.equippedFlair} />
                        {p.equippedTitle && (
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--neon)", textTransform: "uppercase", marginTop: 2 }}>
                            {p.equippedTitle}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: 4, display: "flex", alignItems: "center" }}>
                        <span style={{ 
                          fontSize: 10, 
                          fontWeight: 800, 
                          color: getRankFromRP(p.rp).color, 
                          background: getRankFromRP(p.rp).glow, 
                          padding: "2px 6px", 
                          borderRadius: 6 
                        }}>
                          {getRankFromRP(p.rp).icon} {getRankFromRP(p.rp).tier}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--neon)", fontWeight: 700, marginTop: 4 }}>
                        {p.rp} RP
                      </div>
                      <div
                        className="podium-block"
                        style={{
                          height: heights[i],
                          background: i === 1 ? "linear-gradient(180deg,rgba(167,139,250,0.18) 0%,rgba(167,139,250,0.04) 100%)" : "var(--bg-surface)",
                          borderColor: i === 1 ? "rgba(167,139,250,0.3)" : "var(--border)",
                          color: i === 1 ? "#a78bfa" : "var(--text-muted)",
                          marginTop: 6
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
          {leaders.map((player: any) => {
            const rankInfo = getRankFromRP(player.rp);
            return (
            <div key={player.rank} className="lb-row">
              <span
                className="lb-rank"
                style={{ color: RANK_COLOR[player.rank] ?? "var(--text-muted)" }}
              >
                {MEDAL[player.rank - 1] ?? `#${player.rank}`}
              </span>
              <div className="lb-avatar" style={{ width: 36, height: 36, overflow: "hidden", border: `2px solid ${rankInfo.color}66`, background: "none" }}>
                <img 
                  src={player.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${player.username}`} 
                  alt="Avatar" 
                  style={{ width: "100%", height: "100%", objectFit: "cover", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "50%" }}
                />
              </div>
              <div className="lb-info" style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <div className="lb-name" style={{ textTransform: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center" }}>
                  <PlayerNameFlair username={player.username} flair={player.equippedFlair} />
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 800, 
                    color: rankInfo.color, 
                    background: rankInfo.glow, 
                    padding: "2px 6px", 
                    borderRadius: 6 
                  }}>
                    {rankInfo.icon} {rankInfo.tier}
                  </span>
                </div>
              </div>
              <div className="lb-balance" style={{ color: "var(--neon)", whiteSpace: "nowrap", marginLeft: 8 }}>{player.rp.toLocaleString()} RP</div>
            </div>
          )})}
        </>
      )}
    </div>
  );
}
