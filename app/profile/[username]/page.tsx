import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trophy, Users } from "lucide-react";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).toLowerCase();

  const supabase = await createClient();

  // Fetch the public profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, wins")
    .eq("username", decodedUsername)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const displayName = profile.username.charAt(0).toUpperCase() + profile.username.slice(1);

  return (
    <div className="page-shell">
      <Link href="/friends" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "24px", fontSize: "14px" }}>
        <ChevronLeft size={16} />
        Back to Friends
      </Link>

      <div className="profile-card" style={{ marginBottom: "24px" }}>
        <div className="profile-avatar-ring">{profile.username.charAt(0).toUpperCase()}</div>
        <div className="profile-username">{displayName}</div>
        <div className="profile-handle">@{profile.username}</div>
        
        <div className="profile-fields" style={{ marginTop: 24 }}>
          <div className="profile-field" style={{ borderBottom: "none", justifyContent: "center" }}>
            <Trophy size={16} color="var(--neon)" style={{ marginRight: 8 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{profile.wins.toLocaleString()}</span>
            <span style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: 6 }}>Total Wins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
