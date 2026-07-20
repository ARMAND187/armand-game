import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Ensure Challenge Titles exist
    const challengeTitles = [
      { name: 'Sniper', title: 'Challenge Title', description: 'Complete Sniper challenge', balance: 0, rarity: 'Epic', rarity_color: '#a78bfa' },
      { name: 'Speedrunner', title: 'Challenge Title', description: 'Complete Speedrunner challenge', balance: 0, rarity: 'Legendary', rarity_color: '#fbbf24' },
      { name: 'High Roller', title: 'Challenge Title', description: 'Complete High Roller challenge', balance: 0, rarity: 'Epic', rarity_color: '#a78bfa' },
      { name: 'Rising Star', title: 'Challenge Title', description: 'Complete Rising Star challenge', balance: 0, rarity: 'Rare', rarity_color: '#60a5fa' }
    ];

    for (const item of challengeTitles) {
      const { data } = await supabase.from('challenge_items').select('id').eq('name', item.name).limit(1);
      if (!data || data.length === 0) {
        await supabase.from('challenge_items').insert([item]);
      }
    }

    // 2. Ensure Streak Titles exist
    const streakTitles = [
      { name: 'Navigator', title: 'Streak Title', description: 'Day 1 Streak Reward', balance: 0, rarity: 'Epic', rarity_color: '#a78bfa' }
    ];

    for (const item of streakTitles) {
      const { data } = await supabase.from('streak_items').select('id').eq('name', item.name).limit(1);
      if (!data || data.length === 0) {
        await supabase.from('streak_items').insert([item]);
      }
    }
    
    // 3. Optional cleanup of shop_items (if needed)
    await supabase.from('shop_items').delete().in('type', ['Challenge Title', 'Streak Title']);

    return NextResponse.json({ success: true, message: "Database tables populated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
