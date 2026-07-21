require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setFlair() {
  const svg = `<svg width="220" height="56" viewBox="0 0 220 56" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="214" height="50" rx="25" fill="#2a0f0a" stroke="#ff7a3d" stroke-width="2.2"/>
  <path d="M30 18c-5 5-8 9-8 14 0 5 3.5 9 8 9s8-4 8-9c0-3-1.5-5-2.5-6.5 0 2-1 3-2 3 .5-3.5-.5-6.5-3.5-10.5z" fill="#ff7a3d"/>
  <text x="50" y="34" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#ff7a3d">PlayerName</text>
</svg>`;

  await supabaseAdmin.from("profiles").update({ equipped_flair: svg }).eq("username", "armand");
  console.log("Updated to flame flair!");
}
setFlair();
