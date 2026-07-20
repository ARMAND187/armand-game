const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cItems } = await supabase.from('challenge_items').select('*');
  const { data: sItems } = await supabase.from('streak_items').select('*');
  console.log("Challenge Items:", cItems?.length || 0);
  console.log("Streak Items:", sItems?.length || 0);
  
  if (cItems?.length > 0) console.log("C:", cItems.map(c => c.name).join(', '));
  if (sItems?.length > 0) console.log("S:", sItems.map(s => s.name).join(', '));
}

check();
