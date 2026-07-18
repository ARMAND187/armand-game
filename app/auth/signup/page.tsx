"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccess(false);

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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        // Confirm email is disabled in Supabase, so they are instantly logged in!
        router.push("/");
        router.refresh();
      } else {
        // Confirm email is enabled, so they must check their email
        setSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      <div className="settings-card" style={{ padding: "32px 24px" }}>
        {!success ? (
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
          <div style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ background: "rgba(167,139,250,0.1)", padding: "16px", borderRadius: "50%", marginBottom: "24px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                <path d="m16 19 2 2 4-4" />
              </svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              Verification link sent!
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.5", maxWidth: "260px" }}>
              Please check your email inbox to activate your account.
            </p>
            <Link href="/auth/login" className="btn-lobby-play" style={{ marginTop: "32px", padding: "12px 24px" }}>
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
