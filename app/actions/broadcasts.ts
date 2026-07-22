"use server";

import { createClient } from "@supabase/supabase-js";

export async function getGlobalBroadcasts() {
  try {
    // Use service role key to bypass RLS and fetch broadcasts globally
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the 10 most recent broadcasts. Since the admin inserts one per user,
    // we might get duplicates if we just query the table.
    // However, if we just fetch the distinct ones, we can show them to everyone!
    // Since Supabase JS doesn't have a distinct operator natively without RPC, 
    // we'll fetch a larger chunk and deduplicate in code.
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body, created_at, image_url")
      .eq("type", "broadcast")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    // Deduplicate by title + body
    const unique = [];
    const seen = new Set();
    for (const item of data) {
      const key = `${item.title}-${item.body}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
        if (unique.length >= 3) break; // Only need top 3
      }
    }

    return unique;
  } catch (error) {
    console.error("Error fetching global broadcasts:", error);
    return [];
  }
}
