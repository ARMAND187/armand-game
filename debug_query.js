require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data } = await supabaseAdmin.from("profiles").select("rp, wins, avatar_url, username, equipped_flair, equipped_title, equipped_banner, equipped_avatar_frame, current_streak, last_streak_claim").eq("username", "armand").single();
  console.log("Avatar Frame:", data.equipped_avatar_frame);
}
check();
