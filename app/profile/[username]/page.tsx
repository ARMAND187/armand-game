import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trophy, Users } from "lucide-react";
import { getRankFromRP } from "@/utils/RankSystem";
import PlayerNameFlair from "@/components/PlayerNameFlair";
import ProfileStatus from "@/components/ProfileStatus";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).toLowerCase();

  const supabase = await createClient();

  // Fetch the public profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, wins, rp, avatar_url, equipped_flair, equipped_title, equipped_banner, equipped_avatar_frame, last_seen")
    .eq("username", decodedUsername)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const rankInfo = getRankFromRP(profile.rp || 0);

  return (
    <div className="page-shell">
      <Link href="/friends" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "24px", fontSize: "14px" }}>
        <ChevronLeft size={16} />
        Back to Friends
      </Link>

      {/* ── Banner ── */}
      <div 
        style={{ 
          height: 120, 
          width: "100%", 
          background: profile.equipped_banner 
            ? (profile.equipped_banner.trim().startsWith("<svg") 
                ? `url("data:image/svg+xml;utf8,${encodeURIComponent(profile.equipped_banner)}") center/cover no-repeat` 
                : `url(${profile.equipped_banner}) center/cover no-repeat`)
            : "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
          borderBottom: `1px solid rgba(255,255,255,0.1)`,
          marginBottom: -60,
          maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)"
        }} 
      />

      <div className="profile-card" style={{ position: "relative", zIndex: 10, marginBottom: "24px" }}>
        <div className="profile-avatar-ring" style={{ border: "none", background: "none", overflow: "visible", position: "relative" }}>
          <img 
            src={profile.avatar_url || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${profile.username}`} 
            alt="Avatar" 
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", background: "var(--bg-elevated)", border: `3px solid ${rankInfo.color}`, zIndex: 1, position: "relative" }} 
          />
          {profile.equipped_avatar_frame && (
            profile.equipped_avatar_frame.trim().startsWith("<svg") ? (
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(profile.equipped_avatar_frame)}`}
                alt="Avatar Frame"
                style={{
                  position: "absolute", top: -8, left: -8,
                  width: 106, height: 106, maxWidth: "none", zIndex: 2, pointerEvents: "none"
                }}
              />
            ) : (
              <img 
                src={profile.equipped_avatar_frame} 
                alt="Frame"
                style={{
                  position: "absolute", top: -8, left: -8,
                  width: 106, height: 106, maxWidth: "none", zIndex: 2, pointerEvents: "none"
                }}
              />
            )
          )}
        </div>
        <div className="profile-username" style={{ textTransform: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <PlayerNameFlair username={profile.username} flair={profile.equipped_flair} />
          {profile.equipped_title && (
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--neon)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
              {profile.equipped_title}
            </div>
          )}
          <div style={{ marginTop: 8, display: "flex", alignItems: "center" }}>
            <span style={{ 
              fontSize: 12, 
              fontWeight: 800, 
              color: rankInfo.color, 
              background: rankInfo.glow, 
              padding: "4px 10px", 
              borderRadius: 8 
            }}>
              {rankInfo.icon} {rankInfo.tier}
            </span>
          </div>
          
          <ProfileStatus userId={profile.id} lastSeen={profile.last_seen} />
        </div>
        
        <div className="profile-fields" style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
          
          <div className="profile-field" style={{ justifyContent: "center", borderBottom: "none" }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{(profile.rp || 0).toLocaleString()} RP</span>
          </div>

        </div>
      </div>
    </div>
  );
}
