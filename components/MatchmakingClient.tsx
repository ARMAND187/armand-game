"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Users, Globe, Loader2, Play, UserPlus, X, Check } from "lucide-react";

type MatchState = "idle" | "searching" | "waiting" | "friends";

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
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [region, setRegion] = useState<string>("All Kurdistan");
  const [hasAutoJoined, setHasAutoJoined] = useState(false);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<{id: string, username: string}[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});

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
    });
  }, [supabase]);

  useEffect(() => {
    if (!roomId || matchState !== "waiting") return;

    // Connect to a channel specific to this room ID
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on("broadcast", { event: "PLAYER_JOINED" }, (payload) => {
        setPlayers((prev) => {
          if (prev.includes(payload.payload.username)) return prev;
          const newPlayers = [...prev, payload.payload.username];
          if (newPlayers.length === 4) {
            // Trigger ready if we are exactly 4
            setTimeout(() => {
              if (isHost) channel.send({ type: "broadcast", event: "ROOM_READY", payload: {} });
              router.push(`${playRoute}?roomId=${roomId}`);
            }, 1000);
          }
          
          // If we are the host, broadcast the updated full player list so the new joiner sees everyone
          if (isHost) {
            setTimeout(() => {
              channel.send({ type: "broadcast", event: "SYNC_PLAYERS", payload: { players: newPlayers } });
            }, 500);
          }
          
          return newPlayers;
        });
      })
      .on("broadcast", { event: "SYNC_PLAYERS" }, (payload) => {
        if (!isHost) {
          setPlayers(payload.payload.players);
        }
      })
      .on("broadcast", { event: "PLAYER_LEFT" }, (payload) => {
        setPlayers((prev) => prev.filter((p) => p !== payload.payload.username));
      })
      .on("broadcast", { event: "ROOM_READY" }, () => {
        router.push(`${playRoute}?roomId=${roomId}`);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Announce ourselves to everyone else in the room
          await channel.send({
            type: "broadcast",
            event: "PLAYER_JOINED",
            payload: { username: myUsername },
          });
        }
      });

    return () => {
      // Announce we are leaving when component unmounts
      channel.send({
        type: "broadcast",
        event: "PLAYER_LEFT",
        payload: { username: myUsername },
      }).then(() => {
        supabase.removeChannel(channel);
      });
    };
  }, [roomId, matchState, myUsername, playRoute, router]);

  const joinPublicGame = async () => {
    setMatchState("searching");

    try {
      // 1. Look for an available public room
      const { data: rooms, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("status", "waiting")
        .eq("is_public", true)
        .eq("game_id", gameId)
        .neq("host_username", myUsername) // Prevent joining your own abandoned room
        .lt("player_count", 4)
        .order("created_at", { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;

      if (rooms && rooms.length > 0) {
        // Found a room! Join it.
        const room = rooms[0];
        await supabase
          .from("rooms")
          .update({ player_count: room.player_count + 1 })
          .eq("id", room.id);

        // When joining, we only know about ourselves + the host initially. 
        // Real-time broadcasts will sync the rest if they re-announce.
        // Or if there are 3 players, the others will broadcast PLAYER_JOINED when we subscribe.
        // Actually, without Presence, Broadcast is best-effort. Let's start with just host + me, 
        // or just me if the host broadcasts back when someone joins.
        // For strict robustness, Supabase Presence is better, but we stick to Broadcasts.
        setPlayers(Array.from(new Set([room.host_username, myUsername])));
        setRoomId(room.id);
        setIsHost(false);
        setMatchState("waiting");
      } else {
        // No room found. Create a new one.
        const { data: newRoom, error: insertError } = await supabase
          .from("rooms")
          .insert({
            game_id: gameId,
            status: "waiting",
            is_public: true,
            player_count: 1,
            host_username: myUsername,
            total_rounds: 10
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setPlayers([myUsername]);
        setRoomId(newRoom.id);
        setIsHost(true);
        setMatchState("waiting");
      }
    } catch (err) {
      console.error("Matchmaking error:", err);
      setMatchState("idle");
      alert("Failed to connect to matchmaking. Make sure the 'rooms' table exists in Supabase, and total_rounds is added.");
    }
  };

  const createPrivateGame = async () => {
    setMatchState("searching");
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const { data: newRoom, error: insertError } = await supabase
        .from("rooms")
        .insert({
          game_id: gameId,
          status: "waiting",
          is_public: false,
          player_count: 1,
          host_username: myUsername,
          room_code: shortCode,
          total_rounds: totalRounds
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setPlayers([myUsername]);
      setRoomId(newRoom.id);
      setDisplayCode(shortCode);
      setIsHost(true);
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
      let query = supabase.from("rooms").select("*").eq("status", "waiting").lt("player_count", 4).limit(1);
      
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
      await supabase
        .from("rooms")
        .update({ player_count: room.player_count + 1 })
        .eq("id", room.id);

      setPlayers(Array.from(new Set([room.host_username, myUsername])));
      setRoomId(room.id);
      setIsHost(room.host_username === myUsername);
      setMatchState("waiting");
    } catch(err) {
      console.error("Private room join error:", err);
      setMatchState("idle");
      alert("Failed to join private room.");
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
          <Link href={`${playRoute}?rounds=${totalRounds}&region=${encodeURIComponent(region)}`} className="btn-lobby-play" style={{ flex: 1, justifyContent: "center", padding: "12px 0" }}>
            <Play size={16} fill="currentColor" /> Offline
          </Link>
        <button className="btn-lobby-play" style={{ flex: 1, justifyContent: "center", padding: "12px 0", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }} onClick={joinPublicGame}>
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

        <div className="settings-card" style={{ marginBottom: 24 }}>
          <div className="settings-row">
            <span className="settings-row-label">Rounds</span>
            <div className="settings-row-options">
              {[5, 10, 25].map(r => (
                <button
                  key={r}
                  onClick={() => setTotalRounds(r)}
                  className={`settings-option-btn${totalRounds === r ? " active" : ""}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
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
            style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textTransform: "uppercase" }}
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
          />
          <button className="btn-lobby-play" style={{ borderRadius: 10, padding: "10px 20px" }} onClick={() => joinPrivateGame()}>
            Join
          </button>
        </div>
        <div className="divider" style={{ margin: "16px 0" }} />
        <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Create Private Room</div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Uses current Rounds and Region settings</p>
        <button className="btn-redeem-ghost" style={{ width: "100%", justifyContent: "center", margin: 0 }} onClick={createPrivateGame}>
            Create Private Room
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
            Waiting for players... ({players.length}/4)
            {displayCode && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, userSelect: "all" }}>Room Code: <span style={{ color: "#fff", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, letterSpacing: 1, fontSize: 16 }}>{displayCode}</span></div>}
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[0, 1, 2, 3].map((slotIndex) => {
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
                      <div className="lb-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{player[0]}</div>
                      {player}
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
              onClick={() => {
                const channel = supabase.channel(`room:${roomId}`);
                channel.send({ type: "broadcast", event: "ROOM_READY", payload: {} });
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
