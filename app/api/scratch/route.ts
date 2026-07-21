import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch all users who have claimed Day 2 or higher
    const { data: users, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("id, balance, current_streak")
      .gte("current_streak", 2);

    if (fetchErr) throw fetchErr;

    console.log(`Found ${users.length} users who have reached Day 2+`);

    let updatedCount = 0;
    // 2. Loop through and grant 50 balance
    for (const user of users) {
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ balance: (user.balance || 0) + 50 })
        .eq("id", user.id);
        
      if (!updateErr) updatedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Retroactively added 50 balance to ${updatedCount} players who claimed Day 2+` 
    });

  } catch (error: any) {
    console.error("Scratch execution failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
