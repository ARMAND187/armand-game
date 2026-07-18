import { Info } from "lucide-react";
import SettingsMenu from "@/components/SettingsMenu";

export const metadata = {
  title: "Settings — Armand Games",
};

export default function SettingsPage() {
  return (
    <div className="page-shell">
      <h1 className="page-header">Settings</h1>
      <p className="page-subtitle">App preferences & account</p>

      <SettingsMenu />

      {/* ── Version info ── */}
      <div className="version-info">
        <Info size={12} />
        Armand Games v0.1.0 · Built with ♥ in Kurdistan
      </div>
    </div>
  );
}
