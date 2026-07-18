"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle, Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Stage = "signup" | "otp";

function mapSignupError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already exists")) {
    return "This email is already registered. Try logging in instead.";
  }
  if (m.includes("password should be at least") || m.includes("at least 6")) {
    return "Password must be at least 6 characters.";
  }
  if (m.includes("too many requests")) return "Too many attempts. Please wait a moment and try again.";
  return message;
}

function mapOtpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("token has expired") || m.includes("invalid") || m.includes("otp")) {
    return "Invalid or expired 6-digit code. Please check your email and try again.";
  }
  return message;
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  // Signup form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Shared state
  const [stage, setStage] = useState<Stage>("signup");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Signup ────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) { setErrorMsg("Passwords do not match."); return; }
    if (password.length < 6) { setErrorMsg("Password must be at least 6 characters."); return; }
    if (!agree) { setErrorMsg("You must agree to the Terms and Conditions."); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.toLowerCase().trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.session) {
        // Email verification disabled — instant login
        router.push("/");
        router.refresh();
      } else {
        // OTP / verification required
        setStage("otp");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(mapSignupError(err?.message || "An unexpected error occurred."));
      setLoading(false);
    }
  };

  // ── OTP ───────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const token = otp.join("");
    if (token.length < 6) { setErrorMsg("Please enter the full 6-digit code."); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
      if (error) throw error;
      // Keep loading true while navigating
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(mapOtpError(err?.message || "An unexpected error occurred."));
      setLoading(false);
    }
  };

  const otpComplete = otp.every((d) => d !== "");

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-base)",
      padding: "24px 16px",
    }}>

      {/* Logo / Brand */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(167,139,250,0.08))",
          border: "1px solid rgba(167,139,250,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          boxShadow: "0 0 40px rgba(167,139,250,0.2)",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: -0.5 }}>
          {stage === "signup" ? "Create account" : "Verify your email"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>
          {stage === "signup" ? "Join Armand Games" : `Code sent to ${email}`}
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 24,
        padding: "32px 24px",
      }}>

        {/* ── OTP Stage ── */}
        {stage === "otp" ? (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Mail icon banner */}
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
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                We sent a <strong style={{ color: "var(--text-primary)" }}>6-digit code</strong> to your inbox. Enter it below to activate your account.
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
                background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 12, color: "#f87171", fontSize: 13, fontWeight: 500, lineHeight: 1.5,
              }}>
                <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                {errorMsg}
              </div>
            )}

            {/* 6-digit OTP input */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={loading}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700,
                    background: "var(--bg-base)", border: `2px solid ${digit ? "var(--neon)" : "var(--border)"}`,
                    borderRadius: 12, color: "var(--text-primary)", outline: "none",
                    opacity: loading ? 0.5 : 1,
                    transition: "border-color 0.15s ease",
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !otpComplete}
              style={{
                padding: "14px",
                background: "var(--neon)", border: "none", borderRadius: 12,
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: (loading || !otpComplete) ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Verifying...
                </>
              ) : "Verify & Continue"}
            </button>

            <button
              type="button"
              onClick={() => { setStage("signup"); setOtp(["","","","","",""]); setErrorMsg(""); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "none", border: "none", color: "var(--text-muted)",
                fontSize: 13, cursor: "pointer", padding: 4,
              }}
            >
              <ArrowLeft size={14} /> Back to sign up
            </button>
          </form>

        ) : (
          /* ── Signup Stage ── */
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Error Banner */}
            {errorMsg && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
                background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 12, color: "#f87171", fontSize: 13, fontWeight: 500, lineHeight: 1.5,
              }}>
                <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                {errorMsg}
              </div>
            )}

            {/* Username */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Username</label>
              <input
                type="text" required disabled={loading}
                value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="cool_gamer_99"
                pattern="^[a-zA-Z0-9_]{3,15}$"
                title="3–15 characters, letters, numbers and underscores only."
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "var(--bg-base)", border: "1px solid var(--border)",
                  borderRadius: 12, color: "var(--text-primary)", fontSize: 14,
                  outline: "none", opacity: loading ? 0.6 : 1,
                }}
              />
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Email Address</label>
              <input
                type="email" required disabled={loading}
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "var(--bg-base)", border: "1px solid var(--border)",
                  borderRadius: 12, color: "var(--text-primary)", fontSize: 14,
                  outline: "none", opacity: loading ? 0.6 : 1,
                }}
              />
            </div>

            {/* Password pair */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"} required disabled={loading}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%", padding: "12px 38px 12px 12px",
                      background: "var(--bg-base)", border: "1px solid var(--border)",
                      borderRadius: 12, color: "var(--text-primary)", fontSize: 14,
                      outline: "none", opacity: loading ? 0.6 : 1,
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Confirm</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"} required disabled={loading}
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%", padding: "12px 38px 12px 12px",
                      background: "var(--bg-base)", border: "1px solid var(--border)",
                      borderRadius: 12, color: "var(--text-primary)", fontSize: 14,
                      outline: "none", opacity: loading ? 0.6 : 1,
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 4 }}>
              <input
                type="checkbox" required disabled={loading}
                checked={agree} onChange={(e) => setAgree(e.target.checked)}
                style={{ accentColor: "var(--neon)", width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                I agree to the{" "}
                <Link href="#" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>
                  Terms and Conditions
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !email || !password || !confirmPassword || !agree}
              style={{
                marginTop: 8, padding: "14px",
                background: "var(--neon)", border: "none", borderRadius: 12,
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: (loading || !username || !email || !password || !confirmPassword || !agree) ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Creating account...
                </>
              ) : "Create Account"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Already have an account?{" "}
              <Link href="/auth/login" style={{ color: "var(--neon)", fontWeight: 600, textDecoration: "none" }}>
                Log In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
