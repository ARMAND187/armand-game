"use client";

import { useTheme } from "next-themes";
import { X, Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
}

export default function AppearanceModal({ onClose }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="modal-title" style={{ margin: 0, fontSize: 18 }}>Appearance</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => setTheme("system")}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px",
              background: theme === "system" ? "rgba(167,139,250,0.1)" : "var(--bg-elevated)",
              border: `1px solid ${theme === "system" ? "var(--neon)" : "var(--border)"}`,
              borderRadius: "12px", color: "var(--text-primary)", cursor: "pointer"
            }}
          >
            <Monitor size={20} color={theme === "system" ? "var(--neon)" : "var(--text-muted)"} />
            <span style={{ fontWeight: theme === "system" ? 600 : 500 }}>System Default</span>
          </button>

          <button
            onClick={() => setTheme("dark")}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px",
              background: theme === "dark" ? "rgba(167,139,250,0.1)" : "var(--bg-elevated)",
              border: `1px solid ${theme === "dark" ? "var(--neon)" : "var(--border)"}`,
              borderRadius: "12px", color: "var(--text-primary)", cursor: "pointer"
            }}
          >
            <Moon size={20} color={theme === "dark" ? "var(--neon)" : "var(--text-muted)"} />
            <span style={{ fontWeight: theme === "dark" ? 600 : 500 }}>Dark</span>
          </button>

          <button
            onClick={() => setTheme("light")}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px",
              background: theme === "light" ? "rgba(167,139,250,0.1)" : "var(--bg-elevated)",
              border: `1px solid ${theme === "light" ? "var(--neon)" : "var(--border)"}`,
              borderRadius: "12px", color: "var(--text-primary)", cursor: "pointer"
            }}
          >
            <Sun size={20} color={theme === "light" ? "var(--neon)" : "var(--text-muted)"} />
            <span style={{ fontWeight: theme === "light" ? 600 : 500 }}>Light</span>
          </button>
        </div>
      </div>
    </div>
  );
}
