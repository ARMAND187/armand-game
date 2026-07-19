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
  // Track which image URLs have 404'd or failed to load
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    const loadSlides = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, created_at, image_url")
        .eq("type", "broadcast")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (data && data.length > 0) setSlides(data as Broadcast[]);
      setLoading(false);
    };
    loadSlides();
  }, []);

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % Math.max(slides.length, 1));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(advance, 5000);
    return () => clearInterval(id);
  }, [advance, slides.length]);

  // Mark an image URL as broken so we fall back to gradient
  const handleImageError = (url: string) => {
    setBrokenImages((prev) => new Set(prev).add(url));
  };

  // Returns true if image_url exists AND hasn't 404'd
  const hasValidImage = (url: string | null | undefined): url is string => {
    return !!url && !brokenImages.has(url);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ width: "100%", flex: 1, minHeight: 340, borderRadius: 20, background: "#1e1040", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(167,139,250,0.3)", borderTopColor: "var(--neon)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── Empty ── */
  if (slides.length === 0) {
    return (
      <div style={{ width: "100%", flex: 1, minHeight: 340, borderRadius: 20, background: "linear-gradient(135deg,#1e1040 0%,#0f0a2e 100%)", border: "1px solid rgba(167,139,250,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Megaphone size={36} color="rgba(167,139,250,0.4)" />
        <p style={{ margin: 0, fontSize: 14, color: "rgba(167,139,250,0.6)", fontWeight: 600 }}>No broadcasts yet</p>
      </div>
    );
  }

  const slide = slides[active];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>

      {/*
        Hidden preload images for ALL slides — this is how we detect broken URLs.
        When an image 404s, onError fires and we add its URL to brokenImages.
        The actual background div then checks hasValidImage() and falls back to gradient.
      */}
      <div style={{ display: "none" }}>
        {slides.map((s) =>
          s.image_url ? (
            <img
              key={s.id}
              src={s.image_url}
              alt=""
              onError={() => handleImageError(s.image_url!)}
            />
          ) : null
        )}
      </div>

      {/* ── Slide Card ── */}
      <div
        style={{
          flex: 1,
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          minHeight: 340,
          border: "1px solid rgba(167, 139, 250, 0.35)",
          boxShadow: "0 0 28px rgba(167,139,250,0.2)",
          cursor: slides.length > 1 ? "pointer" : "default",
        }}
        onClick={() => slides.length > 1 && advance()}
      >
        {/* Base Gradient (always visible behind the image) */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#1e1040 0%,#0f0a2e 55%,#09090b 100%)" }} />

        {/* Background Image — uses contain on mobile to prevent cropping, cover on large screens */}
        {hasValidImage(slide.image_url) && (
          <div
            className="bg-contain sm:bg-cover bg-top sm:bg-center bg-no-repeat"
            style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${slide.image_url})`,
              transition: "opacity 0.4s ease",
            }}
          />
        )}

        {/* Purple shimmer overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(167,139,250,0.12) 0%,transparent 55%)", pointerEvents: "none" }} />

        {/* Bottom fade for text readability */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80%", background: "linear-gradient(to top,rgba(9,9,11,0.97) 0%,rgba(9,9,11,0.7) 45%,transparent 100%)", pointerEvents: "none" }} />

        {/* Slide counter */}
        {slides.length > 1 && (
          <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.65)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", backdropFilter: "blur(6px)" }}>
            {active + 1} / {slides.length}
          </div>
        )}

        {/* Content — safely padded from edges and bottom dots */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 40px 20px" }}>

          {/* Title */}
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff", lineHeight: 1.25, marginBottom: 8, textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
            {slide.title}
          </h3>

          {/* Body */}
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {slide.body}
          </p>

          {/* Timestamp */}
          <div style={{ marginTop: 10, fontSize: 11, color: "rgba(167,139,250,0.55)", fontFamily: "monospace" }}>
            {formatTime(slide.created_at)}
          </div>
        </div>
        {/* Badge (Top Left) */}
        <div style={{ position: "absolute", top: 14, left: 14, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.55)", border: "1px solid rgba(167,139,250,0.8)", borderRadius: 8, padding: "4px 10px", backdropFilter: "blur(4px)" }}>
          <Wifi size={10} color="#ffffff" />
          <span style={{ fontSize: 10, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.15em" }}>Broadcast</span>
        </div>

        {/* ── Indicator Dots ── */}
        {slides.length > 1 && (
          <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 8 }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActive(i); }}
                style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 4, background: i === active ? "var(--neon)" : "rgba(167,139,250,0.4)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.3s ease, background 0.3s ease", boxShadow: i === active ? "0 0 8px var(--neon-glow)" : "none" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
