"use client";

/**
 * MapillaryViewer — client-only component
 *
 * Wraps the mapillary-js Viewer. Steps:
 *  1. On mount / location change, query Mapillary Graph API for the
 *     nearest image to the given lat/lng (expanding the bbox if needed).
 *  2. Initialise (or navigate) the Viewer to that imageId.
 *  3. Clean up on unmount to prevent duplicate viewer instances.
 */

import { useEffect, useRef, useState } from "react";
import { Viewer } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";
import { Eye, WifiOff } from "lucide-react";

// ---------------------------------------------------------------------------
// Token — replace with your real Mapillary access token
// ---------------------------------------------------------------------------
export const MAPILLARY_TOKEN =
  "MLY|27954160734202280|be514215d6940ba81f5f40159f8368b2";

// ---------------------------------------------------------------------------
// Fetch the nearest Mapillary imageId to a given lat/lng
// Uses progressively wider bounding boxes to maximise coverage
// ---------------------------------------------------------------------------
async function findNearestImageId(
  lat: number,
  lng: number
): Promise<string | null> {
  const deltas = [0.01, 0.04, 0.1, 0.25]; // ~1 km → ~25 km radius steps

  for (const delta of deltas) {
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    try {
      const res = await fetch(
        `https://graph.mapillary.com/images` +
          `?access_token=${MAPILLARY_TOKEN}` +
          `&fields=id` +
          `&bbox=${bbox}` +
          `&limit=1`
      );
      if (!res.ok) continue;
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        return json.data[0].id as string;
      }
    } catch {
      // network error — try wider bbox next iteration
    }
  }

  return null; // no imagery found at any scale
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MapillaryViewerProps {
  lat: number;
  lng: number;
  locationName: string;
  onSkip?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MapillaryViewer({
  lat,
  lng,
  locationName,
  onSkip,
}: MapillaryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Viewer | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "no-imagery">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus("loading");

      // --- 1. Lookup nearest image ---
      const imageId = await findNearestImageId(lat, lng);

      if (cancelled) return; // component unmounted while fetching

      if (!imageId) {
        setStatus("no-imagery");
        return;
      }

      // --- 2. Initialise or navigate ---
      if (viewerRef.current) {
        // Viewer already exists — just navigate to new image
        try {
          await viewerRef.current.moveTo(imageId);
          if (!cancelled) setStatus("ready");
        } catch {
          // moveTo can throw if the viewer was disposed
        }
        return;
      }

      if (!containerRef.current) return;

      const viewer = new Viewer({
        accessToken: MAPILLARY_TOKEN,
        container: containerRef.current, // the div#mly element
        imageId,
        component: {
          cover: false,        // skip the splash/cover screen
          attribution: true,   // keep Mapillary attribution
        },
      });

      viewerRef.current = viewer;

      // Listen for the first image loaded event
      viewer.on("image", () => {
        if (!cancelled) setStatus("ready");
      });
    }

    init();

    // --- 3. Cleanup ---
    return () => {
      cancelled = true;
      if (viewerRef.current) {
        viewerRef.current.remove();
        viewerRef.current = null;
      }
    };
  }, [lat, lng]); // re-run whenever the round location changes

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ── Mapillary container — id="mly" as required ── */}
      <div
        ref={containerRef}
        id="mly"
        style={{ width: "100%", height: "100%", background: "#0a0a14" }}
      />

      {/* ── Loading overlay ── */}
      {status === "loading" && (
        <div className="mly-overlay">
          <div className="mly-spinner" />
          <span className="mly-overlay-text">Finding imagery near {locationName}…</span>
        </div>
      )}

      {/* ── No imagery fallback ── */}
      {status === "no-imagery" && (
        <div className="mly-overlay" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a14", padding: "24px" }}>
          <WifiOff size={32} color="#a78bfa" style={{ marginBottom: 12 }} />
          <span className="mly-overlay-text">No street-level imagery found near</span>
          <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 16, marginTop: 8, marginBottom: 8, textAlign: "center" }}>
            {locationName}
          </span>
          <span className="mly-overlay-subtext" style={{ marginBottom: 20 }}>
            Use the map below to guess the location anyway, or skip to the next round.
          </span>
          {onSkip && (
            <button
              onClick={onSkip}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "10px 24px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Skip Round
            </button>
          )}
        </div>
      )}

      {/* ── "Mapillary" badge (shown when ready) ── */}
      {status === "ready" && (
        <div className="geo-streetview-overlay">
          <Eye size={10} style={{ display: "inline", marginRight: 4 }} />
          Mapillary
        </div>
      )}
    </div>
  );
}
