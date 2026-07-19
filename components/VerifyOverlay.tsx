"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

export default function VerifyOverlay() {
  const isVerified = useAuthStore((state) => state.isVerified);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid rendering anything until mounted on the client to prevent hydration mismatch
  if (!mounted) return null;

  // If we don't know the status yet, or the user is verified, do not show the overlay
  if (isVerified === null || isVerified === true) return null;

  // We want to allow the user to visit the /profile page to actually verify,
  // and /auth pages to login/signup without being blocked.
  if (pathname === "/profile" || pathname.startsWith("/auth") || pathname === "/") return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      zIndex: 40, // Below BottomNav (50) but above page content
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "auto", // Blocks clicks to the underlying page
    }}>
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 24,
        padding: "32px 24px",
        margin: "0 24px",
        textAlign: "center",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        maxWidth: 400,
        width: "100%",
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(248,113,113,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px"
        }}>
          <ShieldAlert size={32} color="#f87171" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
          Verification Required
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.5 }}>
          You must verify your email address to unlock games, friends, and other core features.
        </p>
        <button 
          onClick={() => router.push("/profile")}
          style={{
            width: "100%",
            padding: "16px",
            background: "var(--neon)",
            border: "none",
            borderRadius: 14,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(167,139,250,0.3)"
          }}
        >
          Go to Profile to Verify
        </button>
      </div>
    </div>
  );
}
