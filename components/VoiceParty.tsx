"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  TrackToggle,
  DisconnectButton,
  useParticipants,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";
import { Loader2, MicOff, Copy } from "lucide-react";

interface VoicePartyProps {
  room: string;
  username: string;
  onLeave: () => void;
}

export default function VoiceParty({ room, username, onLeave }: VoicePartyProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`
        );
        if (!resp.ok) {
          throw new Error(`Server returned ${resp.status}`);
        }
        const data = await resp.json();
        if (data.token) {
          setToken(data.token);
        } else {
          console.error("Failed to fetch token", data);
          setError("Failed to fetch token from server.");
        }
      } catch (e) {
        console.error("LiveKit fetch error:", e);
        setError("Failed to connect to voice server. Please check your API keys and restart the server.");
      }
    })();
  }, [room, username]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-400 text-center border border-red-500/20 bg-red-500/10 rounded-xl">
        <p className="font-bold">{error}</p>
        <button onClick={onLeave} className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm">
          Go Back
        </button>
      </div>
    );
  }

  if (token === "") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-zinc-400">
        <Loader2 className="animate-spin mb-2" />
        <p>Connecting to Party Lounge...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "auto", minHeight: "200px", display: "flex", flexDirection: "column" }}
      onDisconnected={onLeave}
    >
      <PartyLoungeInner roomCode={room} />
    </LiveKitRoom>
  );
}

function PartyLoungeInner({ roomCode }: { roomCode: string }) {
  const participants = useParticipants();
  
  return (
    <>
      <RoomAudioRenderer />
      
      <div className="flex flex-col p-6 md:p-8 gap-4 w-full min-h-[250px]">
        {/* Header Text */}
        <div className="flex flex-col gap-2">
          <div className="text-sm text-purple-300 font-semibold bg-purple-500/10 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-purple-500/20 w-fit">
            <span>Room Code: {roomCode}</span>
            <button onClick={() => navigator.clipboard.writeText(roomCode)} className="text-purple-400 hover:text-white p-1 transition-colors">
              <Copy size={14} />
            </button>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">In The Lounge</p>
        </div>

        {/* Participants List */}
        <div className="flex flex-wrap items-center justify-center gap-8 w-full py-8">
          {participants.map(p => (
            <div key={p.identity} className="flex flex-col items-center gap-2">
              <div className="relative group">
                <img 
                  src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${p.identity}`} 
                  alt={p.identity} 
                  className={`w-12 h-12 rounded-full border border-zinc-700 bg-zinc-900 transition-all object-cover ${p.isSpeaking ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : ''}`} 
                />
                {p.isMicrophoneEnabled === false && (
                  <div className="absolute -top-1 -right-1 bg-red-600 border border-zinc-900 rounded-full p-1 text-white shadow-md">
                    <MicOff className="w-3 h-3"/>
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-zinc-300">{p.identity}</span>
            </div>
          ))}
        </div>

        {/* Control Panel */}
        <div className="flex justify-center gap-4 mt-auto pt-4 w-full">
          <div className="lk-button-group bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-4 flex items-center justify-center gap-4 shadow-xl">
            <TrackToggle source={Track.Source.Microphone} />
            <DisconnectButton>Leave Party</DisconnectButton>
          </div>
        </div>
      </div>
    </>
  );
}
