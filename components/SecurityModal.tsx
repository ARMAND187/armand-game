"use client";

import { X, ShieldAlert, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  onClose: () => void;
}

export default function SecurityModal({ onClose }: Props) {
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 32, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="modal-title" style={{ margin: 0, fontSize: 18 }}>Security</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
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

        {/* Local Toast Overlay */}
        {toast && (
          <div style={{
            position: "absolute", bottom: 20, left: 16, right: 16,
            background: toast.type === "error" ? "#ef4444" : "var(--neon-green)",
            color: "#fff", padding: "12px 16px", borderRadius: "12px",
            display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            animation: "fade-in 0.2s ease-out"
          }}>
            {toast.type === "error" ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
            <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
