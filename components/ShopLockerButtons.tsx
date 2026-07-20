"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Archive, X, Lock, Star, Sparkles, Package, Tag, Shirt, Zap, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function TimerCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const targetDate = new Date(expiresAt).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(`Ends in ${parts.join(" ")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span>{timeLeft}</span>;
}

export interface ShopItem {
  id: string;
  name: string;
  type: string;
  price: number;
  rarity: string;
  rarity_color: string;
  icon_name?: string;
  image_url?: string;
  description?: string;
  expires_at?: string | null;
}

function renderIcon(item: ShopItem) {
  const size = 28;
  const color = item.rarity_color;
  if (item.image_url) {
    return <img src={item.image_url} alt={item.name} style={{ width: size, height: size, objectFit: "contain" }} />;
  }
  switch (item.icon_name) {
    case "Star": return <Star size={size} color={color} />;
    case "Zap": return <Zap size={size} color={color} />;
    case "Sparkles": return <Sparkles size={size} color={color} />;
    case "Package": return <Package size={size} color={color} />;
    case "Tag": return <Tag size={size} color={color} />;
    case "Shirt": return <Shirt size={size} color={color} />;
    default: return <Star size={size} color={color} />;
  }
}

// ─── Full-Screen Overlay ──────────────────────────────────────────────────────
function FullScreenOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#09090b",
        overflowY: "auto",
        paddingBottom: "100px",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "linear-gradient(to bottom, #09090b 80%, transparent)",
          padding: "max(env(safe-area-inset-top), 1rem) 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>{title}</h1>
        <button
          onClick={onClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <X size={20} />
        </button>
      </div>
      <div style={{ padding: "8px 16px" }}>{children}</div>
    </div>
  );
}

