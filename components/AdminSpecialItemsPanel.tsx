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
  is_active?: boolean;
  available_from?: string;
  expires_at?: string;
}

export function AdminSpecialItemsPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"challenge" | "streak">("challenge");
  const [activeView, setActiveView] = useState<"active" | "storage">("active");
  const [items, setItems] = useState<SpecialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SpecialItem>>({});
  const [addingToShopId, setAddingToShopId] = useState<string | null>(null);
  const [timerHours, setTimerHours] = useState(24);
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
      title: activeTab === "challenge" ? "Challenge Title" : "Streak Title",
      description: "Description here...",
      balance: 100,
      icon_name: "Star",
      rarity: "Legendary",
      rarity_color: "#4ade80",
      is_active: false
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

  const toggleStatus = async (item: SpecialItem, forceActive?: boolean, availableFrom?: string | null, expiresAt?: string | null) => {
    const table = activeTab === "challenge" ? "challenge_items" : "streak_items";
    const isActive = forceActive !== undefined ? forceActive : !item.is_active;
    const { error } = await supabase.from(table).update({ 
      is_active: isActive,
      available_from: availableFrom !== undefined ? availableFrom : item.available_from,
      expires_at: expiresAt !== undefined ? expiresAt : item.expires_at
    }).eq("id", item.id);
    
    if (error) {
      alert("Failed to update: " + error.message);
    } else {
      setAddingToShopId(null);
      fetchItems();
    }
  };

  const handleQueueNextRefresh = (item: SpecialItem) => {
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0); 
    const endMidnight = new Date(nextMidnight);
    endMidnight.setHours(nextMidnight.getHours() + 24); 
    toggleStatus(item, true, nextMidnight.toISOString(), endMidnight.toISOString());
  };

  const handleAddToShopNow = (item: SpecialItem) => {
    const availableFrom = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + timerHours);
    toggleStatus(item, true, availableFrom.toISOString(), expiresAt.toISOString());
  };

  const handlePermanentAdd = (item: SpecialItem) => {
    const availableFrom = new Date();
    toggleStatus(item, true, availableFrom.toISOString(), null);
  };

  const calculateDaysInShop = (availableFrom: string) => {
    const start = new Date(availableFrom).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    if (diff <= 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTimeLeft = (expiresAt: string) => {
    const end = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)} days`;
    return `${hours}h ${minutes}m`;
  };

  const now = new Date();
  const filteredItems = items.filter(item => {
    const isActive = item.is_active;
    const isAvailable = !item.available_from || new Date(item.available_from) <= now;
    const isExpired = item.expires_at && new Date(item.expires_at) <= now;
    const currentlyInShop = isActive && isAvailable && !isExpired;
    
    if (activeView === "active") return currentlyInShop;
    if (activeView === "storage") return !currentlyInShop;
    return true;
  });

  return (
    <FullScreenOverlay title="🏆 Special Items Management" onClose={onClose}>
      {/* Top Type Selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => { setActiveTab("challenge"); setActiveView("active"); }}
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
          onClick={() => { setActiveTab("streak"); setActiveView("active"); }}
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

      {/* Storage vs Active View */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
        <button
          onClick={() => setActiveView("active")}
          style={{
            padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: activeView === "active" ? "rgba(168, 85, 247, 0.2)" : "transparent",
            color: activeView === "active" ? "var(--neon)" : "var(--text-muted)",
            border: activeView === "active" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent"
          }}
        >
          Active {activeTab === "challenge" ? "Challenges" : "Streaks"}
        </button>
        <button
          onClick={() => setActiveView("storage")}
          style={{
            padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            background: activeView === "storage" ? "rgba(168, 85, 247, 0.2)" : "transparent",
            color: activeView === "storage" ? "var(--neon)" : "var(--text-muted)",
            border: activeView === "storage" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent"
          }}
        >
          <Package size={14} /> Storage Vault
        </button>
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
          No {activeTab} items found in {activeView}.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredItems.map(item => {
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
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
                      <button onClick={() => setEditingId(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Cancel</button>
                      <button onClick={() => handleSave(item.id)} style={{ background: "var(--neon)", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
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
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { setEditingId(item.id); setEditForm(item); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 8, padding: "8px", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
                          <Trash2 size={14} /> Delete
                        </button>
                        {activeView === "active" ? (
                          <button onClick={() => toggleStatus(item, false, null, null)} style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: "6px 12px", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            Vault Item
                          </button>
                        ) : (
                          <button onClick={() => setAddingToShopId(item.id)} style={{ background: "rgba(74, 222, 128, 0.15)", border: "1px solid rgba(74, 222, 128, 0.3)", borderRadius: 8, padding: "6px 12px", color: "#4ade80", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            Make Active
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats / Info */}
                    {activeView === "active" ? (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8 }}>
                        {item.available_from && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>
                            <Calendar size={14} /> Active for {calculateDaysInShop(item.available_from)} days
                          </div>
                        )}
                        {item.expires_at ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>
                            <Clock size={14} /> Expires in: {calculateTimeLeft(item.expires_at)}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4ade80", fontWeight: 700 }}>
                            <Check size={14} /> Permanent Item
                          </div>
                        )}
                      </div>
                    ) : addingToShopId === item.id ? (
                      <div style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, marginTop: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Activate Special Item</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <button onClick={() => handleQueueNextRefresh(item)} style={{ background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 8, padding: "10px", color: "#60a5fa", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                            Queue for Next Midnight Refresh (24hr limit)
                          </button>
                          
                          <div style={{ display: "flex", gap: 8 }}>
                            <div style={{ flex: 1, display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, overflow: "hidden" }}>
                              <input 
                                type="number" 
                                style={{ background: "transparent", border: "none", color: "#fff", padding: "10px", width: "100%", outline: "none", fontSize: 13, fontWeight: 700 }}
                                value={timerHours} 
                                onChange={e => setTimerHours(Number(e.target.value))}
                              />
                              <div style={{ padding: "10px", color: "var(--text-muted)", fontSize: 13, fontWeight: 700, background: "rgba(255,255,255,0.05)" }}>hours</div>
                            </div>
                            <button onClick={() => handleAddToShopNow(item)} style={{ background: "var(--neon)", border: "none", borderRadius: 8, padding: "10px 16px", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 800 }}>
                              Activate Now
                            </button>
                          </div>

                          <button onClick={() => handlePermanentAdd(item)} style={{ background: "rgba(74, 222, 128, 0.15)", border: "1px solid rgba(74, 222, 128, 0.3)", borderRadius: 8, padding: "10px", color: "#4ade80", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                            Activate Permanently
                          </button>

                          <button onClick={() => setAddingToShopId(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, marginTop: 4 }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8 }}>
                        {item.available_from && new Date(item.available_from) > new Date() ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#60a5fa", fontWeight: 700 }}>
                            <Calendar size={14} /> Queued to return: {new Date(item.available_from).toLocaleString()}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>
                            <Package size={14} /> Currently in Storage Vault
                          </div>
                        )}
                      </div>
                    )}

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
