require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: users, error: fetchErr } = await supabaseAdmin
    .from("profiles")
    .select("id, balance, current_streak")
    .gte("current_streak", 2);

  if (fetchErr) throw fetchErr;

  console.log(`Found ${users.length} users who have reached Day 2+`);

  let updatedCount = 0;
  for (const user of users) {
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ balance: (user.balance || 0) + 50 })
      .eq("id", user.id);
      
    if (!updateErr) updatedCount++;
  }
  
  console.log(`Retroactively added 50 balance to ${updatedCount} players who claimed Day 2+`);
}

run();
