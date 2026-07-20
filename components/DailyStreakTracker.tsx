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
    <div className="w-full relative flex flex-col">
      <div className="pt-6 pb-8 px-2 sm:px-10">
        <div className="flex items-center gap-2 mb-6 relative z-10">
        <Flame color={currentStreak > 0 ? "#ef4444" : "var(--text-muted)"} fill={currentStreak > 0 ? "#ef4444" : "none"} size={20} />
        <h3 className="font-bold text-[13px] tracking-[0.1em] uppercase text-zinc-300" style={{ textShadow: "none" }}>Daily Rewards</h3>
      </div>

      <div className="flex justify-between items-center relative z-10 px-1 sm:px-0">
        {/* Connection line behind the circles */}
        <div className="absolute left-2 right-2 sm:left-6 sm:right-6 h-1 top-1/2 -translate-y-1/2 bg-white/5 -z-10 rounded-full" />
        <div 
          className="absolute left-2 sm:left-6 h-1 top-1/2 -translate-y-1/2 bg-red-500 -z-10 rounded-full transition-all duration-1000" 
          style={{ width: `calc(${(Math.min(currentStreak, 7) / 7) * 100}% - 16px)` }} // Adjust line width approx
        />

        {days.map((d, i) => {
          const isClaimed = currentStreak > i || (currentStreak === i + 1 && alreadyClaimedToday);
          const isNext = currentStreak === i && !alreadyClaimedToday;
          
          return (
            <div key={d.day} className="flex flex-col items-center relative z-10">
              <div 
                className="transition-all duration-300 flex items-center justify-center mb-1"
                style={{
                  filter: isNext ? "drop-shadow(0 0 8px rgba(74, 222, 128, 0.6))" : (isClaimed ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))" : "none")
                }}
              >
                <Flame 
                  color={isClaimed ? "#ef4444" : (isNext ? "#4ade80" : "#3f3f46")} 
                  fill={isClaimed ? "#ef4444" : (isNext ? "#4ade80" : "none")} 
                  size={28} 
                  strokeWidth={1.5}
                  className={isNext ? "animate-pulse" : ""}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: isClaimed ? "#ef4444" : (isNext ? "#4ade80" : "#52525b") }}>+{d.reward}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">Day {d.day}</span>
            </div>
          );
        })}
        </div>
      </div>

      <div className="w-full border-t border-white/5">
        {!alreadyClaimedToday ? (
          <button 
            onClick={handleClaim}
            disabled={claiming}
            className="w-full py-4 flex items-center justify-center font-bold text-[15px] tracking-wide transition-all duration-300 hover:brightness-125"
            style={{ 
              background: "linear-gradient(90deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.1))", 
              boxShadow: "inset 0 0 20px rgba(74, 222, 128, 0.1)",
              color: "#4ade80", 
              border: "none",
              cursor: claiming ? "wait" : "pointer",
              textTransform: "uppercase"
            }}
          >
            {claiming ? "Processing..." : "Claim Daily Reward"}
          </button>
        ) : (
          <div className="w-full py-4 flex items-center justify-center bg-black/20">
            <span className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Come back tomorrow for Day {Math.min(currentStreak + 1, 7)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
