"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Loader2 } from "lucide-react";
import { FullScreenOverlay } from "@/components/FullScreenOverlay";

interface DynamicChallenge {
  id: string;
  name: string;
  description: string;
  target_value: number;
  reward_id: string;
  reward_name: string;
  rule_type: string;
  conditions: any;
  is_active: boolean;
}

export function AdminChallengePanel({ onClose }: { onClose: () => void }) {
  const [challenges, setChallenges] = useState<DynamicChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DynamicChallenge>>({});
  const supabase = createClient();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("dynamic_challenges").select("*").order("created_at", { ascending: false });
    if (data) setChallenges(data);
    if (error) console.error(error);
    setLoading(false);
  };

  const handleCreate = async () => {
    const { error } = await supabase.from("dynamic_challenges").insert([{
      name: "New Challenge",
      description: "Describe the challenge...",
      target_value: 1,
      reward_id: "chal_new",
      reward_name: "Cool Reward",
      rule_type: "per_round",
      conditions: { metric: "distance", operator: "<=", value: 10 },
      is_active: false
    }]);
    
    if (error) alert("Failed to create: " + error.message);
    else fetchChallenges();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this challenge permanently?")) return;
    const { error } = await supabase.from("dynamic_challenges").delete().eq("id", id);
    if (error) alert("Failed to delete: " + error.message);
    else fetchChallenges();
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from("dynamic_challenges")
      .update({
        name: editForm.name,
        description: editForm.description,
        target_value: editForm.target_value,
        reward_id: editForm.reward_id,
        reward_name: editForm.reward_name,
        rule_type: editForm.rule_type,
        conditions: editForm.conditions,
        is_active: editForm.is_active,
      })
      .eq("id", id);
      
    if (error) alert("Failed to save: " + error.message);
    else {
      setEditingId(null);
      fetchChallenges();
    }
  };

  const startEdit = (c: DynamicChallenge) => {
    setEditingId(c.id);
    setEditForm(c);
  };

  return (
    <FullScreenOverlay title="🏆 Challenge Management" onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "#fff", margin: 0 }}>Dynamic Challenges</h2>
        <button onClick={handleCreate} style={{
          background: "var(--neon)", color: "#000", border: "none", borderRadius: 20, padding: "8px 16px",
          fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
        }}>
          <Plus size={16} /> Create Challenge
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="mly-spinner" color="var(--neon)" /></div>
      ) : challenges.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No challenges found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {challenges.map(c => {
            const isEditing = editingId === c.id;
            
            return (
              <div key={c.id} className="glass-panel" style={{ padding: 16 }}>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input className="search-input" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Challenge Name" />
                    <textarea className="search-input" value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Description" style={{ resize: "vertical", minHeight: 60 }} />
                    
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Target (Times to Complete)</label>
                        <input className="search-input" type="number" value={editForm.target_value || 1} onChange={e => setEditForm({...editForm, target_value: Number(e.target.value)})} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Rule Type</label>
                        <select className="search-input" value={editForm.rule_type || "per_round"} onChange={e => setEditForm({...editForm, rule_type: e.target.value})} style={{ appearance: "none" }}>
                          <option value="per_round">Per Round</option>
                          <option value="per_game">Per Game</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Reward Item ID (e.g. chal_sniper)</label>
                        <input className="search-input" value={editForm.reward_id || ""} onChange={e => setEditForm({...editForm, reward_id: e.target.value})} placeholder="chal_custom" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Reward Name to Display</label>
                        <input className="search-input" value={editForm.reward_name || ""} onChange={e => setEditForm({...editForm, reward_name: e.target.value})} placeholder="Awesome Title" />
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Rules JSON (Advanced)</label>
                      <textarea className="search-input" value={JSON.stringify(editForm.conditions, null, 2)} onChange={e => {
                        try { setEditForm({...editForm, conditions: JSON.parse(e.target.value)}); } catch(e) {}
                      }} style={{ fontFamily: "monospace", fontSize: 12, resize: "vertical", minHeight: 80 }} />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                      <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} id={`active-${c.id}`} />
                      <label htmlFor={`active-${c.id}`} style={{ color: "#fff", fontSize: 14 }}>Active Challenge</label>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button onClick={() => setEditingId(null)} style={{ background: "transparent", color: "var(--text-muted)", border: "none", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                      <button onClick={() => handleSave(c.id)} style={{ background: "var(--neon)", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, cursor: "pointer" }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 style={{ margin: 0, fontSize: 18, color: "#fff", fontWeight: 800 }}>{c.name}</h3>
                          {c.is_active ? (
                            <span style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>ACTIVE</span>
                          ) : (
                            <span style={{ background: "rgba(255,255,255,0.1)", color: "#a1a1aa", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>INACTIVE</span>
                          )}
                        </div>
                        <p style={{ margin: "4px 0 12px 0", color: "var(--text-muted)", fontSize: 14 }}>{c.description}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => startEdit(c)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}>Edit</button>
                        <button onClick={() => handleDelete(c.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}>Delete</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, color: "#a78bfa" }}><strong>Target:</strong> {c.target_value} ({c.rule_type})</div>
                      <div style={{ fontSize: 13, color: "#60a5fa" }}><strong>Reward:</strong> {c.reward_name}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </FullScreenOverlay>
  );
}
