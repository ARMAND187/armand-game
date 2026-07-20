"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Save, Trash2, Edit2, Loader2, Target, Zap } from "lucide-react";
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
}

export function AdminSpecialItemsPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"challenge" | "streak">("challenge");
  const [items, setItems] = useState<SpecialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SpecialItem>>({});
  const supabase = createClient();

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    const table = activeTab === "challenge" ? "challenge_items" : "streak_items";
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
    if (error) console.error(error);
    setLoading(false);
  };

  const handleCreate = async () => {
    const table = activeTab === "challenge" ? "challenge_items" : "streak_items";
    const { error } = await supabase.from(table).insert([{
      name: "New Item",
      title: "New Title",
      description: "Description here...",
      balance: 100,
      icon_name: "Star",
      rarity: "Legendary",
      rarity_color: "#4ade80"
    }]);
    
    if (error) alert("Failed to create: " + error.message);
    else fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item permanently?")) return;
    const table = activeTab === "challenge" ? "challenge_items" : "streak_items";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) alert("Failed to delete: " + error.message);
    else fetchItems();
  };

  const handleSave = async (id: string) => {
    const table = activeTab === "challenge" ? "challenge_items" : "streak_items";
    const { error } = await supabase
      .from(table)
      .update({
        name: editForm.name,
        title: editForm.title,
        description: editForm.description,
        balance: editForm.balance,
        icon_name: editForm.icon_name,
        image_url: editForm.image_url,
        rarity: editForm.rarity,
        rarity_color: editForm.rarity_color,
      })
      .eq("id", id);
      
    if (error) alert("Failed to save: " + error.message);
    else {
      setEditingId(null);
      fetchItems();
    }
  };

  const startEdit = (c: SpecialItem) => {
    setEditingId(c.id);
    setEditForm(c);
  };

  return (
    <FullScreenOverlay title="🏆 Special Items Management" onClose={onClose}>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("challenge")}
          style={{
            flex: 1, padding: "12px", borderRadius: 12, fontWeight: 800, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
            background: activeTab === "challenge" ? "rgba(168, 85, 247, 0.2)" : "var(--bg-card)",
            color: activeTab === "challenge" ? "var(--neon)" : "var(--text-muted)",
            border: activeTab === "challenge" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent",
          }}
        >
          <Target size={18} /> Challenge Items
        </button>
        <button
          onClick={() => setActiveTab("streak")}
          style={{
            flex: 1, padding: "12px", borderRadius: 12, fontWeight: 800, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
            background: activeTab === "streak" ? "rgba(245, 158, 11, 0.2)" : "var(--bg-card)",
            color: activeTab === "streak" ? "#f59e0b" : "var(--text-muted)",
            border: activeTab === "streak" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid transparent",
          }}
        >
          <Zap size={18} /> Daily Streak Items
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button onClick={handleCreate} style={{
          background: "var(--neon)", color: "#000", border: "none", borderRadius: 20, padding: "8px 16px",
          fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
        }}>
          <Plus size={16} /> Create New Item
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="mly-spinner" color="var(--neon)" /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          No {activeTab} items found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map(item => {
            const isEditing = editingId === item.id;
            
            return (
              <div key={item.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden" }}>
                {isEditing ? (
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Name</label>
                        <input className="search-input" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="e.g. Sniper" />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Title / Type</label>
                        <input className="search-input" value={editForm.title || ""} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="e.g. Challenge Title" />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Balance (RP Reward / Cost)</label>
                      <input className="search-input" type="number" value={editForm.balance || 0} onChange={e => setEditForm({...editForm, balance: Number(e.target.value)})} placeholder="0" />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Description</label>
                      <textarea 
                        className="search-input" 
                        value={editForm.description || ""} 
                        onChange={e => setEditForm({...editForm, description: e.target.value})} 
                        placeholder="Item description..."
                        style={{ minHeight: 80, resize: "vertical" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Rarity</label>
                        <input className="search-input" value={editForm.rarity || ""} onChange={e => setEditForm({...editForm, rarity: e.target.value})} placeholder="e.g. Legendary" />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Rarity Color</label>
                        <input className="search-input" value={editForm.rarity_color || ""} onChange={e => setEditForm({...editForm, rarity_color: e.target.value})} placeholder="#hex" />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Icon / Image</label>
                        <input className="search-input" value={editForm.image_url || editForm.icon_name || ""} onChange={e => {
                          const val = e.target.value;
                          if (val.includes("/")) setEditForm({...editForm, image_url: val, icon_name: undefined});
                          else setEditForm({...editForm, icon_name: val, image_url: undefined});
                        }} placeholder="Icon Name or Image URL" />
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
                      <button onClick={() => setEditingId(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Cancel</button>
                      <button onClick={() => handleSave(item.id)} style={{ background: "var(--neon)", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>{item.name}</h3>
                        <span style={{ fontSize: 11, background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 12, color: "#fff", fontWeight: 700 }}>{item.title}</span>
                        {item.balance > 0 && (
                           <span style={{ fontSize: 11, background: "rgba(74, 222, 128, 0.1)", padding: "2px 8px", borderRadius: 12, color: "#4ade80", fontWeight: 800 }}>+{item.balance} RP</span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 500 }}>
                        {item.description}
                      </p>
                      
                      <div style={{ marginTop: 12, display: "flex", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                        <span>Rarity: <span style={{ color: item.rarity_color }}>{item.rarity}</span></span>
                        <span>Icon: {item.icon_name || "Image"}</span>
                        <span>ID: {item.id}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => startEdit(item)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 8, padding: "8px", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
                        <Trash2 size={14} /> Delete
                      </button>
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
