"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      setErrorMsg("You must accept the Terms and Conditions.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/" className="back-link">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>

      <div className="settings-card" style={{ padding: "32px 24px" }}>
        <h1 className="page-header" style={{ textAlign: "center", marginBottom: "8px" }}>Create Account</h1>
        <p className="page-subtitle" style={{ textAlign: "center", marginBottom: "32px" }}>
          Join Armand Games and start playing.
        </p>

        {success ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📬</div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--neon)", marginBottom: "8px" }}>
              Check your email to verify your account!
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              We have sent a confirmation link to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                placeholder="CoolGamer123"
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

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="search-input"
                style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="search-input"
                style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "8px", marginBottom: "8px" }}>
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                style={{ marginTop: "2px", accentColor: "var(--neon)", width: "16px", height: "16px" }}
              />
              <label htmlFor="terms" style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, cursor: "pointer" }}>
                I agree to the <span style={{ color: "var(--neon)" }}>Terms and Conditions</span> and confirm I am of legal age to play.
              </label>
            </div>

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
        )}
      </div>
    </div>
  );
}
