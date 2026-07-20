"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  TrackToggle,
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useState, useCallback } from "react";
import { Mic, MicOff, PhoneOff, ChevronDown, ChevronUp } from "lucide-react";
import { usePartyContext } from "@/context/PartyContext";

// ─── Token fetcher ────────────────────────────────────────────────────────────
function usePartyToken(room: string | null, username: string | null) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!room || !username) { setToken(null); return; }
    setToken(null);
    setError(null);
    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`
        );
        if (!resp.ok) throw new Error(`Server ${resp.status}`);
        const data = await resp.json();
        if (data.token) setToken(data.token);
        else setError("Token fetch failed");
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [room, username]);

  return { token, error };
}

// ─── Mini HUD inner (needs LiveKit hooks) ────────────────────────────────────
function MiniHUDInner({ onLeave, collapsed, onToggle }: { onLeave: () => void; collapsed: boolean; onToggle: () => void }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const isMuted = !localParticipant?.isMicrophoneEnabled;

  const toggleMic = useCallback(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(isMuted);
    }
  }, [localParticipant, isMuted]);

  return (
    <>
      <RoomAudioRenderer />
      {/* Header pill */}
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#4ade80",
            boxShadow: "0 0 6px #4ade80",
            animation: "pulse-dot 1.5s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
            Party · {participants.length}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {collapsed
            ? <ChevronUp size={14} color="#a1a1aa" />
            : <ChevronDown size={14} color="#a1a1aa" />}
        </div>
      </div>

      {/* Expanded body */}
      {!collapsed && (
        <div style={{ padding: "0 12px 10px" }}>
          {/* Members */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {participants.map(p => (
              <div key={p.identity} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ position: "relative" }}>
                  <img
                    src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${p.identity}`}
                    alt={p.identity}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: p.isSpeaking
                        ? "2px solid #a78bfa"
                        : "2px solid rgba(255,255,255,0.1)",
                      boxShadow: p.isSpeaking ? "0 0 8px rgba(167,139,250,0.7)" : "none",
                      transition: "all 0.2s",
                      background: "#18181b",
                      objectFit: "cover",
                    }}
                  />
                  {p.isMicrophoneEnabled === false && (
                    <div style={{
                      position: "absolute", top: -2, right: -2,
                      background: "#ef4444",
                      borderRadius: "50%",
                      width: 14, height: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <MicOff size={8} color="#fff" />
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 9,
                  color: "#a1a1aa",
                  maxWidth: 40,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {p.identity}
                </span>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={toggleMic}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "7px 0",
                borderRadius: 10,
                border: "none",
                background: isMuted ? "rgba(239,68,68,0.2)" : "rgba(167,139,250,0.15)",
                color: isMuted ? "#ef4444" : "#a78bfa",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isMuted ? <MicOff size={12} /> : <Mic size={12} />}
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={onLeave}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "7px 12px",
                borderRadius: 10,
                border: "none",
                background: "rgba(239,68,68,0.15)",
                color: "#ef4444",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <PhoneOff size={12} />
              Leave
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Wrapper with LiveKitRoom ─────────────────────────────────────────────────
function PartyRoomWrapper({ room, username, onLeave }: { room: string; username: string; onLeave: () => void }) {
  const { token, error } = usePartyToken(room, username);
  const [collapsed, setCollapsed] = useState(false);

  if (error) return null;  // Silently fail in HUD mode
  if (!token) return (
    <div style={{
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      color: "#a78bfa",
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#a78bfa",
        opacity: 0.6,
        animation: "pulse-dot 1s ease-in-out infinite",
      }} />
      Connecting…
    </div>
  );

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      onDisconnected={onLeave}
      style={{ display: "contents" }}
    >
      <MiniHUDInner
        onLeave={onLeave}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
    </LiveKitRoom>
  );
}

// ─── Main export: mounts in layout, always floating ─────────────────────────
export default function PersistentPartyHUD() {
  const { activeParty, myUsername, leaveParty } = usePartyContext();

  if (!activeParty || !myUsername) return null;

  return (
    <>
      {/* Single LiveKitRoom — always floating bottom-left on every page */}
      <div
        style={{
          position: "fixed",
          bottom: "76px",
          left: "12px",
          zIndex: 9000,
          minWidth: 160,
          maxWidth: 240,
          background: "rgba(9,9,11,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(167,139,250,0.3)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.1)",
        }}
      >
        <PartyRoomWrapper room={activeParty} username={myUsername} onLeave={leaveParty} />
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </>
  );
}
