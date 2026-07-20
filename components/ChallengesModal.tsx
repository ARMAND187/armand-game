"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Target, Flame, CheckCircle, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  wins: number;
  currentTitle: string | null;
  onTitleEquipped: (title: string) => void;
  userId?: string;
}

export default function ChallengesModal({
  isOpen,
  onClose,
  wins,
  currentTitle,
  onTitleEquipped,
  userId,
}: ChallengesModalProps) {
  const [equipping, setEquipping] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isRisingStarCompleted = wins >= 5;

  const handleEquipTitle = async (title: string) => {
    if (!userId) return;
    setEquipping(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ equipped_title: title }).eq("id", userId);
    onTitleEquipped(title);
    setEquipping(false);
  };

  return createPortal(
    <div className="modal-backdrop z-50">
      <div className="modal-sheet relative" style={{ maxWidth: 500, padding: 24 }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={24} />
        </button>

        <h2 className="modal-title flex items-center gap-2 mb-6" style={{ fontSize: 24 }}>
          <Target color="var(--neon)" size={28} /> Challenges & Streaks
        </h2>

        {/* Daily Streaks Placeholder */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <div className="flex items-center gap-2 mb-2">
            <Flame color="#ef4444" size={20} />
            <span style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>Daily Streak</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
            1 <span style={{ fontSize: 16, color: "var(--text-muted)" }}>Day</span>
          </div>
          <p style={{ margin: 0, marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>Play a match tomorrow to keep your streak alive!</p>
        </div>

        {/* Challenges List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 4 }}>
            Active Challenges
          </div>

          {/* Challenge 1: Rising Star */}
          <div style={{
            background: isRisingStarCompleted ? "rgba(74, 222, 128, 0.1)" : "rgba(255,255,255,0.03)",
            border: isRisingStarCompleted ? "1px solid rgba(74, 222, 128, 0.3)" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 16
          }}>
            <div style={{ flexShrink: 0 }}>
              {isRisingStarCompleted ? (
                <CheckCircle color="#4ade80" size={32} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lock size={16} color="var(--text-muted)" />
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: isRisingStarCompleted ? "#4ade80" : "#fff", marginBottom: 2 }}>Rising Star</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                Win your first 5 matches.
              </p>
              <div style={{ marginTop: 8, height: 6, background: "rgba(0,0,0,0.5)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (wins / 5) * 100)}%`, background: isRisingStarCompleted ? "#4ade80" : "var(--neon)", transition: "width 0.3s" }} />
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                {Math.min(wins, 5)} / 5 Wins
              </div>
            </div>

            {isRisingStarCompleted && (
              <div style={{ flexShrink: 0 }}>
                {currentTitle === "Rising Star" ? (
                  <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>
                    Equipped
                  </div>
                ) : (
                  <button
                    onClick={() => handleEquipTitle("Rising Star")}
                    disabled={equipping}
                    style={{
                      padding: "8px 16px", borderRadius: 8, background: "#4ade80", border: "none",
                      color: "#000", fontSize: 12, fontWeight: 800, cursor: equipping ? "not-allowed" : "pointer"
                    }}
                  >
                    {equipping ? "Equipping..." : "Equip Title"}
                  </button>
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>,
    document.body
  );
}
