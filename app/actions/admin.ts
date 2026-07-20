"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function adminToggleStatus(targetUserId: string, field: "is_admin" | "is_verified", newValue: boolean) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify the caller is an admin
  const { data: callerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !callerProfile?.is_admin) {
    return { success: false, error: "Forbidden: Not an admin" };
  }

  // Update target user using service role key
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ [field]: newValue })
    .eq("id", targetUserId);

  if (updateError) {
    console.error("Admin update error:", updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
