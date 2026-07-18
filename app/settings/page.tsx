import Link from "next/link";
import {
  HelpCircle, FileText, Shield, ChevronRight,
  Bell, Palette, Trash2, Info,
} from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

export const metadata = {
  title: "Settings — Armand Games",
};

const sections: Array<{
  heading: string;
  items: Array<{ icon: React.ElementType; label: string; sub: string; href: string; danger?: true }>;
}> = [
  {
    heading: "Support",
    items: [
      { icon: HelpCircle, label: "Help & Support",   sub: "FAQs, contact us",        href: "#" },
      { icon: FileText,   label: "Privacy Policy",   sub: "How we handle your data", href: "#" },
      { icon: Shield,     label: "Security",          sub: "Password, 2FA, sessions", href: "#" },
    ],
  },
  {
    heading: "Preferences",
    items: [
      { icon: Palette, label: "Appearance",        sub: "Theme (dark only for now)", href: "#" },
    ],
  },
  {
    heading: "Account",
    items: [
      { icon: Trash2,  label: "Delete Account",   sub: "Permanently remove data",  href: "#", danger: true },
    ],
  },
];

import InstallAppButton from "@/components/InstallAppButton";

export default function SettingsPage() {
  return (
    <div className="page-shell">
      <h1 className="page-header">Settings</h1>
      <p className="page-subtitle">App preferences & account</p>

      <div style={{ marginBottom: 24 }}>
        <p className="section-title">App Installation</p>
        <div className="settings-card">
          <InstallAppButton />
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.heading} style={{ marginBottom: 24 }}>
          <p className="section-title">{section.heading}</p>
          <div className="settings-card">
            {section.items.map(({ icon: Icon, label, sub, href, danger }, i) => (
              <Link
                key={label}
                href={href}
                className="settings-menu-item"
                style={{
                  borderBottom: (i < section.items.length - 1 || section.heading === "Account") ? "1px solid var(--border)" : "none",
                  color: danger ? "#f87171" : undefined,
                }}
              >
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
              </Link>
            ))}
            
            {section.heading === "Account" && (
              <SignOutButton />
            )}
          </div>
        </div>
      ))}

      {/* ── Version info ── */}
      <div className="version-info">
        <Info size={12} />
        Armand Games v0.1.0 · Built with ♥ in Kurdistan
      </div>
    </div>
  );
}
