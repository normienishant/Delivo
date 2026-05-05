"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Marker {
  id: string;
  lat: number;
  lng: number;
  zone: string;
  predictedMinutes?: number;
}

export default function ZoneMap({ markers }: { markers: Marker[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerMap = useRef<Map<string, L.Marker>>(new Map());

  // Initialise dark Leaflet map with all interactions disabled
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, {
      center: [20.5937, 78.9629],       // centre of India
      zoom: 5,
      zoomControl: false,                // no +/- buttons
      scrollWheelZoom: false,            // no mouse wheel zoom
      doubleClickZoom: false,            // no double‑click zoom
      dragging: false,                   // no drag pan
      touchZoom: false,                  // no pinch zoom
      boxZoom: false,                    // no shift‑drag zoom
      keyboard: false,                   // no keyboard pan
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map.current);

    // no static zone circles – only delivery dots
  }, []);

  // Manage delivery markers (add new, remove old)
  useEffect(() => {
    if (!map.current) return;
    const mapInstance = map.current;
    const currentIds = new Set(markers.map((m) => m.id));

    // Remove old markers
    markerMap.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markerMap.current.delete(id);
      }
    });

    // Add new markers with tooltip
    markers.forEach((m) => {
      if (!markerMap.current.has(m.id)) {
        const dotIcon = L.divIcon({
          className: "delivery-dot",
          html: `
            <div style="
              width: 14px; height: 14px;
              background: radial-gradient(circle, rgba(245,158,11,1) 0%, rgba(245,158,11,0.2) 70%);
              border-radius: 50%;
              box-shadow: 0 0 18px 4px rgba(245,158,11,0.6);
              animation: pulse 2s infinite;
            "></div>
          `,
          iconSize: [14, 14],
        });

        const marker = L.marker([m.lat, m.lng], { icon: dotIcon })
          .addTo(mapInstance)
          .bindTooltip(
            `<b>${m.zone}</b><br/>${m.predictedMinutes ? "Pred: " + m.predictedMinutes.toFixed(1) + " min" : ""}`,
            {
              permanent: false,
              direction: "top",
              offset: [0, -10],
              className: "custom-tooltip",
            }
          );

        markerMap.current.set(m.id, marker);
      }
    });
  }, [markers]);

  // No auto‑pan – map stays perfectly still

  return (
    <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden">
      <style>{`
        .delivery-dot {
          background: transparent !important;
          border: none !important;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.7); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        .custom-tooltip {
          background: #1a1a1a;
          color: #fafafa;
          border: 1px solid rgba(245,158,11,0.4);
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 12px;
        }
        .custom-tooltip::before {
          border-top-color: rgba(245,158,11,0.4) !important;
        }
      `}</style>
    </div>
  );
}