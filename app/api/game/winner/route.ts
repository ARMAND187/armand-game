import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { winnerUsername } = await request.json();

    if (!winnerUsername) {
      return NextResponse.json({ error: "Missing winnerUsername" }, { status: 400 });
    }

    // Since we don't have a service role key to easily bypass RLS and increment,
    // we will fetch the current wins, and increment it for that user.
    // Note: In a production app, this should be done via an RPC function or a secure backend
    // to prevent clients from spoofing wins. Since this is a fun test project, we'll do it simply here.

    const { data: profile } = await supabase
      .from("profiles")
      .select("wins")
      .eq("username", winnerUsername)
      .single();

    if (profile) {
      const currentWins = profile.wins || 0;
      await supabase
        .from("profiles")
        .update({ wins: currentWins + 1 })
        .eq("username", winnerUsername);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Winner update error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
