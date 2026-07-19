"use client";

import Link from "next/link";
import { HelpCircle, FileText, Shield, ChevronRight, Palette, Trash2 } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import InstallAppButton from "@/components/InstallAppButton";
import { useState } from "react";
import AppearanceModal from "@/components/AppearanceModal";
import SecuritySettings from "@/components/SecuritySettings";

const sections: Array<{
  heading: string;
  items: Array<{ icon: React.ElementType; label: string; sub: string; href?: string; danger?: true, onClickId?: string }>;
}> = [
  {
    heading: "Support",
    items: [
      { icon: HelpCircle, label: "Help & Support",   sub: "FAQs, contact us",        href: "#" },
      { icon: FileText,   label: "Privacy Policy",   sub: "How we handle your data", href: "#" },
    ],
  },
  {
    heading: "Preferences",
    items: [
      { icon: Palette, label: "Appearance",        sub: "Customize app theme", onClickId: "appearance" },
    ],
  },
  {
    heading: "Account",
    items: [
      { icon: Trash2,  label: "Delete Account",   sub: "Permanently remove data",  href: "#", danger: true },
    ],
  },
];

export default function SettingsMenu() {
  const [showAppearance, setShowAppearance] = useState(false);

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <p className="section-title">App Installation</p>
        <div className="settings-card" style={{ marginBottom: 12 }}>
          <InstallAppButton />
        </div>
        <div style={{ padding: "0 4px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          <div style={{ marginBottom: 6 }}><strong style={{ color: "var(--text-primary)" }}>iPhone:</strong> Open in Safari, tap the Share icon, then select <strong style={{ color: "white" }}>Add to Home Screen</strong>.</div>
          <div><strong style={{ color: "var(--text-primary)" }}>Android:</strong> Open in Chrome, tap the 3-dot menu, then select <strong style={{ color: "white" }}>Install App</strong>.</div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.heading}>
          {section.heading === "Account" && (
            <div style={{ marginBottom: 24 }}>
              <p className="section-title">Security</p>
              <SecuritySettings />
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <p className="section-title">{section.heading}</p>
          <div className="settings-card">
            {section.items.map(({ icon: Icon, label, sub, href, danger, onClickId }, i) => {
              
              const content = (
                <>
                  <div className="settings-menu-left">
                    <div
                      className="profile-menu-icon"
                      style={danger ? { color: "#f87171", background: "rgba(248,113,113,0.08)" } : {}}
                    >
                      <Icon size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                      {sub && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
                          {sub}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} color={danger ? "#f87171" : "var(--text-muted)"} />
                </>
              );

              const style = {
                borderBottom: (i < section.items.length - 1 || section.heading === "Account") ? "1px solid var(--border)" : "none",
                color: danger ? "#f87171" : undefined,
                cursor: "pointer",
                width: "100%",
                background: "none",
                textAlign: "left" as const,
                fontFamily: "inherit"
              };

              if (onClickId) {
                return (
                  <button
                    key={label}
                    className="settings-menu-item"
                    style={style}
                    onClick={() => {
                      if (onClickId === "appearance") setShowAppearance(true);
                    }}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={label}
                  href={href || "#"}
                  className="settings-menu-item"
                  style={style}
                >
                  {content}
                </Link>
              );
            })}
            
            {section.heading === "Account" && (
              <SignOutButton />
            )}
          </div>
        </div>
        </div>
      ))}

      {showAppearance && <AppearanceModal onClose={() => setShowAppearance(false)} />}
    </>
  );
}
