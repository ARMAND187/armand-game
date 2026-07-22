"use client";

import React, { useState, useEffect } from "react";
import { Loader2, X, Search, Trash2, Plus, ArrowLeft } from "lucide-react";
import { FullScreenOverlay } from "@/components/FullScreenOverlay";
import { 
  searchPlayers, 
  getPlayerInventory, 
  removeInventoryItem, 
  addInventoryItem, 
  getAllItems 
} from "@/app/actions/admin-inventory";

export function AdminPlayerInventoryPanel({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  
  const [allItems, setAllItems] = useState<{ shop: any[], challenge: any[], streak: any[] }>({ shop: [], challenge: [], streak: [] });
  const [granting, setGranting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  
  // Selection for grant
  const [grantCategory, setGrantCategory] = useState<'shop' | 'challenge' | 'streak'>('shop');
  const [grantItemId, setGrantItemId] = useState("");

  useEffect(() => {
    // Load all possible items for the dropdown
    getAllItems().then(res => {
      if (res.success && res.data) {
        setAllItems(res.data);
      }
    });
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    const res = await searchPlayers(searchQuery);
    if (res.success) {
      setSearchResults(res.data || []);
    } else {
      alert(res.error);
    }
    setSearching(false);
  };

  const handleSelectPlayer = async (player: any) => {
    setSelectedPlayer(player);
    await loadInventory(player.id);
  };

  const loadInventory = async (userId: string) => {
    setLoadingInv(true);
    const res = await getPlayerInventory(userId);
    if (res.success) {
      setInventory(res.data || []);
    } else {
      alert(res.error);
    }
    setLoadingInv(false);
  };

  const handleRemove = async (invId: string) => {
    if (!confirm("Are you sure you want to delete this item from the player's locker?")) return;
    setRemoving(invId);
    const res = await removeInventoryItem(invId);
    if (res.success) {
      setInventory(prev => prev.filter(i => i.id !== invId));
    } else {
      alert(res.error);
    }
    setRemoving(null);
  };

  const handleGrant = async () => {
    if (!selectedPlayer || !grantItemId) return;
    setGranting(true);
    const res = await addInventoryItem(selectedPlayer.id, grantItemId, grantCategory);
    if (res.success) {
      await loadInventory(selectedPlayer.id);
      setGrantItemId("");
    } else {
      alert(res.error);
    }
    setGranting(false);
  };

  return (
    <FullScreenOverlay title="Player Lockers" onClose={onClose}>
      <div className="settings-panel" style={{ width: 800, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {selectedPlayer && (
              <button onClick={() => setSelectedPlayer(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
              Player Lockers
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={24} />
          </button>
        </div>

        {!selectedPlayer ? (
          // SEARCH VIEW
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input 
                  className="search-input"
                  style={{ paddingLeft: 44, width: "100%" }}
                  placeholder="Search player by exact username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button className="btn-lobby-play" onClick={handleSearch} disabled={searching} style={{ width: 120, justifyContent: "center" }}>
                {searching ? <Loader2 className="mly-spinner" size={18} /> : "Search"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {searchResults.length === 0 && searchQuery && !searching && (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No players found.</div>
              )}
              {searchResults.map(p => (
                <div 
                  key={p.id} 
                  className="settings-card" 
                  style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "0.2s" }}
                  onClick={() => handleSelectPlayer(p)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backgroundImage: p.avatar_url ? `url(${p.avatar_url})` : "none", backgroundSize: "cover" }} />
                    <div>
                      <div style={{ color: "white", fontWeight: 700 }}>{p.username}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{p.rp} RP</div>
                    </div>
                  </div>
                  <div style={{ color: "var(--neon)", fontSize: 12, fontWeight: 700 }}>View Locker ➔</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // INVENTORY VIEW
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backgroundImage: selectedPlayer.avatar_url ? `url(${selectedPlayer.avatar_url})` : "none", backgroundSize: "cover" }} />
              <div>
                <h3 style={{ margin: 0, color: "white", fontSize: 18 }}>{selectedPlayer.username}'s Locker</h3>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{inventory.length} items owned</div>
              </div>
            </div>

            {/* Grant Tool */}
            <div className="settings-card" style={{ padding: 16, marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Grant Item:</div>
              <select 
                className="search-input" 
                style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
                value={grantCategory}
                onChange={e => {
                  setGrantCategory(e.target.value as any);
                  setGrantItemId("");
                }}
              >
                <option value="shop">Shop Item</option>
                <option value="challenge">Challenge Item</option>
                <option value="streak">Streak Item</option>
              </select>
              
              <select 
                className="search-input" 
                style={{ flex: 2, padding: "8px 12px", fontSize: 13 }}
                value={grantItemId}
                onChange={e => setGrantItemId(e.target.value)}
              >
                <option value="" disabled>Select Item to Grant...</option>
                {allItems[grantCategory].map((i: any) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.title || i.type})</option>
                ))}
              </select>

              <button 
                className="btn-lobby-play" 
                style={{ padding: "8px 16px", height: "auto", fontSize: 13 }}
                onClick={handleGrant}
                disabled={!grantItemId || granting}
              >
                {granting ? <Loader2 className="mly-spinner" size={14} /> : <><Plus size={14} style={{ marginRight: 6 }}/> Grant</>}
              </button>
            </div>

            {/* Items Grid */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
              {loadingInv ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="mly-spinner" color="var(--neon)" /></div>
              ) : inventory.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>This player's locker is empty.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {inventory.map(inv => {
                    const item = inv.shop_items || inv.challenge_items || inv.streak_items;
                    if (!item) return null;
                    const typeLabel = inv.shop_items ? "Shop" : (inv.challenge_items ? "Challenge" : "Streak");
                    
                    return (
                      <div key={inv.id} className="settings-card" style={{ padding: 12, position: "relative" }}>
                        <button 
                          onClick={() => handleRemove(inv.id)}
                          disabled={removing === inv.id}
                          style={{ position: "absolute", top: 8, right: 8, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", borderRadius: 6, padding: 6, cursor: "pointer" }}
                          title="Revoke Item"
                        >
                          {removing === inv.id ? <Loader2 size={14} className="mly-spinner" /> : <Trash2 size={14} />}
                        </button>
                        
                        <div style={{ 
                          width: 48, height: 48, borderRadius: 8, marginBottom: 12,
                          background: item.image_url ? `url(${item.image_url})` : "rgba(255,255,255,0.05)",
                          backgroundSize: "cover", backgroundPosition: "center"
                        }} />
                        
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginBottom: 4 }}>{typeLabel} • {item.title || item.type}</div>
                        <div style={{ color: item.rarity_color || "white", fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
                          Acquired: {new Date(inv.acquired_at).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FullScreenOverlay>
  );
}
