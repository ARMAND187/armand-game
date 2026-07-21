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

  const handleCreate = async () => {
    const { error } = await supabase.from("streak_items").insert([{
      name: "New Item",
      title: "Streak Title",
      description: "Description here...",
      balance: 100,
      icon_name: "Star",
      rarity: "Legendary",
      rarity_color: "#4ade80",
      required_streak: 1
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
    <FullScreenOverlay title="⚡ Daily Streak Items" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <h3 style={{ margin: 0, color: "white", fontSize: 18 }}>All Streak Rewards</h3>
        <div style={{ flex: 1 }} />
        <button onClick={handleCreate} style={{
          background: "var(--neon)", color: "#000", border: "none", borderRadius: 20, padding: "8px 16px",
          fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
        }}>
          <Plus size={16} /> Create New Item
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="mly-spinner" color="var(--neon)" /></div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          No streak items found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredItems.map(item => {
            const isEditing = editingId === item.id;
            
            return (
              <div key={item.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden" }}>
                {isEditing ? (
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                      <input className="search-input" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Item Name (e.g. Navigator)" />
                      <input className="search-input" type="number" min="1" value={editForm.required_streak || 1} onChange={e => setEditForm({...editForm, required_streak: parseInt(e.target.value)})} placeholder="Required Streak Day (e.g. 1)" />
                      <input className="search-input" style={{ gridColumn: "span 2" }} value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Description" />
                      <input className="search-input" value={editForm.icon_name || ""} onChange={e => setEditForm({...editForm, icon_name: e.target.value})} placeholder="Icon Name (e.g. Compass)" />
                      <input className="search-input" value={editForm.image_url || ""} onChange={e => setEditForm({...editForm, image_url: e.target.value})} placeholder="Image URL (optional)" />
                      <select className="search-input" value={editForm.rarity || ""} onChange={e => setEditForm({...editForm, rarity: e.target.value})}>
                        <option value="Common">Common</option>
                        <option value="Rare">Rare</option>
                        <option value="Epic">Epic</option>
                        <option value="Legendary">Legendary</option>
                      </select>
                      <input className="search-input" type="color" value={editForm.rarity_color || "#ffffff"} onChange={e => setEditForm({...editForm, rarity_color: e.target.value})} />
                      <input className="search-input" type="number" value={editForm.balance || 0} onChange={e => setEditForm({...editForm, balance: parseInt(e.target.value) || 0})} placeholder="Reward Balance (e.g. 50)" style={{ gridColumn: "span 2" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                      <button onClick={() => setEditingId(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => handleSave(item.id)} style={{ background: "var(--neon)", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <Save size={16} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                          <h3 style={{ margin: 0, color: "white", fontSize: 18 }}>{item.name}</h3>
                          <div style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>{item.title}</div>
                          <div style={{ background: "rgba(245, 158, 11, 0.15)", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>Day {item.required_streak || 1}</div>
                          {item.balance > 0 && <div style={{ background: "rgba(74, 222, 128, 0.15)", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, color: "#4ade80" }}>+{item.balance} RP</div>}
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>{item.description}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { setEditingId(item.id); setEditForm(item); }} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, padding: "8px", color: "#fff", cursor: "pointer" }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", borderRadius: 8, padding: "8px", color: "#ef4444", cursor: "pointer" }}>
                          <Trash2 size={16} />
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
