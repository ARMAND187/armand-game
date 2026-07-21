require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data } = await supabaseAdmin.from("profiles").select("username, equipped_avatar_frame, equipped_flair").eq("username", "armand").single();
  console.log("Avatar Frame:\n", data.equipped_avatar_frame);
  console.log("Name Flair:\n", data.equipped_flair);
}
check();
