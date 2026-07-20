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
import type { KurdistanLocation } from "@/data/locations";
import "leaflet/dist/leaflet.css";

export interface GuessResult {
  location: KurdistanLocation;
  guessLat: number;
  guessLng: number;
  distanceKm: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface LeafletMapProps {
  onMapClick: (lat: number, lng: number) => void;
  guessMarker: { lat: number; lng: number } | null;
  realLocation: { lat: number; lng: number } | null;
  guessResult: GuessResult | null;
  roundGuesses?: any[]; // multiplayer guesses
  myUsername?: string;
  locked: boolean;
  customPinUrl?: string | null;
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
export function generatePlayerColor(username: string): string {
  const safeColors = ["#FF5733", "#3357FF", "#FF33A8", "#F1C40F", "#8E44AD", "#E67E22", "#3498DB", "#9B59B6", "#E74C3C"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return safeColors[Math.abs(hash) % safeColors.length];
}

export default function LeafletMap({
  onMapClick,
  guessMarker,
  realLocation,
  guessResult,
  roundGuesses = [],
  myUsername = "",
  locked,
  customPinUrl,
}: LeafletMapProps) {
  const [L, setL] = useState<any>(null);

  // Load leaflet client-side
  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet);
    });
  }, []);

  const center: LatLngExpression = [36.0, 44.0];

  // Confine the player's view to the Kurdistan / Middle East region
  const bounds: LatLngBoundsExpression = [
    [29.0, 34.0], // south-west corner (Egypt/Saudi area)
    [43.0, 63.0], // north-east corner (Turkmenistan/Caspian area)
  ];

  if (!L) return null;

  const targetIcon = L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      background:#2ECC71;
      border:3px solid #fff;
      box-shadow:0 0 16px #2ECC71;
      transform:rotate(-45deg);
      animation: pulse-marker 1.5s infinite;
    "></div>
    <style>
      @keyframes pulse-marker {
        0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(46, 204, 113, 0); }
        100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
      }
    </style>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  const createPlayerIcon = (color: string, label: string, pinUrl?: string | null) => {
    let pinHtml = `<div style="
          width:24px;height:24px;border-radius:50% 50% 50% 0;
          background:${color};
          border:2px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.5);
          transform:rotate(-45deg);
        "></div>`;

    if (pinUrl) {
      pinHtml = `<img src="${pinUrl}" style="width:36px; height:36px; object-fit:contain; filter:drop-shadow(0px 4px 4px rgba(0,0,0,0.5)); transform:translateY(8px);" />`;
    }

    return L.divIcon({
      className: "",
      html: `<div style="display:flex; flex-direction:column; align-items:center; transform:translateY(-100%);">
        <div style="background:rgba(0,0,0,0.6); padding:2px 6px; border-radius:4px; color:#fff; font-size:11px; font-weight:bold; margin-bottom:4px; white-space:nowrap;">
          ${label}
        </div>
        ${pinHtml}
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  const myColor = myUsername ? generatePlayerColor(myUsername) : "#a78bfa";
  const localGuessIcon = createPlayerIcon(myColor, myUsername || "Player", customPinUrl);

  // Determine lines to draw
  // If round ended and we have multiplayer guesses, draw lines for everyone
  // Otherwise just draw the local guessResult line
  let linesToDraw = [];
  if (realLocation && roundGuesses.length > 0) {
    linesToDraw = roundGuesses.map((g) => ({
      positions: [[g.guessLat, g.guessLng], [realLocation.lat, realLocation.lng]] as LatLngExpression[],
      color: generatePlayerColor(g.username),
    }));
  } else if (guessResult) {
    linesToDraw.push({
      positions: [[guessResult.guessLat, guessResult.guessLng], [guessResult.location.lat, guessResult.location.lng]] as LatLngExpression[],
      color: myColor,
    });
  }

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

      {/* Local player's live unsubmitted guess */}
      {guessMarker && !realLocation && (
        <Marker position={[guessMarker.lat, guessMarker.lng]} icon={localGuessIcon} />
      )}

      {/* Round End: All multiplayer guesses */}
      {realLocation && roundGuesses.map((g, i) => (
        <Marker 
          key={i} 
          position={[g.guessLat, g.guessLng]} 
          icon={createPlayerIcon(generatePlayerColor(g.username), g.username === myUsername ? `${g.username} (You)` : g.username)} 
        />
      ))}

      {/* Real location marker (Target Marker) */}
      {realLocation && (
        <Marker position={[realLocation.lat, realLocation.lng]} icon={targetIcon} />
      )}

      {/* Dashed lines between guesses and real location */}
      {linesToDraw.map((line, i) => (
        <Polyline
          key={i}
          positions={line.positions}
          pathOptions={{ color: line.color, weight: 2, dashArray: "6 4", opacity: 0.85 }}
        />
      ))}
    </MapContainer>
  );
}
