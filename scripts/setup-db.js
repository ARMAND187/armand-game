const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split(/\r?\n/).forEach(line => {
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
  }
  if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = line.substring(line.indexOf('=') + 1).trim().replace(/['"]/g, '');
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars", { supabaseUrl, hasKey: !!supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log("Setting up DB...");
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
      console.log("Inserted challenge item:", item.name);
    }
  }

  const streakTitles = [
    { name: 'Navigator', title: 'Streak Title', description: 'Day 1 Streak Reward', balance: 0, rarity: 'Epic', rarity_color: '#a78bfa' }
  ];

  for (const item of streakTitles) {
    const { data } = await supabase.from('streak_items').select('id').eq('name', item.name).limit(1);
    if (!data || data.length === 0) {
      await supabase.from('streak_items').insert([item]);
      console.log("Inserted streak item:", item.name);
    }
  }

  const { error } = await supabase.from('shop_items').delete().in('type', ['Challenge Title', 'Streak Title']);
  if (!error) console.log("Cleaned up old shop_items");
  else console.error("Error cleaning shop_items", error);

  console.log("Done!");
}

setup();
