"use client";

import { useState } from "react";
import { ShoppingBag, Archive, X, Lock, Star, Sparkles, Package, Tag, Shirt, Zap } from "lucide-react";

// ─── Shop Items ──────────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  {
    id: 1,
    name: "Neon Purple Frame",
    type: "Avatar Frame",
    price: 500,
    rarity: "Rare",
    rarityColor: "#a78bfa",
    icon: <Star size={28} color="#a78bfa" />,
    description: "A glowing neon purple border for your avatar.",
  },
  {
    id: 2,
    name: "Gold Champion Badge",
    type: "Profile Badge",
    price: 1200,
    rarity: "Epic",
    rarityColor: "#fbbf24",
    icon: <Zap size={28} color="#fbbf24" />,
    description: "Show off your elite status with this golden badge.",
  },
  {
    id: 3,
    name: "Shadow Theme",
    type: "UI Theme",
    price: 800,
    rarity: "Rare",
    rarityColor: "#a78bfa",
    icon: <Sparkles size={28} color="#a78bfa" />,
    description: "A deep shadow color palette for the entire app.",
  },
  {
    id: 4,
    name: "Fire Trail Effect",
    type: "Cursor Effect",
    price: 300,
    rarity: "Common",
    rarityColor: "#94a3b8",
    icon: <Package size={28} color="#f97316" />,
    description: "Leave a trail of fire as you move across the map.",
  },
  {
    id: 5,
    name: "Kurdistan Champion",
    type: "Title",
    price: 2000,
    rarity: "Legendary",
    rarityColor: "#f59e0b",
    icon: <Tag size={28} color="#f59e0b" />,
    description: "The most prestigious title in GeoKurdistan.",
  },
  {
    id: 6,
    name: "Emerald Frame",
    type: "Avatar Frame",
    price: 400,
    rarity: "Common",
    rarityColor: "#94a3b8",
    icon: <Shirt size={28} color="#4ade80" />,
    description: "A sleek emerald green border for your avatar.",
  },
  {
    id: 7,
    name: "Fire Map Pin",
    type: "Map Pin",
    price: 500,
    rarity: "Epic",
    rarityColor: "#fbbf24",
    icon: <img src="/pins/fire-pin.png" alt="Fire Pin" style={{ width: 28, height: 28, objectFit: "contain" }} />,
    description: "A blazing red map pin to mark your territory in GeoKurdistan.",
  },
];

// ─── Locker Items ─────────────────────────────────────────────────────────────
const LOCKER_ITEMS = [
  {
    id: 1,
    name: "Default Frame",
    type: "Avatar Frame",
    equipped: true,
    rarity: "Common",
    rarityColor: "#94a3b8",
    icon: <Star size={28} color="#94a3b8" />,
  },
  {
    id: 2,
    name: "Beta Tester Badge",
    type: "Profile Badge",
    equipped: false,
    rarity: "Epic",
    rarityColor: "#a78bfa",
    icon: <Zap size={28} color="#a78bfa" />,
  },
];

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
      {/* Header */}
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

      {/* Content */}
      <div style={{ padding: "8px 16px" }}>{children}</div>
    </div>
  );
}

// ─── Shop Screen ──────────────────────────────────────────────────────────────
function ShopScreen({ onClose }: { onClose: () => void }) {
  return (
    <FullScreenOverlay title="🛒 Shop" onClose={onClose}>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24, marginTop: 0 }}>
        Spend your coins to unlock exclusive cosmetics and titles.
      </p>

      {/* Coming Soon Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))",
          border: "1px solid rgba(167,139,250,0.3)",
          borderRadius: 16,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Sparkles size={18} color="#a78bfa" />
        <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 600 }}>
          Shop launches soon — Preview items below!
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {SHOP_ITEMS.map((item) => (
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
                background: item.rarityColor,
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
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.type}</div>
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: item.rarityColor,
                background: `${item.rarityColor}22`,
                padding: "2px 8px",
                borderRadius: 6,
                width: "fit-content",
              }}
            >
              {item.rarity}
            </div>
            <button
              disabled
              style={{
                marginTop: 4,
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.25)",
                borderRadius: 10,
                padding: "7px 0",
                color: "#a78bfa",
                fontSize: 12,
                fontWeight: 700,
                cursor: "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <Lock size={12} /> {item.price.toLocaleString()} Coins
            </button>
          </div>
        ))}
      </div>
    </FullScreenOverlay>
  );
}

// ─── Locker Screen ────────────────────────────────────────────────────────────
function LockerScreen({ onClose }: { onClose: () => void }) {
  return (
    <FullScreenOverlay title="🎒 Locker" onClose={onClose}>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24, marginTop: 0 }}>
        Manage your owned cosmetics and equip your favorites.
      </p>

      {/* Empty state for most categories */}
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
          Your locker is mostly empty
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Visit the Shop to unlock cosmetics!
        </div>
      </div>

      {/* Show any unlocked items */}
      {LOCKER_ITEMS.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Owned Items
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {LOCKER_ITEMS.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "var(--bg-card, #18181b)",
                  border: `1px solid ${item.equipped ? "rgba(167,139,250,0.4)" : "var(--border, #27272a)"}`,
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
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.type}</div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: item.equipped ? "#a78bfa" : "var(--text-muted)",
                    background: item.equipped ? "rgba(167,139,250,0.15)" : "transparent",
                    border: `1px solid ${item.equipped ? "rgba(167,139,250,0.3)" : "transparent"}`,
                    padding: "4px 10px",
                    borderRadius: 8,
                  }}
                >
                  {item.equipped ? "Equipped" : "Equip"}
                </span>
              </div>
            ))}
          </div>
        </>
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
