"use client";

import { useWalletStore } from "@/store/useWalletStore";
import { useEffect, useState } from "react";
import {
  Settings, Bell, Gift, ChevronRight,
  Shield, Edit3, RefreshCw, Loader2, Mail, AlertCircle, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import InstallAppButton from "@/components/InstallAppButton";
import { sendOtpEmail } from "@/app/actions/mailer";
import { verifyCustomOTP } from "@/app/actions/verify";
import { useRouter } from "next/navigation";

const menuItems = [
  { icon: Gift,    label: "Redeem Code",    sub: "Enter a gift code",      href: "/redeem" },
  { icon: Shield,  label: "Privacy & Security", sub: "Manage your account", href: "/settings" },
  { icon: Settings, label: "Settings",     sub: "App preferences",         href: "/settings" },
];

export default function ProfilePage() {
  const router = useRouter();
  const armandBalance = useWalletStore((s) => s.armandBalance);
  const [username, setUsername] = useState("Loading...");
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);

  // Verification state
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [verificationStage, setVerificationStage] = useState<"idle" | "sending" | "verifying">("idle");
  const [otp, setOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.user_metadata?.username) {
          setUsername(user.user_metadata.username);
          setEditUsername(user.user_metadata.username);
        } else {
          setUsername("Anonymous");
          setEditUsername("Anonymous");
        }
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, avatar_url, is_verified")
          .eq("id", user.id)
          .single();
          
        if (profile?.is_admin) {
          setIsAdmin(true);
        }
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
        if (profile?.is_verified) {
          setIsVerified(true);
        }
        setIsProfileLoading(false);
      } else {
        setIsProfileLoading(false);
      }
    };
    fetchUser();
  }, [supabase.auth, supabase]);



  const handleRandomizeAvatar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Generate a random seed
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatarUrl = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${randomSeed}`;
    
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: newAvatarUrl })
      .eq("id", user.id);
      
    if (!error) {
      setAvatarUrl(newAvatarUrl);
    }
  };

  const handleSave = async () => {
    const newUsername = editUsername.trim().toLowerCase();
    if (!newUsername) return;
    if (newUsername === username) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      // Check if username is taken in profiles table
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", newUsername)
        .maybeSingle();
        
      if (existingUser) {
        setErrorMsg("Username is already taken.");
        setIsSaving(false);
        return;
      }

      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: newUsername }
      });
      if (authError) throw authError;

      // 2. Update Profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username: newUsername })
          .eq("id", user.id);
        if (profileError) throw profileError;
      }

      setUsername(newUsername);
      setIsEditing(false);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    setVerificationStage("sending");
    setVerifyError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      if (!user.email) throw new Error("No email found for user");

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Insert into otp_codes table
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { error: dbError } = await supabase.from("otp_codes").insert({
        user_id: user.id,
        code,
        expires_at: expiresAt
      });

      if (dbError) throw dbError;

      const res = await sendOtpEmail(user.email, code, user.id);
      if (!res.success) {
        throw new Error(res.error || "Failed to send email");
      }

      setVerificationStage("verifying");
    } catch (err: any) {
      setVerifyError(err.message || "Failed to start verification");
      setVerificationStage("idle");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError("");
    setVerifyLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const res = await verifyCustomOTP(user.id, otp);
      if (!res.success) {
        throw new Error(res.error);
      }

      setIsVerified(true);
      setVerificationStage("idle");
      router.refresh();
    } catch (err: any) {
      setVerifyError(err.message || "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="page-shell">
      {/* ── Profile card ── */}
      <div className="profile-card">
        {verificationStage === "verifying" ? (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              padding: "20px", background: "rgba(167,139,250,0.06)",
              border: "1px solid rgba(167,139,250,0.15)", borderRadius: 16,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Mail size={22} color="var(--neon)" />
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
                We sent a <strong style={{ color: "var(--text-primary)" }}>verification code</strong> to your inbox. Enter it below to activate your account.
              </p>
            </div>

            {verifyError && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
                background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 12, color: "#f87171", fontSize: 13, fontWeight: 500, lineHeight: 1.5,
              }}>
                <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                {verifyError}
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              disabled={verifyLoading}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              autoComplete="one-time-code"
              autoFocus
              style={{
                width: "100%", padding: "18px 16px", background: "var(--bg-base)",
                border: `2px solid ${otp.length === 6 ? "var(--neon)" : "var(--border)"}`,
                borderRadius: 14, color: "var(--text-primary)", fontSize: 28, fontWeight: 700,
                letterSpacing: "0.35em", textAlign: "center", outline: "none",
                opacity: verifyLoading ? 0.5 : 1, transition: "border-color 0.15s ease",
                boxSizing: "border-box",
              }}
            />

            <button
              type="submit"
              disabled={verifyLoading || otp.length < 6}
              style={{
                padding: "14px", background: "var(--neon)", border: "none", borderRadius: 12,
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: (verifyLoading || otp.length < 6) ? 0.6 : 1, transition: "opacity 0.2s",
              }}
            >
              {verifyLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Verifying...
                </>
              ) : "Verify & Continue"}
            </button>

            <button
              type="button"
              onClick={() => { setVerificationStage("idle"); setOtp(""); setVerifyError(""); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "none", border: "none", color: "var(--text-muted)",
                fontSize: 13, cursor: "pointer", padding: 4,
              }}
            >
              <ArrowLeft size={14} /> Cancel
            </button>
          </form>
        ) : (
          <>
            <div className="profile-avatar-ring" style={{ border: "none", background: "none", overflow: "visible" }}>
              <img 
                src={avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${username}`} 
                alt="Avatar" 
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", background: "var(--bg-elevated)", border: "2px solid var(--neon)" }} 
              />
            </div>
            <button 
              onClick={handleRandomizeAvatar}
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "12px", padding: "4px 10px", borderRadius: "10px", marginTop: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={12} /> Randomize Avatar
            </button>
            <div className="profile-username" style={{ textTransform: "none", marginTop: "16px" }}>@{username}</div>

            {errorMsg && (
              <div style={{ color: "#f87171", fontSize: 12, marginTop: 8, textAlign: "center" }}>
                {errorMsg}
              </div>
            )}
            {verifyError && verificationStage === "idle" && (
              <div style={{ color: "#f87171", fontSize: 12, marginTop: 8, textAlign: "center" }}>
                {verifyError}
              </div>
            )}

            <div className="profile-fields" style={{ marginTop: 16 }}>
              <div className="profile-field" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="profile-field-label">Username</span>
                {isEditing ? (
                  <input 
                    className="search-input"
                    style={{ flex: 1, marginLeft: 16, padding: "8px 12px", background: "var(--bg-base)" }}
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    disabled={isSaving}
                    autoFocus
                  />
                ) : (
                  <span className="profile-field-value">{username}</span>
                )}
                
                {isEditing ? (
                  <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                    <button 
                      onClick={() => { setIsEditing(false); setErrorMsg(""); setEditUsername(username); }} 
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave} 
                      className="btn-lobby-play"
                      style={{ padding: "6px 12px", fontSize: 13 }}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    <Edit3 size={15} color="var(--neon)" />
                  </button>
                )}
              </div>

              <div className="profile-field" style={{ borderBottom: "none" }}>
                <span className="profile-field-label">Account Status</span>
                {isProfileLoading ? (
                  <div style={{ marginLeft: "auto", padding: "6px" }}>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "var(--text-muted)" }} />
                  </div>
                ) : isVerified ? (
                  <span className="profile-field-value" style={{ color: "var(--neon)", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                    <Shield size={14} /> Verified
                  </span>
                ) : (
                  <button 
                    onClick={handleRequestVerification} 
                    className="btn-lobby-play"
                    style={{ padding: "6px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, opacity: verificationStage === "sending" ? 0.6 : 1, marginLeft: "auto" }}
                    disabled={verificationStage === "sending"}
                  >
                    {verificationStage === "sending" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Shield size={14} />}
                    {verificationStage === "sending" ? "Sending Code..." : "Verify Account"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Balance tile ── */}
      <div className="profile-balance-tile">
        <div>
          <div className="profile-balance-label">Balance</div>
          <div className="profile-balance-value">{armandBalance.toLocaleString()}</div>
        </div>
        <Link href="/redeem" className="btn-redeem-small" id="profile-redeem-btn">
          <Gift size={14} />
          Redeem
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="stat-row" style={{ marginBottom: 20 }}>
        <div className="stat-chip">
          <span className="stat-chip-label">Rank</span>
          <span className="stat-chip-value" style={{ fontSize: 18 }}>—</span>
        </div>
      </div>

      {/* ── Menu ── */}
      <div className="settings-card">
        {isAdmin && (
          <Link
            href="/admin"
            className="settings-menu-item"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="settings-menu-left">
              <div className="profile-menu-icon" style={{ background: "rgba(167, 139, 250, 0.2)" }}>
                <Shield size={17} color="var(--neon)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--neon)" }}>Admin Dashboard</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Manage users and send broadcasts</div>
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </Link>
        )}
        
        <InstallAppButton />

        {menuItems.map(({ icon: Icon, label, sub, href }, i) => (
          <Link
            key={label}
            href={href}
            className="settings-menu-item"
            style={{ borderBottom: i < menuItems.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div className="settings-menu-left">
              <div className="profile-menu-icon">
                <Icon size={17} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </Link>
        ))}
      </div>
    </div>
  );
}
