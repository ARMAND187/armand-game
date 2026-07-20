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

async function resetStreaks() {
  console.log("Resetting all streaks to 0...");
  const { error } = await supabase
    .from('profiles')
    .update({ current_streak: 0, last_streak_claim: null })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // match all
    
  if (error) {
    console.error("Error resetting streaks:", error);
  } else {
    console.log("Streaks reset successfully!");
  }
}

resetStreaks();
