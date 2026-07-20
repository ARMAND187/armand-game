import { Crown, Star, Gem } from "lucide-react";

export default function PlayerNameFlair({ username, flair }: { username: string; flair?: string | null }) {
  if (flair === "Gold Crown") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2b271d", border: "2px solid #f59e0b", padding: "2px 10px", borderRadius: 9999, maxWidth: "100%" }}>
        <Crown size={12} fill="#f59e0b" color="#f59e0b" style={{ flexShrink: 0 }} />
        <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</span>
      </div>
    );
  }
  if (flair === "Verified Star") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2a1a24", border: "2px solid #ec4899", padding: "2px 10px", borderRadius: 9999, maxWidth: "100%" }}>
        <Star size={12} fill="#ec4899" color="#ec4899" style={{ flexShrink: 0 }} />
        <span style={{ color: "#ec4899", fontWeight: 800, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</span>
      </div>
    );
  }
  if (flair === "Diamond") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1a2530", border: "2px solid #38bdf8", padding: "2px 10px", borderRadius: 9999, maxWidth: "100%" }}>
        <Gem size={12} fill="#38bdf8" color="#38bdf8" style={{ flexShrink: 0 }} />
        <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</span>
      </div>
    );
  }

  const isLong = username.length > 10;
  const scale = isLong ? Math.max(0.5, 10 / username.length) : 1;

  return (
    <span style={{ 
      overflow: "hidden", 
      textOverflow: "ellipsis", 
      whiteSpace: "nowrap", 
      display: "inline-block", 
      maxWidth: "100%",
      fontSize: isLong ? `${scale}em` : "inherit"
    }}>
      @{username}
    </span>
  );
}
