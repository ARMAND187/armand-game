const { createClient } = require('@supabase/supabase-js');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig('./');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: updateData, error: updateErr } = await supabase
    .from('streak_items')
    .update({ balance: 50 })
    .eq('required_streak', 2)
    .select();
    
  console.log("Updated streak items:", updateData, updateErr);
  
  const { data: users, error: userErr } = await supabase
    .from('profiles')
    .select('id, username, rp, current_streak')
    .eq('current_streak', 2);
    
  console.log("Users on Day 2:", users, userErr);
  
  if (users) {
    for (const u of users) {
      await supabase.from('profiles').update({ rp: (u.rp || 0) + 50 }).eq('id', u.id);
      console.log(`Gave 50 RP to ${u.username}`);
    }
  }
}

run();
