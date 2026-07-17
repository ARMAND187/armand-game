"use client";

/**
 * GeoKurdistan Game Page
 *
 * Split view:
 *  - Top  : Mapillary street-level imagery viewer (mapillary-js)
 *  - Bottom: react-leaflet map — click to drop a single marker
 *
 * The game is 100% free-to-play. Nothing is deducted from armandBalance.
 */

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, RotateCcw, MapPin } from "lucide-react";
import { kurdistanLocations, KurdistanLocation } from "@/data/locations";
import { calculateHaversineDistance } from "@/utils/haversine";

// ── Dynamically import both panels (no SSR — both need window / DOM) ──
const MapillaryViewer = dynamic(
  () => import("@/components/MapillaryViewer"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a14",
          color: "#a1a1aa",
          fontSize: 13,
          gap: 8,
        }}
      >
        <div className="mly-spinner" />
        Initialising viewer…
      </div>
    ),
  }
);

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d0d1a",
        color: "#a1a1aa",
        fontSize: 13,
      }}
    >
      Loading map…
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface GuessResult {
  location: KurdistanLocation;
  guessLat: number;
  guessLng: number;
  distanceKm: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


function gradeDistance(km: number): {
  emoji: string;
  label: string;
  color: string;
} {
  if (km < 5)   return { emoji: "🎯", label: "Incredible! Under 5 km!", color: "#4ade80" };
  if (km < 20)  return { emoji: "🔥", label: "Excellent! Very close.",   color: "#a78bfa" };
  if (km < 50)  return { emoji: "👍", label: "Great guess!",             color: "#60a5fa" };
  if (km < 100) return { emoji: "🗺️", label: "Not bad — keep exploring.", color: "#fbbf24" };
  return             { emoji: "😅", label: "Far off — explore more!",   color: "#f87171" };
}

// ---------------------------------------------------------------------------
// Result Modal
// ---------------------------------------------------------------------------
function ResultModal({
  result,
  onNextRound,
}: {
  result: GuessResult;
  onNextRound: () => void;
}) {
  const grade = gradeDistance(result.distanceKm);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-emoji">{grade.emoji}</div>
        <h2 className="modal-title">{result.location.name}</h2>
        <p className="modal-location">
          {result.location.city} · {result.location.lat.toFixed(4)}°N,{" "}
          {result.location.lng.toFixed(4)}°E
        </p>
        <div className="modal-distance-card">
          <div className="modal-distance-label">You missed by</div>
          <div
            className="modal-distance-value"
            style={{ color: grade.color }}
          >
            {result.distanceKm < 1
              ? `${Math.round(result.distanceKm * 1000)}`
              : result.distanceKm.toFixed(1)}
          </div>
          <div className="modal-distance-unit">
            {result.distanceKm < 1 ? "metres" : "kilometres"}
          </div>
          <div
            className="modal-distance-grade"
            style={{ color: grade.color }}
          >
            {grade.label}
          </div>
        </div>
        <button
          className="btn-next-round"
          onClick={onNextRound}
          id="next-round-btn"
        >
          Play Next Round →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function GeoKurdistanPage() {
  const [round, setRound] = useState(1);
  const location = kurdistanLocations[(round - 1) % kurdistanLocations.length];

  const [guessMarker, setGuessMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);


  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (result) return;
      setGuessMarker({ lat, lng });
    },
    [result]
  );

  const handleGuess = () => {
    if (!guessMarker) return;
    const distanceKm = calculateHaversineDistance(
      guessMarker.lat,
      guessMarker.lng,
      location.lat,
      location.lng
    );
    setResult({
      location,
      guessLat: guessMarker.lat,
      guessLng: guessMarker.lng,
      distanceKm,
    });
  };

  const handleNextRound = () => {
    setGuessMarker(null);
    setResult(null);
    setRound((r) => r + 1);
  };

  return (
    <>
      <div className="geo-page">
        {/* ── Top bar ── */}
        <div className="geo-top-bar">
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div style={{ textAlign: "center" }}>
            <div className="geo-round-badge">GeoKurdistan</div>
            <div className="geo-round-number">Round {round}</div>
          </div>
          <button
            onClick={handleNextRound}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              padding: 4,
            }}
            title="Skip round"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* ── Split view ── */}
        <div className="geo-split">
          {/* TOP: Mapillary street-level viewer */}
          <div className="geo-streetview flex-1 min-h-0 relative h-full w-full">
            <MapillaryViewer
              lat={location.lat}
              lng={location.lng}
              locationName={location.name}
              onSkip={handleNextRound}
            />
          </div>

          {/* BOTTOM: Leaflet guess map */}
          <div className="geo-map-panel flex-1 min-h-0 relative flex flex-col h-full w-full overflow-hidden">
            <LeafletMap
              onMapClick={handleMapClick}
              guessMarker={guessMarker}
              realLocation={
                result ? { lat: location.lat, lng: location.lng } : null
              }
              guessResult={result}
              locked={!!result}
            />

            {/* Floating Guess button */}
            <button
              className="guess-btn"
              onClick={handleGuess}
              disabled={!guessMarker || !!result}
              id="guess-location-btn"
              aria-label="Guess Location"
            >
              <MapPin size={18} />
              {guessMarker ? "Guess Location" : "Tap Map to Pin"}
            </button>
          </div>
        </div>
      </div>

      {/* Result modal */}
      {result && (
        <ResultModal result={result} onNextRound={handleNextRound} />
      )}
    </>
  );
}
