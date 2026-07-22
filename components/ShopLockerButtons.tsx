"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Archive, X, Lock, Star, Sparkles, Package, Tag, Shirt, Zap, CheckCircle2, Ban, Crown, Gem, Circle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { FullScreenOverlay } from "@/components/FullScreenOverlay";
import { useRouter } from "next/navigation";

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
  available_from?: string | null;
  expires_at?: string | null;
}

function renderIcon(item: ShopItem, isPreview: boolean = false) {
  const size = isPreview ? 64 : 28;
  const color = item.rarity_color;

  if (item.type === 'Title') {
    return (
      <div style={{ 
        color: color, 
        fontSize: isPreview ? 32 : 16, 
        fontWeight: 900, 
        textTransform: "uppercase", 
        letterSpacing: "0.05em", 
        textShadow: `0 0 10px ${color}88`,
        textAlign: "center",
        width: "100%"
      }}>
        {item.name}
      </div>
    );
  }

  if (item.image_url) {
    if (item.image_url.trim().startsWith("<svg")) {
      let svgHtml = item.image_url;

      svgHtml = svgHtml
        .replace(/width="[^"]*"/, 'width="100%"')
        .replace(/height="[^"]*"/, 'height="100%"');

      return (
        <div 
          style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      );
    }
    return <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
  }
  switch (item.icon_name) {
    case "Star": return <Star size={size} color={color} />;
    case "Zap": return <Zap size={size} color={color} />;
    case "Sparkles": return <Sparkles size={size} color={color} />;
    case "Package": return <Package size={size} color={color} />;
    case "Tag": return <Tag size={size} color={color} />;
    case "Shirt": return <Shirt size={size} color={color} />;
    case "Crown": return <Crown size={size} color={color} />;
    case "Gem": return <Gem size={size} color={color} />;
    case "Circle": return <Circle size={size} color={color} />;
    default: return <Star size={size} color={color} />;
  }
}

const BUNDLE_CONTENTS: Record<string, string[]> = {
  "Aurora Frost Bundle": ["Aurora Peaks", "Glacier Ring", "Frostbite", "Frostbite Pin", "Aurora"]
};

function getDynamicBundlePrice(bundle: ShopItem, items: ShopItem[], ownedIds: Set<string>): { price: number, fullyOwned: boolean, ownedCount: number, totalContents: number } {
  const contents = BUNDLE_CONTENTS[bundle.name];
  if (!contents) return { price: bundle.price, fullyOwned: false, ownedCount: 0, totalContents: 0 };
  
  let discount = 0;
  let ownedCount = 0;

  for (const itemName of contents) {
    const item = items.find(i => i.name === itemName);
    if (item && ownedIds.has(item.id)) {
      ownedCount++;
      discount += item.price;
    }
  }

  const finalPrice = Math.max(0, bundle.price - discount);
  const fullyOwned = ownedCount === contents.length;

  return { price: finalPrice, fullyOwned, ownedCount, totalContents: contents.length };
}

