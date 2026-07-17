"use client";

import { useState } from "react";
import {
  Bell, Trophy, UserPlus, Gamepad2, Gift, Clock, CheckCheck,
} from "lucide-react";

type NotifType = "match" | "friend" | "achievement" | "reward" | "system";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const ICON_MAP: Record<NotifType, React.ReactNode> = {
  match:       <Gamepad2  size={18} color="#a78bfa" />,
  friend:      <UserPlus  size={18} color="#60a5fa" />,
  achievement: <Trophy    size={18} color="#fbbf24" />,
  reward:      <Gift      size={18} color="#4ade80" />,
  system:      <Bell      size={18} color="#94a3b8" />,
};

const MOCK_NOTIFS: Notification[] = [
  { id: "1", type: "achievement", title: "First Guess!", body: "You completed your first GeoKurdistan round.", time: "2m ago",  read: false },
  { id: "2", type: "friend",      title: "Friend Request", body: "Soran K. sent you a friend request.",            time: "1h ago",  read: false },
  { id: "3", type: "match",       title: "Challenge Invite", body: "Dilan H. challenged you to GeoKurdistan.",    time: "3h ago",  read: true  },
  { id: "4", type: "reward",      title: "Daily Bonus Ready", body: "Claim your daily Armand Balance bonus.",      time: "5h ago",  read: true  },
  { id: "5", type: "system",      title: "Update Available", body: "GeoKurdistan v1.1 with 10 new locations.",    time: "1d ago",  read: true  },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

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
            <button
              key={n.id}
              className={`notif-item${!n.read ? " notif-item--unread" : ""}`}
              onClick={() => markRead(n.id)}
              id={`notif-${n.id}`}
            >
              <div className="notif-icon">{ICON_MAP[n.type]}</div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-body">{n.body}</div>
                <div className="notif-time">
                  <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                  {n.time}
                </div>
              </div>
              {!n.read && <div className="notif-unread-dot" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
