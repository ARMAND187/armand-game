"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Save, Trash2, X, Store } from "lucide-react";
import type { ShopItem } from "./ShopLockerButtons";

export default function AdminShopPanel() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
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
        is_active: (editForm as any).is_active,
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
    // Next 12 AM
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0); // Next midnight
    const endMidnight = new Date(nextMidnight);
    endMidnight.setHours(nextMidnight.getHours() + 24); // The midnight after that

    toggleStatus(item, true, nextMidnight.toISOString(), endMidnight.toISOString());
  };

  const handleAddToShopNow = (item: ShopItem) => {
    // Right now
    const availableFrom = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + timerHours);
    toggleStatus(item, true, availableFrom.toISOString(), expiresAt.toISOString());
  };

  const handlePermanentAdd = (item: ShopItem) => {
    const availableFrom = new Date();
    toggleStatus(item, true, availableFrom.toISOString(), null);
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Loader2 className="mly-spinner" /></div>;
  }

  return (
    <div className="settings-card" style={{ padding: 20, marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Store size={18} color="var(--neon)" /> Shop Item Management
      </h2>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => {
          const isEditing = editingId === item.id;
          const isActive = (item as any).is_active;

          return (
            <div
              key={item.id}
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 16,
              }}
            >
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
                    if (val.includes("/")) setEditForm({...editForm, image_url: val, icon_name: null as any});
                    else setEditForm({...editForm, icon_name: val, image_url: null as any});
                  }} placeholder="Icon Name or Image URL (/pins/fire-pin.png)" />
                  <textarea
                    className="search-input"
                    value={editForm.description || ""}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    placeholder="Description"
                    style={{ minHeight: 60, resize: "vertical" }}
                  />
                  
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                    <button onClick={handleCancel} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                    <button onClick={() => handleSave(item.id)} style={{ background: "var(--neon)", color: "#000", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <Save size={14} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                      {item.name}
                      {!isActive && <span style={{ fontSize: 10, background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "2px 6px", borderRadius: 4 }}>Hidden</span>}
                      {isActive && (item as any).available_from && new Date((item as any).available_from) > new Date() && (
                        <span style={{ fontSize: 10, background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", padding: "2px 6px", borderRadius: 4 }}>
                          Queued (starts {new Date((item as any).available_from).toLocaleString()})
                        </span>
                      )}
                      {isActive && (!(item as any).available_from || new Date((item as any).available_from) <= new Date()) && (item as any).expires_at && (
                        <span style={{ fontSize: 10, background: "rgba(167, 139, 250, 0.2)", color: "#a78bfa", padding: "2px 6px", borderRadius: 4 }}>
                          In Shop (ends {new Date((item as any).expires_at).toLocaleString()})
                        </span>
                      )}
                      {isActive && (!(item as any).available_from || new Date((item as any).available_from) <= new Date()) && !(item as any).expires_at && (
                        <span style={{ fontSize: 10, background: "rgba(74, 222, 128, 0.2)", color: "#4ade80", padding: "2px 6px", borderRadius: 4 }}>
                          In Shop (Permanent)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{item.type} • {item.price} Coins</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => handleEdit(item)} style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: 8, padding: "6px 10px", color: "#fff", cursor: "pointer", fontSize: 12 }}>
                      Edit
                    </button>
                    
                    {isActive ? (
                      <button onClick={() => toggleStatus(item, false, null, null)} style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 8, padding: "6px 10px", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>
                        Remove from Shop
                      </button>
                    ) : (
                      addingToShopId === item.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button onClick={() => handleQueueNextRefresh(item)} style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 6, padding: "6px 10px", color: "#60a5fa", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            Queue for Next Refresh (12 AM)
                          </button>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                            <input 
                              type="number" 
                              className="search-input" 
                              style={{ width: 50, padding: 4, fontSize: 12 }} 
                              value={timerHours} 
                              onChange={e => setTimerHours(Number(e.target.value))}
                            />
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>hrs</span>
                            <button onClick={() => handleAddToShopNow(item)} style={{ background: "var(--neon)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#000", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                              Add Now
                            </button>
                          </div>
                          <button onClick={() => setAddingToShopId(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, marginLeft: 4 }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingToShopId(item.id)} style={{ background: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.2)", borderRadius: 8, padding: "6px 10px", color: "#4ade80", cursor: "pointer", fontSize: 12 }}>
                          Add to Shop
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
