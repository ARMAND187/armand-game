"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  TrackToggle,
  DisconnectButton,
  ParticipantLoop,
  ParticipantName,
  useParticipants,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface VoicePartyProps {
  room: string;
  username: string;
  onLeave: () => void;
}

export default function VoiceParty({ room, username, onLeave }: VoicePartyProps) {
  const [token, setToken] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`
        );
        const data = await resp.json();
        if (data.token) {
          setToken(data.token);
        } else {
          console.error("Failed to fetch token", data);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [room, username]);

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
      style={{ height: "auto", minHeight: "200px", display: "flex", flexDirection: "column", gap: "16px" }}
      onDisconnected={onLeave}
    >
      <PartyLoungeInner />
    </LiveKitRoom>
  );
}

function PartyLoungeInner() {
  const participants = useParticipants();
  return (
    <>
      <RoomAudioRenderer />
      
      {/* Participants List */}
      <div className="bg-zinc-900/50 rounded-xl p-4 flex-1">
        <h4 className="text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider">In the Lounge</h4>
        <div className="flex flex-wrap gap-4">
          <ParticipantLoop participants={participants}>
            <ParticipantTile />
          </ParticipantLoop>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-4 flex items-center justify-center gap-4 shadow-xl">
        <div className="lk-button-group">
          <TrackToggle source={Track.Source.Microphone} />
          <DisconnectButton>Leave Party</DisconnectButton>
        </div>
      </div>
    </>
  );
}

function ParticipantTile() {
  const participants = useParticipants();
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/50 bg-zinc-800 flex items-center justify-center">
        <ParticipantName className="text-[0px] w-full h-full" /> {/* Hide default text if possible, but keep component logic */}
        <div className="w-full h-full" style={{ position: "relative" }}>
           <AvatarRenderer />
        </div>
      </div>
      <ParticipantName className="text-xs font-bold text-zinc-300" />
    </div>
  );
}

import { useParticipantContext } from "@livekit/components-react";

function AvatarRenderer() {
  const p = useParticipantContext();
  const seed = p.identity || "guest";
  return (
    <img 
      src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${seed}`} 
      alt="Avatar"
      className="w-full h-full object-cover"
    />
  );
}
