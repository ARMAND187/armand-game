"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, Store, Package, Trash2, Check, Lock, Edit3, Image as ImageIcon, Box, Clock, Plus, Loader2, Calendar, Save } from "lucide-react";
import { FullScreenOverlay } from "@/components/FullScreenOverlay";
import type { ShopItem } from "@/components/ShopLockerButtons";

interface ShopManagementModalProps {
  onClose: () => void;
}

export function ShopManagementModal({ onClose }: ShopManagementModalProps) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "storage">("active");
  const [filter, setFilter] = useState<"all" | "challenge" | "streak">("all");
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ShopItem>>({});
  const [addingToShopId, setAddingToShopId] = useState<string | null>(null);
  const [timerHours, setTimerHours] = useState<number>(24);

  const supabase = createClient();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("shop_items").select("*").order("created_at", { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleEdit = (item: ShopItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleCreateItem = async () => {
    const { error } = await supabase.from("shop_items").insert([{
      name: "New Item",
      type: "Map Pin",
      price: 0,
      rarity: "Common",
      rarity_color: "#ffffff",
      is_active: false
    }]);
    
    if (error) {
      alert("Failed to create item: " + error.message);
    } else {
      fetchItems();
    }
  };

  const handleSeedSpecialItems = async () => {
    const itemsToSeed = [
      { name: 'Rising Star', type: 'Challenge Title', price: 0, rarity: 'Legendary', rarity_color: '#4ade80', icon_name: 'Star', is_active: false },
      { name: 'Sniper', type: 'Challenge Title', price: 0, rarity: 'Legendary', rarity_color: '#4ade80', icon_name: 'Crosshair', is_active: false },
      { name: 'Geographer', type: 'Challenge Title', price: 0, rarity: 'Legendary', rarity_color: '#4ade80', icon_name: 'Target', is_active: false },
      { name: 'Speedster', type: 'Challenge Title', price: 0, rarity: 'Legendary', rarity_color: '#4ade80', icon_name: 'Zap', is_active: false },
      { name: 'Navigator', type: 'Streak Title', price: 0, rarity: 'Legendary', rarity_color: '#fbbf24', icon_name: 'Compass', is_active: false }
    ];
    for (const item of itemsToSeed) {
      const { data } = await supabase.from("shop_items").select("id").eq("name", item.name).eq("type", item.type);
      if (!data || data.length === 0) {
        await supabase.from("shop_items").insert([item]);
      }
    }
    fetchItems();
    alert("Special items seeded!");
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from("shop_items")
      .update({
        name: editForm.name,
        type: editForm.type,
        price: editForm.price,
        rarity: editForm.rarity,
        rarity_color: editForm.rarity_color,
        description: editForm.description,
        icon_name: editForm.icon_name,
        image_url: editForm.image_url,
      })
      .eq("id", id);
    
    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      setEditingId(null);
      fetchItems();
    }
  };

  const toggleStatus = async (item: ShopItem, forceActive?: boolean, availableFrom?: string | null, expiresAt?: string | null) => {
    const isActive = forceActive !== undefined ? forceActive : !(item as any).is_active;
    const { error } = await supabase.from("shop_items").update({ 
      is_active: isActive,
      available_from: availableFrom !== undefined ? availableFrom : (item as any).available_from,
      expires_at: expiresAt !== undefined ? expiresAt : (item as any).expires_at
    }).eq("id", item.id);
    
    if (error) {
      alert("Failed to update: " + error.message);
    } else {
      setAddingToShopId(null);
      fetchItems();
    }
  };

  const handleQueueNextRefresh = (item: ShopItem) => {
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0); 
    const endMidnight = new Date(nextMidnight);
    endMidnight.setHours(nextMidnight.getHours() + 24); 
    toggleStatus(item, true, nextMidnight.toISOString(), endMidnight.toISOString());
  };

  const handleAddToShopNow = (item: ShopItem) => {
    const availableFrom = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + timerHours);
    toggleStatus(item, true, availableFrom.toISOString(), expiresAt.toISOString());
  };

  const handlePermanentAdd = (item: ShopItem) => {
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
    if (hours > 24) {
      return `${Math.floor(hours / 24)} days`;
    }
    return `${hours}h ${minutes}m`;
  };

  const now = new Date();
  
  const filteredItems = items.filter(item => {
    // Filter by type
    if (filter === "challenge" && item.type !== "Challenge Title") return false;
    if (filter === "streak" && item.type !== "Streak Title") return false;
    
    // Filter by tab
    const isActive = (item as any).is_active;
    const isAvailable = !(item as any).available_from || new Date((item as any).available_from) <= now;
    const isExpired = (item as any).expires_at && new Date((item as any).expires_at) <= now;
    
    const currentlyInShop = isActive && isAvailable && !isExpired;
    
    if (activeTab === "active") return currentlyInShop;
    if (activeTab === "storage") return !currentlyInShop;
    
    return true;
  });

  return (
    <FullScreenOverlay title="🛒 Shop Management" onClose={onClose}>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            flex: 1, padding: "12px", borderRadius: 12, fontWeight: 800, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
            background: activeTab === "active" ? "rgba(168, 85, 247, 0.2)" : "var(--bg-card)",
            color: activeTab === "active" ? "var(--neon)" : "var(--text-muted)",
            border: activeTab === "active" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent",
          }}
        >
          <Store size={18} /> Active Shop
        </button>
        <button
          onClick={() => setActiveTab("storage")}
          style={{
            flex: 1, padding: "12px", borderRadius: 12, fontWeight: 800, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
            background: activeTab === "storage" ? "rgba(168, 85, 247, 0.2)" : "var(--bg-card)",
            color: activeTab === "storage" ? "var(--neon)" : "var(--text-muted)",
            border: activeTab === "storage" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent",
          }}
        >
          <Package size={18} /> Storage
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            background: filter === "all" ? "var(--text-primary)" : "var(--bg-card)",
            color: filter === "all" ? "#000" : "var(--text-muted)",
            border: "none"
          }}
        >
          All Items
        </button>
        <button
          onClick={() => setFilter("challenge")}
          style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            background: filter === "challenge" ? "var(--text-primary)" : "var(--bg-card)",
            color: filter === "challenge" ? "#000" : "var(--text-muted)",
            border: "none"
          }}
        >
          Challenge Items
        </button>
        <button
          onClick={() => setFilter("streak")}
          style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            background: filter === "streak" ? "var(--text-primary)" : "var(--bg-card)",
            color: filter === "streak" ? "#000" : "var(--text-muted)",
            border: "none"
          }}
        >
          Daily Streak
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCreateItem}
          style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            background: "var(--neon)", color: "#000", border: "none", display: "flex", alignItems: "center", gap: 6
          }}
        >
          <Plus size={16} /> Create Item
        </button>
        <button
          onClick={handleSeedSpecialItems}
          style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: 6
          }}
        >
          Seed Specials
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="mly-spinner" color="var(--neon)" /></div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40, fontSize: 14 }}>
          No items found in {activeTab}.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredItems.map(item => {
            const isEditing = editingId === item.id;
            
            return (
              <div key={item.id} className="glass-panel" style={{ padding: 16 }}>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input
                      className="search-input"
                      value={editForm.name || ""}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      placeholder="Item Name"
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <input className="search-input" type="number" value={editForm.price || 0} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} placeholder="Price" style={{ flex: 1 }} />
                      <select 
                        className="search-input" 
                        value={editForm.type || "Map Pin"} 
                        onChange={e => setEditForm({...editForm, type: e.target.value})} 
                        style={{ flex: 1, appearance: "none" }}
                      >
                        <option value="Map Pin">Map Pin</option>
                        <option value="Name Flair">Name Flair</option>
                        <option value="Title">Title</option>
                        <option value="Challenge Title">Challenge Title</option>
                        <option value="Streak Title">Streak Title</option>
                        <option value="Banner">Banner</option>
                        <option value="Avatar Frame">Avatar Frame</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input className="search-input" value={editForm.rarity || ""} onChange={e => setEditForm({...editForm, rarity: e.target.value})} placeholder="Rarity" style={{ flex: 1 }} />
                      <input className="search-input" value={editForm.rarity_color || ""} onChange={e => setEditForm({...editForm, rarity_color: e.target.value})} placeholder="Color (#hex)" style={{ flex: 1 }} />
                    </div>
                    <input className="search-input" value={editForm.image_url || editForm.icon_name || ""} onChange={e => {
                      const val = e.target.value;
                      if (val.includes("/")) setEditForm({...editForm, image_url: val, icon_name: undefined});
                      else setEditForm({...editForm, icon_name: val, image_url: undefined});
                    }} placeholder="Icon Name or Image URL (/pins/fire-pin.png)" />
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                      <button onClick={handleCancel} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                      <button onClick={() => handleSave(item.id)} style={{ background: "var(--neon)", color: "#000", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <Save size={14} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>{item.name}</h3>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{item.type} • {item.price} RP</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleEdit(item)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                          Edit
                        </button>
                        {activeTab === "active" ? (
                          <button onClick={() => toggleStatus(item, false, null, null)} style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: "6px 12px", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            Remove
                          </button>
                        ) : (
                          <button onClick={() => setAddingToShopId(item.id)} style={{ background: "rgba(74, 222, 128, 0.15)", border: "1px solid rgba(74, 222, 128, 0.3)", borderRadius: 8, padding: "6px 12px", color: "#4ade80", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            Add to Shop
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats / Info */}
                    {activeTab === "active" ? (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8 }}>
                        {(item as any).available_from && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>
                            <Calendar size={14} /> Active for {calculateDaysInShop((item as any).available_from)} days
                          </div>
                        )}
                        {(item as any).expires_at ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>
                            <Clock size={14} /> Expires in: {calculateTimeLeft((item as any).expires_at)}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4ade80", fontWeight: 700 }}>
                            <Check size={14} /> Permanent Item
                          </div>
                        )}
                      </div>
                    ) : addingToShopId === item.id ? (
                      <div style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, marginTop: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Publish to Active Shop</div>
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
                              Add Now
                            </button>
                          </div>

                          <button onClick={() => handlePermanentAdd(item)} style={{ background: "rgba(74, 222, 128, 0.15)", border: "1px solid rgba(74, 222, 128, 0.3)", borderRadius: 8, padding: "10px", color: "#4ade80", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                            Add Permanently
                          </button>

                          <button onClick={() => setAddingToShopId(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, marginTop: 4 }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8 }}>
                        {(item as any).available_from && new Date((item as any).available_from) > new Date() ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#60a5fa", fontWeight: 700 }}>
                            <Calendar size={14} /> Queued to return: {new Date((item as any).available_from).toLocaleString()}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>
                            <Package size={14} /> Currently in Storage
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
