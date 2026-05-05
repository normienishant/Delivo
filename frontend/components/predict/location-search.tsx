"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import debounce from "lodash.debounce";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  id: string;
  label: string;
  type: "address" | "restaurant";
  value: string;
  onChange: (lat: string, lon: string, display: string) => void;
  nearLat?: number | null;
  nearLon?: number | null;
  displayValue?: string;
  onDisplayChange?: (display: string) => void;
  maxDistanceKm?: number | null;
}

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function LocationSearch({
  id,
  label,
  type,
  value,
  onChange,
  nearLat,
  nearLon,
  displayValue,
  onDisplayChange,
  maxDistanceKm = null,
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const debouncerRef = useRef<any>(null);

  useEffect(() => {
    if (displayValue) setQuery(displayValue);
  }, [displayValue]);

  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const searchTerm = type === 'restaurant' ? `${q} restaurant` : q;
        let url = `/api/places/autocomplete?query=${encodeURIComponent(searchTerm)}&type=${type}`;
        if (nearLat && nearLon) {
          url += `&location=${nearLat},${nearLon}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        const predictions = data?.predictions || [];
        setSuggestions(
          predictions.map((p: any) => ({
            display_name: p.description,
            lat: p.geometry?.location?.lat?.toString() || "",
            lon: p.geometry?.location?.lng?.toString() || "",
            place_id: p.place_id,
          }))
        );
      } catch (e) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [nearLat, nearLon, type]
  );
  debouncerRef.current = fetchSuggestions;

  const handleSelect = async (result: any) => {
    if (debouncerRef.current) debouncerRef.current.cancel();
    setQuery(result.display_name);
    setSuggestions([]);
    if (onDisplayChange) onDisplayChange(result.display_name);

    // If we already have lat/lon, check distance
    if (result.lat && result.lon) {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      if (maxDistanceKm != null && nearLat != null && nearLon != null) {
        const dist = haversineKm(nearLat, nearLon, lat, lon);
        if (dist > maxDistanceKm) {
          setWarning(`This location is ${dist.toFixed(0)} km away. Please select within ${maxDistanceKm} km.`);
          setQuery("");
          if (onDisplayChange) onDisplayChange("");
          return;
        }
      }
      setWarning(null);
      onChange(result.lat, result.lon, result.display_name);
      return;
    }

    // Fallback geocode
    try {
      const geoRes = await fetch(
        `/api/places/geocode?address=${encodeURIComponent(result.display_name)}`
      );
      const geoData = await geoRes.json();
      if (geoData?.results?.length > 0) {
        const loc = geoData.results[0];
        const lat = loc.geometry?.location?.lat;
        const lng = loc.geometry?.location?.lng;
        if (lat == null || lng == null) return;

        if (maxDistanceKm != null && nearLat != null && nearLon != null) {
          const dist = haversineKm(nearLat, nearLon, lat, lng);
          if (dist > maxDistanceKm) {
            setWarning(`This location is ${dist.toFixed(0)} km away. Please select within ${maxDistanceKm} km.`);
            setQuery("");
            if (onDisplayChange) onDisplayChange("");
            return;
          }
        }

        setWarning(null);
        onChange(lat.toString(), lng.toString(), result.display_name);
      }
    } catch {}
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setWarning(null);
    if (onDisplayChange) onDisplayChange(val);
    if (debouncerRef.current) debouncerRef.current(val);
  };

  return (
    <div className="relative">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative z-10">
        <Input
          id={id}
          value={query}
          onChange={handleInputChange}
          placeholder={type === "restaurant" ? "Search a restaurant…" : "Search an address…"}
          className="pr-8"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>
      {warning && (
        <p className="text-xs text-red-400 mt-1">{warning}</p>
      )}
      {suggestions.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-amber-500/10 transition-colors border-b border-neutral-800 last:border-0"
              onMouseDown={(e) => {
                // prevent blur on input before click (desktop)
                e.preventDefault();
              }}
              onTouchStart={(e) => {
                // same for mobile – prevents keyboard dismiss & blur
                e.preventDefault();
              }}
              onClick={() => handleSelect(s)}
            >
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}