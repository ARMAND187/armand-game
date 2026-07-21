"use client";

import { useState, useEffect } from "react";
import { Gift, Tag, Sparkles, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ShopPackage = {
  id: string;
  name: string;
  base_amount: number;
  bonus_amount: number;
  price_usd: number;
};

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  const [packages, setPackages] = useState<ShopPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ShopPackage | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("shop_packages")
      .select("*")
      .order("base_amount", { ascending: true });
      
    if (!error && data) {
      setPackages(data);
    }
    setPackagesLoading(false);
  };

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setStatus("loading");

    const { data, error } = await supabase.rpc("redeem_code", { p_code: trimmed });

    if (error || !data?.success) {
      setStatus("error");
      // The RPC returns a secure generic error or a lockout message
      setMessage(error?.message || data?.error || "Invalid or expired code.");
    } else {
      setStatus("success");
      setMessage(`Code accepted! Added ${data.reward} Balance.`);
    }
  };

  const handlePurchase = (pkg: ShopPackage) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const reset = () => { setCode(""); setStatus("idle"); setMessage(""); };

  return (
    <div className="page-shell">
      <h1 className="page-header">Redeem</h1>
      <p className="page-subtitle">Enter a code or buy Balance</p>

      {/* ── Code Redemption ── */}
      <div className="redeem-card" style={{
        background: "rgba(24, 24, 27, 0.4)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
      }}>
        <div className="redeem-card-header" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Tag size={18} color="var(--neon)" />
          <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Redemption Code</span>
        </div>

        {status === "success" ? (
          <div className="redeem-success" style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle size={48} color="#4ade80" style={{ margin: "0 auto 16px" }} />
            <p className="redeem-feedback-text" style={{ fontSize: 15, fontWeight: 700, color: "#4ade80", marginBottom: 20 }}>{message}</p>
            <button className="btn-redeem-ghost" onClick={reset}>Redeem Another</button>
          </div>
        ) : status === "error" ? (
          <div className="redeem-error" style={{ textAlign: "center", padding: "20px 0" }}>
            <AlertCircle size={48} color="#f87171" style={{ margin: "0 auto 16px" }} />
            <p className="redeem-feedback-text" style={{ fontSize: 15, fontWeight: 700, color: "#f87171", marginBottom: 20 }}>{message}</p>
            <button className="btn-redeem-ghost" onClick={reset}>Try Again</button>
          </div>
        ) : (
          <>
            <p className="redeem-hint" style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Enter your code below. Codes are case-insensitive.
            </p>
            <input
              className="code-input"
              placeholder="XXXX-XXXX-XXXX"
              value={code}
              maxLength={24}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
              id="redeem-code-input"
              spellCheck={false}
              autoComplete="off"
              style={{
                width: "100%",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "16px",
                color: "#fff",
                fontSize: 16,
                letterSpacing: "0.05em",
                marginBottom: 16,
                outline: "none",
                fontFamily: "monospace"
              }}
            />
            <button
              className="btn-redeem"
              onClick={handleRedeem}
              disabled={!code.trim() || status === "loading"}
              id="redeem-submit-btn"
            >
              {status === "loading" ? (
                <span className="mly-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                <>
                  <Gift size={16} />
                  Redeem Code
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* ── Buy Options ── */}
      <div className="redeem-section-header" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Sparkles size={16} color="var(--neon)" />
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Buy Balance</span>
      </div>

      {packagesLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>Loading store...</div>
      ) : packages.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>Store unavailable.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {packages.map((pack) => (
            <div key={pack.id} className="buy-pack" style={{
              background: "rgba(24, 24, 27, 0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 16,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
            }}>
              <div className="buy-pack-icon" style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(167, 139, 250, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                boxShadow: "0 0 15px rgba(167,139,250,0.15)"
              }}>💎</div>
              <div className="buy-pack-info" style={{ flex: 1 }}>
                <div className="buy-pack-amount" style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                  {pack.base_amount.toLocaleString()} Balance
                </div>
                {pack.bonus_amount > 0 && (
                  <div className="buy-pack-bonus" style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", marginTop: 2 }}>
                    +{pack.bonus_amount.toLocaleString()} bonus
                  </div>
                )}
              </div>
              <div className="buy-pack-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <button 
                  className="btn-redeem-small"
                  onClick={() => handlePurchase(pack)}
                  style={{ minWidth: 80, justifyContent: "center" }}
                >
                  ${pack.price_usd}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Premium Modal ── */}
      {isModalOpen && selectedPackage && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 24,
        }}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid rgba(167, 139, 250, 0.3)",
            borderRadius: 24,
            width: "100%",
            maxWidth: 400,
            padding: 32,
            boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(167, 139, 250, 0.15)",
            position: "relative",
            textAlign: "center"
          }}>
            <div style={{
              width: 64, height: 64,
              borderRadius: 16,
              background: "rgba(167, 139, 250, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 0 20px rgba(167, 139, 250, 0.2)"
            }}>
              <Sparkles size={32} color="#a78bfa" />
            </div>
            
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
              {selectedPackage.name}
            </h2>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80", marginBottom: 24 }}>
              {selectedPackage.base_amount + selectedPackage.bonus_amount} Balance
            </div>
            
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 32 }}>
              Please message an admin to manually process your payment and receive a gift code.
            </p>
            
            <button 
              className="btn-redeem" 
              onClick={() => setIsModalOpen(false)}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
