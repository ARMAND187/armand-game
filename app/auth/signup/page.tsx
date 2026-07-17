"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // OTP Verification state
  const [otpCode, setOtpCode] = useState("");

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!agree) {
      setErrorMsg("You must agree to the Terms and Conditions.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase().trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      // Success! Move to verification step
      setStep("verify");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "signup",
      });

      if (error) {
        throw error;
      }

      // Successfully verified and logged in, redirect home
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      <div className="settings-card" style={{ padding: "32px 24px" }}>
        {step === "form" ? (
          <>
            <h1 className="page-header" style={{ textAlign: "center", marginBottom: "8px" }}>Create Account</h1>
            <p className="page-subtitle" style={{ textAlign: "center", marginBottom: "32px" }}>
              Join Armand Games and start climbing the leaderboard.
            </p>

            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {errorMsg && (
                <div style={{ padding: "12px", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "12px", color: "#f87171", fontSize: "13px", fontWeight: 500 }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  className="search-input"
                  style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cool_gamer_99"
                  pattern="^[a-zA-Z0-9_]{3,15}$"
                  title="Username must be 3-15 characters, alphanumeric and underscores only."
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="search-input"
                  style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@example.com"
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="search-input"
                    style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    className="search-input"
                    style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  required
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  style={{ accentColor: "var(--neon)", width: "16px", height: "16px" }}
                />
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  I agree to the <Link href="#" style={{ color: "var(--text-primary)" }}>Terms and Conditions</Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn-lobby-play"
                style={{ width: "100%", justifyContent: "center", padding: "14px", marginTop: "8px" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mly-spinner" size={18} style={{ border: "none", marginBottom: 0 }} />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
              
              <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "16px" }}>
                Already have an account? <Link href="/auth/login" style={{ color: "var(--neon)", fontWeight: 600, textDecoration: "none" }}>Log In</Link>
              </p>
            </form>
          </>
        ) : (
          <>
            {/* OTP Verification Step */}
            <h1 className="page-header" style={{ textAlign: "center", marginBottom: "8px" }}>Verify Email</h1>
            <p className="page-subtitle" style={{ textAlign: "center", marginBottom: "32px" }}>
              We&apos;ve sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
            </p>

            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {errorMsg && (
                <div style={{ padding: "12px", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "12px", color: "#f87171", fontSize: "13px", fontWeight: 500 }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  className="search-input"
                  style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px", textAlign: "center", letterSpacing: "8px", fontSize: "20px", fontWeight: 700 }}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="btn-lobby-play"
                style={{ width: "100%", justifyContent: "center", padding: "14px", marginTop: "8px" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mly-spinner" size={18} style={{ border: "none", marginBottom: 0 }} />
                    Verifying...
                  </>
                ) : (
                  "Verify & Log In"
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep("form")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", marginTop: "16px", cursor: "pointer", textDecoration: "underline" }}
              >
                Change Email Address
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