// ─── Shop Screen ──────────────────────────────────────────────────────────────
function ShopScreen({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const supabase = createClient();
  
  const categories = ["All", "Map Pin", "Name Flair", "Title", "Banner", "Avatar Frame"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch Shop Items
    const { data: shopData } = await supabase
      .from("shop_items")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    // Fetch Inventory
    if (user) {
      const { data: invData } = await supabase
        .from("user_inventory")
        .select("shop_item_id")
        .eq("user_id", user.id);
      
      if (invData) {
        setOwnedIds(new Set(invData.map(i => i.shop_item_id)));
      }
    }

    if (shopData) {
      // Filter out items that have expired
      const now = new Date();
      const activeShopItems = shopData.filter(item => {
        if (!item.expires_at) return true;
        return new Date(item.expires_at) > now;
      });
      setItems(activeShopItems);
    }
    setLoading(false);
  };

  const buyItem = async (item: ShopItem) => {
    if (ownedIds.has(item.id) || purchasing) return;
    setPurchasing(item.id);
    
    const { data, error } = await supabase.rpc("purchase_shop_item", { p_item_id: item.id });
    
    if (error || !data?.success) {
      alert(error?.message || data?.error || "Failed to purchase item.");
    } else {
      // Success! Update local UI
      setOwnedIds(prev => new Set([...prev, item.id]));
      alert(`Successfully purchased ${item.name}! Check your Locker.`);
    }
    
    setPurchasing(null);
  };

  return (
    <FullScreenOverlay title="🛒 Shop" onClose={onClose}>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16, marginTop: 0 }}>
        Spend your coins to unlock exclusive cosmetics and map pins.
      </p>

      {/* Categories */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 12, scrollbarWidth: "none" }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: activeCategory === cat ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${activeCategory === cat ? "rgba(167,139,250,0.5)" : "transparent"}`,
              color: activeCategory === cat ? "#a78bfa" : "var(--text-muted)",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>Loading shop...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {items.filter(item => activeCategory === "All" || item.type === activeCategory).map((item) => {
            const isOwned = ownedIds.has(item.id);
            const isPurchasing = purchasing === item.id;
            
            return (
              <div
                key={item.id}
                style={{
                  background: "var(--bg-card, #18181b)",
                  border: "1px solid var(--border, #27272a)",
                  borderRadius: 16,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Rarity glow */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: item.rarity_color,
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {renderIcon(item)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.type}</div>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: item.rarity_color,
                    background: `${item.rarity_color}22`,
                    padding: "2px 8px",
                    borderRadius: 6,
                    width: "fit-content",
                  }}
                >
                  {item.rarity}
                </div>
                {item.expires_at && (
                  <div style={{ fontSize: 10, color: "#fca5a5", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <TimerCountdown expiresAt={item.expires_at} />
                  </div>
                )}
                <button
                  onClick={() => buyItem(item)}
                  disabled={isOwned || isPurchasing}
                  style={{
                    marginTop: 4,
                    background: isOwned ? "rgba(74, 222, 128, 0.1)" : "rgba(167,139,250,0.1)",
                    border: `1px solid ${isOwned ? "rgba(74, 222, 128, 0.25)" : "rgba(167,139,250,0.25)"}`,
                    borderRadius: 10,
                    padding: "7px 0",
                    color: isOwned ? "#4ade80" : "#a78bfa",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isOwned ? "default" : (isPurchasing ? "wait" : "pointer"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {isOwned ? (
                    <>
                      <CheckCircle2 size={14} /> Owned
                    </>
                  ) : (
                    <>
                      <Lock size={12} /> {isPurchasing ? "..." : item.price.toLocaleString()} Coins
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </FullScreenOverlay>
  );
}

// ─── Locker Screen ────────────────────────────────────────────────────────────
function LockerScreen({ onClose }: { onClose: () => void }) {
  const [ownedItems, setOwnedItems] = useState<ShopItem[]>([]);
  const [equippedPinUrl, setEquippedPinUrl] = useState<string | null>(null);
  const [equippedFlair, setEquippedFlair] = useState<string | null>(null);
  const [equippedTitle, setEquippedTitle] = useState<string | null>(null);
  const [equippedBanner, setEquippedBanner] = useState<string | null>(null);
  const [equippedAvatarFrame, setEquippedAvatarFrame] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const categories = ["All", "Map Pin", "Name Flair", "Title", "Banner", "Avatar Frame"];
  const supabase = createClient();

  useEffect(() => {
    fetchLocker();
  }, []);

  const fetchLocker = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Profile for equipped items
    const { data: profileData } = await supabase
      .from("profiles")
      .select("equipped_pin_url, equipped_flair, equipped_title, equipped_banner, equipped_avatar_frame")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setEquippedPinUrl(profileData.equipped_pin_url);
      setEquippedFlair(profileData.equipped_flair);
      setEquippedTitle(profileData.equipped_title);
      setEquippedBanner(profileData.equipped_banner);
      setEquippedAvatarFrame(profileData.equipped_avatar_frame);
    }

    // Fetch User Inventory Joined with Shop Items
    const { data: invData } = await supabase
      .from("user_inventory")
      .select(`
        shop_item_id,
        shop_items (
          id, name, type, price, rarity, rarity_color, icon_name, image_url, description
        )
      `)
      .eq("user_id", user.id);

    if (invData) {
      const items = invData.map((i: any) => i.shop_items as ShopItem).filter(Boolean);
      setOwnedItems(items);
    }
    
    setLoading(false);
  };

  const equipItem = async (item: ShopItem) => {
    if (equipping) return;
    setEquipping(item.id);

    const { data, error } = await supabase.rpc("equip_shop_item", { p_item_id: item.id });
    
    if (error || !data?.success) {
      alert(error?.message || data?.error || "Failed to equip item.");
    } else {
      if (item.type === 'Map Pin' && item.image_url) {
        setEquippedPinUrl(item.image_url);
      } else if (item.type === 'Name Flair') {
        setEquippedFlair(item.name);
      } else if (item.type === 'Title') {
        setEquippedTitle(item.name);
      } else if (item.type === 'Banner' && item.image_url) {
        setEquippedBanner(item.image_url);
      } else if (item.type === 'Avatar Frame' && item.image_url) {
        setEquippedAvatarFrame(item.image_url);
      }
    }
    
    setEquipping(null);
  };

  return (
    <FullScreenOverlay title="🎒 Locker" onClose={onClose}>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16, marginTop: 0 }}>
        Manage your owned cosmetics and equip your favorites.
      </p>

      {/* Categories */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 12, scrollbarWidth: "none" }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: activeCategory === cat ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${activeCategory === cat ? "rgba(167,139,250,0.5)" : "transparent"}`,
              color: activeCategory === cat ? "#a78bfa" : "var(--text-muted)",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>Loading locker...</div>
      ) : ownedItems.length === 0 ? (
        <div
          style={{
            background: "var(--bg-card, #18181b)",
            border: "1px solid var(--border, #27272a)",
            borderRadius: 16,
            padding: "32px 16px",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          <Archive size={36} color="rgba(167,139,250,0.4)" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            Your locker is empty
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Visit the Shop to unlock cosmetics!
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Owned Items
          </div>
          {ownedItems.filter(item => activeCategory === "All" || item.type === activeCategory).map((item) => {
            // Determine if equipped
            let isEquipped = false;
            if (item.type === 'Map Pin' && item.image_url === equippedPinUrl) {
              isEquipped = true;
            } else if (item.type === 'Name Flair' && item.name === equippedFlair) {
              isEquipped = true;
            } else if (item.type === 'Title' && item.name === equippedTitle) {
              isEquipped = true;
            } else if (item.type === 'Banner' && item.image_url === equippedBanner) {
              isEquipped = true;
            } else if (item.type === 'Avatar Frame' && item.image_url === equippedAvatarFrame) {
              isEquipped = true;
            }

            const isEquipping = equipping === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: "var(--bg-card, #18181b)",
                  border: `1px solid ${isEquipped ? "rgba(167,139,250,0.4)" : "var(--border, #27272a)"}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {renderIcon(item)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.type}</div>
                </div>
                
                {['Map Pin', 'Name Flair', 'Title', 'Banner', 'Avatar Frame'].includes(item.type) ? (
                  <button
                    onClick={() => equipItem(item)}
                    disabled={isEquipped || isEquipping}
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: isEquipped ? "#a78bfa" : "var(--text-primary)",
                      background: isEquipped ? "rgba(167,139,250,0.15)" : "var(--bg-elevated)",
                      border: `1px solid ${isEquipped ? "rgba(167,139,250,0.3)" : "var(--border)"}`,
                      padding: "6px 12px",
                      borderRadius: 8,
                      cursor: isEquipped ? "default" : "pointer",
                    }}
                  >
                    {isEquipping ? "..." : isEquipped ? "Equipped" : "Equip"}
                  </button>
                ) : (
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Non-equippable</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </FullScreenOverlay>
  );
}

// ─── Main Export: Header Buttons ──────────────────────────────────────────────
export default function ShopLockerButtons() {
  const [open, setOpen] = useState<"shop" | "locker" | null>(null);

  return (
    <>
      {/* Shop Button */}
      <button
        id="shop-btn"
        onClick={() => setOpen("shop")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(167,139,250,0.1)",
          border: "1px solid rgba(167,139,250,0.25)",
          borderRadius: 20,
          padding: "7px 14px",
          color: "#a78bfa",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.2)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.1)"; }}
      >
        <ShoppingBag size={15} />
        Shop
      </button>

      {/* Locker Button */}
      <button
        id="locker-btn"
        onClick={() => setOpen("locker")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "7px 14px",
          color: "#e4e4e7",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
      >
        <Archive size={15} />
        Locker
      </button>

      {/* Full-Screen Overlays */}
      {open === "shop" && <ShopScreen onClose={() => setOpen(null)} />}
      {open === "locker" && <LockerScreen onClose={() => setOpen(null)} />}
    </>
  );
}
