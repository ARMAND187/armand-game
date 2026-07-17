"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, MapPin, Trophy, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { kurdistanLocations, KurdistanLocation } from "@/data/locations";
import { calculateHaversineDistance } from "@/utils/haversine";

const MapillaryViewer = dynamic(() => import("@/components/MapillaryViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0a0a14] text-[#a1a1aa] text-[13px] gap-2">
      <div className="mly-spinner" /> Initialising viewer…
    </div>
  ),
});

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0d0d1a] text-[#a1a1aa] text-[13px]">
      Loading map…
    </div>
  ),
});

export interface MultiplayerGuess {
  username: string;
  guessLat: number;
  guessLng: number;
  distanceKm: number;
  score: number;
}

type GameState = "WAITING" | "PLAYING" | "ROUND_END" | "GAME_OVER";

function calculateScore(distanceKm: number): number {
  if (distanceKm < 1) return 100;
  if (distanceKm > 500) return 0;
  // Exponential decay: 100 * e^(-k * distance)
  const k = 0.01;
  return Math.max(0, Math.round(100 * Math.exp(-k * distanceKm)));
}

function gradeDistance(km: number) {
  if (km < 5)   return { emoji: "🎯", label: "Incredible! Under 5 km!", color: "#4ade80" };
  if (km < 20)  return { emoji: "🔥", label: "Excellent! Very close.",   color: "#a78bfa" };
  if (km < 50)  return { emoji: "👍", label: "Great guess!",             color: "#60a5fa" };
  if (km < 100) return { emoji: "🗺️", label: "Not bad.",                 color: "#fbbf24" };
  return             { emoji: "😅", label: "Far off!",                  color: "#f87171" };
}

import { Suspense } from "react";

