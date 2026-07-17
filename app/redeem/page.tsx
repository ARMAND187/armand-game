"use client";

import { useState } from "react";
import { Gift, Tag, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

export default function RedeemPage() {
  const [code, setCode]       = useState("");
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setStatus("loading");

    // TODO: replace with real Supabase edge-function call
    await new Promise((r) => setTimeout(r, 1200));

    if (trimmed === "DEMO2025") {
      setStatus("success");
      setMessage("Code accepted! Balance updated.");
    } else {
      setStatus("error");
      setMessage("Invalid or expired code. Try again.");
    }
  };

  const reset = () => { setCode(""); setStatus("idle"); setMessage(""); };

  return (
    <div className="page-shell">
      <h1 className="page-header">Redeem</h1>
      <p className="page-subtitle">Enter a code or buy Armand Balance</p>

      {/* ── Code Redemption ── */}
      <div className="redeem-card">
        <div className="redeem-card-header">
          <Tag size={18} color="var(--neon)" />
          <span>Redemption Code</span>
        </div>

        {status === "success" ? (
          <div className="redeem-success">
            <CheckCircle size={36} color="#4ade80" />
            <p className="redeem-feedback-text">{message}</p>
            <button className="btn-redeem-ghost" onClick={reset}>Redeem Another</button>
          </div>
        ) : status === "error" ? (
          <div className="redeem-error">
            <AlertCircle size={36} color="#f87171" />
            <p className="redeem-feedback-text" style={{ color: "#f87171" }}>{message}</p>
            <button className="btn-redeem-ghost" onClick={reset}>Try Again</button>
          </div>
        ) : (
          <>
            <p className="redeem-hint">
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

      {/* ── Buy Options (Coming Soon) ── */}
      <div className="redeem-section-header">
        <Sparkles size={14} color="var(--neon)" />
        <span>Buy Armand Balance</span>
      </div>

      {[
        { amount: 500,   price: "$1.99",  bonus: "" },
        { amount: 1200,  price: "$3.99",  bonus: "+200 bonus" },
        { amount: 3000,  price: "$9.99",  bonus: "+500 bonus" },
        { amount: 7500,  price: "$19.99", bonus: "+1500 bonus" },
      ].map((pack) => (
        <div key={pack.amount} className="buy-pack">
          <div className="buy-pack-icon">💎</div>
          <div className="buy-pack-info">
            <div className="buy-pack-amount">{pack.amount.toLocaleString()} Balance</div>
            {pack.bonus && <div className="buy-pack-bonus">{pack.bonus}</div>}
          </div>
          <div className="buy-pack-right">
            <div className="buy-pack-price">{pack.price}</div>
            <div className="coming-soon-tag">Coming Soon</div>
          </div>
        </div>
      ))}
    </div>
  );
}
