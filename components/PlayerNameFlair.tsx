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

    // Advanced dynamic pill rendering:
    // If it's a standard pill-based SVG from the user (contains rect and text),
    // extract its properties and render a perfect responsive CSS pill!
    const bgMatch = finalSvg.match(/<rect[^>]*fill="([^"]+)"/);
    const borderMatch = finalSvg.match(/<rect[^>]*stroke="([^"]+)"/);
    const textMatch = finalSvg.match(/<text[^>]*fill="([^"]+)"/);

    if (bgMatch && borderMatch && textMatch) {
      const bgColor = bgMatch[1];
      const borderColor = borderMatch[1];
      const textColor = textMatch[1];

      // Extract the icon by stripping out the rect, text, and svg tags
      let iconInner = finalSvg
        .replace(/<rect[^>]*>/, '')
        .replace(/<text[^>]*>.*?<\/text>/, '')
        .replace(/<svg[^>]*>/, '')
        .replace(/<\/svg>/, '')
        .trim();

      // The icon is typically drawn in the first 56x56 area of the 220x56 canvas.
      const iconSvg = `<svg width="24" height="24" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">${iconInner}</svg>`;
      const iconSvgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(iconSvg)}`;

      return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 2, background: bgColor, border: `2px solid ${borderColor}`, padding: "2px 10px 2px 4px", borderRadius: 9999, maxWidth: "100%" }}>
          <img 
            src={iconSvgDataUri} 
            alt="Flair Icon"
            style={{ width: 24, height: 24, marginLeft: -4, marginRight: -2 }}
          />
          <span style={{ color: textColor, fontWeight: 800, fontSize: 12 }}>{username}</span>
        </div>
      );
    }

    // Fallback if the SVG is not a standard pill format
    let hasReplaced = false;
    if (finalSvg.includes("PlayerName")) {
      finalSvg = finalSvg.replace("PlayerName", username);
      hasReplaced = true;
    }

    // Ensure fallback scales down to a reasonable flair height (28px)
    finalSvg = finalSvg
      .replace(/width="[^"]*"/, '')
      .replace(/height="[^"]*"/, 'height="28"');

    const fallbackDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(finalSvg)}`;

    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
        <img 
          src={fallbackDataUri} 
          alt="Flair"
          style={{ height: 28, display: "block" }}
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
