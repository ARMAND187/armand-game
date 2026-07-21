import { Crown, Star, Gem } from "lucide-react";

export default function PlayerNameFlair({ username, flair }: { username: string; flair?: string | null }) {
  if (flair === "Gold Crown") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2b271d", border: "2px solid #f59e0b", padding: "2px 10px", borderRadius: 9999, maxWidth: "100%" }}>
        <Crown size={12} fill="#f59e0b" color="#f59e0b" style={{ flexShrink: 0 }} />
        <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 12 }}>{username}</span>
      </div>
    );
  }
  if (flair === "Verified Star") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2a1a24", border: "2px solid #ec4899", padding: "2px 10px", borderRadius: 9999, maxWidth: "100%" }}>
        <Star size={12} fill="#ec4899" color="#ec4899" style={{ flexShrink: 0 }} />
        <span style={{ color: "#ec4899", fontWeight: 800, fontSize: 12 }}>{username}</span>
      </div>
    );
  }
  if (flair === "Diamond") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1a2530", border: "2px solid #38bdf8", padding: "2px 10px", borderRadius: 9999, maxWidth: "100%" }}>
        <Gem size={12} fill="#38bdf8" color="#38bdf8" style={{ flexShrink: 0 }} />
        <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: 12 }}>{username}</span>
      </div>
    );
  }

  if (flair && flair.trim().startsWith("<svg")) {
    let finalSvg = flair;
    let hasReplaced = false;

    if (finalSvg.includes("PlayerName")) {
      finalSvg = finalSvg.replace("PlayerName", username);
      hasReplaced = true;
    }

    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
        <div 
          style={{ display: "flex", alignItems: "center" }}
          dangerouslySetInnerHTML={{ __html: finalSvg }} 
        />
        {!hasReplaced && <span style={{ fontWeight: 800 }}>@{username}</span>}
      </div>
    );
  }

  if (flair && (flair.startsWith("http") || flair.startsWith("/"))) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
        <img src={flair} alt="Flair" style={{ height: 24, objectFit: "contain" }} />
        <span style={{ fontWeight: 800 }}>@{username}</span>
      </div>
    );
  }

  return (
    <span style={{ 
      whiteSpace: "nowrap", 
      display: "inline-block", 
    }}>
      @{username}
    </span>
  );
}
