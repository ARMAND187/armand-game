"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Users, Globe, Loader2 } from "lucide-react";

type MatchState = "idle" | "searching" | "waiting" | "friends";

interface Props {
  gameId: string;
  playRoute: string;
}

export default function MatchmakingClient({ gameId, playRoute }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [matchState, setMatchState] = useState<MatchState>("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [myUsername, setMyUsername] = useState<string>("Player");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

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
              channel.send({ type: "broadcast", event: "ROOM_READY", payload: {} });
              router.push(`${playRoute}?roomId=${roomId}`);
            }, 1000);
          }
          return newPlayers;
        });
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
        setPlayers([room.host_username, myUsername]);
        setRoomId(room.id);
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
            total_rounds: 5
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

  const [totalRounds, setTotalRounds] = useState<number>(5);

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

  const joinPrivateGame = async () => {
    if (!roomCodeInput.trim()) return;
    setMatchState("searching");
    
    try {
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_code", roomCodeInput.trim().toUpperCase())
        .eq("status", "waiting")
        .lt("player_count", 4)
        .limit(1);

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

      setPlayers([room.host_username, myUsername]);
      setRoomId(room.id);
      setMatchState("waiting");
    } catch(err) {
      console.error("Private room join error:", err);
      setMatchState("idle");
      alert("Failed to join private room.");
    }
  };

  if (matchState === "idle") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn-lobby-play btn-lobby-play--full" onClick={joinPublicGame}>
          <Globe size={18} />
          Join Public Game
        </button>
        <button
          className="btn-redeem-ghost"
          style={{ width: "100%", justifyContent: "center", fontSize: "14px", padding: "14px", borderRadius: "14px", margin: 0 }}
          onClick={() => setMatchState("friends")}
        >
          <Users size={18} />
          Play With Friends
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
            style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textTransform: "uppercase" }}
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
          />
          <button className="btn-lobby-play" style={{ borderRadius: 10, padding: "10px 20px" }} onClick={joinPrivateGame}>
            Join
          </button>
        </div>
        <div className="divider" style={{ margin: "16px 0" }} />
        <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Create Private Room</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[5, 10, 25].map(r => (
            <button
              key={r}
              onClick={() => setTotalRounds(r)}
              style={{
                flex: 1,
                padding: "8px 0",
                background: totalRounds === r ? "var(--neon)" : "var(--bg-elevated)",
                color: totalRounds === r ? "#000" : "var(--text-muted)",
                border: `1px solid ${totalRounds === r ? "var(--neon)" : "var(--border)"}`,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {r} Rounds
            </button>
          ))}
        </div>
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

          <button 
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, marginTop: isHost && players.length >= 2 ? 12 : 24, cursor: "pointer" }}
            onClick={() => setMatchState("idle")}
          >
            Cancel Matchmaking
          </button>
        </>
      )}
    </div>
  );
}
