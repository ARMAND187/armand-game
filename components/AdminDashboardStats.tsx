"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Users, Activity } from "lucide-react";

export default function AdminDashboardStats({ totalRegistered }: { totalRegistered: number }) {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    // AuthProvider already creates and subscribes to global-lobby.
    // We just need to find it and listen to its presence state.
    let channel = supabase.getChannels().find(c => c.topic === "realtime:global-lobby");
    let isMounted = true;

    if (!channel) {
      // Fallback just in case AuthProvider hasn't initialized it yet
      channel = supabase.channel("global-lobby");
      channel.subscribe();
    }

    const updateCount = () => {
      if (!isMounted) return;
      const newState = channel.presenceState();
      setOnlineCount(Object.keys(newState).length);
    };

    channel.on("presence", { event: "sync" }, updateCount);

    // Initial count in case it's already synced
    updateCount();

    return () => {
      isMounted = false;
      // DO NOT remove the channel, AuthProvider needs it!
      // Supabase JS doesn't have a simple way to remove just one "on" listener 
      // without unsubscribing the whole channel, so we just use isMounted.
    };
  }, [supabase]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Total Registered Card */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="text-zinc-400 font-bold text-sm uppercase tracking-wider mb-2">Total Users</h3>
          <p className="text-4xl font-extrabold text-white">{totalRegistered}</p>
        </div>
        <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
          <Users size={32} color="#a855f7" />
        </div>
      </div>

      {/* Live Players Card */}
      <div className="bg-zinc-900 border border-green-500/30 p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
        {/* Pulse effect in background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10">
          <h3 className="text-zinc-400 font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            Live Players <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </h3>
          <p className="text-4xl font-extrabold text-green-400">{onlineCount}</p>
        </div>
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center relative z-10">
          <Activity size={32} color="#4ade80" />
        </div>
      </div>
    </div>
  );
}
