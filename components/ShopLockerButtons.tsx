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

function renderIcon(item: ShopItem) {
  const size = 28;
  const color = item.rarity_color;
  if (item.image_url) {
    if (item.image_url.trim().startsWith("<svg")) {
      return (
        <div 
          style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}
          dangerouslySetInnerHTML={{ 
            __html: item.image_url
              .replace(/width="[^"]*"/, 'width="100%"')
              .replace(/height="[^"]*"/, 'height="100%"') 
          }}
        />
      );
    }
    return <img src={item.image_url} alt={item.name} style={{ width: size, height: size, objectFit: "contain" }} />;
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

// ─── Shop Screen ──────────────────────────────────────────────────────────────
function ShopScreen({ onClose, onPurchase }: { onClose: () => void, onPurchase: () => void }) {
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
      setOwnedIds(prev => new Set([...prev, item.id]));
      onPurchase();
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
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: `radial-gradient(circle at center, ${item.rarity_color}22 0%, transparent 70%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 4,
                      boxShadow: `0 0 20px ${item.rarity_color}11`
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
          const val = (item.type === 'Title' || item.type === 'Name Flair') ? item.name : item.image_url;
          const { error } = await supabase.from("profiles").update({ [col]: val }).eq("id", user.id);
          if (error) {
            alert("Failed to equip item.");
          } else {
            if (item.type === 'Map Pin' && item.image_url) setEquippedPinUrl(item.image_url);
            else if (item.type === 'Name Flair') setEquippedFlair(item.name);
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
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    background: isEquipped ? "rgba(255,255,255,0.05)" : "var(--primary, #8b5cf6)",
                    color: isEquipped ? "var(--text-muted)" : "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: (isEquipping || (isEquipped && cat !== 'Map Pin')) ? "not-allowed" : "pointer",
                    opacity: isEquipping ? 0.7 : 1,
                  }}
                >
                  {isEquipping ? "..." : (isEquipped && cat === 'Map Pin' ? "Save Color" : (isEquipped ? "Equipped" : "Equip"))}
                </button>
              </div>
            );
          })}

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginTop: 10, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    background: `radial-gradient(circle at center, ${item.rarity_color}22 0%, transparent 70%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 0 15px ${item.rarity_color}11`
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
