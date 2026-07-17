"use client";

import { useWalletStore } from "@/store/useWalletStore";
import { useEffect, useState } from "react";
import {
  Settings, Bell, Gift, ChevronRight,
  Shield, Edit3, MapPin, Trophy,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const menuItems = [
  { icon: Bell,    label: "Notifications",  sub: "Manage alerts",          href: "/notifications" },
  { icon: Gift,    label: "Redeem Code",    sub: "Enter a gift code",      href: "/redeem" },
  { icon: Trophy,  label: "Leaderboard",    sub: "See your rank",          href: "/leaderboard" },
  { icon: Shield,  label: "Privacy & Security", sub: "Manage your account", href: "/settings" },
  { icon: Settings, label: "Settings",     sub: "App preferences",         href: "/settings" },
];

export default function ProfilePage() {
  const armandBalance = useWalletStore((s) => s.armandBalance);
  const [username, setUsername] = useState("Loading...");

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.username) {
        setUsername(user.user_metadata.username);
      } else {
        setUsername("Anonymous");
      }
    };
    fetchUser();
  }, []);

  const displayName = username !== "Loading..." && username !== "Anonymous" 
    ? username.charAt(0).toUpperCase() + username.slice(1) 
    : username;

  return (
    <div className="page-shell">
      {/* ── Profile card ── */}
      <div className="profile-card">
        <div className="profile-avatar-ring">{username !== "Loading..." && username !== "Anonymous" ? username.charAt(0).toUpperCase() : "AG"}</div>
        <div className="profile-username">{displayName}</div>
        <div className="profile-handle">@{username}</div>

        {/* Editable fields (static display for now) */}
        <div className="profile-fields">
          <div className="profile-field">
            <span className="profile-field-label">Username</span>
            <span className="profile-field-value">{username}</span>
            <Edit3 size={13} color="var(--neon)" />
          </div>
          <div className="profile-field" style={{ borderBottom: "none" }}>
            <span className="profile-field-label">Display Name</span>
            <span className="profile-field-value">{displayName}</span>
            <Edit3 size={13} color="var(--neon)" />
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
          <span className="stat-chip-label">Rounds</span>
          <span className="stat-chip-value" style={{ fontSize: 18 }}>0</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Rank</span>
          <span className="stat-chip-value" style={{ fontSize: 18 }}>—</span>
        </div>
      </div>

      {/* ── Menu ── */}
      <div className="settings-card">
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
