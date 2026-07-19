"use client";

import { useWalletStore } from "@/store/useWalletStore";
import { Wallet, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function WalletPage() {
  const armandBalance = useWalletStore((s) => s.armandBalance);
  const setBalance = useWalletStore((s) => s.setBalance);

  useEffect(() => {
    const fetchBalance = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();
        if (profile?.balance !== undefined) {
          setBalance(profile.balance);
        }
      }
    };
    fetchBalance();
  }, [setBalance]);

  const transactions: { label: string; amount: number; time: string; type: "in" | "out" }[] = [];

  return (
    <div className="wallet-page">
      <h1 className="page-header">Wallet</h1>
      <p className="page-subtitle">Your Balance</p>

      {/* Hero balance card */}
      <div className="wallet-hero">
        <Wallet
          size={32}
          color="#a78bfa"
          style={{ margin: "0 auto 16px", filter: "drop-shadow(0 0 12px rgba(167,139,250,0.6))" }}
        />
        <div className="wallet-balance-label">Balance</div>
        <div className="wallet-balance-value">
          {armandBalance.toLocaleString()}
        </div>
        <div className="wallet-balance-unit">Balance = {armandBalance}</div>
      </div>

      {/* Quick stats */}
      <div className="stat-row">
        <div className="stat-chip">
          <span className="stat-chip-label">Earned</span>
          <span className="stat-chip-value" style={{ fontSize: 18 }}>0</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Spent</span>
          <span className="stat-chip-value" style={{ fontSize: 18 }}>0</span>
        </div>
      </div>

      {/* Transaction history */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Clock size={14} color="var(--text-muted)" />
        <span className="section-title" style={{ margin: 0 }}>Transaction History</span>
      </div>

      {transactions.length === 0 ? (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <TrendingUp size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
            No transactions yet. Play GeoKurdistan to earn!
          </div>
        </div>
      ) : (
        transactions.map((tx, i) => (
          <div key={i} className="lb-row">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: tx.type === "in" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {tx.type === "in"
                ? <ArrowUpRight size={18} color="#4ade80" />
                : <ArrowDownLeft size={18} color="#f87171" />}
            </div>
            <div className="lb-info">
              <div className="lb-name">{tx.label}</div>
              <div className="lb-score">{tx.time}</div>
            </div>
            <div
              className="lb-balance"
              style={{ color: tx.type === "in" ? "#4ade80" : "#f87171" }}
            >
              {tx.type === "in" ? "+" : "-"}{tx.amount}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
