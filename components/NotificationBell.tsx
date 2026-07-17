"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell, Trophy, UserPlus, Gamepad2, Gift, Clock, Play, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  match:       <Gamepad2  size={16} color="#a78bfa" />,
  friend:      <UserPlus  size={16} color="#60a5fa" />,
  achievement: <Trophy    size={16} color="#fbbf24" />,
  reward:      <Gift      size={16} color="#4ade80" />,
  system:      <Bell      size={16} color="#94a3b8" />,
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const supabase = createClient();
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifs();
    
    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;

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
    setIsOpen(false);
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
    <div style={{ position: "relative" }} ref={popoverRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifs(); // Refresh on open
        }}
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "center", 
          width: "36px", height: "36px", borderRadius: "10px", 
          background: isOpen ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.05)", 
          border: "1px solid rgba(255,255,255,0.1)", color: isOpen ? "var(--neon)" : "white",
          cursor: "pointer", position: "relative"
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "#ef4444", color: "white",
            fontSize: "10px", fontWeight: "bold",
            padding: "2px 6px", borderRadius: "10px",
            border: "2px solid #09090b"
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="fixed top-20 left-[5%] w-[90%] z-50 sm:absolute sm:top-16 sm:right-0 sm:left-auto sm:w-80 sm:mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 z-10" style={{ background: "rgba(24,24,27,0.9)", backdropFilter: "blur(8px)" }}>
            <h3 className="m-0 text-base font-bold text-white">Notifications</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  style={{ background: "none", border: "none", color: "var(--neon)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                >
                  Mark all read
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {notifs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: "14px" }}>
                <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                No notifications yet
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{ 
                    padding: "12px", borderRadius: "12px",
                    background: n.read ? "transparent" : "rgba(167,139,250,0.05)",
                    border: "1px solid",
                    borderColor: n.read ? "transparent" : "rgba(167,139,250,0.2)",
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ 
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      {ICON_MAP[n.type] || ICON_MAP.system}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "2px" }}>{n.title}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.4 }}>{n.body}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={10} /> {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.read && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--neon)", flexShrink: 0, marginTop: "4px" }} />}
                  </div>
                  
                  {n.type === "match" && (
                    <div style={{ marginTop: "12px", paddingLeft: "44px" }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                        style={{ 
                          background: "var(--neon)", color: "#000", border: "none", 
                          padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, 
                          display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", width: "100%", justifyContent: "center"
                        }}
                      >
                        <Play size={12} fill="currentColor" /> Accept Invite
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
