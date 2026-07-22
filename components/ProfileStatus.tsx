"use client";

import { usePresenceStore } from "@/store/usePresenceStore";
import { timeAgo } from "@/utils/timeAgo";
import { useEffect, useState } from "react";

export default function ProfileStatus({ userId, lastSeen }: { userId: string, lastSeen: string | null }) {
  const activeUsers = usePresenceStore((state) => state.activeUsers);
  const isOnline = activeUsers.some(u => u.userId === userId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
      {isOnline ? (
        <>
          <div style={{ width: 10, height: 10, background: "#4ade80", borderRadius: "50%", boxShadow: "0 0 10px rgba(74, 222, 128, 0.5)" }} />
          <span style={{ color: "#4ade80" }}>Online</span>
        </>
      ) : (
        <>
          <div style={{ width: 10, height: 10, background: "var(--text-muted)", borderRadius: "50%", opacity: 0.5 }} />
          <span>{lastSeen ? `Last seen ${timeAgo(lastSeen)}` : "Offline"}</span>
        </>
      )}
    </div>
  );
}