function GeoKurdistanInner() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const supabase = createClient();

  const [gameState, setGameState] = useState<GameState>("WAITING");
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(() => parseInt(searchParams.get("rounds") || "5", 10));
  const regionQuery = searchParams.get("region") || "All Kurdistan";
  
  // Filter locations by region
  const availableLocations = React.useMemo(() => {
    if (regionQuery === "Erbil Only") return kurdistanLocations.filter(loc => loc.city === "Erbil");
    if (regionQuery === "Sulaymaniyah Only") return kurdistanLocations.filter(loc => loc.city === "Sulaymaniyah" || loc.city === "Slemani");
    return kurdistanLocations;
  }, [regionQuery]);
  const [locationIndices, setLocationIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  const [timer, setTimer] = useState(30);
  
  const [myUsername, setMyUsername] = useState("Player");
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [totalScores, setTotalScores] = useState<Record<string, number>>({});
  
  const [guessMarker, setGuessMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [roundGuesses, setRoundGuesses] = useState<MultiplayerGuess[]>([]);
  const [showScoreboard, setShowScoreboard] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Keep a ref of the latest state for the host to sync to late joiners
  const stateRef = useRef({ locationIndices, players, round, timer, gameState, roundGuesses, totalScores });
  useEffect(() => {
    stateRef.current = { locationIndices, players, round, timer, gameState, roundGuesses, totalScores };
  }, [locationIndices, players, round, timer, gameState, roundGuesses, totalScores]);

  const updateTotalScores = useCallback(() => {
    setTotalScores(prev => {
      const newScores = { ...prev };
      roundGuesses.forEach(g => {
        newScores[g.username] = (newScores[g.username] || 0) + g.score;
      });
      return newScores;
    });
  }, [roundGuesses]);

  const submitGuess = useCallback((marker: { lat: number; lng: number } | null) => {
    setHasGuessed(true);
    const location = kurdistanLocations[locationIndices[round - 1]] || kurdistanLocations[0];
    
    let distanceKm = 99999;
    let score = 0;

    if (marker) {
      distanceKm = calculateHaversineDistance(marker.lat, marker.lng, location.lat, location.lng);
      score = calculateScore(distanceKm);
    }

    const myGuess: MultiplayerGuess = {
      username: myUsername,
      guessLat: marker?.lat || 0,
      guessLng: marker?.lng || 0,
      distanceKm,
      score,
    };

    if (channelRef.current && roomId) {
      channelRef.current.send({
        type: "broadcast",
        event: "PLAYER_GUESS",
        payload: myGuess
      });
    }

    setRoundGuesses(prev => {
      if (prev.find(g => g.username === myUsername)) return prev;
      return [...prev, myGuess];
    });
  }, [locationIndices, round, myUsername, roomId]);

  const handleTimeUp = useCallback(() => {
    if (!hasGuessed) {
      submitGuess(null);
    }
    // We defer the state update to avoid cascading renders warning
    setTimeout(() => {
      setGameState("ROUND_END");
      updateTotalScores();
    }, 0);
  }, [hasGuessed, submitGuess, updateTotalScores]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.username) {
        setMyUsername(data.user.user_metadata.username);
      }
    });
  }, [supabase]);

  // Initialise Multiplayer Connection
  useEffect(() => {
    if (!roomId) {
      // Single player fallback if no room ID provided
      setTimeout(() => {
        const shuffled = [...availableLocations].map((_, i) => i).sort(() => Math.random() - 0.5);
        const indices = shuffled.slice(0, totalRounds);
        setLocationIndices(indices);
        setGameState("PLAYING");
      }, 0);
      return;
    }

    const initRoom = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const realUsername = userData.user?.user_metadata?.username || "Player";
      setMyUsername(realUsername);

      const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
      if (!room) return;
      
      setTotalRounds(room.total_rounds || 5);
      const isRoomHost = room.host_username === realUsername;
      setIsHost(isRoomHost);

      const channel = supabase.channel(`game:${roomId}`);
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "GAME_START" }, (payload) => {
          setLocationIndices(payload.payload.indices);
          setPlayers(payload.payload.players);
          setGameState("PLAYING");
          setTimer(30);
          setRound(1);
          setRoundGuesses([]);
          setTotalScores({});
          setHasGuessed(false);
          setGuessMarker(null);
          setShowScoreboard(false);
        })
        .on("broadcast", { event: "PLAYER_GUESS" }, (payload) => {
          setRoundGuesses((prev) => {
            const exists = prev.find(g => g.username === payload.payload.username);
            if (exists) return prev;
            return [...prev, payload.payload as MultiplayerGuess];
          });
        })
        .on("broadcast", { event: "NEXT_ROUND" }, (payload) => {
          if (payload.payload && payload.payload.round) {
            setRound(payload.payload.round);
          } else {
            setRound((r) => r + 1); // fallback
          }
          setGameState("PLAYING");
          setTimer(30);
          setRoundGuesses([]);
          setHasGuessed(false);
          setGuessMarker(null);
          setShowScoreboard(false);
        })
        .on("broadcast", { event: "REQUEST_SYNC" }, () => {
          if (isRoomHost) {
            channel.send({
              type: "broadcast",
              event: "SYNC_STATE",
              payload: stateRef.current
            });
          }
        })
        .on("broadcast", { event: "SYNC_STATE" }, (payload) => {
          if (!isRoomHost) {
            const state = payload.payload;
            setLocationIndices(state.locationIndices);
            setPlayers(state.players);
            setRound(state.round);
            setTimer(state.timer);
            setGameState(state.gameState);
            setRoundGuesses(state.roundGuesses);
            setTotalScores(state.totalScores);
          }
        })
        .on("broadcast", { event: "GAME_OVER" }, (payload) => {
          const state = payload.payload;
          if (state && state.totalScores) {
             setTotalScores(state.totalScores);
          }
          setGameState("GAME_OVER");
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            if (isRoomHost) {
            // Wait a sec for others to subscribe before sending game start
            setTimeout(async () => {
              // Generate random locations
              const shuffled = [...availableLocations].map((_, i) => i).sort(() => Math.random() - 0.5);
              const indices = shuffled.slice(0, room.total_rounds || 5);
              // Fetch players from room
              const { data: updatedRoom } = await supabase.from("rooms").select("player_count").eq("id", roomId).single();
              const pCount = updatedRoom?.player_count || 1;
              channel.send({
                type: "broadcast",
                event: "GAME_START",
                payload: { indices, players: Array.from({length: pCount}, (_, i) => `Player${i+1}`) }, 
              });
              
              setLocationIndices(indices);
              setPlayers(Array.from({length: pCount}, (_, i) => `Player${i+1}`));
              setGameState("PLAYING");
              setTimer(30);
            }, 2000);
            } else {
              // I am a guest, request current state from host
              setTimeout(() => {
                channel.send({ type: "broadcast", event: "REQUEST_SYNC" });
              }, 500);
            }
          }
        });
    };

    initRoom();
    
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [roomId, myUsername, supabase]);

  // Timer logic
  useEffect(() => {
    if (gameState !== "PLAYING") return;
    
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, handleTimeUp]);

  // End round if everyone guessed
  useEffect(() => {
    if (gameState === "PLAYING" && roundGuesses.length > 0) {
      if (!roomId || (players.length > 0 && roundGuesses.length >= players.length)) {
        setTimeout(() => {
          setGameState("ROUND_END");
          updateTotalScores();
        }, 0);
      }
    }
  }, [roundGuesses, players, gameState, updateTotalScores, roomId]);

  const handleGuessBtn = () => {
    if (!guessMarker || hasGuessed) return;
    submitGuess(guessMarker);
  };

  const handleNextRound = useCallback(async () => {
    if (round >= totalRounds) {
      setGameState("GAME_OVER");
      if (channelRef.current && roomId) {
        channelRef.current.send({ type: "broadcast", event: "GAME_OVER", payload: stateRef.current });
      }
      
      // Update wins if I am the host, I will calculate the winner
      if (isHost && roomId) {
        let maxScore = -1;
        let winner = "";
        Object.entries(totalScores).forEach(([user, score]) => {
          if (score > maxScore) {
            maxScore = score;
            winner = user;
          }
        });
        
        if (winner) {
          // Fire and forget updating the wins
          fetch("/api/game/winner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ winnerUsername: winner })
          }).catch(console.error);
        }
      }
    } else {
      const nextRoundNum = round + 1;
      if (channelRef.current && roomId) {
        channelRef.current.send({ type: "broadcast", event: "NEXT_ROUND", payload: { round: nextRoundNum } });
      }
      setRound(nextRoundNum);
      setGameState("PLAYING");
      setTimer(30);
      setRoundGuesses([]);
      setHasGuessed(false);
      setGuessMarker(null);
      setShowScoreboard(false);
    }
  }, [round, totalRounds, isHost, totalScores, roomId, myUsername]);

  const handlePlayAgain = () => {
    if (!roomId) {
      const shuffled = [...availableLocations].map((_, i) => i).sort(() => Math.random() - 0.5);
      const indices = shuffled.slice(0, totalRounds);
      setLocationIndices(indices);
      setGameState("PLAYING");
      setTimer(30);
      setRound(1);
      setRoundGuesses([]);
      setTotalScores({});
      setHasGuessed(false);
      setGuessMarker(null);
      setShowScoreboard(false);
    } else {
      if (isHost && channelRef.current) {
        const shuffled = [...availableLocations].map((_, i) => i).sort(() => Math.random() - 0.5);
        const indices = shuffled.slice(0, totalRounds);
        channelRef.current.send({
           type: "broadcast",
           event: "GAME_START",
           payload: { indices, players }
        });
        setLocationIndices(indices);
        setGameState("PLAYING");
        setTimer(30);
        setRound(1);
        setRoundGuesses([]);
        setTotalScores({});
        setHasGuessed(false);
        setGuessMarker(null);
        setShowScoreboard(false);
      }
    }
  };

  useEffect(() => {
    if (gameState === "ROUND_END") {
      const t1 = setTimeout(() => setShowScoreboard(true), 3000);
      let t2: NodeJS.Timeout;
      if (!roomId || isHost) {
        t2 = setTimeout(() => {
          handleNextRound();
        }, 8000);
      }
      return () => {
        clearTimeout(t1);
        if (t2) clearTimeout(t2);
      };
    }
  }, [gameState, isHost, handleNextRound, roomId]);

  if (gameState === "WAITING") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0d0d1a] text-white flex-col gap-4">
        <Loader2 className="animate-spin" size={48} color="var(--neon)" />
        <h2 className="text-xl font-bold">Waiting for host to start the game...</h2>
      </div>
    );
  }

  const location = availableLocations[locationIndices[round - 1]] || availableLocations[0] || kurdistanLocations[0];
  const myCurrentGuess = roundGuesses.find(g => g.username === myUsername);
  
  return (
    <>
      <div className="geo-page">
        <div className="geo-top-bar">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", textDecoration: "none" }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{ textAlign: "center" }}>
            <div className="geo-round-badge">Round {round} / {totalRounds}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: timer <= 10 ? "#ef4444" : "var(--neon)", fontVariantNumeric: "tabular-nums" }}>
              {timer}s
            </div>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>
            {myUsername} <span style={{ color: "var(--neon)", marginLeft: 4 }}>{totalScores[myUsername] || 0} pts</span>
          </div>
        </div>

        <div className="geo-split">
          <div className="geo-streetview">
            {location && (
              <MapillaryViewer 
                lat={location.lat} 
                lng={location.lng} 
                locationName={location.name}
                imageId={location.imageId}
                onSkip={() => handleTimeUp()} 
              />
            )}
          </div>

          <div className="geo-map-panel flex-1 min-h-0 relative flex flex-col h-full w-full overflow-hidden">
            <LeafletMap
              onMapClick={(lat, lng) => { if (!hasGuessed && gameState === "PLAYING") setGuessMarker({lat, lng})}}
              guessMarker={guessMarker}
              realLocation={gameState === "ROUND_END" ? { lat: location.lat, lng: location.lng } : null}
              guessResult={myCurrentGuess ? { location, guessLat: myCurrentGuess.guessLat, guessLng: myCurrentGuess.guessLng, distanceKm: myCurrentGuess.distanceKm } : null}
              locked={hasGuessed || gameState !== "PLAYING"}
            />

            {gameState === "PLAYING" && (
              <button
                className="guess-btn"
                onClick={handleGuessBtn}
                disabled={!guessMarker || hasGuessed}
                style={{ opacity: hasGuessed ? 0.5 : 1 }}
              >
                <MapPin size={18} />
                {hasGuessed ? "Waiting for others..." : (guessMarker ? "Guess Location" : "Tap Map to Pin")}
              </button>
            )}
          </div>
        </div>
      </div>

      {gameState === "ROUND_END" && showScoreboard && (
        <div className="modal-backdrop">
          <div className="modal-sheet" style={{ maxWidth: 500 }}>
            <h2 className="modal-title" style={{ marginBottom: 16 }}>Round {round} Results</h2>
            <p className="modal-location" style={{ marginBottom: 24 }}>
              {location.name}, {location.city}
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {roundGuesses.sort((a,b) => b.score - a.score).map((g, i) => {
                const grade = gradeDistance(g.distanceKm);
                return (
                  <div key={g.username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: g.username === myUsername ? "rgba(167,139,250,0.1)" : "var(--bg-elevated)", padding: 12, borderRadius: 12, border: g.username === myUsername ? "1px solid rgba(167,139,250,0.3)" : "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? "#fbbf24" : "var(--text-muted)" }}>#{i+1}</div>
                      <div style={{ fontWeight: 700, color: g.username === myUsername ? "var(--neon)" : "var(--text-primary)" }}>{g.username}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ fontSize: 12, color: grade.color }}>{g.distanceKm > 9000 ? "Time's up" : `${g.distanceKm.toFixed(1)} km`}</div>
                      <div style={{ fontWeight: 800, color: "#fff", background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: 8 }}>+{g.score}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, fontWeight: 700, padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
              {round >= totalRounds ? "Calculating final standings..." : "Starting next round in 5 seconds..."}
            </div>
          </div>
        </div>
      )}

      {gameState === "GAME_OVER" && (
        <div className="modal-backdrop">
          <div className="modal-sheet" style={{ maxWidth: 500, padding: 32 }}>
            <Trophy size={48} color="#fbbf24" style={{ margin: "0 auto 16px" }} />
            <h2 className="modal-title" style={{ fontSize: 32, marginBottom: 8 }}>Game Over!</h2>
            <div style={{ marginBottom: 32, color: "var(--text-muted)", fontWeight: 700 }}>Final Standings</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {Object.entries(totalScores)
                .sort((a,b) => b[1] - a[1])
                .map(([username, score], i) => (
                  <div key={username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: i === 0 ? "rgba(251,191,36,0.1)" : "var(--bg-elevated)", padding: 16, borderRadius: 12, border: i === 0 ? "1px solid rgba(251,191,36,0.3)" : "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--text-muted)" }}>#{i+1}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: username === myUsername ? "var(--neon)" : "var(--text-primary)" }}>{username}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{score} <span style={{ fontSize: 14, color: "var(--text-muted)" }}>pts</span></div>
                  </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {(!roomId || isHost) && (
                <button onClick={handlePlayAgain} className="btn-lobby-play" style={{ border: "none", cursor: "pointer", background: "var(--neon)", color: "#000" }}>
                  Play Again
                </button>
              )}
              {roomId && !isHost && (
                <div style={{ padding: "12px 24px", color: "var(--text-muted)", fontSize: 14, fontWeight: 600 }}>
                  Waiting for host to restart...
                </div>
              )}
              <Link href="/" className="btn-lobby-play" style={{ display: "flex", justifyContent: "center", textDecoration: "none", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                Return to Lobby
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function GeoKurdistanPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#0d0d1a] text-white flex-col gap-4">
        <Loader2 className="animate-spin" size={48} color="var(--neon)" />
        <h2 className="text-xl font-bold">Loading game...</h2>
      </div>
    }>
      <GeoKurdistanInner />
    </Suspense>
  );
}
