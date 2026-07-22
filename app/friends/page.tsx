"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase/client";
import {
  UserPlus, Check, X, Search, Users, Bell, PhoneCall, Copy, Plus
} from "lucide-react";
import Link from "next/link";
import PlayerNameFlair from "@/components/PlayerNameFlair";
import { timeAgo } from "@/utils/timeAgo";

import { usePartyContext } from "@/context/PartyContext";
import { usePresenceStore } from "@/store/usePresenceStore";

interface Friend {
  id: string; // ID of the friendship row or the user profile
  profile_id: string; // The other user's ID
  username: string;
  displayName: string;
  avatarUrl: string | null;
  equippedFlair: string | null;
  online: boolean;
  score: number;
  currentParty: string | null;
  lastSeen: string | null;
}
interface Request {
  id: string; // ID of the friend_request row
  sender_id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  equippedFlair: string | null;
}

type Tab = "friends" | "requests";


export default function FriendsPage() {
  const [tab, setTab]             = useState<Tab>("friends");
  const [query, setQuery]         = useState("");
  const [addValue, setAddValue]   = useState("");
  const [addFeedback, setAddFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const activeUsers = usePresenceStore((state) => state.activeUsers);

  // Voice Party — from global context (connection lives in layout)
  const { activeParty, myUsername: ctxUsername, joinParty, leaveParty: ctxLeaveParty, sendInvite } = usePartyContext();
  const [partyCodeInput, setPartyCodeInput] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!myUserId) return;

    // Load Requests (where receiver is me)
    const { data: reqData } = await supabase
      .from("friend_requests")
      .select(`
        id,
        sender_id,
        profiles!friend_requests_sender_id_fkey (
          username, wins, avatar_url, equipped_flair
        )
      `)
      .eq("receiver_id", myUserId);

    if (reqData) {
      setRequests(
        reqData.map((r: unknown) => {
          const req = r as { id: string; sender_id: string; profiles: { username: string; wins: number; avatar_url: string | null, equipped_flair: string | null } | { username: string; wins: number; avatar_url: string | null, equipped_flair: string | null }[] | null };
          const p = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
          return {
            id: req.id,
            sender_id: req.sender_id,
            username: p?.username || "unknown",
            displayName: p?.username || "Unknown",
            avatarUrl: p?.avatar_url || null,
            equippedFlair: p?.equipped_flair || null,
          };
        })
      );
    }

    // Load Friends
    const { data: friendsData } = await supabase
      .from("friends")
      .select(`
        id,
        user1_id,
        user2_id,
        u1:profiles!friends_user1_id_fkey(id, username, wins, avatar_url, current_party, equipped_flair, last_seen),
        u2:profiles!friends_user2_id_fkey(id, username, wins, avatar_url, current_party, equipped_flair, last_seen)
      `)
      .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`);

    if (friendsData) {
      setFriends(
        friendsData.map((f: unknown) => {
          const fr = f as { id: string; user1_id: string; user2_id: string; u1: any; u2: any };
          const p1 = Array.isArray(fr.u1) ? fr.u1[0] : fr.u1;
          const p2 = Array.isArray(fr.u2) ? fr.u2[0] : fr.u2;
          const other = fr.user1_id === myUserId ? p2 : p1;
          return {
            id: fr.id,
            profile_id: other?.id || "",
            username: other?.username || "unknown",
            displayName: other?.username || "Unknown",
            avatarUrl: other?.avatar_url || null,
            equippedFlair: other?.equipped_flair || null,
            online: false,
            score: other?.wins || 0,
            currentParty: other?.current_party || null,
            lastSeen: other?.last_seen || null,
          };
        })
      );
    }
  }, [myUserId, supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setMyUserId(data.user.id);
        // myUsername comes from context (already loaded there)
      }
    });
  }, [supabase]);

  useEffect(() => {
    if (myUserId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [myUserId, loadData]);

  const activeFriends = friends.filter(f => f.currentParty !== null && f.currentParty !== activeParty);

  const handleCreateParty = async () => {
    if (!myUserId) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    joinParty(code);
    await supabase.from("profiles").update({ current_party: code }).eq("id", myUserId);
    loadData();
  };

  const handleJoinParty = async (codeOverride?: string) => {
    if (!myUserId) return;
    const code = (codeOverride || partyCodeInput).trim().toUpperCase();
    if (code) {
      joinParty(code);
      await supabase.from("profiles").update({ current_party: code }).eq("id", myUserId);
      loadData();
    }
  };

  const handleLeaveParty = async () => {
    if (!myUserId) return;
    ctxLeaveParty();
    await supabase.from("profiles").update({ current_party: null }).eq("id", myUserId);
    loadData();
  };

  const filtered = friends.filter(
    (f) =>
      f.displayName.toLowerCase().includes(query.toLowerCase()) ||
      f.username.toLowerCase().includes(query.toLowerCase())
  );

  const handleAdd = async () => {
    const trimmed = addValue.trim().toLowerCase();
    if (!trimmed || !myUserId) return;
    
    // 1. Find user by username
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmed)
      .single();

    if (!profile) {
      setAddFeedback({ msg: "User not found!", type: "error" });
      setTimeout(() => setAddFeedback(null), 3000);
      return;
    }

    if (profile.id === myUserId) {
      setAddFeedback({ msg: "You can't add yourself!", type: "error" });
      setTimeout(() => setAddFeedback(null), 3000);
      return;
    }

    // --- NEW PRE-INSERT CHECK ---
    // Check for existing friendship
    const { data: existingFriends } = await supabase
      .from("friends")
      .select("id")
      .or(`and(user1_id.eq.${myUserId},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${myUserId})`);
      
    if (existingFriends && existingFriends.length > 0) {
      setAddFeedback({ msg: "This user is already your friend!", type: "error" });
      setTimeout(() => setAddFeedback(null), 3000);
      return;
    }

    // Check for existing friend requests
    const { data: existingRequests } = await supabase
      .from("friend_requests")
      .select("id")
      .or(`and(sender_id.eq.${myUserId},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${myUserId})`);

    if (existingRequests && existingRequests.length > 0) {
      setAddFeedback({ msg: "A request is already pending.", type: "error" });
      setTimeout(() => setAddFeedback(null), 3000);
      return;
    }

    // 2. Insert request
    const { error } = await supabase.from("friend_requests").insert({
      sender_id: myUserId,
      receiver_id: profile.id,
    });

    if (error) {
      setAddFeedback({ msg: "Request already sent or they are your friend.", type: "error" });
    } else {
      setAddFeedback({ msg: `Request sent to @${trimmed}!`, type: "success" });
      setAddValue("");
    }
    setTimeout(() => setAddFeedback(null), 3000);
  };

  const handleAccept = async (req: Request) => {
    if (!myUserId) return;
    
    // --- PRE-INSERT CHECK ---
    const { data: existingFriends } = await supabase
      .from("friends")
      .select("id")
      .or(`and(user1_id.eq.${req.sender_id},user2_id.eq.${myUserId}),and(user1_id.eq.${myUserId},user2_id.eq.${req.sender_id})`);

    if (existingFriends && existingFriends.length > 0) {
      // Already friends, just clean up the duplicate request
      await supabase.from("friend_requests").delete().eq("id", req.id);
      loadData();
      return;
    }

    // Insert into friends table
    await supabase.from("friends").insert({
      user1_id: req.sender_id,
      user2_id: myUserId,
    });

    // Delete request
    await supabase.from("friend_requests").delete().eq("id", req.id);
    loadData(); // Refresh both lists
  };

  const handleReject = async (id: string) => {
    await supabase.from("friend_requests").delete().eq("id", id);
    loadData();
  };



  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl flex flex-col gap-6 mt-8 px-4 md:px-8 pb-32">

      <div>
        <h1 className="page-header mb-1">Friends</h1>
        <p className="page-subtitle mb-0">Connect and compete</p>
      </div>

      {/* ── Section 1: Add Friend Bar ── */}
      <div>
        <div className="add-friend-bar">
          <UserPlus size={16} color="var(--neon)" style={{ flexShrink: 0 }} />
          <input
            className="add-friend-input"
            placeholder="Add by username…"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          {(() => {
            const trimmed = addValue.trim().toLowerCase();
            const isAlreadyFriend = friends.some(f => f.username.toLowerCase() === trimmed);
            const isPending = requests.some(r => r.username.toLowerCase() === trimmed);
            const disabled = !trimmed || isAlreadyFriend || isPending;
            
            let btnText = "Add";
            if (isAlreadyFriend) btnText = "Already Friends";
            else if (isPending) btnText = "Pending";

            return (
              <button 
                className="add-friend-btn" 
                onClick={handleAdd} 
                id="add-friend-btn"
                disabled={disabled}
                style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
              >
                {btnText}
              </button>
            );
          })()}
        </div>
        {addFeedback && (
          <p style={{ fontSize: 12, color: addFeedback.type === "success" ? "#4ade80" : "#f87171", marginBottom: 12, paddingLeft: 4 }}>
            {addFeedback.type === "success" ? "✓" : "✗"} {addFeedback.msg}
          </p>
        )}
      </div>

      {/* ── Section 2: Party Lounge ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(9,9,11,0) 100%)",
        border: "1px solid rgba(167,139,250,0.35)",
        borderRadius: 20,
        padding: "20px",
        width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            🎉 Party Lounge
          </h2>
          {activeParty && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
              <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>LIVE</span>
            </div>
          )}
        </div>

        {activeParty ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Code + Copy row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: 14, padding: "12px 16px",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Party Code</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#a78bfa", letterSpacing: "0.15em" }}>{activeParty}</div>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(activeParty)}
                style={{
                  background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)",
                  borderRadius: 10, padding: "8px 12px", color: "#a78bfa",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                }}
                title="Copy code"
              >
                <Copy size={13} /> Copy
              </button>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              {/* Invite button → opens modal */}
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  border: "none", borderRadius: 12, padding: "12px 0",
                  color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 4px 18px rgba(167,139,250,0.35)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
                onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                <Users size={15} /> Invite Friends
              </button>
              <button
                onClick={handleLeaveParty}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 12, padding: "12px 18px",
                  color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                Leave
              </button>
            </div>

            <div style={{ fontSize: 11, color: "#52525b", display: "flex", alignItems: "center", gap: 5 }}>
              <PhoneCall size={11} /> Voice controls in the floating panel (bottom-left)
            </div>

            <style>{`
              @keyframes pulse-green { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
            `}</style>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={handleCreateParty}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                border: "none", borderRadius: 14, padding: "14px",
                color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(167,139,250,0.3)",
                transition: "transform 0.15s",
              }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              <Plus size={18} /> Create Party
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 11, color: "#52525b", fontWeight: 600 }}>or join with code</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="search-input"
                placeholder="ENTER CODE..."
                value={partyCodeInput}
                onChange={e => setPartyCodeInput(e.target.value.toUpperCase())}
                style={{ flex: 1, background: "rgba(0,0,0,0.3)", letterSpacing: "0.12em", fontWeight: 800, textTransform: "uppercase", fontSize: 13 }}
                onKeyDown={e => e.key === "Enter" && handleJoinParty()}
              />
              <button
                onClick={() => handleJoinParty()}
                disabled={!partyCodeInput.trim()}
                style={{
                  background: partyCodeInput.trim() ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${partyCodeInput.trim() ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10, padding: "10px 16px",
                  color: partyCodeInput.trim() ? "#a78bfa" : "#52525b",
                  fontSize: 13, fontWeight: 800, cursor: partyCodeInput.trim() ? "pointer" : "default",
                  transition: "all 0.2s",
                }}
              >
                Join
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Invite Friends Modal ── */}
      {showInviteModal && mounted && createPortal(
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowInviteModal(false); }}
        >
          <div style={{
            background: "#111113",
            border: "1px solid rgba(167,139,250,0.3)",
            borderRadius: "24px",
            width: "100%",
            maxWidth: 480,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "modal-pop 0.3s cubic-bezier(0.34,1.2,0.64,1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          }}>
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Invite to Party</div>
                <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                  Code: <span style={{ color: "#a78bfa", fontWeight: 700 }}>{activeParty}</span>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#a1a1aa",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Friend list */}
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px 20px" }}>
              {friends.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#52525b" }}>
                  <Users size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                  <p style={{ fontSize: 13 }}>No friends to invite yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {friends.map(f => {
                    const alreadyInParty = f.currentParty === activeParty;
                    return (
                      <div
                        key={f.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${alreadyInParty ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.06)"}`,
                          borderRadius: 14, padding: "12px 14px",
                        }}
                      >
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <img
                            src={f.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${f.username}`}
                            alt={f.username}
                            style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", display: "block" }}
                          />
                          {activeUsers.some(u => u.userId === f.profile_id) && (
                            <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, background: "#4ade80", border: "2px solid #111113", borderRadius: "50%", zIndex: 10 }} />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 justify-center min-w-0">
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center" }}>
                            <PlayerNameFlair username={f.username} flair={f.equippedFlair} />
                          </div>
                          {alreadyInParty && <div style={{ fontSize: 11, color: "#4ade80" }}>Already in party</div>}
                        </div>
                        {alreadyInParty ? (
                          <div style={{
                            background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)",
                            borderRadius: 10, padding: "6px 12px", color: "#4ade80", fontSize: 11, fontWeight: 700,
                          }}>
                            In Party ✓
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              await sendInvite(f.profile_id);
                              setSentInvites(s => new Set([...s, f.profile_id]));
                            }}
                            disabled={sentInvites.has(f.profile_id)}
                            style={{
                              background: sentInvites.has(f.profile_id) ? "rgba(74,222,128,0.12)" : "linear-gradient(135deg, #a78bfa, #7c3aed)",
                              border: sentInvites.has(f.profile_id) ? "1px solid rgba(74,222,128,0.25)" : "none",
                              borderRadius: 10, padding: "7px 14px",
                              color: sentInvites.has(f.profile_id) ? "#4ade80" : "#fff",
                              fontSize: 12, fontWeight: 700,
                              cursor: sentInvites.has(f.profile_id) ? "default" : "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            {sentInvites.has(f.profile_id) ? "Sent ✓" : "Invite"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <style>{`
            @keyframes modal-pop {
              from { transform: scale(0.95); opacity: 0; }
              to   { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>,
        document.body
      )}


      {/* ── Section 3: Active Parties ── */}
      {activeFriends.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h3 className="text-zinc-400 font-semibold text-sm uppercase tracking-wider mb-2">Friends in Parties</h3>
          <div className="flex flex-wrap gap-3">
            {activeFriends.map(f => (
              <div key={f.id} className="w-full flex items-center justify-between bg-zinc-950 border border-purple-500/40 rounded-xl p-3 md:p-4 mb-2">
                <div className="flex items-center gap-3">
                  <div style={{ position: "relative" }}>
                    <img 
                      src={f.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${f.username}`} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 block"
                    />
                    {activeUsers.some(u => u.userId === f.profile_id) && (
                      <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, background: "#4ade80", border: "2px solid #09090b", borderRadius: "50%", zIndex: 10 }} />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pl-1">
                    <div className="text-sm font-bold text-white flex items-center">
                      <PlayerNameFlair username={f.username} flair={f.equippedFlair} />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleJoinParty(f.currentParty!)}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-sm px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 4: Tabs & Search ── */}
      <div className="flex flex-col gap-4">
        <div className="tab-bar">
          <button
            className={`tab-btn${tab === "friends" ? " active" : ""}`}
            onClick={() => setTab("friends")}
          >
            <Users size={14} /> Friends ({friends.length})
          </button>
          <button
            className={`tab-btn${tab === "requests" ? " active" : ""}`}
            onClick={() => setTab("requests")}
          >
            <Bell size={14} />
            Requests
            {requests.length > 0 && (
              <span className="tab-badge">{requests.length}</span>
            )}
          </button>
        </div>

        {/* ── Section 5: Friends list ── */}
        {tab === "friends" && (
          <>
            <div className="search-bar mb-2">
              <Search size={14} color="var(--text-muted)" />
              <input
                className="search-input"
                placeholder="Search friends…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <Users size={28} color="var(--text-muted)" />
                <span>No friends found</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((friend) => {
                  const isOnline = activeUsers.some(u => u.userId === friend.profile_id);
                  return (
                  <Link href={`/profile/${friend.username}`} key={friend.id} className="friend-row bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors p-4 rounded-xl flex items-center" style={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <div className="friend-avatar mr-4" style={{ border: "none", background: "none", padding: 0, position: "relative" }}>
                      <img src={friend.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${friend.username}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-zinc-800 block" />
                      {isOnline && (
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, background: "#4ade80", border: "2px solid #18181b", borderRadius: "50%", zIndex: 10 }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="friend-name font-bold text-white text-base flex items-center">
                        <PlayerNameFlair username={friend.username} flair={friend.equippedFlair} />
                      </div>
                      <div className="text-xs text-zinc-500 font-medium">
                        {isOnline ? (
                          <span className="text-emerald-400">Online</span>
                        ) : (
                          <span>{friend.lastSeen ? `Last seen ${timeAgo(friend.lastSeen)}` : "Offline"}</span>
                        )}
                      </div>
                    </div>
                    
                    {activeParty && friend.currentParty !== activeParty && (
                      <button 
                        onClick={(e) => { e.preventDefault(); sendInvite(friend.profile_id); }}
                        className="ml-auto bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition-colors"
                      >
                        <PhoneCall size={12} /> Invite
                      </button>
                    )}
                  </Link>
                )})}
              </div>
            )}
          </>
        )}

        {/* ── Requests list ── */}
        {tab === "requests" && (
          <>
            {requests.length === 0 ? (
              <div className="empty-state">
                <Check size={28} color="var(--text-muted)" />
                <span>No pending requests</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((req) => (
                  <div key={req.id} className="request-row bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center">
                    <div className="friend-avatar mr-4" style={{ border: "none", background: "none", padding: 0 }}>
                      <img src={req.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${req.username}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-zinc-800" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="friend-name font-bold text-white text-base flex items-center">
                        <PlayerNameFlair username={req.username} flair={req.equippedFlair} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="req-btn req-btn--accept bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg transition-colors"
                        onClick={() => handleAccept(req)}
                        id={`accept-${req.id}`}
                        title="Accept"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="req-btn req-btn--reject bg-zinc-800 hover:bg-zinc-700 text-zinc-400 p-2 rounded-lg transition-colors"
                        onClick={() => handleReject(req.id)}
                        id={`reject-${req.id}`}
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
}
