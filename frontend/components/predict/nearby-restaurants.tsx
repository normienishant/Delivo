"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

export interface Restaurant {
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

const FAMOUS: Restaurant[] = [
  { name: "Haldiram's (Bangalore)", lat: 12.9716, lon: 77.5946 },
  { name: "Saravana Bhavan (Chennai)", lat: 13.0827, lon: 80.2707 },
  { name: "Paradise Biryani (Hyderabad)", lat: 17.385, lon: 78.4867 },
  { name: "Karim's (Delhi)", lat: 28.7041, lon: 77.1025 },
  { name: "Bade Miya (Mumbai)", lat: 19.076, lon: 72.8777 },
  { name: "Britannia & Co. (Mumbai)", lat: 18.9322, lon: 72.8264 },
  { name: "Flury's (Kolkata)", lat: 22.5456, lon: 88.3517 },
  { name: "Indian Coffee House (Kochi)", lat: 9.9674, lon: 76.2833 },
  { name: "CTR (Bangalore)", lat: 12.9784, lon: 77.6404 },
  { name: "Vidyarthi Bhavan (Bangalore)", lat: 12.9489, lon: 77.5697 },
  { name: "Tunday Kababi (Lucknow)", lat: 26.8467, lon: 80.9462 },
  { name: "Kesar Da Dhaba (Amritsar)", lat: 31.634, lon: 74.8737 },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyRestaurants({
  deliveryLat,
  deliveryLon,
  onSelect,
}: {
  deliveryLat: number;
  deliveryLon: number;
  onSelect: (r: Restaurant) => void;
}) {
  const [sorted, setSorted] = useState<Restaurant[]>([]);

  useEffect(() => {
  const withDist = FAMOUS.map((r) => ({
    ...r,
    distance: haversine(deliveryLat, deliveryLon, r.lat, r.lon),
  }));
  const filtered = withDist.filter((r) => r.distance <= 21);   
  filtered.sort((a, b) => a.distance - b.distance);
  setSorted(filtered.slice(0, 6));
}, [deliveryLat, deliveryLon]);

  if (sorted.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
        Nearby famous restaurants
      </p>
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((r) => (
          <Card
            key={r.name}
            className="glass cursor-pointer hover:border-amber-500/40 p-3 text-sm flex items-center gap-2 transition-all"
            onClick={() => onSelect(r)}
          >
            <span className="text-base">🍽️</span>
            <div>
              <p className="font-medium truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.distance?.toFixed(1)} km</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}