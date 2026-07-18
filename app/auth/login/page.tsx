"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Successful login, go home
      router.push("/");
      router.refresh(); // Refresh to update middleware state
      // DO NOT setLoading(false) here, leave it true while routing
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "An error occurred during login.");
      setLoading(false);
    }
  };

  return (
    <div className="page-shell" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      <div className="settings-card" style={{ padding: "32px 24px" }}>
        <h1 className="page-header" style={{ textAlign: "center", marginBottom: "8px" }}>Welcome Back</h1>
        <p className="page-subtitle" style={{ textAlign: "center", marginBottom: "32px" }}>
          Log in to Armand Games to continue.
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {errorMsg && (
            <div style={{ padding: "12px", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "12px", color: "#f87171", fontSize: "13px", fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}

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
              className="search-input"
              style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
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
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>
          
          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "16px" }}>
            Don&apos;t have an account? <Link href="/auth/signup" style={{ color: "var(--neon)", fontWeight: 600, textDecoration: "none" }}>Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
