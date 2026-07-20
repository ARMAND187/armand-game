import { createClient } from "@/utils/supabase/server";
import LeaderboardClient from "./LeaderboardClient";

export const metadata = {
  title: "Leaderboard — Armand Games",
  description: "See who's topping the charts on Armand Games.",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, rp, wins, avatar_url, equipped_flair")
    .order("rp", { ascending: false, nullsFirst: false })
    .limit(100);

  const leaders = (profiles || []).map((p: any, i: number) => ({
    rank: i + 1,
    username: p.username || "anonymous",
    rp: p.rp || 0,
    score: p.wins || 0,
    games: 0,
    avatarUrl: p.avatar_url,
    equippedFlair: p.equipped_flair || null,
  }));

  return <LeaderboardClient initialData={leaders} />;
}
