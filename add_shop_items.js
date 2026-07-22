const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const frostbiteSVG = `<svg width="220" height="56" viewBox="0 0 220 56" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="frostBorder" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8fd3f4"/>
      <stop offset="50%" stop-color="#e0c3fc"/>
      <stop offset="100%" stop-color="#8fd3f4"/>
    </linearGradient>
    <linearGradient id="frostIcon" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#4facfe"/>
      <stop offset="100%" stop-color="#00f2fe"/>
    </linearGradient>
    <filter id="frostGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#8fd3f4" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect x="3" y="3" width="214" height="50" rx="25" fill="#0d1b2a" stroke="url(#frostBorder)" stroke-width="2.4" filter="url(#frostGlow)"/>

  <!-- Snowflake Icon -->
  <g transform="translate(30,28)">
    <g fill="url(#frostIcon)">
      <rect x="-1" y="-12" width="2" height="24" rx="1"/>
      <rect x="-12" y="-1" width="24" height="2" rx="1"/>
      <rect x="-8.5" y="-1.5" width="17" height="3" rx="1" transform="rotate(45)"/>
      <rect x="-8.5" y="-1.5" width="17" height="3" rx="1" transform="rotate(-45)"/>
      <circle cx="0" cy="0" r="2.5" fill="#e0f2fe"/>
      <circle cx="0" cy="-14" r="1.5"/>
      <circle cx="0" cy="14" r="1.5"/>
      <circle cx="-14" cy="0" r="1.5"/>
      <circle cx="14" cy="0" r="1.5"/>
      <circle cx="-10" cy="-10" r="1.5"/>
      <circle cx="10" cy="10" r="1.5"/>
      <circle cx="-10" cy="10" r="1.5"/>
      <circle cx="10" cy="-10" r="1.5"/>
    </g>
  </g>

  <text x="50" y="37" font-family="Arial, sans-serif" font-size="25" font-weight="800" fill="#e0f2fe">PlayerName</text>
</svg>`;

async function insertItems() {
  // Insert Flair
  const { data: flairData, error: flairError } = await supabase.from('shop_items').insert([{
    name: 'Frostbite',
    type: 'Name Flair',
    price: 750,
    rarity: 'Epic',
    rarity_color: '#a1c4fd',
    image_url: frostbiteSVG,
    description: 'Icy blue pill with a snowflake icon',
    is_active: true
  }]);
  
  if (flairError) console.error('Flair error:', flairError);
  else console.log('Flair added!');

  // Insert Banner
  const { data: bannerData, error: bannerError } = await supabase.from('shop_items').insert([{
    name: 'Aurora Peaks',
    type: 'Banner',
    price: 900,
    rarity: 'Legendary',
    rarity_color: '#00f2fe',
    image_url: '/banners/banner_aurora_peaks.svg',
    description: 'Deep night-blue sky with flowing teal/purple aurora waves, stars, and layered icy mountain silhouettes',
    is_active: true
  }]);

  if (bannerError) console.error('Banner error:', bannerError);
  else console.log('Banner added!');
}

insertItems();
