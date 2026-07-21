import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Delete old streak items
    await supabaseAdmin.from("streak_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 2. Insert new streak items
    const { error: insertErr } = await supabaseAdmin.from("streak_items").insert([
      {
        name: "Navigator",
        title: "Streak Title",
        description: "Day 1 Reward Title",
        balance: 0,
        icon_name: "Compass",
        rarity: "Epic",
        rarity_color: "#a78bfa",
        required_streak: 1
      },
      {
        name: "100 Balance",
        title: "Streak Reward",
        description: "Free balance for your streak!",
        balance: 100,
        icon_name: "Coins",
        rarity: "Legendary",
        rarity_color: "#f59e0b",
        required_streak: 2
      },
      {
        name: "Starter Pin",
        title: "Profile Pin",
        description: "A cool starter pin!",
        balance: 0,
        image_url: `<svg width="120" height="144" viewBox="0 0 120 144" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="starterPinGrad" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#6b8fa8"/>
      <stop offset="100%" stop-color="#3d5f78"/>
    </linearGradient>
    <filter id="starterShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <g filter="url(#starterShadow)">
    <path d="M60 4C32 4 10 25.4 10 52.6c0 36.4 50 82.4 50 82.4s50-46 50-82.4C110 25.4 88 4 60 4z" fill="url(#starterPinGrad)" stroke="#22394a" stroke-width="2"/>
  </g>
  <circle cx="60" cy="52" r="37" fill="#eef4f8" stroke="#22394a" stroke-width="2"/>
  <g transform="translate(60,52)">
    <circle r="20" fill="none" stroke="#3d5f78" stroke-width="2"/>
    <polygon points="0,-14 5,0 0,14 -5,0" fill="#3d5f78"/>
    <circle r="3" fill="#eef4f8" stroke="#3d5f78" stroke-width="1.2"/>
  </g>
</svg>`,
        rarity: "Rare",
        rarity_color: "#60a5fa",
        required_streak: 3
      },
      {
        name: "Flame Flair",
        title: "Name Flair",
        description: "A fiery flair for your name",
        balance: 0,
        image_url: `<svg width="220" height="56" viewBox="0 0 220 56" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="214" height="50" rx="25" fill="#2a0f0a" stroke="#ff7a3d" stroke-width="2.2"/>
  <path d="M30 18c-5 5-8 9-8 14 0 5 3.5 9 8 9s8-4 8-9c0-3-1.5-5-2.5-6.5 0 2-1 3-2 3 .5-3.5-.5-6.5-3.5-10.5z" fill="#ff7a3d"/>
  <text x="50" y="34" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#ff7a3d">PlayerName</text>
</svg>`,
        rarity: "Epic",
        rarity_color: "#ef4444",
        required_streak: 4
      },
      {
        name: "Violet Ring",
        title: "Avatar Frame",
        description: "A glowing purple ring for your avatar",
        balance: 0,
        image_url: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="w2grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c79bff"/>
      <stop offset="100%" stop-color="#6a2fb0"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="46" fill="none" stroke="url(#w2grad)" stroke-width="6"/>
</svg>`,
        rarity: "Epic",
        rarity_color: "#a855f7",
        required_streak: 5
      },
      {
        name: "Sunset Banner",
        title: "Profile Banner",
        description: "A beautiful sunset gradient banner",
        balance: 0,
        image_url: `<svg width="400" height="90" viewBox="0 0 400 90" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="w3grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffb347"/>
      <stop offset="50%" stop-color="#ff6f61"/>
      <stop offset="100%" stop-color="#c94f7c"/>
    </linearGradient>
  </defs>
  <rect width="400" height="90" rx="10" fill="url(#w3grad)"/>
  <circle cx="330" cy="45" r="18" fill="#fff6da" opacity="0.9"/>
  <path d="M0 78 C 60 62, 120 70, 180 60 C 240 50, 300 66, 400 55 L400 90 L0 90 Z" fill="#1a1a1a" opacity="0.18"/>
  <rect x="0" y="0" width="400" height="90" rx="10" fill="none" stroke="#1a1a1a" stroke-width="2"/>
</svg>`,
        rarity: "Legendary",
        rarity_color: "#fbbf24",
        required_streak: 6
      }
    ]);

    if (insertErr) throw insertErr;

    return NextResponse.json({ 
      success: true, 
      message: "Successfully seeded Day 1-6 Streak Items with SVGs!" 
    });

  } catch (error: any) {
    console.error("Scratch execution failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
