import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trophy, Users } from "lucide-react";
import { getRankFromRP } from "@/utils/RankSystem";
import PlayerNameFlair from "@/components/PlayerNameFlair";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).toLowerCase();

  const supabase = await createClient();

  // Fetch the public profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, wins, rp, avatar_url, equipped_flair")
    .eq("username", decodedUsername)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  return (
    <div className="page-shell">
      <Link href="/friends" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "24px", fontSize: "14px" }}>
        <ChevronLeft size={16} />
        Back to Friends
      </Link>

      <div className="profile-card" style={{ marginBottom: "24px" }}>
        <div className="profile-avatar-ring" style={{ border: "none", background: "none", overflow: "visible" }}>
          <img 
            src={profile.avatar_url || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${profile.username}`} 
            alt="Avatar" 
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", background: "var(--bg-elevated)", border: "2px solid var(--neon)" }} 
          />
        </div>
        <div className="profile-username" style={{ textTransform: "none", display: "flex", justifyContent: "center" }}>
          <PlayerNameFlair username={profile.username} flair={profile.equipped_flair} />
        </div>
        
        <div className="profile-fields" style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
          
          <div className="profile-field" style={{ justifyContent: "center", borderBottom: "none" }}>
            <span style={{ fontSize: 24, marginRight: 8 }}>{getRankFromRP(profile.rp || 0).icon}</span>
            <span style={{ color: getRankFromRP(profile.rp || 0).color, fontWeight: 700, fontSize: 18, textTransform: "uppercase", letterSpacing: "0.05em" }}>{getRankFromRP(profile.rp || 0).tier}</span>
            <span className="text-zinc-500" style={{ margin: "0 12px" }}>•</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{(profile.rp || 0).toLocaleString()} RP</span>
          </div>

        </div>
      </div>
    </div>
  );
}
