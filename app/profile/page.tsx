"use client";

import { useWalletStore } from "@/store/useWalletStore";
import { useEffect, useState } from "react";
import {
  Settings, Bell, Gift, ChevronRight,
  Shield, Edit3,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const menuItems = [
  { icon: Gift,    label: "Redeem Code",    sub: "Enter a gift code",      href: "/redeem" },
  { icon: Shield,  label: "Privacy & Security", sub: "Manage your account", href: "/settings" },
  { icon: Settings, label: "Settings",     sub: "App preferences",         href: "/settings" },
];

export default function ProfilePage() {
  const armandBalance = useWalletStore((s) => s.armandBalance);
  const [username, setUsername] = useState("Loading...");
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.user_metadata?.username) {
          setUsername(user.user_metadata.username);
          setEditUsername(user.user_metadata.username);
        } else {
          setUsername("Anonymous");
          setEditUsername("Anonymous");
        }
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
          
        if (profile?.is_admin) {
          setIsAdmin(true);
        }
      }
    };
    fetchUser();
  }, [supabase.auth, supabase]);



  const handleSave = async () => {
    const newUsername = editUsername.trim().toLowerCase();
    if (!newUsername) return;
    if (newUsername === username) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      // Check if username is taken in profiles table
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", newUsername)
        .maybeSingle();
        
      if (existingUser) {
        setErrorMsg("Username is already taken.");
        setIsSaving(false);
        return;
      }

      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: newUsername }
      });
      if (authError) throw authError;

      // 2. Update Profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username: newUsername })
          .eq("id", user.id);
        if (profileError) throw profileError;
      }

      setUsername(newUsername);
      setIsEditing(false);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell">
      {/* ── Profile card ── */}
      <div className="profile-card">
        <div className="profile-avatar-ring">{username !== "Loading..." && username !== "Anonymous" ? username.charAt(0).toUpperCase() : "AG"}</div>
        <div className="profile-username" style={{ textTransform: "none" }}>@{username}</div>

        {errorMsg && (
          <div style={{ color: "#f87171", fontSize: 12, marginTop: 8, textAlign: "center" }}>
            {errorMsg}
          </div>
        )}

        <div className="profile-fields" style={{ marginTop: 16 }}>
          <div className="profile-field" style={{ borderBottom: "none" }}>
            <span className="profile-field-label">Username</span>
            {isEditing ? (
              <input 
                className="search-input"
                style={{ flex: 1, marginLeft: 16, padding: "8px 12px", background: "var(--bg-base)" }}
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                disabled={isSaving}
                autoFocus
              />
            ) : (
              <span className="profile-field-value">{username}</span>
            )}
            
            {isEditing ? (
              <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                <button 
                  onClick={() => { setIsEditing(false); setErrorMsg(""); setEditUsername(username); }} 
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="btn-lobby-play"
                  style={{ padding: "6px 12px", fontSize: 13 }}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <Edit3 size={15} color="var(--neon)" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Balance tile ── */}
      <div className="profile-balance-tile">
        <div>
          <div className="profile-balance-label">Armand Balance</div>
          <div className="profile-balance-value">{armandBalance.toLocaleString()}</div>
        </div>
        <Link href="/redeem" className="btn-redeem-small" id="profile-redeem-btn">
          <Gift size={14} />
          Redeem
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="stat-row" style={{ marginBottom: 20 }}>
        <div className="stat-chip">
          <span className="stat-chip-label">Rank</span>
          <span className="stat-chip-value" style={{ fontSize: 18 }}>—</span>
        </div>
      </div>

      {/* ── Menu ── */}
      <div className="settings-card">
        {isAdmin && (
          <Link
            href="/admin"
            className="settings-menu-item"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="settings-menu-left">
              <div className="profile-menu-icon" style={{ background: "rgba(167, 139, 250, 0.2)" }}>
                <Shield size={17} color="var(--neon)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--neon)" }}>Admin Dashboard</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Manage users and send broadcasts</div>
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </Link>
        )}
        
        {menuItems.map(({ icon: Icon, label, sub, href }, i) => (
          <Link
            key={label}
            href={href}
            className="settings-menu-item"
            style={{ borderBottom: i < menuItems.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div className="settings-menu-left">
              <div className="profile-menu-icon">
                <Icon size={17} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </Link>
        ))}
      </div>
    </div>
  );
}
