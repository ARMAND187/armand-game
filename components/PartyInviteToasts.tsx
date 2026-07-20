"use client";

import { usePartyContext } from "@/context/PartyContext";
import { X, Check, Users } from "lucide-react";
import { useState } from "react";

export default function PartyInviteToasts() {
  const { pendingInvites, dismissInvite, joinParty } = usePartyContext();
  const [accepting, setAccepting] = useState<string | null>(null);

  if (pendingInvites.length === 0) return null;

  const handleAccept = async (invite: typeof pendingInvites[0]) => {
    setAccepting(invite.id);
    joinParty(invite.party_code);
    dismissInvite(invite.id);
    setAccepting(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "max(env(safe-area-inset-top), 60px)",
        right: 12,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 320,
        width: "calc(100vw - 24px)",
      }}
    >
      {pendingInvites.map((invite) => (
        <div
          key={invite.id}
          style={{
            background: "rgba(9,9,11,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(167,139,250,0.4)",
            borderRadius: 18,
            padding: "14px 16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(167,139,250,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "slide-in-right 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={invite.sender_avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${invite.sender_username}`}
              alt={invite.sender_username}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "2px solid rgba(167,139,250,0.5)",
                background: "#18181b",
                objectFit: "cover",
              }}
            />
            <div style={{
              position: "absolute",
              bottom: -2, right: -2,
              background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
              borderRadius: "50%",
              width: 18, height: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #09090b",
            }}>
              <Users size={9} color="#fff" />
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
              Party Invite! 🎉
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <span style={{ color: "#a78bfa", fontWeight: 700 }}>@{invite.sender_username}</span> invited you
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => handleAccept(invite)}
              disabled={accepting === invite.id}
              style={{
                width: 34, height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(167,139,250,0.4)",
                transition: "transform 0.15s",
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              title="Accept"
            >
              <Check size={16} color="#fff" strokeWidth={3} />
            </button>
            <button
              onClick={() => dismissInvite(invite.id)}
              style={{
                width: 34, height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              title="Dismiss"
            >
              <X size={15} color="#a1a1aa" />
            </button>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
