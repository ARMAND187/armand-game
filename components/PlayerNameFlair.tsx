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

      // If the SVG uses a gradient (url(#...)) for its background or border,
      // standard CSS won't be able to render it directly. Fallback to raw SVG rendering.
      if (!bgColor.includes("url(") && !borderColor.includes("url(")) {
        // Extract the icon by stripping out the rect, text, and svg tags
        let iconInner = finalSvg
          .replace(/<rect[^>]*>/, '')
          .replace(/<text[^>]*>.*?<\/text>/, '')
          .replace(/<svg[^>]*>/, '')
          .replace(/<\/svg>/, '')
          .trim();

        // Dynamically extract the viewbox height to properly frame the icon
        let viewBoxMatch = finalSvg.match(/viewBox="0 0 \d+ (\d+)"/);
        let vh = 56;
        if (viewBoxMatch) vh = parseInt(viewBoxMatch[1], 10);

        const iconSvg = `<svg width="24" height="24" viewBox="0 0 ${vh} ${vh}" xmlns="http://www.w3.org/2000/svg">${iconInner}</svg>`;
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
    }

    // Fallback if the SVG is not a standard pill format
    let hasReplaced = false;
    if (finalSvg.includes("PlayerName")) {
      finalSvg = finalSvg.replace("PlayerName", username);
      hasReplaced = true;
      
      // Dynamic username width detection system
      const charDiff = username.length - 10; // "PlayerName" is 10 chars
      if (charDiff !== 0) {
        const extraWidth = charDiff * 12; // Approx 12px per character at standard font size
        
        // Stretch the viewBox
        finalSvg = finalSvg.replace(/viewBox="0 0 (\d+) (\d+)"/, (match, w, h) => {
          return `viewBox="0 0 ${Math.max(50, parseInt(w, 10) + extraWidth)} ${h}"`;
        });
        
        // Stretch any large background rects
        finalSvg = finalSvg.replace(/<rect([^>]*)width="(\d+)"([^>]*)>/g, (match, before, w, after) => {
          const oldW = parseInt(w, 10);
          if (oldW > 80) { // Assume >80px is a background rect
            return `<rect${before}width="${Math.max(20, oldW + extraWidth)}"${after}>`;
          }
          return match;
        });
      }
    }

    // Extract original viewbox height to properly scale the final img height
    let fallbackViewBoxMatch = finalSvg.match(/viewBox="0 0 \d+ (\d+)"/);
    let originalHeight = 56;
    if (fallbackViewBoxMatch) originalHeight = parseInt(fallbackViewBoxMatch[1], 10);
    
    // Scale the img height so that the inner pill (usually ~56px out of the canvas) renders at ~28px
    const scaledHeight = (originalHeight / 56) * 28;

    // Ensure fallback scales down properly
    finalSvg = finalSvg
      .replace(/width="[^"]*"/, '')
      .replace(/height="[^"]*"/, `height="${scaledHeight}"`);

    const fallbackDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(finalSvg)}`;

    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
        <img 
          src={fallbackDataUri} 
          alt="Flair"
          style={{ height: scaledHeight, display: "block" }}
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
