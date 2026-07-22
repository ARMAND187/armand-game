"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Save, Trash2, Edit2, Loader2, Target, Zap, Package, Clock, Check, Calendar } from "lucide-react";
import { FullScreenOverlay } from "@/components/FullScreenOverlay";

interface SpecialItem {
  id: string;
  name: string;
  title: string;
  description: string;
  balance: number;
  icon_name: string;
  image_url: string;
  rarity: string;
  rarity_color: string;
  required_streak?: number;
}

export function AdminSpecialItemsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<SpecialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SpecialItem>>({});
  const supabase = createClient();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("streak_items").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
    if (error) console.error(error);
    setLoading(false);
  };

  const handleCreateForDay = async (day: number) => {
    const { error } = await supabase.from("streak_items").insert([{
      name: `Day ${day} Reward`,
      title: "Streak Title",
      description: "Description here...",
      balance: day === 2 ? 50 : 0,
      icon_name: "Star",
      rarity: "Epic",
      rarity_color: "#a78bfa",
      required_streak: day
    }]);
    
    if (error) alert("Failed to create: " + error.message);
    else fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item permanently?")) return;
    const { error } = await supabase.from("streak_items").delete().eq("id", id);
    if (error) alert("Failed to delete: " + error.message);
    else fetchItems();
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from("streak_items")
      .update({
        name: editForm.name,
        title: editForm.title,
        description: editForm.description,
        balance: editForm.balance,
        icon_name: editForm.icon_name,
        image_url: editForm.image_url,
        rarity: editForm.rarity,
        rarity_color: editForm.rarity_color,
        required_streak: editForm.required_streak || 1,
      })
      .eq("id", id);
      
    if (error) alert("Failed to save: " + error.message);
    else {
      setEditingId(null);
      fetchItems();
    }
  };

  const filteredItems = items.sort((a, b) => (a.required_streak || 1) - (b.required_streak || 1));

  return (
    <FullScreenOverlay title="⚡ Daily Streak Management" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <h3 style={{ margin: 0, color: "white", fontSize: 18 }}>7-Day Streak Rewards</h3>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="mly-spinner" color="var(--neon)" /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6, 7].map(day => {
            const item = items.find(i => i.required_streak === day);
            
            if (!item) {
              return (
                <div key={`empty-${day}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--text-muted)" }}>{day}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 15, fontWeight: 700 }}>No Reward for Day {day}</div>
                  </div>
                  <button onClick={() => handleCreateForDay(day)} style={{ background: "transparent", border: "1px solid var(--neon)", color: "var(--neon)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={16} /> Create Reward
                  </button>
                </div>
              );
            }

            const isEditing = editingId === item.id;
            
            return (
              <div key={item.id} className="glass-panel" style={{ padding: 16 }}>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Item Details (Day {day})</label>
                      <div style={{ display: "flex", gap: 12 }}>
                        <input
                          className="search-input"
                          style={{ flex: 2 }}
                          value={editForm.name || ""}
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                          placeholder="Item Name (e.g. Navigator)"
                        />
                        <input
                          className="search-input"
                          style={{ flex: 1 }}
                          value={editForm.title || ""}
                          onChange={e => setEditForm({...editForm, title: e.target.value})}
                          placeholder="Category (e.g. Profile Pin)"
                        />
                      </div>
                      <input 
                        className="search-input" 
                        value={editForm.description || ""} 
                        onChange={e => setEditForm({...editForm, description: e.target.value})} 
                        placeholder="Description text" 
                      />
                    </div>

                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Day Requirement</label>
                        <input className="search-input" type="number" min="1" max="7" value={editForm.required_streak || 1} onChange={e => setEditForm({...editForm, required_streak: parseInt(e.target.value)})} placeholder="e.g. 1" />
                      </div>
                      
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: "var(--neon)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Balance Reward</label>
                        <input className="search-input" type="number" value={editForm.balance || 0} onChange={e => setEditForm({...editForm, balance: parseInt(e.target.value) || 0})} placeholder="e.g. 50" style={{ border: "1px solid rgba(168, 85, 247, 0.3)" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rarity Tier</label>
                        <select className="search-input" value={editForm.rarity || "Common"} onChange={e => setEditForm({...editForm, rarity: e.target.value})}>
                          <option value="Common">Common</option>
                          <option value="Rare">Rare</option>
                          <option value="Epic">Epic</option>
                          <option value="Legendary">Legendary</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Theme Color</label>
                        <input className="search-input" type="color" value={editForm.rarity_color || "#ffffff"} onChange={e => setEditForm({...editForm, rarity_color: e.target.value})} style={{ padding: 4, height: 42, width: "100%" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Visual Asset (Icon Name or SVG/Image URL)</label>
                      <input className="search-input" value={editForm.image_url || editForm.icon_name || ""} onChange={e => {
                        const val = e.target.value;
                        if (val.includes("/") || val.includes("<svg")) setEditForm({...editForm, image_url: val, icon_name: undefined});
                        else setEditForm({...editForm, icon_name: val, image_url: undefined});
                      }} placeholder="e.g. Star OR /pins/custom.png OR <svg..." />
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <button onClick={() => setEditingId(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 20px", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                      <button onClick={() => handleSave(item.id)} style={{ background: "var(--neon)", color: "#000", border: "none", borderRadius: 8, padding: "8px 24px", cursor: "pointer", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 0 15px rgba(168, 85, 247, 0.4)" }}>
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 16 }}>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 18, border: "2px solid rgba(255,255,255,0.1)" }}>
                          {day}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                            <h3 style={{ margin: 0, color: "white", fontSize: 18 }}>{item.name}</h3>
                            <div style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>{item.title}</div>
                            {item.balance > 0 && <div style={{ background: "rgba(74, 222, 128, 0.15)", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, color: "#4ade80" }}>+{item.balance} Balance</div>}
                          </div>
                          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>{item.description}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { setEditingId(item.id); setEditForm(item); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 8, padding: "8px 16px", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
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
