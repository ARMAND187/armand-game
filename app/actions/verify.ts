"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function verifyCustomOTP(userId: string, otp: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase admin credentials");
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify OTP in the database
    const { data, error } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", otp.trim())
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { success: false, error: "Invalid or expired code. Please check your email and try again." };
    }

    // Update profiles table
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ is_verified: true })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile status:", updateError);
      throw new Error("Failed to update profile verification status");
    }

    // Force server revalidation
    revalidatePath("/profile", "page");

    return { success: true };
  } catch (error: any) {
    console.error("Verification error:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
