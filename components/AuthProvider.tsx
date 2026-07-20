"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import { usePresenceStore } from "@/store/usePresenceStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const setOnlineCount = usePresenceStore((state) => state.setOnlineCount);
  const setActiveUsers = usePresenceStore((state) => state.setActiveUsers);
  
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // 1. Listen for auth changes to trigger redirect
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        router.push("/");
        router.refresh();
      }
      
      if (session?.user) {
        // Fetch verification status whenever auth state changes and a user exists
        supabase
          .from("profiles")
          .select("is_verified")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            useAuthStore.getState().setIsVerified(data?.is_verified ?? false);
          });
      } else {
        useAuthStore.getState().setIsVerified(false);
      }
    });

    // Fetch initial verification state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from("profiles")
          .select("is_verified")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            useAuthStore.getState().setIsVerified(data?.is_verified ?? false);
          });
      } else {
        useAuthStore.getState().setIsVerified(false);
      }
    });

    // 2. Track global presence
    const initPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || `anon-${Math.random().toString(36).substr(2, 9)}`;

      const channel = supabase.channel('global-lobby', {
        config: {
          presence: { key: userId },
        },
      });
      presenceChannelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          
          // Map state to ActiveUsers array
          const users = Object.keys(state).map((key) => {
            const presences = state[key] as any[];
            const firstPresence = presences[0] || {};
            return {
              userId: key,
              status: firstPresence.status || 'online'
            };
          });
          
          setOnlineCount(users.length);
          setActiveUsers(users as any);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              online_at: new Date().toISOString(),
              status: window.location.pathname.startsWith('/play') ? 'in-game' : 'online',
            });
          }
        });
    };

    initPresence();

    return () => {
      subscription.unsubscribe();
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [router, supabase]);

  // Update presence when pathname changes
  useEffect(() => {
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        online_at: new Date().toISOString(),
        status: pathname.startsWith('/play') ? 'in-game' : 'online',
      });
    }
  }, [pathname]);

  return null;
}
