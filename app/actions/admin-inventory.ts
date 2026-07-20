"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Helper to get Admin Client
const getAdminClient = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Verify user is an admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return null;

  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function searchPlayers(query: string) {
  if (!query || query.length < 2) return { success: true, data: [] };
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Unauthorized" };

  const { data, error } = await admin
    .from("profiles")
    .select("id, username, avatar_url, rp")
    .ilike("username", `%${query}%`)
    .limit(10);

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getPlayerInventory(userId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Unauthorized" };

  const { data, error } = await admin
    .from("user_inventory")
    .select(`
      id,
      shop_item_id,
      challenge_item_id,
      streak_item_id,
      acquired_at,
      shop_items ( id, name, type, rarity, rarity_color, icon_name, image_url ),
      challenge_items ( id, name, title, rarity, rarity_color, icon_name, image_url ),
      streak_items ( id, name, title, rarity, rarity_color, icon_name, image_url )
    `)
    .eq("user_id", userId)
    .order("acquired_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function removeInventoryItem(inventoryId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Unauthorized" };

  const { error } = await admin
    .from("user_inventory")
    .delete()
    .eq("id", inventoryId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addInventoryItem(userId: string, itemId: string, type: 'shop' | 'challenge' | 'streak') {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Unauthorized" };

  const payload: any = { user_id: userId };
  if (type === 'shop') payload.shop_item_id = itemId;
  if (type === 'challenge') payload.challenge_item_id = itemId;
  if (type === 'streak') payload.streak_item_id = itemId;

  // Check if they already own it
  const { data: existing } = await admin.from("user_inventory")
    .select("id")
    .eq("user_id", userId)
    .eq(type === 'shop' ? 'shop_item_id' : (type === 'challenge' ? 'challenge_item_id' : 'streak_item_id'), itemId);
    
  if (existing && existing.length > 0) {
    return { success: false, error: "Player already owns this item!" };
  }

  const { error } = await admin.from("user_inventory").insert([payload]);
  
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getAllItems() {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Unauthorized" };

  const { data: shopItems } = await admin.from("shop_items").select("id, name, type").order("type", { ascending: true });
  const { data: challengeItems } = await admin.from("challenge_items").select("id, name, title");
  const { data: streakItems } = await admin.from("streak_items").select("id, name, title");

  return {
    success: true,
    data: {
      shop: shopItems || [],
      challenge: challengeItems || [],
      streak: streakItems || []
    }
  };
}
