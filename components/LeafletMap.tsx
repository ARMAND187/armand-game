"use client";

/**
 * LeafletMap — client-only component
 *
 * All react-leaflet hooks and components live here so they are never
 * imported server-side. The parent page uses dynamic(() => import(...), { ssr: false }).
 */

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import type { LatLngExpression, LatLngBoundsExpression, DivIcon } from "leaflet";
import type { GuessResult } from "@/app/play/geokurdistan/page";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface LeafletMapProps {
  onMapClick: (lat: number, lng: number) => void;
  guessMarker: { lat: number; lng: number } | null;
  realLocation: { lat: number; lng: number } | null;
  guessResult: GuessResult | null;
  locked: boolean;
}

// ---------------------------------------------------------------------------
// Click event handler — must be a child of MapContainer
// ---------------------------------------------------------------------------
function MapClickHandler({
  onMapClick,
  locked,
}: {
  onMapClick: (lat: number, lng: number) => void;
  locked: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!locked) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LeafletMap({
  onMapClick,
  guessMarker,
  realLocation,
  guessResult,
  locked,
}: LeafletMapProps) {
  const [guessIcon, setGuessIcon] = useState<DivIcon | null>(null);
  const [realIcon, setRealIcon]   = useState<DivIcon | null>(null);

  // Build custom div icons — must happen client-side
  useEffect(() => {
    import("leaflet").then((L) => {
      setGuessIcon(
        L.divIcon({
          className: "",
          html: `<div style="
            width:30px;height:30px;border-radius:50% 50% 50% 0;
            background:linear-gradient(135deg,#7c3aed,#a78bfa);
            border:3px solid #fff;
            box-shadow:0 2px 12px rgba(124,58,237,0.7);
            transform:rotate(-45deg);
          "></div>`,
          iconSize:   [30, 30],
          iconAnchor: [15, 30],
        })
      );
      setRealIcon(
        L.divIcon({
          className: "",
          html: `<div style="
            width:30px;height:30px;border-radius:50% 50% 50% 0;
            background:linear-gradient(135deg,#059669,#4ade80);
            border:3px solid #fff;
            box-shadow:0 2px 12px rgba(74,222,128,0.7);
            transform:rotate(-45deg);
          "></div>`,
          iconSize:   [30, 30],
          iconAnchor: [15, 30],
        })
      );
    });
  }, []);

  const center: LatLngExpression = [36.0, 44.0];

  // Confine the player's view to the Kurdistan / Middle East region
  const bounds: LatLngBoundsExpression = [
    [29.0, 34.0], // south-west corner (Egypt/Saudi area)
    [43.0, 63.0], // north-east corner (Turkmenistan/Caspian area)
  ];

  const linePositions: LatLngExpression[] = guessResult
    ? [
        [guessResult.guessLat, guessResult.guessLng],
        [guessResult.location.lat, guessResult.location.lng],
      ]
    : [];

  return (
    <MapContainer
      center={center}
      zoom={5}
      maxBounds={bounds}
      minZoom={4}
      maxBoundsViscosity={1.0}
      className="leaflet-container"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
      zoomControl
      attributionControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <MapClickHandler onMapClick={onMapClick} locked={locked} />

      {/* Player's guess marker */}
      {guessMarker && guessIcon && (
        <Marker position={[guessMarker.lat, guessMarker.lng]} icon={guessIcon} />
      )}

      {/* Real location marker (revealed after guess) */}
      {realLocation && realIcon && (
        <Marker position={[realLocation.lat, realLocation.lng]} icon={realIcon} />
      )}

      {/* Dashed line between guess and real */}
      {linePositions.length === 2 && (
        <Polyline
          positions={linePositions}
          pathOptions={{ color: "#a78bfa", weight: 2, dashArray: "6 4", opacity: 0.85 }}
        />
      )}
    </MapContainer>
  );
}
