"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed")) return "Please verify your email address before logging in.";
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) return "Invalid email or password. Please try again.";
  if (m.includes("too many requests")) return "Too many attempts. Please wait a moment and try again.";
  return message;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Logging in...");
  const [errorMsg, setErrorMsg] = useState(
    searchParams.get("error") === "invalid_link"
      ? "Your verification link is invalid or has expired. Please request a new one."
      : ""
  );

  // Prefetch the destination on mount so Vercel wakes the serverless
  // function in the background while the user types their credentials.
  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoadingText("Logging in...");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Auth succeeded — set up progressive labels in case the serverless
      // function is cold-starting. clearTimeout ensures no flicker if fast.
      const t1 = setTimeout(() => setLoadingText("Authenticating..."), 1500);
      const t2 = setTimeout(() => setLoadingText("Waking up servers..."), 4000);

      router.push("/");
      router.refresh();

      clearTimeout(t1);
      clearTimeout(t2);
    } catch (err: any) {
      // Always unblock the button on failure — this was causing the infinite freeze.
      setErrorMsg(mapAuthError(err?.message || "An unexpected error occurred."));
      setLoading(false);
    }
  };

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
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>
          Log in to Armand Games
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
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

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

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              Email Address
            </label>
            <input
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@example.com"
              style={{
                width: "100%", padding: "12px 14px",
                background: "var(--bg-base)", border: "1px solid var(--border)",
                borderRadius: 12, color: "var(--text-primary)", fontSize: 14,
                outline: "none", opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 44px 12px 14px",
                  background: "var(--bg-base)", border: "1px solid var(--border)",
                  borderRadius: 12, color: "var(--text-primary)", fontSize: 14,
                  outline: "none", opacity: loading ? 0.6 : 1,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              marginTop: 8, padding: "14px",
              background: "var(--neon)", border: "none", borderRadius: 12,
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: (loading || !email || !password) ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                {loadingText}
              </>
            ) : "Log In"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" style={{ color: "var(--neon)", fontWeight: 600, textDecoration: "none" }}>
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
