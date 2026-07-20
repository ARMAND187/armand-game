"use client";

import { useEffect, useState } from "react";
import { FullScreenOverlay } from "@/components/FullScreenOverlay";
import { usePresenceStore } from "@/store/usePresenceStore";
import { createClient } from "@/utils/supabase/client";

interface OnlineProfile {
  id: string;
  username: string;
  avatar_url: string;
  rp: number;
  status: 'online' | 'in-game';
}

export function OnlinePlayersModal({ onClose }: { onClose: () => void }) {
  const activeUsers = usePresenceStore((state) => state.activeUsers);
  const [profiles, setProfiles] = useState<OnlineProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfiles() {
      if (!activeUsers || activeUsers.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const userIds = activeUsers.map(u => u.userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, rp")
        .in("id", userIds);

      if (!error && data) {
        // Merge status
        const merged = data.map(profile => {
          const activeUser = activeUsers.find(u => u.userId === profile.id);
          return {
            ...profile,
            status: activeUser?.status || 'online'
          };
        });
        setProfiles(merged as OnlineProfile[]);
      }
      setLoading(false);
    }

    fetchProfiles();
  }, [activeUsers, supabase]);

  return (
    <FullScreenOverlay title="🟢 Online Players" onClose={onClose}>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24, marginTop: 0 }}>
        Live view of all players currently connected.
      </p>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : profiles.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
          No players online.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {profiles.map(p => (
            <div 
              key={p.id}
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 20px",
                gap: 16
              }}
            >
              {/* Avatar */}
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{p.username.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  {p.username}
                  <span style={{ fontSize: 12, color: "var(--neon)", background: "rgba(167, 139, 250, 0.1)", padding: "2px 8px", borderRadius: 12 }}>
                    {p.rp} RP
                  </span>
                </h3>
              </div>

              {/* Status Badge */}
              <div style={{ flexShrink: 0 }}>
                {p.status === 'in-game' ? (
                  <div style={{ padding: "6px 12px", borderRadius: 12, background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                    In Game
                  </div>
                ) : (
                  <div style={{ padding: "6px 12px", borderRadius: 12, background: "rgba(74, 222, 128, 0.15)", border: "1px solid rgba(74, 222, 128, 0.3)", color: "#4ade80", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                    Online
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </FullScreenOverlay>
  );
}
