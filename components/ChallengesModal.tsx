"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Target, Flame, CheckCircle, Crosshair, Star, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChallengesModal({ isOpen, onClose }: ChallengesModalProps) {
  const [mounted, setMounted] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch active challenges
    const { data: activeChallenges } = await supabase
      .from("dynamic_challenges")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    // Fetch user progress
    const { data: progress } = await supabase
      .from("user_challenge_progress")
      .select("*")
      .eq("user_id", user.id);

    const progMap = new Map();
    if (progress) {
      progress.forEach(p => progMap.set(p.challenge_id, p));
    }

    if (activeChallenges) {
      const merged = activeChallenges.map(c => {
        const p = progMap.get(c.id);
        return {
          ...c,
          progress: p ? p.progress : 0,
          completed: p ? p.completed : false
        };
      });
      setChallenges(merged);
    }
    setLoading(false);
  };

  if (!isOpen || !mounted) return null;

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
          Complete these challenges to unlock exclusive titles and rewards.
        </p>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Loader2 className="mly-spinner" color="var(--neon)" />
          </div>
        ) : challenges.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            No active challenges found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {challenges.map(c => {
              const isCompleted = c.completed;
              const progressRatio = Math.min(100, (c.progress / c.target_value) * 100);

              // Basic colors based on name or generic
              let color = "var(--neon)";
              let Icon = Star;
              if (c.name.includes("Sniper")) { color = "#f87171"; Icon = Crosshair; }
              else if (c.name.includes("Speed")) { color = "#f97316"; Icon = Flame; }
              else if (c.name.includes("High Roller") || c.name.includes("Geographer")) { color = "#a855f7"; Icon = Target; }
              else if (c.name.includes("Star")) { color = "#facc15"; Icon = Star; }

              return (
                <div key={c.id} style={{
                  background: isCompleted ? "rgba(74, 222, 128, 0.05)" : "rgba(255,255,255,0.03)",
                  border: isCompleted ? "1px solid rgba(74, 222, 128, 0.2)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 20
                }}>
                  <div style={{ flexShrink: 0 }}>
                    {isCompleted ? (
                      <CheckCircle color="#4ade80" size={40} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={24} color={color} />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: isCompleted ? "#4ade80" : "#fff" }}>{c.name}</h3>
                      {c.reward_name && (
                         <span style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", color: "#fff", padding: "2px 6px", borderRadius: 4, fontWeight: 800, textTransform: "uppercase" }}>Reward: {c.reward_name}</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {c.description}
                    </p>
                    <div style={{ marginTop: 12, height: 8, background: "rgba(0,0,0,0.5)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progressRatio}%`, background: isCompleted ? "#4ade80" : color, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                      <span>Progress</span>
                      <span>{c.progress} / {c.target_value}</span>
                    </div>
                  </div>

                  {isCompleted && (
                    <div style={{ flexShrink: 0, paddingLeft: 16 }}>
                      <div style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "var(--neon)", fontSize: 13, fontWeight: 800 }}>
                        In Locker
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
