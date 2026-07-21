"use client";

import React, { useState, useEffect } from "react";
import { Flame, CheckCircle2, CircleDashed } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { claimDailyStreak } from "@/app/actions/streak";

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
    
    // Check if streak was artificially reset recently
    if (currentStreak >= 7) {
        // Safe guard
    }
    
    const data = await claimDailyStreak();
    
    if (!data?.success) {
      alert(data?.error || "Failed to claim reward.");
      setClaiming(false);
    } else {
      const isCoin = !isNaN(Number(data.reward)) && data.reward !== "0";
      alert(`Claimed ${data.reward}${isCoin ? ' Coins' : ''}! You are on a ${data.new_streak}-day streak!`);
      // Refresh the page to update header coins and local state
      window.location.reload();
    }
  };

  const [streakItems, setStreakItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchStreakItems = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("streak_items").select("*").order("required_streak", { ascending: true });
      if (data) setStreakItems(data);
    };
    fetchStreakItems();
  }, []);

  const days = [1, 2, 3, 4, 5, 6, 7].map(day => {
    const item = streakItems.find(i => i.required_streak === day);
    if (!item) return { day, type: "empty", reward: "?" };
    
    if (item.balance > 0) return { day, type: "coins", reward: item.balance };
    return { day, type: "title", reward: item.name };
  });

  return (
    <div className="w-full relative flex flex-col">
      <div className="pt-6 pb-8 px-2 sm:px-10">
        <div className="flex items-center gap-2 mb-6 relative z-10">
        <Flame color={currentStreak > 0 ? "#ef4444" : "var(--text-muted)"} fill={currentStreak > 0 ? "#ef4444" : "none"} size={20} />
        <h3 className="font-bold text-[13px] tracking-[0.1em] uppercase text-zinc-300" style={{ textShadow: "none" }}>Daily Rewards</h3>
      </div>

      <div className="flex justify-between items-start relative z-10 px-4 sm:px-2">
        {/* Connection line behind the circles */}
        <div className="absolute left-2 right-2 sm:left-6 sm:right-6 h-1 -translate-y-1/2 bg-white/5 -z-10 rounded-full" style={{ top: 14 }} />
        <div 
          className="absolute left-2 sm:left-6 h-1 -translate-y-1/2 bg-red-500 -z-10 rounded-full transition-all duration-1000" 
          style={{ width: `calc(${(Math.min(currentStreak, 7) / 7) * 100}% - 16px)`, top: 14 }} // Adjust line width approx
        />

        {days.map((d, i) => {
          const isClaimed = currentStreak > i || (currentStreak === i + 1 && alreadyClaimedToday);
          const isNext = currentStreak === i && !alreadyClaimedToday;
          
          return (
            <div key={d.day} className="flex flex-col items-center relative z-10 w-10 sm:w-16">
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
              <div className="flex flex-col items-center justify-start h-8 sm:h-6 pt-1">
                {d.type === "coins" ? (
                  <span className="text-[10px] sm:text-[11px] font-extrabold" style={{ color: isClaimed ? "#ef4444" : (isNext ? "#4ade80" : "#52525b") }}>+{d.reward}</span>
                ) : d.type === "title" ? (
                  <span className="text-[7.5px] sm:text-[8px] font-extrabold text-center leading-[1.1] break-words w-full" style={{ color: isClaimed ? "#ef4444" : (isNext ? "#4ade80" : "#52525b"), textTransform: "uppercase" }}>{d.reward}</span>
                ) : (
                  <span className="text-[11px] sm:text-[12px] font-extrabold" style={{ color: "#52525b" }}>?</span>
                )}
              </div>
              <span className="text-[8.5px] sm:text-[9px] font-bold text-zinc-500 uppercase mt-0.5">Day {d.day}</span>
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
