"use server";

import { createClient } from "@supabase/supabase-js";

// Ensure the service role key is available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function updateLobbyRP(playerScores: Record<string, number>) {
  if (!supabaseServiceKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing. Cannot update RP.");
    return { success: false, error: "Server missing Service Role Key" };
  }

  const usernames = Object.keys(playerScores);
  if (usernames.length === 0) return { success: true };

  // Fetch current RP for all players
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, rp")
    .in("username", usernames);

  if (error || !profiles) {
    console.error("Failed to fetch profiles for RP distribution", error);
    return { success: false, error: "Database error" };
  }

  // Sort players by score descending
  const sortedPlayers = usernames.map(username => ({
    username,
    score: playerScores[username],
    profile: profiles.find(p => p.username === username)
  })).sort((a, b) => b.score - a.score);

  const numPlayers = sortedPlayers.length;
  
  // Calculate updates
  const updates = sortedPlayers.map((player, index) => {
    let rpChange = 0;
    
    if (numPlayers === 1) {
      // Solo match: Small flat gain to encourage play, but capped.
      if (player.score >= 300) rpChange = 10;
      else if (player.score >= 200) rpChange = 5;
      else rpChange = 0;
    } else {
      // Multiplayer Placement RP
      if (index === 0) rpChange = 50; // 1st Place
      else if (index === 1 && numPlayers > 2) rpChange = 15; // 2nd Place in 3+ lobby
      else if (index === numPlayers - 1) rpChange = -30; // Last Place
      else rpChange = -10; // Middle/3rd Place
    }

    const currentRP = player.profile?.rp || 0;
    const newRP = Math.max(0, currentRP + rpChange);

    return {
      id: player.profile?.id,
      username: player.username,
      newRP,
      rpChange
    };
  });

  // Bulk update (Supabase JS doesn't have a simple bulk update without an RPC, 
  // so we'll do it iteratively for this prototype)
  for (const update of updates) {
    if (update.id) {
      await supabaseAdmin
        .from("profiles")
        .update({ rp: update.newRP })
        .eq("id", update.id);
    }
  }

  return { success: true, updates };
}
