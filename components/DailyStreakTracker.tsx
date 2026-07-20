"use client";

import React, { useState } from "react";
import { Flame, CheckCircle2, CircleDashed } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface DailyStreakTrackerProps {
  currentStreak: number;
  lastClaimDate: string | null;
}

export default function DailyStreakTracker({ currentStreak, lastClaimDate }: DailyStreakTrackerProps) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  
  // Calculate if today is already claimed
  const now = new Date();
  let alreadyClaimedToday = false;
  if (lastClaimDate) {
    const claimDate = new Date(lastClaimDate);
    if (claimDate.getUTCFullYear() === now.getUTCFullYear() &&
        claimDate.getUTCMonth() === now.getUTCMonth() &&
        claimDate.getUTCDate() === now.getUTCDate()) {
      alreadyClaimedToday = true;
    }
  }

  const handleClaim = async () => {
    if (claiming || alreadyClaimedToday) return;
    setClaiming(true);
    
    const supabase = createClient();
    const { data, error } = await supabase.rpc("claim_daily_streak");
    
    if (error || !data?.success) {
      alert(error?.message || data?.error || "Failed to claim reward.");
      setClaiming(false);
    } else {
      alert(`Claimed ${data.reward} Coins! You are on a ${data.new_streak}-day streak!`);
      // Refresh the page to update header coins and local state
      window.location.reload();
    }
  };

  const days = [
    { day: 1, reward: 50 },
    { day: 2, reward: 100 },
    { day: 3, reward: 150 },
    { day: 4, reward: 200 },
    { day: 5, reward: 300 },
    { day: 6, reward: 400 },
    { day: 7, reward: 500 },
  ];

  return (
    <div className="w-full relative py-6 px-4 sm:px-8">
      <div className="flex items-center gap-2 mb-6 relative z-10 pl-2">
        <Flame color={currentStreak > 0 ? "#ef4444" : "var(--text-muted)"} fill={currentStreak > 0 ? "#ef4444" : "none"} size={20} />
        <h3 className="font-bold text-[13px] tracking-[0.1em] uppercase text-zinc-300" style={{ textShadow: "none" }}>Daily Rewards</h3>
      </div>

      <div className="flex justify-between items-center relative z-10 px-2 sm:px-4">
        {/* Connection line behind the circles */}
        <div className="absolute left-8 right-8 h-1 top-1/2 -translate-y-1/2 bg-white/5 -z-10 rounded-full" />
        <div 
          className="absolute left-8 h-1 top-1/2 -translate-y-1/2 bg-red-500 -z-10 rounded-full transition-all duration-1000" 
          style={{ width: `calc(${(Math.min(currentStreak, 7) / 7) * 100}% - 64px)` }}
        />

        {days.map((d, i) => {
          const isClaimed = currentStreak > i || (currentStreak === i + 1 && alreadyClaimedToday);
          const isNext = currentStreak === i && !alreadyClaimedToday;
          
          return (
            <div key={d.day} className="flex flex-col items-center gap-2 relative">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ 
                  background: isClaimed ? "rgba(239, 68, 68, 0.2)" : (isNext ? "rgba(74, 222, 128, 0.2)" : "rgba(0,0,0,0.5)"),
                  border: isClaimed ? "2px solid #ef4444" : (isNext ? "2px solid #4ade80" : "2px solid #27272a"),
                  boxShadow: isNext ? "0 0 12px rgba(74, 222, 128, 0.4)" : (isClaimed ? "0 0 12px rgba(239, 68, 68, 0.4)" : "none"),
                  zIndex: 10
                }}
              >
                {isClaimed ? (
                  <CheckCircle2 color="#ef4444" size={20} />
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 800, color: isNext ? "#4ade80" : "#52525b" }}>+{d.reward}</span>
                )}
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase mt-2">Day {d.day}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-8 relative z-10">
        {!alreadyClaimedToday ? (
          <button 
            onClick={handleClaim}
            disabled={claiming}
            className="w-full sm:w-auto hover:brightness-125 transition-all duration-300"
            style={{ 
              background: "linear-gradient(90deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05))", 
              color: "#4ade80", 
              border: "1px solid rgba(74, 222, 128, 0.4)",
              boxShadow: "inset 0 0 12px rgba(74, 222, 128, 0.1)",
              padding: "12px 32px", 
              borderRadius: "100px", 
              fontSize: "14px", 
              fontWeight: 800, 
              cursor: claiming ? "wait" : "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}
          >
            {claiming ? "Processing..." : "Claim Daily Reward"}
          </button>
        ) : (
          <div className="py-3 px-6 rounded-full border border-zinc-800 bg-zinc-900/50">
            <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Come back tomorrow for Day {Math.min(currentStreak + 1, 7)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
