import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseKey) {
    return NextResponse.json({ error: "No service role key found in environment." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const item = {
      name: '\tFlair Phoenix',
      type: 'Name Flair',
      price: 1800,
      rarity: 'Epic',
      rarity_color: '#ff5b1a',
      image_url: `<svg width="220" height="56" viewBox="0 0 220 56" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="phoenixBorder" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff5b1a"/>
      <stop offset="50%" stop-color="#ffb020"/>
      <stop offset="100%" stop-color="#ff5b1a"/>
    </linearGradient>
    <linearGradient id="phoenixIcon" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#ff5b1a"/>
      <stop offset="60%" stop-color="#ffb020"/>
      <stop offset="100%" stop-color="#ffdf6b"/>
    </linearGradient>
    <filter id="phoenixGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#ff8a1a" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect x="3" y="3" width="214" height="50" rx="25" fill="#1f0f08" stroke="url(#phoenixBorder)" stroke-width="2.4" filter="url(#phoenixGlow)"/>

  <!-- wing-like flame icon -->
  <g transform="translate(30,28)">
    <path d="M0 -14 C -8 -10 -14 -2 -12 8 C -6 4 -2 6 0 12 C 2 6 6 4 12 8 C 14 -2 8 -10 0 -14 Z" fill="url(#phoenixIcon)"/>
  </g>

  <text x="50" y="37" font-family="Arial, sans-serif" font-size="25" font-weight="800" fill="#ffb020">PlayerName</text>
</svg>`,
      description: 'A glowing phoenix flair reborn from the ashes.',
      is_active: true
    };

    // Check if it already exists to avoid duplicates
    const { data: existing } = await supabase.from('shop_items').select('id').eq('name', item.name).single();
    if (existing) {
      return NextResponse.json({ success: true, message: "Flair Phoenix already exists in the shop!" });
    }

    const { error } = await supabase.from('shop_items').insert([item]);
    
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Flair Phoenix added successfully to the shop for 1800 balance!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
