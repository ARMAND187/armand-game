import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // 1. Update the balance for Day 2 streak items
    const { error: updateErr } = await supabase
      .from('streak_items')
      .update({ balance: 50 })
      .eq('required_streak', 2);
      
    // 2. Compensate users who have current_streak = 2
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username, rp')
      .eq('current_streak', 2);
      
    const compensated = [];
    if (users && users.length > 0) {
      for (const u of users) {
        await supabase.from('profiles').update({ rp: (u.rp || 0) + 50 }).eq('id', u.id);
        compensated.push(u.username);
      }
    }
    
    return NextResponse.json({ success: true, message: "Streak fixed", compensated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
