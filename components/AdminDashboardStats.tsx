"use client";

import { Users, Activity } from "lucide-react";
import { usePresenceStore } from "@/store/usePresenceStore";

export default function AdminDashboardStats({ totalRegistered }: { totalRegistered: number }) {
  const onlineCount = usePresenceStore((state) => state.onlineCount);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24, marginBottom: 32 }}>
      {/* Total Registered Card */}
      <div className="settings-card" style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px 0" }}>
            Total Users
          </h3>
          <p style={{ fontSize: 36, fontWeight: 800, color: "white", margin: 0 }}>
            {totalRegistered}
          </p>
        </div>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(168, 85, 247, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={32} color="#a855f7" />
        </div>
      </div>

      {/* Live Players Card */}
      <div className="settings-card" style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden", border: "1px solid rgba(74, 222, 128, 0.3)" }}>
        {/* Pulse effect in background */}
        <div style={{ position: "absolute", top: 0, right: 0, width: 128, height: 128, background: "rgba(74, 222, 128, 0.1)", borderRadius: "50%", filter: "blur(40px)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}></div>
        
        <div style={{ position: "relative", zIndex: 10 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: 8 }}>
            Live Players
            <div style={{ position: "relative", width: 8, height: 8, display: "flex" }}>
              <span style={{ position: "absolute", width: "100%", height: "100%", background: "#4ade80", borderRadius: "50%", opacity: 0.75, animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }}></span>
              <span style={{ position: "relative", width: 8, height: 8, background: "#4ade80", borderRadius: "50%" }}></span>
            </div>
          </h3>
          <p style={{ fontSize: 36, fontWeight: 800, color: "#4ade80", margin: 0 }}>
            {onlineCount}
          </p>
        </div>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(74, 222, 128, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 10 }}>
          <Activity size={32} color="#4ade80" />
        </div>
      </div>
    </div>
  );
}
