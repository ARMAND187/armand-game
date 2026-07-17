"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  UserPlus, Check, X, Search, Users, Bell, PhoneCall, Copy, Plus
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
  currentParty: string | null;
}
interface Request {
  id: string; // ID of the friend_request row
  sender_id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

type Tab = "friends" | "requests";

interface IncomingInvite {
  id: string;
  sender_id: string;
  party_code: string;
  sender_username?: string;
  sender_avatarUrl?: string | null;
}


export default function FriendsPage() {
  const [tab, setTab]             = useState<Tab>("friends");
  const [query, setQuery]         = useState("");
  const [addValue, setAddValue]   = useState("");
  const [addFeedback, setAddFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);

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
        u1:profiles!friends_user1_id_fkey(id, username, wins, avatar_url, current_party),
        u2:profiles!friends_user2_id_fkey(id, username, wins, avatar_url, current_party)
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
            online: false,
            score: other?.wins || 0,
            currentParty: other?.current_party || null,
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [myUserId, loadData]);


  // Real-time listener for invites
  useEffect(() => {
    if (!myUserId) return;

    const channel = supabase
      .channel('party_invites_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'party_invites',
          filter: `receiver_id=eq.${myUserId}`,
        },
        (payload) => {
          const newInvite = payload.new as IncomingInvite;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFriends(currentFriends => {
            const sender = currentFriends.find(f => f.profile_id === newInvite.sender_id);
            setIncomingInvites(prev => [
              ...prev,
              {
                ...newInvite,
                sender_username: sender?.username || "Someone",
                sender_avatarUrl: sender?.avatarUrl || null,
              }
            ]);
            return currentFriends;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myUserId, supabase]);

  const activeFriends = friends.filter(f => f.currentParty !== null);

  const handleCreateParty = async () => {
    if (!myUserId) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setActiveParty(code);
    await supabase.from("profiles").update({ current_party: code }).eq("id", myUserId);
    loadData();
  };

  const handleJoinParty = async (codeOverride?: string) => {
    if (!myUserId) return;
    const code = (codeOverride || partyCodeInput).trim().toUpperCase();
    if (code) {
      setActiveParty(code);
      await supabase.from("profiles").update({ current_party: code }).eq("id", myUserId);
      loadData();
    }
  };

  const handleLeaveParty = async () => {
    if (!myUserId) return;
    setActiveParty(null);
    await supabase.from("profiles").update({ current_party: null }).eq("id", myUserId);
    loadData();
  };

  const handleSendInvite = async (friendId: string) => {
    if (!myUserId || !activeParty) return;
    await supabase.from("party_invites").insert({
      sender_id: myUserId,
      receiver_id: friendId,
      party_code: activeParty,
    });
  };

  const acceptInvite = (invite: IncomingInvite) => {
    handleJoinParty(invite.party_code);
    dismissInvite(invite.id);
  };

  const dismissInvite = (id: string) => {
    setIncomingInvites(prev => prev.filter(inv => inv.id !== id));
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



  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl flex flex-col gap-6 mt-8 px-4 md:px-8 pb-32">

      {/* ── Incoming Invites Toasts ── */}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-2">
        {incomingInvites.map(inv => (
          <div key={inv.id} className="bg-zinc-900 border border-purple-500/50 p-4 rounded-xl shadow-2xl flex items-center gap-4 w-80 animate-in slide-in-from-right-8">
            <img 
              src={inv.sender_avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${inv.sender_username}`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800"
            />
            <div className="flex-1">
              <p className="text-sm text-white font-bold">@{inv.sender_username}</p>
              <p className="text-xs text-zinc-400">Invited you to party!</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => acceptInvite(inv)} className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg">
                <Check size={16} />
              </button>
              <button onClick={() => dismissInvite(inv.id)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 p-2 rounded-lg">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

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
          <button className="add-friend-btn" onClick={handleAdd} id="add-friend-btn">
            Add
          </button>
        </div>
        {addFeedback && (
          <p style={{ fontSize: 12, color: addFeedback.type === "success" ? "#4ade80" : "#f87171", marginBottom: 12, paddingLeft: 4 }}>
            {addFeedback.type === "success" ? "✓" : "✗"} {addFeedback.msg}
          </p>
        )}
      </div>

      {/* ── Section 2: Party Lounge ── */}
      <div className="border border-purple-500/50 rounded-2xl p-6 w-full bg-zinc-900/50">
        <h2 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
          🎉 Party Lounge
        </h2>
        
        {activeParty && myUsername ? (
          <div>
            <div className="mb-4 text-sm text-purple-300 font-semibold bg-purple-500/10 inline-block px-3 py-1 rounded-full border border-purple-500/20 flex items-center justify-between w-full max-w-sm">
              <span>Room Code: {activeParty}</span>
              <button onClick={() => {
                navigator.clipboard.writeText(activeParty);
              }} className="text-purple-400 hover:text-white p-1">
                <Copy size={14} />
              </button>
            </div>
            <VoiceParty 
              room={activeParty} 
              username={myUsername} 
              onLeave={handleLeaveParty} 
            />
          </div>
        ) : (
          <div>
            <p className="text-sm text-zinc-400 mb-4">Create a new voice party or jump into an existing one with your friends.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Create Section */}
              <div className="flex items-center justify-center">
                <button 
                  onClick={handleCreateParty}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-8 py-3.5 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 w-full shadow-lg"
                >
                  <Plus size={18} /> Create Party
                </button>
              </div>

              {/* Join Section */}
              <div className="flex items-center justify-center w-full">
                <div className="relative w-full">
                  <input 
                    type="text" 
                    placeholder="Enter Code..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-full pl-6 pr-24 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all uppercase font-mono shadow-lg"
                    value={partyCodeInput}
                    onChange={(e) => setPartyCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinParty()}
                  />
                  <button 
                    onClick={() => handleJoinParty()}
                    disabled={!partyCodeInput.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Active Parties ── */}
      {activeFriends.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h3 className="text-zinc-400 font-semibold text-sm uppercase tracking-wider mb-2">Friends in Parties</h3>
          <div className="flex flex-wrap gap-3">
            {activeFriends.map(f => (
              <div key={f.id} className="bg-zinc-900 border border-purple-500/30 rounded-xl p-3 flex items-center gap-3 pr-4 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                <img 
                  src={f.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${f.username}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800"
                />
                <div>
                  <div className="text-sm font-bold text-white">@{f.username}</div>
                </div>
                <button 
                  onClick={() => handleJoinParty(f.currentParty!)}
                  className="ml-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors"
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
                {filtered.map((friend) => (
                  <Link href={`/profile/${friend.username}`} key={friend.id} className="friend-row bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors p-4 rounded-xl flex items-center" style={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <div className="friend-avatar mr-4" style={{ border: "none", background: "none", padding: 0 }}>
                      <img src={friend.avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${friend.username}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-zinc-800" />
                    </div>
                    <div className="friend-info flex-1">
                      <div className="friend-name font-bold text-white text-base">@{friend.username}</div>
                      <div className="friend-score text-zinc-400 text-xs">{friend.score.toLocaleString()} wins</div>
                    </div>
                    
                    {activeParty && friend.currentParty !== activeParty && (
                      <button 
                        onClick={(e) => { e.preventDefault(); handleSendInvite(friend.profile_id); }}
                        className="ml-auto bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1 transition-colors"
                      >
                        <PhoneCall size={12} /> Invite
                      </button>
                    )}
                  </Link>
                ))}
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
                    <div className="friend-info flex-1">
                      <div className="friend-name font-bold text-white text-base">@{req.username}</div>
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
