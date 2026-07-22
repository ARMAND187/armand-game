"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Users, Globe, Loader2, Play, UserPlus, X, Check, Share } from "lucide-react";

type MatchState = "idle" | "searching" | "waiting" | "friends" | "public-setup" | "solo-setup";

interface Props {
  gameId: string;
  playRoute: string;
}

export default function MatchmakingClient({ gameId, playRoute }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinParam = searchParams.get("join");
  const supabase = createClient();
  const [matchState, setMatchState] = useState<MatchState>("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [myUsername, setMyUsername] = useState<string>("Player");
  const [isUsernameLoaded, setIsUsernameLoaded] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [region, setRegion] = useState<string>("All Kurdistan");
  const [hasAutoJoined, setHasAutoJoined] = useState(false);
  const [publicMaxPlayers] = useState<number>(4);
  const [customMaxPlayers, setCustomMaxPlayers] = useState<number>(10);
  const [customTimeLimit, setCustomTimeLimit] = useState<number>(30);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<{id: string, username: string}[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300);

  // Restore PWA matchmaking state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pwa_active_room");
      if (saved) {
        try {
          const state = JSON.parse(saved);
          // Only restore if it's not expired
          if (state.expiresAt && new Date(state.expiresAt).getTime() > Date.now()) {
            setRoomId(state.id);
            setDisplayCode(state.code);
            setIsHost(state.isHost);
            setExpiresAt(new Date(state.expiresAt));
            setTotalRounds(state.totalRounds);
            if (state.maxPlayers) setCustomMaxPlayers(state.maxPlayers);
            setRegion(state.region);
            setMatchState(state.matchState);
          } else {
            localStorage.removeItem("pwa_active_room");
          }
        } catch (e) {}
      }
    }
  }, []);

  // Save PWA matchmaking state whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (roomId && (matchState === "waiting" || matchState === "searching")) {
        localStorage.setItem("pwa_active_room", JSON.stringify({
          id: roomId,
          code: displayCode,
          isHost,
          expiresAt: expiresAt?.toISOString(),
          totalRounds,
          maxPlayers: customMaxPlayers,
          region,
          matchState
        }));
      } else if (matchState === "idle") {
        localStorage.removeItem("pwa_active_room");
      }
    }
  }, [roomId, matchState, displayCode, isHost, expiresAt, totalRounds, region]);

  const handleOpenInvite = async () => {
    setShowInviteModal(true);
    setLoadingFriends(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("friends")
        .select(`
          id,
          user1_id,
          user2_id,
          u1:profiles!friends_user1_id_fkey(id, username),
          u2:profiles!friends_user2_id_fkey(id, username)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        
      if (data) {
        setFriends(data.map((fr: any) => {
          const p1 = Array.isArray(fr.u1) ? fr.u1[0] : fr.u1;
          const p2 = Array.isArray(fr.u2) ? fr.u2[0] : fr.u2;
          const other = fr.user1_id === user.id ? p2 : p1;
          return {
            id: other?.id || "",
            username: other?.username || "Unknown"
          };
        }).filter((f: any) => f.id));
      }
    }
    setLoadingFriends(false);
  };

  const sendInvite = async (friendId: string, friendUsername: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from("notifications").insert({
      receiver_id: friendId,
      sender_id: user.id,
      type: "match",
      title: "Game Invite",
      body: `${myUsername} invited you to play!`,
      metadata: { roomId, gameId, roomCode: displayCode }
    });
    
    setInvitedMap(prev => ({ ...prev, [friendId]: true }));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.username) {
        setMyUsername(data.user.user_metadata.username);
      }
      setIsUsernameLoaded(true);
    });
  }, [supabase]);

  useEffect(() => {
    if (!roomId || matchState !== "waiting" || !isUsernameLoaded) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: myUsername } }
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activePlayers = Object.keys(state);
        setPlayers(activePlayers);

        if (!displayCode && activePlayers.length >= 4) {
          // Trigger ready if we are exactly 4 (public only)
          setTimeout(() => {
            localStorage.removeItem("pwa_active_room");
            router.push(`${playRoute}?roomId=${roomId}`);
          }, 1000);
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        // A player dropped! First active player handles the RPC to avoid duplicate DB calls
        const state = channel.presenceState();
        const activePlayers = Object.keys(state);
        if (activePlayers[0] === myUsername) {
          supabase.rpc('handle_player_leave', { p_room_id: roomId, p_username: key }).then(({ data }) => {
            if (data?.new_host && data.new_host === myUsername) {
              setIsHost(true);
            }
          });
        }
      })
      .on("broadcast", { event: "start-game" }, () => {
        localStorage.removeItem("pwa_active_room");
        router.push(`${playRoute}?roomId=${roomId}`);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString(), isHost });
        }
      });

    return () => {
      // Clean up on unmount. The presence 'leave' event will fire for others.
      channel.untrack().then(() => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      });
    };
  }, [roomId, matchState, myUsername, playRoute, router]);

  // Countdown timer logic for private waiting rooms
  useEffect(() => {
    if (matchState !== "waiting" || !expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        // If timer hits zero and we are the host with less than required players, clean up
        if (isHost && players.length < 2) {
          supabase.rpc('handle_player_leave', { p_room_id: roomId, p_username: myUsername }).then(() => {
            setMatchState("idle");
            setRoomId(null);
            setExpiresAt(null);
            localStorage.removeItem("pwa_active_room");
            alert("Invite expired. Room closed.");
          });
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchState, expiresAt, isHost, players.length, roomId, myUsername]);

  const joinPublicGame = async () => {
    setMatchState("searching");

    try {
      // Look for an available public room, or create one natively if none exist
      const { data, error: rpcError } = await supabase.rpc('join_public_lobby', {
        p_game_id: gameId,
        p_username: myUsername,
        p_max_players: publicMaxPlayers
      });

      if (rpcError) throw rpcError;

      if (data && data.roomId) {
        setPlayers(Array.from(new Set([data.hostUsername, myUsername])));
        setRoomId(data.roomId);
        setIsHost(data.isHost);
        setMatchState("waiting");
      } else {
        throw new Error("Invalid response from join_public_lobby RPC");
      }
    } catch (err) {
      console.error("Matchmaking error:", err);
      setMatchState("idle");
      alert("Failed to connect to matchmaking. Make sure the 'rooms' table and the join_public_lobby RPC exist in Supabase.");
    }
  };

  const createPrivateGame = async () => {
    setMatchState("searching");
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiration = new Date(Date.now() + 5 * 60 * 1000);
    
    try {
      const { data: newRoom, error: insertError } = await supabase
        .from("rooms")
        .insert({
          game_id: gameId,
          status: "waiting",
          is_public: false,
          player_count: 1,
          players: [myUsername],
          host_username: myUsername,
          room_code: shortCode,
          total_rounds: totalRounds,
          max_players: customMaxPlayers,
          time_limit_seconds: customTimeLimit,
          expires_at: expiration.toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setPlayers([myUsername]);
      setRoomId(newRoom.id);
      setDisplayCode(shortCode);
      setIsHost(true);
      setExpiresAt(expiration);
      setTimeLeft(300);
      setMatchState("waiting");
    } catch (err) {
      console.error("Private room creation error:", err);
      setMatchState("idle");
      alert("Failed to create private room. Make sure you ran the SQL command to add 'room_code' and 'total_rounds'!");
    }
  };

  const joinPrivateGame = async (codeOrId?: string) => {
    const target = typeof codeOrId === "string" ? codeOrId : roomCodeInput.trim();
    if (!target) return;
    setMatchState("searching");
    
    try {
      const isUuid = target.length > 20;
      let query = supabase.from("rooms").select("*").in("status", ["waiting", "playing"]).limit(1);
      
      if (isUuid) {
        query = query.eq("id", target);
      } else {
        query = query.eq("room_code", target.toUpperCase());
      }

      const { data: rooms, error } = await query;

      if (error || !rooms || rooms.length === 0) {
        setMatchState("friends");
        alert("Room not found, full, or already in progress.");
        return;
      }
      
      const room = rooms[0];
      
      // The Gatekeeper
      if (room.expires_at && new Date(room.expires_at).getTime() < Date.now()) {
        setMatchState("idle");
        alert("This invite has expired.");
        return;
      }
      
      const isAlreadyInRoom = (room.players || []).includes(myUsername);
      const currentCount = room.player_count || 0;
      const maxCount = room.max_players || 10;
      
      if (!isAlreadyInRoom && currentCount >= maxCount) {
        setMatchState("idle");
        alert("This room is already full.");
        return;
      }

      if (!isAlreadyInRoom) {
        await supabase
          .from("rooms")
          .update({ 
            player_count: room.player_count + 1,
            players: [...(room.players || []), myUsername]
          })
          .eq("id", room.id);
      }

      setPlayers(Array.from(new Set([room.host_username, myUsername])));
      setRoomId(room.id);
      setIsHost(room.host_username === myUsername);
      setDisplayCode(room.room_code);
      setCustomMaxPlayers(room.max_players || 10);
      
      if (room.status === "playing") {
         localStorage.removeItem("pwa_active_room");
         router.push(`${playRoute}?roomId=${room.id}`);
      } else {
         setMatchState("waiting");
      }
    } catch(err) {
      console.error("Private room join error:", err);
      setMatchState("idle");
      alert("Failed to join private room.");
    }
  };

  const handleShareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my game!',
          text: `Join my private game room! Code: ${displayCode}`,
        });
      } catch (err) {
        console.log("User cancelled share");
      }
    } else {
      navigator.clipboard.writeText(displayCode || "");
      alert("Room code copied to clipboard!");
    }
  };

  useEffect(() => {
    if (joinParam && myUsername !== "Player" && !hasAutoJoined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasAutoJoined(true);
      joinPrivateGame(joinParam);
      router.replace(`/lobby/${gameId}`);
    }
  }, [joinParam, myUsername, hasAutoJoined, router, gameId]);

  if (matchState === "idle") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 16 }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", width: "100%" }}>
          <button onClick={() => setMatchState("solo-setup")} className="btn-lobby-play" style={{ flex: 1, justifyContent: "center", padding: "12px 0" }}>
            <Play size={16} fill="currentColor" /> Solo
          </button>
        <button className="btn-lobby-play" style={{ flex: 1, justifyContent: "center", padding: "12px 0", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }} onClick={() => setMatchState("public-setup")}>
          <Globe size={16} /> Public
        </button>
        <button
          className="btn-lobby-play"
          style={{ flex: 1, justifyContent: "center", padding: "12px 0", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          onClick={() => setMatchState("friends")}
        >
          <Users size={16} /> Private
        </button>
        </div>

        <div className="settings-card" style={{ marginBottom: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Select a mode above to start playing.
        </div>
      </div>
    );
  }

  if (matchState === "solo-setup") {
    return (
      <div className="settings-card" style={{ padding: "16px", textAlign: "left" }}>
        <div style={{
          background: "rgba(24, 24, 27, 0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 20,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          marginBottom: 16
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <Play size={18} color="var(--neon)" fill="currentColor" />
            Solo Match
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Rounds</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[5, 10, 15].map(r => (
                  <button
                    key={r}
                    onClick={() => setTotalRounds(r)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 12, fontWeight: 800, fontSize: 13,
                      background: totalRounds === r ? "rgba(167, 139, 250, 0.15)" : "rgba(255,255,255,0.05)",
                      color: totalRounds === r ? "#a78bfa" : "var(--text-muted)",
                      border: totalRounds === r ? "1px solid rgba(167, 139, 250, 0.3)" : "1px solid transparent",
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Link href={`${playRoute}?rounds=${totalRounds}&region=${encodeURIComponent(region)}`} className="btn-redeem" style={{ display: "flex", width: "100%", justifyContent: "center", margin: 0, textDecoration: "none" }}>
            Start Solo Game
        </Link>
        <button 
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, width: "100%", marginTop: 16, cursor: "pointer" }}
          onClick={() => setMatchState("idle")}
        >
          Cancel
        </button>
      </div>
    );
  }


  if (matchState === "public-setup") {
    return (
      <div className="settings-card" style={{ padding: "16px", textAlign: "left" }}>
        <div style={{
          background: "rgba(24, 24, 27, 0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 20,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          marginBottom: 16
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={18} color="var(--neon)" />
            Public Matchmaking
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Rounds</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 12, fontWeight: 800, fontSize: 13,
                    background: "rgba(167, 139, 250, 0.05)",
                    color: "rgba(167, 139, 250, 0.5)",
                    border: "1px solid rgba(167, 139, 250, 0.1)",
                    textAlign: "center"
                  }}
                >5 Rounds (Locked)</div>
              </div>
            </div>
          </div>
        </div>

        <button className="btn-redeem" style={{ width: "100%", justifyContent: "center", margin: 0 }} onClick={joinPublicGame}>
            Find Match
        </button>
        <button 
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, width: "100%", marginTop: 16, cursor: "pointer" }}
          onClick={() => setMatchState("idle")}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (matchState === "friends") {
    return (
      <div className="settings-card" style={{ padding: "16px", textAlign: "left" }}>
        <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Join Room Code</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Room ID"
            className="search-input"
            style={{ flex: 1, minWidth: 0, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textTransform: "uppercase" }}
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
          />
          <button className="btn-lobby-play" style={{ borderRadius: 10, padding: "10px 20px", flexShrink: 0 }} onClick={() => joinPrivateGame()}>
            Join
          </button>
        </div>
        <div className="divider" style={{ margin: "16px 0" }} />
        
        {/* Custom Host Panel */}
        <div style={{
          background: "rgba(24, 24, 27, 0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 20,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          marginBottom: 16
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color="var(--neon)" />
            Host Custom Room
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Rounds</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[5, 10, 15].map(r => (
                  <button
                    key={r}
                    onClick={() => setTotalRounds(r)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 12, fontWeight: 800, fontSize: 13,
                      background: totalRounds === r ? "rgba(167, 139, 250, 0.15)" : "rgba(255,255,255,0.05)",
                      color: totalRounds === r ? "#a78bfa" : "var(--text-muted)",
                      border: totalRounds === r ? "1px solid rgba(167, 139, 250, 0.3)" : "1px solid transparent",
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Max Players</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[2, 4, 6, 10].map(p => (
                  <button
                    key={p}
                    onClick={() => setCustomMaxPlayers(p)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 12, fontWeight: 800, fontSize: 13,
                      background: customMaxPlayers === p ? "rgba(167, 139, 250, 0.15)" : "rgba(255,255,255,0.05)",
                      color: customMaxPlayers === p ? "#a78bfa" : "var(--text-muted)",
                      border: customMaxPlayers === p ? "1px solid rgba(167, 139, 250, 0.3)" : "1px solid transparent",
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >{p}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Round Timer</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[15, 30, 60].map(t => (
                  <button
                    key={t}
                    onClick={() => setCustomTimeLimit(t)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 12, fontWeight: 800, fontSize: 13,
                      background: customTimeLimit === t ? "rgba(167, 139, 250, 0.15)" : "rgba(255,255,255,0.05)",
                      color: customTimeLimit === t ? "#a78bfa" : "var(--text-muted)",
                      border: customTimeLimit === t ? "1px solid rgba(167, 139, 250, 0.3)" : "1px solid transparent",
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >{t}s</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button className="btn-redeem" style={{ width: "100%", justifyContent: "center", margin: 0 }} onClick={createPrivateGame}>
            Launch Private Room
        </button>
        <button 
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, width: "100%", marginTop: 16, cursor: "pointer" }}
          onClick={() => setMatchState("idle")}
        >
          Cancel
        </button>
      </div>
    );
  }

  // WAITING / SEARCHING STATE
  return (
    <div className="settings-card" style={{ padding: "24px 16px", textAlign: "center" }}>
      {matchState === "searching" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Loader2 className="mly-spinner" style={{ border: "none" }} size={32} color="var(--neon)" />
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--neon)" }}>Searching for public match...</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--neon)", marginBottom: 16 }}>
            Waiting for players... ({players.length}/{displayCode ? customMaxPlayers : publicMaxPlayers})
            {displayCode && (
              <>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, userSelect: "all", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Room Code: <span style={{ color: "#fff", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, letterSpacing: 1, fontSize: 16 }}>{displayCode}</span>
                  <button onClick={handleShareCode} style={{ background: "var(--neon)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Share size={12} /> Share
                  </button>
                </div>
                <div style={{ fontSize: 12, color: timeLeft <= 60 ? "#ef4444" : "var(--text-muted)", marginTop: 8, fontWeight: 500 }}>
                  Invite expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </div>
              </>
            )}
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: displayCode ? "repeat(auto-fit, minmax(120px, 1fr))" : "1fr 1fr", gap: 10 }}>
            {Array.from({ length: displayCode ? customMaxPlayers : publicMaxPlayers }).map((_, slotIndex) => {
              const player = players[slotIndex];
              return (
                <div
                  key={slotIndex}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    height: "48px",
                    background: player ? "rgba(167,139,250,0.1)" : "var(--bg-base)",
                    border: `1px solid ${player ? "rgba(167,139,250,0.3)" : "var(--border)"}`,
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: player ? 700 : 500,
                    color: player ? "var(--neon)" : "var(--text-muted)",
                    animation: !player ? "pulse-dot 2s infinite" : "none",
                  }}
                >
                  {player ? (
                    <>
                      <div className="lb-avatar" style={{ width: 24, height: 24, fontSize: 10, flexShrink: 0 }}>{player[0]}</div>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player}</span>
                    </>
                  ) : (
                    "Waiting..."
                  )}
                </div>
              );
            })}
          </div>

          {isHost && players.length >= 2 && (
            <button 
              className="btn-lobby-play"
              style={{ width: "100%", marginTop: 24, padding: 12, borderRadius: 12 }}
              onClick={async () => {
                // Update the DB so anyone loading mid-refresh goes straight to game
                await supabase.from("rooms").update({ status: "playing" }).eq("id", roomId);
                
                // Broadcast to anyone actively in the lobby
                if (channelRef.current) {
                  channelRef.current.send({
                    type: "broadcast",
                    event: "start-game",
                    payload: { timestamp: Date.now() }
                  });
                }
                
                localStorage.removeItem("pwa_active_room");
                router.push(`${playRoute}?roomId=${roomId}`);
              }}
            >
              Start Game Now ({players.length} players)
            </button>
          )}

          {isHost && displayCode && (
            <button 
              className="btn-lobby-play"
              style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 12, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onClick={handleOpenInvite}
            >
              <UserPlus size={16} /> Invite Friends
            </button>
          )}

          <button 
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, marginTop: isHost && players.length >= 2 ? 12 : 24, cursor: "pointer" }}
            onClick={() => setMatchState("idle")}
          >
            Cancel Matchmaking
          </button>
        </>
      )}

      {showInviteModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet" style={{ maxWidth: 400, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0, fontSize: 18 }}>Invite Friends</h2>
              <button onClick={() => setShowInviteModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            
            {loadingFriends ? (
              <div style={{ padding: 24, textAlign: "center" }}><Loader2 className="mly-spinner" size={24} color="var(--neon)" /></div>
            ) : friends.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No friends found. Add some friends first!</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                {friends.map(f => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="lb-avatar">{f.username[0]?.toUpperCase()}</div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{f.username}</span>
                    </div>
                    {invitedMap[f.id] ? (
                      <div style={{ color: "var(--neon)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <Check size={14} /> Sent
                      </div>
                    ) : (
                      <button 
                        onClick={() => sendInvite(f.id, f.username)}
                        style={{ background: "var(--neon)", color: "#000", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Invite
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
