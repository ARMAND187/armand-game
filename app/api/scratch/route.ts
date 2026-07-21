import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Delete all streak items from user inventory
    const { error: invErr } = await supabaseAdmin
      .from("user_inventory")
      .delete()
      .not("streak_item_id", "is", null);

    if (invErr) throw invErr;

    // 2. Reset all player streaks back to 0
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({ 
        current_streak: 0, 
        last_streak_claim: null 
      })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Dummy condition to update all

    if (profileErr) throw profileErr;

    return NextResponse.json({ 
      success: true, 
      message: `Successfully reset all player streaks to 0 and removed all claimed streak items from their inventories!` 
    });

  } catch (error: any) {
    console.error("Scratch execution failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
