"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

interface PartyContextValue {
  activeParty: string | null;
  myUsername: string | null;
  joinParty: (roomCode: string) => void;
  leaveParty: () => void;
}

const PartyContext = createContext<PartyContextValue>({
  activeParty: null,
  myUsername: null,
  joinParty: () => {},
  leaveParty: () => {},
});

export function usePartyContext() {
  return useContext(PartyContext);
}

export function PartyProvider({ children }: { children: ReactNode }) {
  const [activeParty, setActiveParty] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const supabase = createClient();

  // Load username and restore saved party on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (profile?.username) {
        setMyUsername(profile.username);
        // Restore saved party session
        try {
          const saved = localStorage.getItem("party_session");
          if (saved) {
            const { room, time } = JSON.parse(saved);
            // Only restore if within 4 hours
            if (room && Date.now() - time < 4 * 60 * 60 * 1000) {
              setActiveParty(room);
            } else {
              localStorage.removeItem("party_session");
            }
          }
        } catch {}
      }
    })();
  }, []);

  const joinParty = useCallback((roomCode: string) => {
    setActiveParty(roomCode);
    try {
      localStorage.setItem("party_session", JSON.stringify({ room: roomCode, time: Date.now() }));
    } catch {}
  }, []);

  const leaveParty = useCallback(() => {
    setActiveParty(null);
    try {
      localStorage.removeItem("party_session");
    } catch {}
  }, []);

  return (
    <PartyContext.Provider value={{ activeParty, myUsername, joinParty, leaveParty }}>
      {children}
    </PartyContext.Provider>
  );
}
