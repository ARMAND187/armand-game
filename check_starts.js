require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data } = await supabaseAdmin.from("profiles").select("username, equipped_avatar_frame, equipped_flair").eq("username", "armand").single();
  
  const frame = data.equipped_avatar_frame;
  const flair = data.equipped_flair;

  console.log("Frame string starts with <svg:", frame ? frame.trim().startsWith("<svg") : false);
  console.log("Flair string starts with <svg:", flair ? flair.trim().startsWith("<svg") : false);
}
check();
