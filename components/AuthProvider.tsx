"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import { usePresenceStore } from "@/store/usePresenceStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthProvider() {
  const router = useRouter();
  const supabase = createClient();
  const setOnlineCount = usePresenceStore((state) => state.setOnlineCount);

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
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
    
    const initPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || `anon-${Math.random().toString(36).substr(2, 9)}`;

      presenceChannel = supabase.channel('global-lobby', {
        config: {
          presence: { key: userId },
        },
      });

      presenceChannel
        .on("presence", { event: "sync" }, () => {
          const state = presenceChannel!.presenceState();
          setOnlineCount(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel!.track({
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    initPresence();

    return () => {
      subscription.unsubscribe();
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [router, supabase]);

  return null;
}
