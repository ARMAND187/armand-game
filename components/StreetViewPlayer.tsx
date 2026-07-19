"use client";

/**
 * StreetViewPlayer — client-only component
 *
 * A hybrid router that wraps either the mapillary-js Viewer or ReactPhotoSphereViewer.
 */

import { useEffect, useRef, useState } from "react";
import { Viewer as MapillaryViewerInstance } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";
import { Eye, WifiOff, Camera } from "lucide-react";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";

// ---------------------------------------------------------------------------
// Mapillary Token
// ---------------------------------------------------------------------------
export const MAPILLARY_TOKEN =
  "MLY|27954160734202280|be514215d6940ba81f5f40159f8368b2";

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
      // network error
    }
  }
  return null;
}

interface StreetViewPlayerProps {
  lat: number;
  lng: number;
  locationName: string;
  sourceType: "mapillary" | "custom";
  imageId?: string;
  imageUrl?: string;
  onSkip?: () => void;
}

export default function StreetViewPlayer({
  lat,
  lng,
  locationName,
  sourceType,
  imageId,
  imageUrl,
  onSkip,
}: StreetViewPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<MapillaryViewerInstance | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "no-imagery">("loading");

  useEffect(() => {
    let cancelled = false;

    async function initMapillary() {
      setStatus("loading");
      const finalImageId = imageId || await findNearestImageId(lat, lng);

      if (cancelled) return;

      if (!finalImageId) {
        setStatus("no-imagery");
        return;
      }

      if (viewerRef.current) {
        try {
          await viewerRef.current.moveTo(finalImageId);
          if (!cancelled) setStatus("ready");
        } catch {}
        return;
      }

      if (!containerRef.current) return;

      const viewer = new MapillaryViewerInstance({
        accessToken: MAPILLARY_TOKEN,
        container: containerRef.current,
        imageId: finalImageId,
        component: {
          cover: false,
          attribution: true,
        },
      });

      viewerRef.current = viewer;
      viewer.on("image", () => {
        if (!cancelled) setStatus("ready");
      });
    }

    if (sourceType === "mapillary") {
      initMapillary();
    } else {
      // Custom spherical photos don't need to load an API image
      if (imageUrl) {
        setStatus("ready");
      } else {
        setStatus("no-imagery");
      }
    }

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        viewerRef.current.remove();
        viewerRef.current = null;
      }
    };
  }, [lat, lng, imageId, imageUrl, sourceType]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {sourceType === "mapillary" && (
        <div
          ref={containerRef}
          id="mly"
          style={{ width: "100%", height: "100%", background: "#0a0a14" }}
        />
      )}

      {sourceType === "custom" && status === "ready" && imageUrl && (
        <ReactPhotoSphereViewer
          src={imageUrl}
          height={"100%"}
          width={"100%"}
          defaultZoomLvl={0}
          navbar={false}
          mousewheel={false}
          touchmoveTwoFingers={false}
        />
      )}

      {status === "loading" && (
        <div className="mly-overlay">
          <div className="mly-spinner" />
          <span className="mly-overlay-text">Loading view...</span>
        </div>
      )}

      {status === "no-imagery" && (
        <div className="mly-overlay" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a14", padding: "24px" }}>
          <WifiOff size={32} color="#a78bfa" style={{ marginBottom: 12 }} />
          <span className="mly-overlay-text" style={{ marginBottom: 20 }}>No imagery found for this location.</span>
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

      {status === "ready" && (
        <div className="geo-streetview-overlay">
          {sourceType === "mapillary" ? (
            <><Eye size={10} style={{ display: "inline", marginRight: 4 }} /> Mapillary</>
          ) : (
            <><Camera size={10} style={{ display: "inline", marginRight: 4 }} /> Custom 360 View</>
          )}
        </div>
      )}
    </div>
  );
}
