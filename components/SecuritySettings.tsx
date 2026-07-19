"use client";

import { X, ShieldAlert, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function SecuritySettings() {
  const supabase = createClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  
  useEffect(() => {
    const fetchEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchEmail();
  }, [supabase.auth]);

  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);

    try {
      // Supabase natively requires just the new password in standard setups
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Password updated successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      showToast(err.message || "An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-card" style={{ padding: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <ShieldAlert size={20} color="var(--neon)" />
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Security</h2>
      </div>

        <div style={{ marginBottom: 24, padding: 16, background: "var(--bg-base)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>Account Email</div>
          <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{email || "Loading..."}</div>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Change Password</div>
          
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{
              width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "12px", color: "var(--text-primary)", outline: "none"
            }}
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "12px", color: "var(--text-primary)", outline: "none"
            }}
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "12px", color: "var(--text-primary)", outline: "none"
            }}
          />

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            style={{
              background: "var(--neon)", color: "#fff", border: "none", borderRadius: "12px",
              padding: "12px", fontWeight: 600, cursor: (loading || !currentPassword || !newPassword || !confirmPassword) ? "not-allowed" : "pointer",
              opacity: (loading || !currentPassword || !newPassword || !confirmPassword) ? 0.5 : 1,
              display: "flex", justifyContent: "center", alignItems: "center"
            }}
          >
            {loading ? <Loader2 className="mly-spinner" size={20} /> : "Update Password"}
          </button>
        </form>

        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Advanced Security</div>
        
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px",
          background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "12px", opacity: 0.6
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ShieldAlert size={20} color="var(--text-muted)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Two-Factor Auth (2FA)</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Authenticator App or SMS</div>
            </div>
          </div>
          <div style={{
            background: "rgba(167,139,250,0.1)", color: "var(--neon)", padding: "4px 8px",
            borderRadius: "6px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase"
          }}>
            Coming Soon
          </div>
        </div>

        {/* Local Toast */}
        {toast && (
          <div style={{
            marginTop: 16,
            background: toast.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(74, 222, 128, 0.1)",
            color: toast.type === "error" ? "#ef4444" : "#4ade80",
            padding: "12px", borderRadius: "8px", fontSize: 14, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8, border: `1px solid ${toast.type === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(74, 222, 128, 0.2)"}`
          }}>
            {toast.type === "success" && <CheckCircle2 size={18} />}
            {toast.message}
          </div>
        )}
      </div>
  );
}
