"use client";

import React, { useState, useEffect } from "react";
import { Loader2, X, Search, Trash2, Plus, ArrowLeft } from "lucide-react";
import { FullScreenOverlay } from "@/components/FullScreenOverlay";
import { 
  searchPlayers, 
  getPlayerInventory, 
  removeInventoryItem, 
  addInventoryItem, 
  getAllItems,
  addPlayerRP,
  setPlayerRP,
  addPlayerWalletBalance,
  setPlayerWalletBalance
} from "@/app/actions/admin-inventory";
import { renderIcon } from "@/components/ShopLockerButtons";

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
  const [showFullInventory, setShowFullInventory] = useState(false);

  const [rpAmount, setRpAmount] = useState("");
  const [rpAction, setRpAction] = useState<'add' | 'set'>('add');
  const [addingRp, setAddingRp] = useState(false);

  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceAction, setBalanceAction] = useState<'add' | 'set'>('add');
  const [addingBalance, setAddingBalance] = useState(false);

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

  const handleAddRp = async () => {
    const amount = parseInt(rpAmount);
    if (!selectedPlayer || isNaN(amount)) return;
    setAddingRp(true);
    const res = rpAction === 'add' ? await addPlayerRP(selectedPlayer.id, amount) : await setPlayerRP(selectedPlayer.id, amount);
    if (res.success) {
      setSelectedPlayer({ ...selectedPlayer, rp: res.newRp });
      setRpAmount("");
      
      // Update in search results so it matches
      setSearchResults(prev => prev.map(p => p.id === selectedPlayer.id ? { ...p, rp: res.newRp } : p));
    } else {
      alert(res.error);
    }
    setAddingRp(false);
  };

  const handleUpdateBalance = async () => {
    const amount = parseInt(balanceAmount);
    if (!selectedPlayer || isNaN(amount)) return;
    setAddingBalance(true);
    const res = balanceAction === 'add' ? await addPlayerWalletBalance(selectedPlayer.id, amount) : await setPlayerWalletBalance(selectedPlayer.id, amount);
    if (res.success) {
      setSelectedPlayer({ ...selectedPlayer, balance: res.newBalance });
      setBalanceAmount("");
      
      // Update in search results so it matches
      setSearchResults(prev => prev.map(p => p.id === selectedPlayer.id ? { ...p, balance: res.newBalance } : p));
    } else {
      alert(res.error);
    }
    setAddingBalance(false);
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
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{p.rp || 0} RP • {p.balance || 0} Wallet</div>
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
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backgroundImage: selectedPlayer.avatar_url ? `url(${selectedPlayer.avatar_url})` : "none", backgroundSize: "cover", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: "white", fontSize: 18 }}>{selectedPlayer.username}'s Locker</h3>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{inventory.length} items owned</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ color: "var(--neon)", fontSize: 20, fontWeight: 800 }}>{selectedPlayer.rp || 0} RP</div>
                <div style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Current Rank (RP)</div>
              </div>
              <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ color: "#4ade80", fontSize: 20, fontWeight: 800 }}>${selectedPlayer.balance || 0}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Wallet Balance</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {/* Edit RP */}
              <div className="settings-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, width: 80 }}>Rank (RP):</div>
                <select 
                  className="search-input" 
                  style={{ width: 100, padding: "8px", fontSize: 13 }}
                  value={rpAction}
                  onChange={e => setRpAction(e.target.value as any)}
                >
                  <option value="add">Add (+/-)</option>
                  <option value="set">Set Exact</option>
                </select>
                <input 
                  type="number"
                  className="search-input" 
                  style={{ flex: 1, minWidth: 120, padding: "8px 12px", fontSize: 13 }}
                  placeholder="RP Amount"
                  value={rpAmount}
                  onChange={e => setRpAmount(e.target.value)}
                />
                <button 
                  className="btn-lobby-play" 
                  style={{ padding: "8px 12px", height: "auto", fontSize: 13 }}
                  onClick={handleAddRp}
                  disabled={addingRp || !rpAmount}
                >
                  {addingRp ? <Loader2 className="mly-spinner" size={14} /> : "Save"}
                </button>
              </div>

              {/* Edit Wallet */}
              <div className="settings-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, width: 80 }}>Wallet:</div>
                <select 
                  className="search-input" 
                  style={{ width: 100, padding: "8px", fontSize: 13 }}
                  value={balanceAction}
                  onChange={e => setBalanceAction(e.target.value as any)}
                >
                  <option value="add">Add (+/-)</option>
                  <option value="set">Set Exact</option>
                </select>
                <input 
                  type="number"
                  className="search-input" 
                  style={{ flex: 1, minWidth: 120, padding: "8px 12px", fontSize: 13 }}
                  placeholder="Wallet Amount"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                />
                <button 
                  className="btn-lobby-play" 
                  style={{ padding: "8px 12px", height: "auto", fontSize: 13 }}
                  onClick={handleUpdateBalance}
                  disabled={addingBalance || !balanceAmount}
                >
                  {addingBalance ? <Loader2 className="mly-spinner" size={14} /> : "Save"}
                </button>
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

            {/* View Inventory Button */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
              {loadingInv ? (
                <Loader2 className="mly-spinner" color="var(--neon)" />
              ) : inventory.length === 0 ? (
                <div style={{ color: "var(--text-muted)" }}>This player's locker is empty.</div>
              ) : (
                <button 
                  onClick={() => setShowFullInventory(true)}
                  style={{
                    background: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: 12,
                    padding: "16px 32px",
                    color: "var(--neon)",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 0 20px rgba(168, 85, 247, 0.2)"
                  }}
                >
                  View Full Inventory ({inventory.length} Items)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showFullInventory && selectedPlayer && (
        <FullScreenOverlay onClose={() => setShowFullInventory(false)} title={`${selectedPlayer.username}'s Locker`}>
          <div className="game-panel" style={{ width: 1000, maxWidth: "90vw", height: "80vh", display: "flex", flexDirection: "column", padding: 0 }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>{selectedPlayer.username}'s Locker</h2>
                <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>{inventory.length} items owned</div>
              </div>
              <button onClick={() => setShowFullInventory(false)} className="icon-btn"><X size={24} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {inventory.map(inv => {
                  const item = inv.shop_items || inv.challenge_items || inv.streak_items;
                  if (!item) return null;
                  const typeLabel = inv.shop_items ? "Shop" : (inv.challenge_items ? "Challenge" : "Streak");
                  
                  return (
                    <div key={inv.id} style={{
                      background: "rgba(24, 24, 27, 0.4)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      position: "relative"
                    }}>
                      <div style={{
                        width: item.type === 'Name Flair' || item.type === 'Banner' || item.type === 'Title' ? 120 : 54,
                        height: item.type === 'Banner' ? 40 : (item.type === 'Name Flair' || item.type === 'Title' ? 30 : 54),
                        borderRadius: item.type === 'Banner' ? 4 : (item.type === 'Name Flair' ? 14 : (item.type === 'Avatar Frame' ? "50%" : 14)),
                        background: item.type === 'Title' ? "transparent" : `radial-gradient(circle at center, ${item.rarity_color || '#fff'}22 0%, transparent 70%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden"
                      }}>
                        {renderIcon(item)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginBottom: 2 }}>{typeLabel} • {item.title || item.type}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: item.rarity_color || "#fff" }}>{item.name}</div>
                      </div>
                      
                      <button 
                        onClick={() => handleRemove(inv.id)}
                        disabled={removing === inv.id}
                        style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", flexShrink: 0 }}
                        title="Revoke Item"
                      >
                        {removing === inv.id ? <Loader2 size={16} className="mly-spinner" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </FullScreenOverlay>
      )}
    </FullScreenOverlay>
  );
}
