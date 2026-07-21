require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTitles() {
  console.log("Fetching all streak items...");
  const { data: streakItems, error: streakErr } = await supabaseAdmin.from("streak_items").select("*");
  if (streakErr) return console.error("Error fetching streak items:", streakErr);

  // Find names of items that are NOT titles
  const nonTitleItems = streakItems.filter(item => {
    const t = (item.title || "").toLowerCase();
    return t.includes("pin") || t.includes("flair") || t.includes("banner") || t.includes("frame") || t.includes("avatar") || t.includes("reward") || t.includes("balance");
  });

  const nonTitleNames = nonTitleItems.map(i => i.name);
  console.log("Non-title items to clean from equipped_title:", nonTitleNames);

  if (nonTitleNames.length === 0) {
    return console.log("No non-title items found to clean.");
  }

  // Fetch all profiles
  console.log("Fetching profiles...");
  const { data: profiles, error: profErr } = await supabaseAdmin.from("profiles").select("id, equipped_title");
  if (profErr) return console.error("Error fetching profiles:", profErr);

  let fixCount = 0;

  for (const profile of profiles) {
    if (profile.equipped_title && nonTitleNames.includes(profile.equipped_title)) {
      console.log(`Fixing profile ${profile.id} (had title ${profile.equipped_title})`);
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ equipped_title: null })
        .eq("id", profile.id);
      
      if (updateErr) {
        console.error(`Failed to fix profile ${profile.id}:`, updateErr);
      } else {
        fixCount++;
      }
    }
  }

  console.log(`Successfully fixed ${fixCount} corrupted titles across all players!`);
}

fixTitles();
