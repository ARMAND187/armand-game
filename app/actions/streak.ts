"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function claimDailyStreak() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get the user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_streak, last_streak_claim, rp")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    const now = new Date();
    let currentStreak = profile.current_streak || 0;
    
    // Check if already claimed today
    if (profile.last_streak_claim) {
      const lastClaim = new Date(profile.last_streak_claim);
      if (
        lastClaim.getUTCFullYear() === now.getUTCFullYear() &&
        lastClaim.getUTCMonth() === now.getUTCMonth() &&
        lastClaim.getUTCDate() === now.getUTCDate()
      ) {
        return { success: false, error: "Already claimed today" };
      }
      
      // Check if streak is broken (more than 48 hours since last claim at midnight)
      // For simplicity, if yesterday was not the last claim day, reset to 0.
      const yesterday = new Date(now);
      yesterday.setUTCDate(now.getUTCDate() - 1);
      
      if (
        lastClaim.getUTCFullYear() !== yesterday.getUTCFullYear() ||
        lastClaim.getUTCMonth() !== yesterday.getUTCMonth() ||
        lastClaim.getUTCDate() !== yesterday.getUTCDate()
      ) {
        // Streak broken
        currentStreak = 0;
      }
    }

    // Cap streak at 7
    if (currentStreak >= 7) {
      currentStreak = 0; // Reset after 7 days
    }
    
    const newStreak = currentStreak + 1;

    // 2. Determine reward based on newStreak
    // We will fetch from streak_items based on some logic, but the user specifically mentioned:
    // Day 1: Navigator Title
    // Day 2: 50 Balance
    let rewardName = "";
    let rewardBalance = 0;
    
    if (newStreak === 1) {
      rewardName = "Navigator";
    } else if (newStreak === 2) {
      rewardBalance = 50;
    }

    // 3. Grant the reward
    if (rewardName) {
      // Find the item in streak_items using either title or name
      const { data: streakItems } = await supabase
        .from("streak_items")
        .select("id")
        .or(`title.ilike.%${rewardName}%,name.ilike.%${rewardName}%`)
        .limit(1);
        
      if (streakItems && streakItems.length > 0) {
        const itemId = streakItems[0].id;
        
        // Ensure user doesn't already have it
        const { data: inv } = await supabaseAdmin
          .from("user_inventory")
          .select("id")
          .eq("user_id", user.id)
          .eq("streak_item_id", itemId);

        if (!inv || inv.length === 0) {
          const { error: insertErr } = await supabaseAdmin.from("user_inventory").insert([{
            user_id: user.id,
            streak_item_id: itemId
          }]);
          if (insertErr) console.error("Error granting streak item:", insertErr);
        }
      }
    }
    
    if (rewardBalance > 0) {
      const { error: rpErr } = await supabaseAdmin.from("profiles").update({
        rp: (profile.rp || 0) + rewardBalance
      }).eq("id", user.id);
      if (rpErr) console.error("Error updating RP:", rpErr);
    }

    // 4. Update the profile with new streak
    const { error: streakErr } = await supabaseAdmin.from("profiles").update({
      current_streak: newStreak,
      last_streak_claim: now.toISOString()
    }).eq("id", user.id);
    if (streakErr) console.error("Error updating streak:", streakErr);

    return { 
      success: true, 
      new_streak: newStreak,
      reward: rewardName ? rewardName : rewardBalance.toString()
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
