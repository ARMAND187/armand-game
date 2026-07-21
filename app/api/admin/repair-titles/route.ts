import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    // SECURITY CHECK: Verify the user is an admin before allowing execution
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - You must be logged in" }, { status: 401 });
    }
    
    const { data: profile } = await serverClient.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - You must be an admin" }, { status: 403 });
    }

    // Initialize Admin client to bypass RLS for the repair
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: streakItems, error: streakErr } = await supabaseAdmin.from("streak_items").select("*");
    if (streakErr) throw streakErr;

    // Find names of items that are NOT titles
    const nonTitleItems = streakItems.filter(item => {
      const t = (item.title || "").toLowerCase();
      return t.includes("pin") || t.includes("flair") || t.includes("banner") || t.includes("frame") || t.includes("avatar") || t.includes("reward") || t.includes("balance");
    });

    const nonTitleNames = nonTitleItems.map(i => i.name);
    
    if (nonTitleNames.length === 0) {
      return NextResponse.json({ message: "No non-title items found to clean." });
    }

    const { data: profiles, error: profErr } = await supabaseAdmin.from("profiles").select("id, equipped_title");
    if (profErr) throw profErr;

    let fixCount = 0;

    for (const p of profiles) {
      if (p.equipped_title && nonTitleNames.includes(p.equipped_title)) {
        const { error: updateErr } = await supabaseAdmin
          .from("profiles")
          .update({ equipped_title: null })
          .eq("id", p.id);
        
        if (!updateErr) fixCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully removed ${fixCount} corrupted frames/pins from players' Title slots! They can now equip them normally without bugs.`,
      corruptedNamesChecked: nonTitleNames
    });

  } catch (error: any) {
    console.error("Repair error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
