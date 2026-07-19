export type RankTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export interface RankInfo {
  tier: RankTier;
  color: string;
  glow: string;
  icon: string;
}

export function getRankFromRP(rp: number): RankInfo {
  if (rp >= 3600) {
    return { tier: "Diamond", color: "#38bdf8", glow: "rgba(56, 189, 248, 0.5)", icon: "💎" };
  } else if (rp >= 2800) {
    return { tier: "Platinum", color: "#a78bfa", glow: "rgba(167, 139, 250, 0.5)", icon: "💠" };
  } else if (rp >= 1800) {
    return { tier: "Gold", color: "#fbbf24", glow: "rgba(251, 191, 36, 0.5)", icon: "🏆" };
  } else if (rp >= 1000) {
    return { tier: "Silver", color: "#94a3b8", glow: "rgba(148, 163, 184, 0.5)", icon: "⚔️" };
  } else {
    return { tier: "Bronze", color: "#b45309", glow: "rgba(180, 83, 9, 0.5)", icon: "🛡️" };
  }
}
