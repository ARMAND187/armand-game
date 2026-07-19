"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, Users, Send, Loader2, ArrowLeft, Trash2, Edit2, ListOrdered } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getRankFromRP } from "@/utils/RankSystem";

const AdminDashboardStats = dynamic(() => import("@/components/AdminDashboardStats"), {
  ssr: false,
  loading: () => <div style={{ height: 110, width: "100%", background: "var(--bg-card)", borderRadius: 16, marginBottom: 24, display: "flex", justifyContent: "center", alignItems: "center" }}><Loader2 className="mly-spinner" color="var(--neon)" /></div>
});

interface Profile {
  id: string;
  username: string;
  wins: number;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
  rp: number;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userLimit, setUserLimit] = useState<number | "All">("All");

  // Notification states
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifStatus, setNotifStatus] = useState("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      router.replace("/profile");
      return;
    }

    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("rp", { ascending: false });
    
    if (data) {
      setProfiles(data as Profile[]);
      setTotalUsers(data.length);
    }
    setLoading(false);
  };

  const handleSendGlobalNotif = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setSendingNotif(true);
    setNotifStatus("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Send to all users
    const inserts = profiles.map(p => ({
      receiver_id: p.id,
      sender_id: user.id,
      type: "system",
      title: notifTitle,
      body: notifBody,
    }));

    const { error } = await supabase.from("notifications").insert(inserts);

    if (error) {
      setNotifStatus("Failed to send notification.");
    } else {
      setNotifStatus(`Successfully sent to ${inserts.length} users!`);
      setNotifTitle("");
      setNotifBody("");
    }
    setSendingNotif(false);
    
    setTimeout(() => setNotifStatus(""), 3000);
  };

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    await supabase.from("profiles").update({ is_admin: !currentStatus }).eq("id", id);
    fetchData();
  };

  if (isAdmin === null || loading) {
    return (
      <div className="page-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Loader2 className="mly-spinner" size={48} color="var(--neon)" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div style={{ marginBottom: 16 }}>
        <Link href="/profile" className="back-link">
          <ArrowLeft size={16} />
          Profile
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "rgba(167, 139, 250, 0.2)", padding: 12, borderRadius: 12 }}>
          <Shield size={32} color="var(--neon)" />
        </div>
        <div>
          <h1 className="page-header" style={{ margin: 0 }}>Admin Dashboard</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Manage users and send broadcasts</p>
        </div>
      </div>

      <AdminDashboardStats totalRegistered={totalUsers} />

      {/* Global Notifications */}
      <div className="settings-card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Send size={18} color="var(--neon)" /> Global Broadcast
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input 
            className="search-input" 
            placeholder="Notification Title" 
            value={notifTitle}
            onChange={e => setNotifTitle(e.target.value)}
            style={{ background: "var(--bg-base)" }}
          />
          <textarea 
            className="search-input" 
            placeholder="Notification Body..." 
            value={notifBody}
            onChange={e => setNotifBody(e.target.value)}
            style={{ background: "var(--bg-base)", minHeight: 80, resize: "vertical" }}
          />
          <button 
            className="btn-lobby-play" 
            onClick={handleSendGlobalNotif}
            disabled={sendingNotif}
            style={{ justifyContent: "center" }}
          >
            {sendingNotif ? <Loader2 className="mly-spinner" size={18} /> : "Broadcast to Everyone"}
          </button>
          {notifStatus && <div style={{ fontSize: 12, color: notifStatus.includes("Failed") ? "#ef4444" : "#4ade80", textAlign: "center" }}>{notifStatus}</div>}
        </div>
      </div>

      {/* User List */}
      <div className="settings-card" style={{ padding: 20, overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>Registered Users</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "var(--bg-base)", padding: 4, borderRadius: 8, gap: 4 }}>
              {(["Top 10", "Top 20", "All"] as const).map(opt => {
                const limitVal = opt === "All" ? "All" : parseInt(opt.replace("Top ", ""));
                return (
                  <button
                    key={opt}
                    onClick={() => setUserLimit(limitVal)}
                    style={{
                      background: userLimit === limitVal ? "rgba(167, 139, 250, 0.2)" : "transparent",
                      color: userLimit === limitVal ? "var(--neon)" : "var(--text-muted)",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            <input
              className="search-input"
              placeholder="Search username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "var(--bg-base)", width: "100%", maxWidth: 200, margin: 0 }}
            />
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", textAlign: "left" }}>
              <th style={{ paddingBottom: 12 }}>Username</th>
              <th style={{ paddingBottom: 12 }}>Rank / RP</th>
              <th style={{ paddingBottom: 12 }}>Status</th>
              <th style={{ paddingBottom: 12 }}>Role</th>
              <th style={{ paddingBottom: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {profiles
              .filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, userLimit === "All" ? undefined : userLimit)
              .map(p => {
                const rankInfo = getRankFromRP(p.rp);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 0", color: "white", fontWeight: 600 }}>@{p.username}</td>
                    <td style={{ padding: "12px 0" }}>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 800, 
                        color: rankInfo.color, 
                        background: rankInfo.glow, 
                        padding: "4px 8px", 
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        {rankInfo.icon} {p.rp.toLocaleString()} RP
                      </span>
                    </td>
                <td style={{ padding: "12px 0" }}>
                  <span style={{ 
                    background: p.is_verified ? "rgba(74, 222, 128, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: p.is_verified ? "#4ade80" : "var(--text-muted)",
                    padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4
                  }}>
                    {p.is_verified && <Shield size={12} />}
                    {p.is_verified ? "Verified" : "Unverified"}
                  </span>
                </td>
                <td style={{ padding: "12px 0" }}>
                  <span style={{ 
                    background: p.is_admin ? "rgba(167, 139, 250, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    color: p.is_admin ? "var(--neon)" : "var(--text-muted)",
                    padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700
                  }}>
                    {p.is_admin ? "ADMIN" : "USER"}
                  </span>
                </td>
                <td style={{ padding: "12px 0" }}>
                  <button 
                    onClick={() => toggleAdmin(p.id, p.is_admin)}
                    style={{ background: "none", border: "none", color: p.is_admin ? "#ef4444" : "var(--neon)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                  >
                    {p.is_admin ? "Revoke Admin" : "Make Admin"}
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

    </div>
  );
}
