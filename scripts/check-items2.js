const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
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

async function check() {
  const { data: cItems, error: e1 } = await supabase.from('challenge_items').select('*');
  const { data: sItems, error: e2 } = await supabase.from('streak_items').select('*');
  const { data: profiles, error: e3 } = await supabase.from('profiles').select('id, current_streak').limit(1);
  const { data: inv, error: e4 } = await supabase.from('user_inventory').select('*');
  
  if (e1) console.error("E1", e1);
  if (e2) console.error("E2", e2);
  
  console.log("Challenge Items:", cItems?.length);
  if (cItems) console.dir(cItems, {depth: null});
  
  console.log("Streak Items:", sItems?.length);
  if (sItems) console.dir(sItems, {depth: null});
  
  console.log("Inventory count:", inv?.length);
  if (inv && inv.length > 0) {
    console.log("Some inventory items:", inv.slice(0, 5));
  }
}

check();
