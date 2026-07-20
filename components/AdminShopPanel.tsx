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

  const toggleStatus = async (item: ShopItem) => {
    const { error } = await supabase.from("shop_items").update({ is_active: !(item as any).is_active }).eq("id", item.id);
    if (!error) fetchItems();
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
                    <input className="search-input" value={editForm.type || ""} onChange={e => setEditForm({...editForm, type: e.target.value})} placeholder="Type (e.g. Map Pin)" style={{ flex: 1 }} />
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
                      {!isActive && <span style={{ fontSize: 10, background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "2px 6px", borderRadius: 4 }}>Disabled</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.type} • {item.price} Coins</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleEdit(item)} style={{ background: "rgba(167, 139, 250, 0.1)", border: "1px solid rgba(167, 139, 250, 0.2)", borderRadius: 8, padding: 6, color: "var(--neon)", cursor: "pointer" }}>
                      Edit
                    </button>
                    <button onClick={() => toggleStatus(item)} style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, padding: 6, color: "#fff", cursor: "pointer" }}>
                      {isActive ? "Disable" : "Enable"}
                    </button>
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
