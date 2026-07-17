"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell, Trophy, UserPlus, Gamepad2, Gift, Clock, CheckCheck, Play } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  metadata?: any;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  match:       <Gamepad2  size={18} color="#a78bfa" />,
  friend:      <UserPlus  size={18} color="#60a5fa" />,
  achievement: <Trophy    size={18} color="#fbbf24" />,
  reward:      <Gift      size={18} color="#4ade80" />,
  system:      <Bell      size={18} color="#94a3b8" />,
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });
    
    if (data) setNotifs(data as Notification[]);
  };

  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("receiver_id", user.id);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleAction = async (n: Notification) => {
    await markRead(n.id);
    if (n.type === "match" && n.metadata?.roomId) {
      router.push(`/lobby/${n.metadata.gameId || 'geokurdistan'}?join=${n.metadata.roomId}`);
    }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="page-shell">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 className="page-header" style={{ margin: 0 }}>Notifications</h1>
        {unread > 0 && (
          <button className="mark-read-btn" onClick={markAllRead} id="mark-all-read">
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>
      <p className="page-subtitle">
        {unread > 0 ? `${unread} unread` : "All caught up!"}
      </p>

      {notifs.length === 0 ? (
        <div className="empty-state">
          <Bell size={28} color="var(--text-muted)" />
          <span>No notifications yet</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifs.map((n) => (
            <div
              key={n.id}
              className={`notif-item${!n.read ? " notif-item--unread" : ""}`}
              id={`notif-${n.id}`}
              style={{ display: "block" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }} onClick={() => markRead(n.id)}>
                <div className="notif-icon">{ICON_MAP[n.type] || ICON_MAP.system}</div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-body">{n.body}</div>
                  <div className="notif-time">
                    <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.read && <div className="notif-unread-dot" />}
              </div>
              
              {n.type === "match" && (
                <div style={{ marginTop: 12, display: "flex", gap: 8, paddingLeft: 44 }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                    style={{ background: "var(--neon)", color: "#000", border: "none", padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                  >
                    <Play size={14} /> Accept Invite
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
