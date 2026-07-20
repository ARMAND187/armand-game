"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Target, Flame, CheckCircle, Lock, Crosshair, Star } from "lucide-react";
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

  // We are visually tracking these based on generic metrics for now.
  // In the future, this will be tied directly to game score history.
  // "wins" can proxy for games played > 370 points for now.
  const risingStarProgress = Math.min(wins, 5);
  const isRisingStarCompleted = risingStarProgress >= 5;

  // Let's pretend they have 3 bullseyes for the Sniper challenge as a placeholder
  const sniperProgress = 3;
  const isSniperCompleted = sniperProgress >= 10;

  const handleEquipTitle = async (title: string) => {
    if (!userId) return;
    setEquipping(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ equipped_title: title }).eq("id", userId);
    onTitleEquipped(title);
    setEquipping(false);
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#09090b",
        overflowY: "auto",
        paddingBottom: "100px",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(9, 9, 11, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Target size={24} color="var(--neon)" />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Challenges</h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)", border: "none",
            width: 36, height: 36, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Complete these challenges to unlock exclusive titles and rewards. More challenges will unlock as you progress!
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Challenge 1: Rising Star */}
          <div style={{
            background: isRisingStarCompleted ? "rgba(74, 222, 128, 0.05)" : "rgba(255,255,255,0.03)",
            border: isRisingStarCompleted ? "1px solid rgba(74, 222, 128, 0.2)" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 20
          }}>
            <div style={{ flexShrink: 0 }}>
              {isRisingStarCompleted ? (
                <CheckCircle color="#4ade80" size={40} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Star size={24} color="#facc15" />
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: isRisingStarCompleted ? "#4ade80" : "#fff", marginBottom: 4 }}>Rising Star</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Get more than 370 points in a 5-round match, 5 different times.
              </p>
              <div style={{ marginTop: 12, height: 8, background: "rgba(0,0,0,0.5)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (risingStarProgress / 5) * 100)}%`, background: isRisingStarCompleted ? "#4ade80" : "var(--neon)", transition: "width 0.3s" }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                <span>Progress</span>
                <span>{risingStarProgress} / 5</span>
              </div>
            </div>

            {isRisingStarCompleted && (
              <div style={{ flexShrink: 0, paddingLeft: 16 }}>
                {currentTitle === "Rising Star" ? (
                  <div style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", fontSize: 13, fontWeight: 800 }}>
                    Equipped
                  </div>
                ) : (
                  <button
                    onClick={() => handleEquipTitle("Rising Star")}
                    disabled={equipping}
                    style={{
                      padding: "10px 20px", borderRadius: 10, background: "#4ade80", border: "none",
                      color: "#000", fontSize: 13, fontWeight: 800, cursor: equipping ? "wait" : "pointer"
                    }}
                  >
                    {equipping ? "Equipping..." : "Equip Title"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Challenge 2: Sniper */}
          <div style={{
            background: isSniperCompleted ? "rgba(74, 222, 128, 0.05)" : "rgba(255,255,255,0.03)",
            border: isSniperCompleted ? "1px solid rgba(74, 222, 128, 0.2)" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 20
          }}>
            <div style={{ flexShrink: 0 }}>
              {isSniperCompleted ? (
                <CheckCircle color="#4ade80" size={40} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Crosshair size={24} color="#f87171" />
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: isSniperCompleted ? "#4ade80" : "#fff" }}>Sniper</h3>
                <span style={{ fontSize: 10, background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "2px 6px", borderRadius: 4, fontWeight: 800, textTransform: "uppercase" }}>New</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Drop your pin within exactly 5km of the target location 10 times.
              </p>
              <div style={{ marginTop: 12, height: 8, background: "rgba(0,0,0,0.5)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (sniperProgress / 10) * 100)}%`, background: isSniperCompleted ? "#4ade80" : "#f87171", transition: "width 0.3s" }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                <span>Progress</span>
                <span>{sniperProgress} / 10</span>
              </div>
            </div>

            {isSniperCompleted && (
              <div style={{ flexShrink: 0, paddingLeft: 16 }}>
                {currentTitle === "Sniper" ? (
                  <div style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", fontSize: 13, fontWeight: 800 }}>
                    Equipped
                  </div>
                ) : (
                  <button
                    onClick={() => handleEquipTitle("Sniper")}
                    disabled={equipping}
                    style={{
                      padding: "10px 20px", borderRadius: 10, background: "#4ade80", border: "none",
                      color: "#000", fontSize: 13, fontWeight: 800, cursor: equipping ? "wait" : "pointer"
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