// 🛒 Shop Screen 🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒🛒──────────────────────────────────────────────────────────────
function ShopScreen({ onClose, onPurchase }: { onClose: () => void, onPurchase: () => void }) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
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
      // Filter out items that have expired or are queued for the future
      const now = new Date();
      const activeShopItems = shopData.filter(item => {
        // Must be available
        if (item.available_from && new Date(item.available_from) > now) return false;
        // Must not be expired
        if (item.expires_at && new Date(item.expires_at) < now) return false;
        
        return true;
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
      const newOwned = new Set([...ownedIds, item.id]);
      if (item.type === "Bundle" && BUNDLE_CONTENTS[item.name]) {
        for (const childName of BUNDLE_CONTENTS[item.name]) {
          const child = items.find(i => i.name === childName);
          if (child) newOwned.add(child.id);
        }
      }
      setOwnedIds(newOwned);
      onPurchase();
      setPreviewItem(null);
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {items.filter(item => activeCategory === "All" || item.type === activeCategory).map((item) => {
            let isOwned = ownedIds.has(item.id);
            let displayPrice = item.price;

            if (item.type === "Bundle") {
              const bundleInfo = getDynamicBundlePrice(item, items, ownedIds);
              displayPrice = bundleInfo.price;
              if (bundleInfo.fullyOwned) {
                isOwned = true;
              }
            }

            const isPurchasing = purchasing === item.id;
            
            return (
              <div
                key={item.id}
                onClick={() => setPreviewItem(item)}
                style={{
                  cursor: "pointer",
                  background: "rgba(24, 24, 27, 0.5)",
                  border: `1px solid ${isOwned ? "rgba(74, 222, 128, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: 20,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  position: "relative",
                  overflow: "hidden",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
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
                {item.price === 0 && !isOwned && (
                  <div style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "rgba(239, 68, 68, 0.9)",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    zIndex: 10,
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
                  }}>
                    FREE
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "center",
                    paddingTop: 12,
                    paddingBottom: 8,
                    flex: 1
                  }}
                >
                  <div
                    style={{
                      width: item.type === 'Name Flair' || item.type === 'Banner' || item.type === 'Title' ? "100%" : 64,
                      height: item.type === 'Banner' ? 80 : (item.type === 'Name Flair' || item.type === 'Title' ? 40 : 64),
                      borderRadius: item.type === 'Banner' ? 8 : (item.type === 'Name Flair' ? 20 : "50%"),
                      background: item.type === 'Title' ? "transparent" : `radial-gradient(circle at center, ${item.rarity_color}22 0%, transparent 70%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 4,
                      boxShadow: item.type === 'Title' ? "none" : `0 0 20px ${item.rarity_color}11`,
                      overflow: "hidden"
                    }}
                  >
                    {renderIcon(item)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.type}</div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: item.rarity_color,
                      background: `${item.rarity_color}15`,
                      border: `1px solid ${item.rarity_color}33`,
                      padding: "4px 10px",
                      borderRadius: 12,
                      width: "fit-content",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginTop: 4,
                    }}
                  >
                    {item.rarity}
                  </div>
                </div>
                {item.expires_at && (
                  <div style={{ fontSize: 10, color: "#fca5a5", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <TimerCountdown expiresAt={item.expires_at} />
                  </div>
                )}
                <div
                  className={isOwned ? "" : "btn-redeem-small"}
                  style={isOwned ? {
                    marginTop: 4,
                    background: "rgba(74, 222, 128, 0.1)",
                    border: "1px solid rgba(74, 222, 128, 0.25)",
                    borderRadius: 999,
                    padding: "7px 0",
                    color: "#4ade80",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    width: "100%"
                  } : {
                    marginTop: 4,
                    justifyContent: "center",
                    width: "100%",
                    pointerEvents: "none"
                  }}
                >
                  {isOwned ? (
                    <>
                      <CheckCircle2 size={14} /> Owned
                    </>
                  ) : (
                    <>
                      <Lock size={12} /> {displayPrice.toLocaleString()} Coins
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Preview Modal */}
      {previewItem && (() => {
        let isOwned = ownedIds.has(previewItem.id);
        let displayPrice = previewItem.price;

        if (previewItem.type === "Bundle") {
          const bundleInfo = getDynamicBundlePrice(previewItem, items, ownedIds);
          displayPrice = bundleInfo.price;
          if (bundleInfo.fullyOwned) {
            isOwned = true;
          }
        }
        
        const isPurchasing = purchasing === previewItem.id;

        return (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.85)", zIndex: 100000,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(12px)", padding: 24
          }}>
            <div style={{
              background: "var(--bg-panel)",
              border: `1px solid ${previewItem.rarity_color}55`,
              borderRadius: 24,
              width: "100%", maxWidth: 460,
              maxHeight: "90vh",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 40px ${previewItem.rarity_color}22`
            }}>
              {/* Header */}
              <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Item Preview</div>
                <button onClick={() => setPreviewItem(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                  <X size={24} />
                </button>
              </div>

              {/* Preview Area */}
              <div style={{ 
                height: 240,
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `radial-gradient(circle at center, ${previewItem.rarity_color}15 0%, transparent 70%)`,
                padding: 32,
                position: "relative"
              }}>
                {previewItem.price === 0 && !isOwned && (
                  <div style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    background: "rgba(239, 68, 68, 0.9)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    zIndex: 10,
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)"
                  }}>
                    FREE
                  </div>
                )}
                <div style={{ 
                  width: previewItem.type === 'Name Flair' || previewItem.type === 'Banner' || previewItem.type === 'Title' ? "100%" : "auto",
                  height: previewItem.type === 'Banner' ? 160 : (previewItem.type === 'Name Flair' ? 80 : "auto"),
                  transform: previewItem.type === 'Name Flair' || previewItem.type === 'Banner' || previewItem.type === 'Title' ? "scale(1)" : "scale(2.5)", 
                  transformOrigin: "center",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  {renderIcon(previewItem, true)}
                </div>
              </div>

              {/* Details */}
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 4 }}>
                    {previewItem.name}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{previewItem.type}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: previewItem.rarity_color,
                      background: `${previewItem.rarity_color}15`, padding: "2px 8px", borderRadius: 12, textTransform: "uppercase"
                    }}>
                      {previewItem.rarity}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {previewItem.description || "A mysterious item from the shop."}
                </div>

                {/* Bundle Contents List */}
                {previewItem.type === "Bundle" && BUNDLE_CONTENTS[previewItem.name] && (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Bundle Contents:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {BUNDLE_CONTENTS[previewItem.name].map(childName => {
                        const child = items.find(i => i.name === childName);
                        const ownsChild = child && ownedIds.has(child.id);
                        return (
                          <div key={childName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                            <span style={{ color: ownsChild ? "var(--text-muted)" : "#fff", textDecoration: ownsChild ? "line-through" : "none" }}>
                              {childName}
                            </span>
                            {ownsChild ? (
                              <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>Owned</span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{child?.price} Coins</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Buy Button */}
                <button
                  onClick={() => buyItem(previewItem)}
                  disabled={isOwned || isPurchasing}
                  className={isOwned ? "" : "btn-redeem-large"}
                  style={isOwned ? {
                    background: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.25)",
                    borderRadius: 12, padding: 16, color: "#4ade80", fontSize: 16, fontWeight: 800,
                    cursor: "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%"
                  } : { width: "100%", justifyContent: "center" }}
                >
                  {isOwned ? (
                    <><CheckCircle2 size={18} /> Owned</>
                  ) : (
                    <><Lock size={16} /> {isPurchasing ? "Purchasing..." : `Purchase for ${displayPrice.toLocaleString()} Coins`}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </FullScreenOverlay>
  );
}

// ─── Locker Screen ────────────────────────────────────────────────────────────
function LockerScreen({ onClose, refreshKey }: { onClose: () => void, refreshKey: number }) {
  const router = useRouter();
  const [ownedItems, setOwnedItems] = useState<ShopItem[]>([]);
  const [equippedPinUrl, setEquippedPinUrl] = useState<string | null>(null);
  const [equippedFlair, setEquippedFlair] = useState<string | null>(null);
  const [equippedTitle, setEquippedTitle] = useState<string | null>(null);
  const [equippedBanner, setEquippedBanner] = useState<string | null>(null);
  const [equippedAvatarFrame, setEquippedAvatarFrame] = useState<string | null>(null);
  const [pinColor, setPinColor] = useState<string>("#a78bfa");
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [equippingDefault, setEquippingDefault] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const categories = ["All", "Map Pin", "Name Flair", "Title", "Banner", "Avatar Frame"];
  const supabase = createClient();

  useEffect(() => {
    fetchLocker();
  }, [refreshKey]);

  const fetchLocker = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Profile for equipped items
    const { data: profileData } = await supabase
      .from("profiles")
      .select("equipped_pin_url, equipped_flair, equipped_title, equipped_banner, equipped_avatar_frame, pin_color, challenge_rising_star, challenge_sniper, challenge_high_roller, challenge_speedrunner, current_streak")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setEquippedPinUrl(profileData.equipped_pin_url);
      setEquippedFlair(profileData.equipped_flair);
      setEquippedTitle(profileData.equipped_title);
      setEquippedBanner(profileData.equipped_banner);
      setEquippedAvatarFrame(profileData.equipped_avatar_frame);
      setPinColor(profileData.pin_color || "#a78bfa");
    }

    // Fetch User Inventory Joined with Shop Items
    const { data: invData } = await supabase
      .from("user_inventory")
      .select(`
        shop_item_id,
        challenge_item_id,
        streak_item_id,
        shop_items (
          id, name, type, price, rarity, rarity_color, icon_name, image_url, description
        ),
        challenge_items (
          id, name, title, description, balance, icon_name, image_url, rarity, rarity_color
        ),
        streak_items (
          id, name, title, description, balance, icon_name, image_url, rarity, rarity_color
        )
      `)
      .eq("user_id", user.id);

    let items: ShopItem[] = [];
    if (invData) {
      const getType = (t: string) => {
        if (!t) return "Title";
        const low = t.toLowerCase();
        if (low.includes("pin")) return "Map Pin";
        if (low.includes("flair")) return "Name Flair";
        if (low.includes("banner")) return "Banner";
        if (low.includes("frame") || low.includes("avatar")) return "Avatar Frame";
        if (low.includes("reward") || low.includes("balance") || low.includes("coin")) return "Reward";
        return "Title";
      };
      
      invData.forEach((i: any) => {
        if (i.shop_items) items.push(i.shop_items as ShopItem);
        if (i.challenge_items) items.push({ ...i.challenge_items, type: getType(i.challenge_items.title), price: i.challenge_items.balance, id: "chal_" + i.challenge_items.id } as ShopItem);
        if (i.streak_items) items.push({ ...i.streak_items, type: getType(i.streak_items.title), price: i.streak_items.balance, id: "strk_" + i.streak_items.id } as ShopItem);
      });
    }
    
    // Fetch user challenge progress to grant fallback legacy titles
    const { data: progressData } = await supabase.from("user_challenge_progress").select("challenge_id, completed").eq("user_id", user.id).eq("completed", true);
    
    // Fetch dynamic challenges to know which reward_id corresponds to completed challenges
    const { data: challengesData } = await supabase.from("dynamic_challenges").select("id, reward_id");
    
    // Fetch special items from database to get their dynamic colors and icons
    const { data: specialData } = await supabase.from("shop_items").select("*").in("type", ["Challenge Title", "Streak Title"]);
    
    // Legacy fallback for old items (if they don't exist in user_inventory yet)
    if (profileData && specialData) {
      const pushSpecial = (name: string, condition: boolean, prefixId: string) => {
        if (condition && !items.some(i => i.name === name)) {
          const dbItem = specialData.find(i => i.name === name);
          if (dbItem) {
            items.push({ ...dbItem, type: "Title", id: prefixId } as ShopItem);
          } else {
            // Virtual item fallback if missing from DB
            items.push({
              id: prefixId,
              name: name,
              type: "Title",
              description: "Special achievement title",
              price: 0,
              rarity: "Epic",
              rarity_color: "#a78bfa"
            } as ShopItem);
          }
        }
      };

      pushSpecial('Navigator', profileData.current_streak >= 1, 'strk_navigator'); 
      
      // Determine which challenges are completed based on user_challenge_progress
      const completedChallengeIds = new Set(progressData?.map(p => p.challenge_id) || []);
      const checkChallenge = (rewardId: string) => {
        const chal = challengesData?.find(c => c.reward_id === rewardId);
        return chal ? completedChallengeIds.has(chal.id) : false;
      };

      pushSpecial('Sniper', checkChallenge('chal_sniper') || profileData.challenge_sniper >= 1, 'chal_sniper');
      pushSpecial('Speedrunner', checkChallenge('chal_speedrunner') || profileData.challenge_speedrunner >= 1, 'chal_speedrunner');
      pushSpecial('High Roller', checkChallenge('chal_high_roller') || profileData.challenge_high_roller >= 1, 'chal_high_roller');
      pushSpecial('Rising Star', checkChallenge('chal_rising_star') || profileData.challenge_rising_star >= 1, 'chal_rising_star');
    }

    setOwnedItems(items);
    
    setLoading(false);
  };



  const equipItem = async (item: ShopItem) => {
    if (equipping) return;
    setEquipping(item.id);

    if (item.id.startsWith('chal_') || item.id.startsWith('strk_')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let col = "";
        if (item.type === 'Map Pin') col = 'equipped_pin_url';
        if (item.type === 'Name Flair') col = 'equipped_flair';
        if (item.type === 'Title') col = 'equipped_title';
        if (item.type === 'Banner') col = 'equipped_banner';
        if (item.type === 'Avatar Frame') col = 'equipped_avatar_frame';
        
        if (col) {
          const val = item.type === 'Title' ? item.name : (item.image_url || item.name);
          const { error } = await supabase.from("profiles").update({ [col]: val }).eq("id", user.id);
          if (error) {
            alert("Failed to equip item.");
          } else {
            if (item.type === 'Map Pin' && item.image_url) setEquippedPinUrl(item.image_url);
            else if (item.type === 'Name Flair') setEquippedFlair(item.image_url || item.name);
            else if (item.type === 'Title') setEquippedTitle(item.name);
            else if (item.type === 'Banner' && item.image_url) setEquippedBanner(item.image_url);
            else if (item.type === 'Avatar Frame' && item.image_url) setEquippedAvatarFrame(item.image_url);
            router.refresh();
          }
        }
      }
      setEquipping(null);
      return;
    }

    const { data, error } = await supabase.rpc("equip_shop_item", { p_item_id: item.id });
    
    if (error || !data?.success) {
      alert(error?.message || data?.error || "Failed to equip item.");
    } else {
      // The RPC might save the item.name instead of item.image_url for SVGs.
      // We explicitly override the column here to ensure the full SVG data is saved.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let col = "";
        if (item.type === 'Map Pin') col = 'equipped_pin_url';
        if (item.type === 'Name Flair') col = 'equipped_flair';
        if (item.type === 'Title') col = 'equipped_title';
        if (item.type === 'Banner') col = 'equipped_banner';
        if (item.type === 'Avatar Frame') col = 'equipped_avatar_frame';
        
        if (col) {
          const val = item.type === 'Title' ? item.name : (item.image_url || item.name);
          await supabase.from("profiles").update({ [col]: val }).eq("id", user.id);
        }
      }

      if (item.type === 'Map Pin' && item.image_url) {
        setEquippedPinUrl(item.image_url);
      } else if (item.type === 'Name Flair') {
        setEquippedFlair(item.image_url || item.name);
      } else if (item.type === 'Title') {
        setEquippedTitle(item.name);
      } else if (item.type === 'Banner' && item.image_url) {
        setEquippedBanner(item.image_url);
      } else if (item.type === 'Avatar Frame' && item.image_url) {
        setEquippedAvatarFrame(item.image_url);
      }
      router.refresh();
    }
    
    setEquipping(null);
  };

  const unequipCategory = async (type: string) => {
    if (equippingDefault) return;
    setEquippingDefault(type);
    
    let col = "";
    if (type === 'Map Pin') col = 'equipped_pin_url';
    if (type === 'Name Flair') col = 'equipped_flair';
    if (type === 'Title') col = 'equipped_title';
    if (type === 'Banner') col = 'equipped_banner';
    if (type === 'Avatar Frame') col = 'equipped_avatar_frame';
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user && col) {
      const updateData: any = { [col]: null };
      // If saving map pin default, also save pin color
      if (type === 'Map Pin') {
        updateData.pin_color = pinColor;
      }
      
      const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);
      if (!error) {
        if (type === 'Map Pin') setEquippedPinUrl(null);
        if (type === 'Name Flair') setEquippedFlair(null);
        if (type === 'Title') setEquippedTitle(null);
        if (type === 'Banner') setEquippedBanner(null);
        if (type === 'Avatar Frame') setEquippedAvatarFrame(null);
        router.refresh();
      }
    }
    setEquippingDefault(null);
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
            Equipped & Default
          </div>
          
          {/* Default Items */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {categories.filter(c => c !== "All" && (activeCategory === "All" || activeCategory === c)).map(cat => {
            let isEquipped = false;
            if (cat === 'Map Pin' && !equippedPinUrl) isEquipped = true;
            if (cat === 'Name Flair' && !equippedFlair) isEquipped = true;
            if (cat === 'Title' && !equippedTitle) isEquipped = true;
            if (cat === 'Banner' && !equippedBanner) isEquipped = true;
            if (cat === 'Avatar Frame' && !equippedAvatarFrame) isEquipped = true;
            
            const isEquipping = equippingDefault === cat;
            
            return (
              <div
                key={`default-${cat}`}
                style={{
                  background: "rgba(24, 24, 27, 0.4)",
                  border: `1px solid ${isEquipped ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 16,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: cat === 'Map Pin' ? pinColor : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <Ban size={20} color={cat === 'Map Pin' ? "#fff" : "currentColor"} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>Default {cat}</h4>
                    {isEquipped && <div style={{ background: "#4ade8022", color: "#4ade80", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>EQUIPPED</div>}
                  </div>
                  {cat === 'Map Pin' ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Pin Color:</span>
                      <input 
                        type="color" 
                        value={pinColor} 
                        onChange={(e) => setPinColor(e.target.value)} 
                        style={{ border: "none", width: 24, height: 24, padding: 0, cursor: "pointer", background: "none" }}
                      />
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Unequip current {cat.toLowerCase()}</p>
                  )}
                </div>
                
                <button
                  onClick={() => unequipCategory(cat)}
                  disabled={isEquipping || (isEquipped && cat !== 'Map Pin')}
                  className={isEquipped && cat !== 'Map Pin' ? "" : "btn-redeem-small"}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: isEquipped ? "rgba(167,139,250,0.15)" : "",
                    border: isEquipped ? "1px solid rgba(167,139,250,0.3)" : "",
                    color: isEquipped ? "#a78bfa" : "",
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: (isEquipping || (isEquipped && cat !== 'Map Pin')) ? "default" : "pointer",
                    opacity: isEquipping ? 0.7 : 1,
                  }}
                >
                  {isEquipping ? "..." : (isEquipped && cat === 'Map Pin' ? "Save Color" : (isEquipped ? "Equipped" : "Equip"))}
                </button>
              </div>
            );
          })}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginTop: 10, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Owned Items
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {ownedItems.filter(item => activeCategory === "All" || item.type === activeCategory).map((item) => {
            // Determine if equipped
            let isEquipped = false;
            if (item.type === 'Map Pin' && item.image_url === equippedPinUrl) {
              isEquipped = true;
            } else if (item.type === 'Name Flair' && (item.image_url === equippedFlair || item.name === equippedFlair)) {
              isEquipped = true;
            } else if (item.type === 'Title' && item.name === equippedTitle) {
              isEquipped = true;
            } else if (item.type === 'Banner' && (item.image_url === equippedBanner || item.name === equippedBanner)) {
              isEquipped = true;
            } else if (item.type === 'Avatar Frame' && (item.image_url === equippedAvatarFrame || item.name === equippedAvatarFrame)) {
              isEquipped = true;
            }

            const isEquipping = equipping === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(24, 24, 27, 0.4)",
                  border: `1px solid ${isEquipped ? "rgba(74, 222, 128, 0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 16,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    width: item.type === 'Name Flair' || item.type === 'Banner' || item.type === 'Title' ? 120 : 54,
                    height: item.type === 'Banner' ? 40 : (item.type === 'Name Flair' || item.type === 'Title' ? 30 : 54),
                    borderRadius: item.type === 'Banner' ? 4 : (item.type === 'Name Flair' ? 14 : 14),
                    background: item.type === 'Title' ? "transparent" : `radial-gradient(circle at center, ${item.rarity_color}22 0%, transparent 70%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: item.type === 'Title' ? "none" : `0 0 15px ${item.rarity_color}11`,
                    overflow: "hidden"
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
                    className={isEquipped ? "" : "btn-redeem-small"}
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: isEquipped ? "#4ade80" : "",
                      background: isEquipped ? "rgba(74, 222, 128, 0.1)" : "",
                      border: isEquipped ? "1px solid rgba(74, 222, 128, 0.3)" : "",
                      padding: "6px 14px",
                      borderRadius: 999,
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
        </div>
      )}
    </FullScreenOverlay>
  );
}

// ─── Main Export: Header Buttons ──────────────────────────────────────────────
export default function ShopLockerButtons() {
  const [open, setOpen] = useState<"shop" | "locker" | null>(null);
  const [refreshLocker, setRefreshLocker] = useState(0);

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

      {/* Full-Screen Overlays (Pre-mounted for instant load) */}
      <div style={{ display: open === "shop" ? "block" : "none" }}>
        <ShopScreen onClose={() => setOpen(null)} onPurchase={() => setRefreshLocker(r => r + 1)} />
      </div>
      <div style={{ display: open === "locker" ? "block" : "none" }}>
        <LockerScreen onClose={() => setOpen(null)} refreshKey={refreshLocker} />
      </div>
    </>
  );
}
