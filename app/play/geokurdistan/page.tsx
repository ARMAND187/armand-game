"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, MapPin, Trophy, Loader2 } from "lucide-react";
import PlayerNameFlair from "@/components/PlayerNameFlair";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
// Removed static kurdistanLocations, fetching dynamically now
import { calculateHaversineDistance } from "@/utils/haversine";
import { updateLobbyRP } from "@/app/actions/elo";

const StreetViewPlayer = dynamic(() => import("@/components/StreetViewPlayer"), {
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
  equippedFlair?: string | null;
}

type GameState = "WAITING" | "PLAYING" | "REVEALING" | "ROUND_END" | "GAME_OVER";

function calculateScore(distanceKm: number): number {
  if (distanceKm <= 0.6) return 100;
  if (distanceKm > 160) return 0;
  // Linear decay: 100 * (1 - distance / 160)
  // 10km = 94 pts
  // 50km = 69 pts
  // 100km = 38 pts
  // 138km = 14 pts
  return Math.max(0, Math.round(100 * (1 - distanceKm / 160)));
}

function gradeDistance(km: number) {
  if (km < 5)   return { emoji: "🎯", label: "Incredible! Under 5 km!", color: "#4ade80" };
  if (km < 20)  return { emoji: "🔥", label: "Excellent! Very close.",   color: "#a78bfa" };
  if (km < 50)  return { emoji: "👍", label: "Great guess!",             color: "#60a5fa" };
  if (km < 100) return { emoji: "🗺️", label: "Not bad.",                 color: "#fbbf24" };
  return             { emoji: "😅", label: "Far off!",                  color: "#f87171" };
}

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateDeterministicIndices(seedStr: string, count: number, maxVal: number) {
    let seed = 0;
    for(let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
    const indices: number[] = [];
    while(indices.length < count) {
        seed++;
        const val = Math.floor(seededRandom(seed) * maxVal);
        if(!indices.includes(val) && val < maxVal) indices.push(val);
    }
    return indices;
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
  
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    async function fetchLocs() {
      const { data } = await supabase.from('locations').select('*');
      if (data && data.length > 0) {
        setAllLocations(data);
      }
      setLoadingLocations(false);
    }
    fetchLocs();
  }, [supabase]);

  // Filter locations by region
  const availableLocations = React.useMemo(() => {
    if (!allLocations.length) return [];
    let filtered = allLocations.filter(loc => loc.source_type === 'custom' || !!loc.image_id);
    if (regionQuery === "Erbil Only") filtered = filtered.filter(loc => loc.city === "Erbil");
    if (regionQuery === "Sulaymaniyah Only") filtered = filtered.filter(loc => loc.city === "Sulaymaniyah" || loc.city === "Slemani");
    return filtered.length > 0 ? filtered : allLocations;
  }, [regionQuery, allLocations]);
  const [locationIndices, setLocationIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  const [timer, setTimer] = useState(30);
  
  const [myUsername, setMyUsername] = useState("Player");
  const [equippedPinUrl, setEquippedPinUrl] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [totalScores, setTotalScores] = useState<Record<string, number>>({});
  const [playerFlairs, setPlayerFlairs] = useState<Record<string, string | null>>({});
  const [equippedFlair, setEquippedFlair] = useState<string | null>(null);
  
  const [guessMarker, setGuessMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [roundGuesses, setRoundGuesses] = useState<MultiplayerGuess[]>([]);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [forfeitWin, setForfeitWin] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

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
    const location = availableLocations[locationIndices[round - 1]] || availableLocations[0];
    
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
      equippedFlair,
    };

    if (channelRef.current && roomId) {
      channelRef.current.send({
        type: "broadcast",
        event: "PLAYER_GUESS",
        payload: myGuess
      });
    }

    setRoundGuesses(prev => {
      const guess = myGuess;
      if (prev.find(g => g.username === guess.username)) return prev;
      return [...prev, guess];
    });
    setPlayerFlairs(prev => ({ ...prev, [myUsername]: equippedFlair }));
  }, [locationIndices, round, myUsername, roomId, equippedFlair]);

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
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        if (data.user.user_metadata?.username) {
          setMyUsername(data.user.user_metadata.username);
        }
        
        // Fetch equipped pin url
        const { data: profile } = await supabase
          .from("profiles")
          .select("equipped_pin_url, equipped_flair")
          .eq("id", data.user.id)
          .single();
        if (profile?.equipped_pin_url) {
          setEquippedPinUrl(profile.equipped_pin_url);
        }
        if (profile?.equipped_flair) {
          setEquippedFlair(profile.equipped_flair);
          setPlayerFlairs(prev => ({ ...prev, [data.user.user_metadata?.username || "Player"]: profile.equipped_flair }));
        }
      }
    });
  }, [supabase]);

  // Initialise Multiplayer Connection
  useEffect(() => {
    if (availableLocations.length === 0) return;

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
      if (!room || room.status === "expired") {
        window.location.href = "/";
        return;
      }
      
      const isPublicRoom = room.is_public;
      setIsPublic(isPublicRoom);
      setTotalRounds(room.total_rounds || 5);
      const isRoomHost = room.host_username === realUsername;
      setIsHost(isRoomHost);

      const channel = supabase.channel(`game:${roomId}`, {
        config: { presence: { key: realUsername } }
      });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const activePlayers = Object.keys(state);
          setPlayers(activePlayers);
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          const state = channel.presenceState();
          const activePlayers = Object.keys(state);
          
          if (activePlayers[0] === realUsername) {
            supabase.rpc("handle_player_leave", { p_room_id: roomId, p_username: key }).then(({ data }) => {
              if (data?.new_host && data.new_host === realUsername) setIsHost(true);
            });
          }

          // Win Condition A: Forfeit Win
          if (activePlayers.length <= 1) {
             setGameState(prev => {
               if (prev !== "GAME_OVER" && prev !== "WAITING") {
                 setForfeitWin(true);
                 return "GAME_OVER";
               }
               return prev;
             });
          }
        })
        .on("broadcast", { event: "GAME_START" }, (payload) => {
          if (isPublicRoom) return; // Public uses deterministic logic
          setLocationIndices(payload.payload.indices);
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
          const guess = payload.payload as MultiplayerGuess;
          setRoundGuesses((prev) => {
            const exists = prev.find(g => g.username === guess.username);
            if (exists) return prev;
            return [...prev, guess];
          });
          setPlayerFlairs(prev => ({ ...prev, [guess.username]: guess.equippedFlair || null }));
        })
        .on("broadcast", { event: "NEXT_ROUND" }, (payload) => {
          if (isPublicRoom) return; // Public transitions locally
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
          if (isRoomHost && !isPublicRoom) {
            channel.send({
              type: "broadcast",
              event: "SYNC_STATE",
              payload: stateRef.current
            });
          }
        })
        .on("broadcast", { event: "SYNC_STATE" }, (payload) => {
          if (!isRoomHost && !isPublicRoom) {
            const state = payload.payload;
            setLocationIndices(state.locationIndices);
            setRound(state.round);
            setTimer(state.timer);
            setGameState(state.gameState);
            setRoundGuesses(state.roundGuesses);
            setTotalScores(state.totalScores);
          }
        })
        .on("broadcast", { event: "GAME_OVER" }, (payload) => {
          if (isPublicRoom) return;
          const state = payload.payload;
          if (state && state.totalScores) {
             setTotalScores(state.totalScores);
          }
          setGameState("GAME_OVER");
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ online_at: new Date().toISOString() });
            
            if (isPublicRoom) {
               // Deterministic start
               const indices = generateDeterministicIndices(roomId, room.total_rounds || 5, availableLocations.length);
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
               if (isRoomHost) {
                 setTimeout(async () => {
                   const shuffled = [...availableLocations].map((_, i) => i).sort(() => Math.random() - 0.5);
                   const indices = shuffled.slice(0, room.total_rounds || 5);
                   channel.send({
                     type: "broadcast",
                     event: "GAME_START",
                     payload: { indices, players: [] }, // Players tracked via presence
                   });
                   setLocationIndices(indices);
                   setGameState("PLAYING");
                   setTimer(30);
                 }, 2000);
               } else {
                 setTimeout(() => {
                   channel.send({ type: "broadcast", event: "REQUEST_SYNC" });
                 }, 500);
               }
            }
          }
        });
    };

    initRoom();
    
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [roomId, myUsername, supabase, availableLocations.length]);

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
        setGameState("REVEALING");
        setTimeout(() => {
          setGameState("ROUND_END");
          updateTotalScores();
        }, 2000);
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
      
      const shouldDistributeRP = (!roomId) || (channelRef.current && isHost);
      
      if (channelRef.current && isHost) {
        channelRef.current.send({ type: "broadcast", event: "GAME_OVER", payload: stateRef.current });
      }
      
      // Distribute RP if there are scores
      if (shouldDistributeRP && stateRef.current.totalScores && Object.keys(stateRef.current.totalScores).length > 0) {
        updateLobbyRP(stateRef.current.totalScores, totalRounds).catch(console.error);
      }
      
      // Update wins
      if ((isHost || isPublic) && roomId) {
        let maxScore = -1;
        let winner = "";
        Object.entries(totalScores).forEach(([user, score]) => {
          if (score > maxScore) {
            maxScore = score;
            winner = user;
          }
        });
        
        if (winner) {
          fetch("/api/game/winner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ winnerUsername: winner })
          }).catch(console.error);
        }
      }
    } else {
      const nextRoundNum = round + 1;
      if (channelRef.current && roomId && !isPublic) {
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
  }, [round, totalRounds, isHost, isPublic, totalScores, roomId, myUsername]);

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
      if (!roomId || isHost || isPublic) {
        t2 = setTimeout(() => {
          handleNextRound();
        }, 8000);
      }
      return () => {
        clearTimeout(t1);
        if (t2) clearTimeout(t2);
      };
    }
  }, [gameState, isHost, isPublic, handleNextRound, roomId]);

  if (loadingLocations) {
    return (
      <div className="page-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Loader2 className="mly-spinner" size={48} color="var(--neon)" />
      </div>
    );
  }

  if (gameState === "WAITING" && (!isHost && !roomId)) {
      return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0d0d1a] text-white flex-col gap-4">
        <Loader2 className="animate-spin" size={48} color="var(--neon)" />
        <h2 className="text-xl font-bold">Waiting for host to start the game...</h2>
      </div>
    );
  }

  const location = availableLocations[locationIndices[round - 1]] || availableLocations[0];
  const myCurrentGuess = roundGuesses.find(g => g.username === myUsername);
  
  return (
    <>
      <div className="geo-page relative">
        {gameState === "REVEALING" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ animationDuration: '300ms' }}>
            <div className="bg-zinc-900 border border-purple-500/50 text-white px-8 py-6 rounded-2xl flex flex-col items-center shadow-2xl">
              <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
              <span className="font-extrabold text-xl mb-1">All players ready!</span>
              <span className="text-sm text-zinc-400 font-medium">Revealing results...</span>
            </div>
          </div>
        )}
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
          <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center" }}>
            <PlayerNameFlair username={myUsername} flair={equippedFlair} />
            <span style={{ color: "var(--neon)", marginLeft: 6 }}>{totalScores[myUsername] || 0} pts</span>
          </div>
        </div>

        <div className="geo-split">
          <div className="geo-streetview">
            {location && (
              <StreetViewPlayer 
                lat={location.lat} 
                lng={location.lng} 
                locationName={location.name}
                sourceType={location.source_type}
                imageId={location.image_id}
                imageUrl={location.image_url}
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
              roundGuesses={roundGuesses}
              myUsername={myUsername}
              locked={hasGuessed || gameState !== "PLAYING"}
              customPinUrl={equippedPinUrl}
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
                      <div style={{ fontWeight: 700, display: "flex", alignItems: "center", color: g.username === myUsername ? "var(--neon)" : "var(--text-primary)" }}>
                        <PlayerNameFlair username={g.username} flair={playerFlairs[g.username]} />
                      </div>
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
            <h2 className="modal-title" style={{ fontSize: 32, marginBottom: 8 }}>
              {forfeitWin ? "You win! All other players have left." : "Game Over!"}
            </h2>
            <div style={{ marginBottom: 32, color: "var(--text-muted)", fontWeight: 700 }}>Final Standings</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {Object.entries(totalScores)
                .sort((a,b) => b[1] - a[1])
                .map(([username, score], i) => (
                  <div key={username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: i === 0 ? "rgba(251,191,36,0.1)" : "var(--bg-elevated)", padding: 16, borderRadius: 12, border: i === 0 ? "1px solid rgba(251,191,36,0.3)" : "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--text-muted)" }}>#{i+1}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", color: username === myUsername ? "var(--neon)" : "var(--text-primary)" }}>
                        <PlayerNameFlair username={username} flair={playerFlairs[username]} />
                      </div>
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
