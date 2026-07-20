import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { username, sniperInc, speedrunnerInc, risingStarInc, highRollerInc } = await request.json();

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    // Fetch the current profile challenges
    const { data: profile } = await supabase
      .from("profiles")
      .select("challenge_rising_star, challenge_sniper, challenge_high_roller, challenge_speedrunner")
      .eq("username", username)
      .single();

    if (profile) {
      const updates: any = {};
      
      if (sniperInc > 0) updates.challenge_sniper = (profile.challenge_sniper || 0) + sniperInc;
      if (speedrunnerInc > 0) updates.challenge_speedrunner = (profile.challenge_speedrunner || 0) + speedrunnerInc;
      if (risingStarInc > 0) updates.challenge_rising_star = (profile.challenge_rising_star || 0) + risingStarInc;
      if (highRollerInc > 0) updates.challenge_high_roller = (profile.challenge_high_roller || 0) + highRollerInc;

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("profiles")
          .update(updates)
          .eq("username", username);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Challenge update error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
