"use client";

import React, { useState } from "react";
import { Target } from "lucide-react";
import ChallengesModal from "./ChallengesModal";

interface ChallengesButtonProps {
  wins: number;
  currentTitle: string | null;
  userId?: string;
  challenges?: { risingStar: number, sniper: number, highRoller: number, speedrunner: number };
}

export default function ChallengesButton({ wins, currentTitle, userId, challenges }: ChallengesButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equippedTitle, setEquippedTitle] = useState(currentTitle);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-4 flex items-center justify-center gap-3 font-bold text-[15px] tracking-wide transition-all duration-300 hover:brightness-125"
        style={{
          background: "linear-gradient(90deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15))",
          boxShadow: "inset 0 0 20px rgba(168, 85, 247, 0.1)",
          color: "var(--text-primary)",
        }}
      >
        <Target size={20} className="text-zinc-400" />
        <span>Challenges & Streaks</span>
      </button>

      <ChallengesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wins={wins}
        currentTitle={equippedTitle}
        userId={userId}
        challenges={challenges || { risingStar: 0, sniper: 0, highRoller: 0, speedrunner: 0 }}
        onTitleEquipped={(title) => {
          setEquippedTitle(title);
          // To reflect globally immediately without refresh, we might need router.refresh() 
          // or just rely on the next navigation since it's a server component reload on Home.
          window.location.reload(); 
        }}
      />
    </>
  );
}
