"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Megaphone, Wifi } from "lucide-react";

interface Broadcast {
  id: string;
  title: string;
  body: string;
  created_at: string;
  image_url?: string | null;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NewsCarousel() {
  const [slides, setSlides] = useState<Broadcast[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, created_at, image_url")
        .eq("type", "system")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (data && data.length > 0) setSlides(data as Broadcast[]);
      setLoading(false);
    };
    fetch();
  }, []);

  // Auto-advance every 5 seconds
  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % Math.max(slides.length, 1));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(advance, 5000);
    return () => clearInterval(id);
  }, [advance, slides.length]);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 320,
          background: "var(--bg-surface)",
          borderRadius: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "var(--neon)",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 320,
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "var(--text-muted)",
        }}
      >
        <Megaphone size={36} opacity={0.4} />
        <p style={{ margin: 0, fontSize: 14 }}>No broadcasts yet</p>
      </div>
    );
  }

  const slide = slides[active];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingLeft: 4 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#4ade80",
            boxShadow: "0 0 8px #4ade80",
            animation: "pulse 2s infinite",
          }}
        />
        <Megaphone size={16} color="var(--neon)" />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Global Broadcasts
        </span>
      </div>

      {/* The Carousel Slide Card */}
      <div
        style={{
          flex: 1,
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          minHeight: 300,
          border: "1px solid rgba(167, 139, 250, 0.3)",
          boxShadow: "0 0 24px var(--neon-glow)",
          cursor: slides.length > 1 ? "pointer" : "default",
        }}
        onClick={() => slides.length > 1 && advance()}
      >
        {/* Background Image or Gradient */}
        {slide.image_url ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${slide.image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transition: "opacity 0.6s ease",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, #1e1040 0%, #0f0a2e 50%, #09090b 100%)`,
            }}
          />
        )}

        {/* Animated Slide Transition Overlay (colour accent) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />

        {/* Bottom dark gradient for text readability */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "75%",
            background:
              "linear-gradient(to top, rgba(9,9,11,0.98) 0%, rgba(9,9,11,0.8) 40%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px 24px",
          }}
        >
          {/* "LIVE" badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(167, 139, 250, 0.2)",
              border: "1px solid rgba(167, 139, 250, 0.4)",
              borderRadius: 8,
              padding: "3px 10px",
              marginBottom: 10,
            }}
          >
            <Wifi size={10} color="var(--neon)" />
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--neon)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Broadcast
            </span>
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: 8,
              textShadow: "0 2px 12px rgba(0,0,0,0.8)",
            }}
          >
            {slide.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "rgba(250,250,250,0.75)",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {slide.body}
          </p>
          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              fontFamily: "monospace",
            }}
          >
            {formatTime(slide.created_at)}
          </div>
        </div>

        {/* Slide counter (top-right) */}
        {slides.length > 1 && (
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "3px 10px",
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "monospace",
              backdropFilter: "blur(4px)",
            }}
          >
            {active + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* Indicator Dots */}
      {slides.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 14,
          }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === active ? "var(--neon)" : "var(--border)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.3s ease, background 0.3s ease",
                boxShadow: i === active ? "0 0 8px var(--neon-glow)" : "none",
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
