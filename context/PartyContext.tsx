"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

export interface PartyInvite {
  id: string;
  sender_id: string;
  party_code: string;
  sender_username: string;
  sender_avatarUrl: string | null;
}

interface PartyContextValue {
  activeParty: string | null;
  myUserId: string | null;
  myUsername: string | null;
  pendingInvites: PartyInvite[];
  joinParty: (roomCode: string) => void;
  leaveParty: () => void;
  dismissInvite: (id: string) => void;
  sendInvite: (receiverId: string) => Promise<void>;
}

const PartyContext = createContext<PartyContextValue>({
  activeParty: null,
  myUserId: null,
  myUsername: null,
  pendingInvites: [],
  joinParty: () => {},
  leaveParty: () => {},
  dismissInvite: () => {},
  sendInvite: async () => {},
});

export function usePartyContext() {
  return useContext(PartyContext);
}

export function PartyProvider({ children }: { children: ReactNode }) {
  const [activeParty, setActiveParty] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PartyInvite[]>([]);
  const supabase = createClient();
  const userIdRef = useRef<string | null>(null);

  // Load user info and restore saved party on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyUserId(user.id);
      userIdRef.current = user.id;

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

  // Global real-time invite listener — works on ALL pages
  useEffect(() => {
    if (!myUserId) return;

    const channel = supabase
      .channel(`global_party_invites_${myUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "party_invites",
          filter: `receiver_id=eq.${myUserId}`,
        },
        async (payload) => {
          const inv = payload.new as { id: string; sender_id: string; party_code: string };
          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", inv.sender_id)
            .single();

          setPendingInvites(prev => [
            ...prev,
            {
              id: inv.id,
              sender_id: inv.sender_id,
              party_code: inv.party_code,
              sender_username: senderProfile?.username || "Someone",
              sender_avatarUrl: senderProfile?.avatar_url || null,
            },
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myUserId]);

  const joinParty = useCallback((roomCode: string) => {
    setActiveParty(roomCode);
    try {
      localStorage.setItem("party_session", JSON.stringify({ room: roomCode, time: Date.now() }));
    } catch {}
    // Update DB
    if (userIdRef.current) {
      const sb = createClient();
      sb.from("profiles").update({ current_party: roomCode }).eq("id", userIdRef.current).then(() => {});
    }
  }, []);

  const leaveParty = useCallback(() => {
    setActiveParty(null);
    try { localStorage.removeItem("party_session"); } catch {}
    if (userIdRef.current) {
      const sb = createClient();
      sb.from("profiles").update({ current_party: null }).eq("id", userIdRef.current).then(() => {});
    }
  }, []);

  const dismissInvite = useCallback((id: string) => {
    setPendingInvites(prev => prev.filter(i => i.id !== id));
  }, []);

  const sendInvite = useCallback(async (receiverId: string) => {
    if (!userIdRef.current || !activeParty) return;
    await supabase.from("party_invites").insert({
      sender_id: userIdRef.current,
      receiver_id: receiverId,
      party_code: activeParty,
    });
  }, [activeParty]);

  return (
    <PartyContext.Provider value={{ activeParty, myUserId, myUsername, pendingInvites, joinParty, leaveParty, dismissInvite, sendInvite }}>
      {children}
    </PartyContext.Provider>
  );
}
