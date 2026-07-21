require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: streaks } = await supabaseAdmin.from("streak_items").select("*");
  const { data: challenges } = await supabaseAdmin.from("challenge_items").select("*");
  console.log("Streaks:", streaks);
  console.log("Challenges:", challenges);
}
check();
