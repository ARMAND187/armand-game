"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, Users, Send, Loader2, ArrowLeft, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const AdminDashboardStats = dynamic(() => import("@/components/AdminDashboardStats"), {
  ssr: false,
  loading: () => <div style={{ height: 110, width: "100%", background: "var(--bg-card)", borderRadius: 16, marginBottom: 24, display: "flex", justifyContent: "center", alignItems: "center" }}><Loader2 className="mly-spinner" color="var(--neon)" /></div>
});

interface Profile {
  id: string;
  username: string;
  wins: number;
  is_admin: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

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
      .order("created_at", { ascending: false });
    
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
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 16 }}>Registered Users</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", textAlign: "left" }}>
              <th style={{ paddingBottom: 12 }}>Username</th>
              <th style={{ paddingBottom: 12 }}>Wins</th>
              <th style={{ paddingBottom: 12 }}>Role</th>
              <th style={{ paddingBottom: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 0", color: "white", fontWeight: 600 }}>@{p.username}</td>
                <td style={{ padding: "12px 0", color: "var(--text-muted)" }}>{p.wins}</td>
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
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
