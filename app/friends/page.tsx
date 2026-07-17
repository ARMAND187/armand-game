"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  UserPlus, Check, X, Search, Users, Bell,
} from "lucide-react";
import Link from "next/link";

import VoiceParty from "@/components/VoiceParty";

interface Friend {
  id: string; // ID of the friendship row or the user profile
  profile_id: string; // The other user's ID
  username: string;
  displayName: string;
  avatarUrl: string | null;
  online: boolean;
  score: number;
}
interface Request {
  id: string; // ID of the friend_request row
  sender_id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

type Tab = "friends" | "requests";

export default function FriendsPage() {
  const [tab, setTab]             = useState<Tab>("friends");
  const [query, setQuery]         = useState("");
  const [addValue, setAddValue]   = useState("");
  const [addFeedback, setAddFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  
  // Voice Party state
  const [partyCodeInput, setPartyCodeInput] = useState("");
  const [activeParty, setActiveParty] = useState<string | null>(null);
  
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
          username, wins, avatar_url
        )
      `)
      .eq("receiver_id", myUserId);

    if (reqData) {
      setRequests(
        reqData.map((r: unknown) => {
          const req = r as { id: string; sender_id: string; profiles: { username: string; wins: number; avatar_url: string | null } | { username: string; wins: number; avatar_url: string | null }[] | null };
          const p = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
          return {
            id: req.id,
            sender_id: req.sender_id,
            username: p?.username || "unknown",
            displayName: p?.username || "Unknown",
            avatarUrl: p?.avatar_url || null,
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
        u1:profiles!friends_user1_id_fkey(id, username, wins, avatar_url),
        u2:profiles!friends_user2_id_fkey(id, username, wins, avatar_url)
      `)
      .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`);

    if (friendsData) {
      setFriends(
        friendsData.map((f: unknown) => {
          const fr = f as { id: string; user1_id: string; user2_id: string; u1: { id: string; username: string; wins: number; avatar_url: string | null } | { id: string; username: string; wins: number; avatar_url: string | null }[] | null; u2: { id: string; username: string; wins: number; avatar_url: string | null } | { id: string; username: string; wins: number; avatar_url: string | null }[] | null };
          const p1 = Array.isArray(fr.u1) ? fr.u1[0] : fr.u1;
          const p2 = Array.isArray(fr.u2) ? fr.u2[0] : fr.u2;
          const other = fr.user1_id === myUserId ? p2 : p1;
          return {
            id: fr.id,
            profile_id: other?.id || "",
            username: other?.username || "unknown",
            displayName: other?.username || "Unknown",
            avatarUrl: other?.avatar_url || null,
            online: false,
            score: other?.wins || 0,
          };
        })
      );
    }
  }, [myUserId, supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setMyUserId(data.user.id);
        setMyUsername(data.user.user_metadata?.username || "guest");
      }
    });
  }, [supabase]);

  useEffect(() => {
    if (myUserId) {
      // Ignore lint rule about cascading renders since it's an async data fetch
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [myUserId, loadData]);

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

  const handleJoinParty = () => {
    const code = partyCodeInput.trim().toUpperCase();
    if (code) {
      setActiveParty(code);
    }
  };

  return (
    <div className="page-shell">
      <h1 className="page-header">Friends</h1>
      <p className="page-subtitle">Connect and compete</p>

      {/* ── Party Lounge ── */}
      <div className="bg-zinc-900 border border-purple-500/50 rounded-2xl p-6 mb-8 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
        <h2 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
          🎉 Party Lounge
        </h2>
        
        {activeParty && myUsername ? (
          <div>
            <div className="mb-4 text-sm text-purple-300 font-semibold bg-purple-500/10 inline-block px-3 py-1 rounded-full border border-purple-500/20">
              Room Code: {activeParty}
            </div>
            <VoiceParty 
              room={activeParty} 
              username={myUsername} 
              onLeave={() => setActiveParty(null)} 
            />
          </div>
        ) : (
          <div>
            <p className="text-sm text-zinc-400 mb-4">Jump into a voice party with your friends.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter Party Code" 
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors uppercase font-mono"
                value={partyCodeInput}
                onChange={(e) => setPartyCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinParty()}
              />
              <button 
                onClick={handleJoinParty}
                disabled={!partyCodeInput.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 rounded-xl text-sm transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Friend ── */}
      <div className="add-friend-bar">
        <UserPlus size={16} color="var(--neon)" style={{ flexShrink: 0 }} />
        <input
          className="add-friend-input"
          placeholder="Add by username…"
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="add-friend-btn" onClick={handleAdd} id="add-friend-btn">
          Add
        </button>
      </div>
      {addFeedback && (
        <p style={{ fontSize: 12, color: addFeedback.type === "success" ? "#4ade80" : "#f87171", marginBottom: 12, paddingLeft: 4 }}>
          {addFeedback.type === "success" ? "✓" : "✗"} {addFeedback.msg}
        </p>
      )}

      {/* ── Tabs ── */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
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

      {/* ── Friends list ── */}
      {tab === "friends" && (
        <>
          <div className="search-bar" style={{ marginBottom: 14 }}>
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
            filtered.map((friend) => (
              <Link href={`/profile/${friend.username}`} key={friend.id} className="friend-row" style={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <div className="friend-avatar" style={{ border: "none", background: "none", padding: 0 }}>
                  <img src={friend.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${friend.username}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-zinc-900" />
                </div>
                <div className="friend-info">
                  <div className="friend-name" style={{textTransform: "none"}}>@{friend.username}</div>
                </div>
                <div className="friend-score">{friend.score.toLocaleString()}</div>
              </Link>
            ))
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
            requests.map((req) => (
              <div key={req.id} className="request-row">
                <div className="friend-avatar" style={{ border: "none", background: "none", padding: 0 }}>
                  <img src={req.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${req.username}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-zinc-900" />
                </div>
                <div className="friend-info">
                  <div className="friend-name" style={{textTransform: "none"}}>@{req.username}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="req-btn req-btn--accept"
                    onClick={() => handleAccept(req)}
                    id={`accept-${req.id}`}
                    title="Accept"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="req-btn req-btn--reject"
                    onClick={() => handleReject(req.id)}
                    id={`reject-${req.id}`}
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
