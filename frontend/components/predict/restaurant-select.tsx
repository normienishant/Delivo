"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const RESTAURANTS = [
  { name: "Haldiram's (Bangalore)", lat: 12.9716, lon: 77.5946 },
  { name: "Saravana Bhavan (Chennai)", lat: 13.0827, lon: 80.2707 },
  { name: "Paradise Biryani (Hyderabad)", lat: 17.385, lon: 78.4867 },
  { name: "Karim's (Delhi)", lat: 28.7041, lon: 77.1025 },
  { name: "Bade Miya (Mumbai)", lat: 19.076, lon: 72.8777 },
  { name: "Kake Da Hotel (Delhi)", lat: 28.6448, lon: 77.2155 },
  { name: "CTR (Bangalore)", lat: 12.9784, lon: 77.6404 },
  { name: "Vidyarthi Bhavan (Bangalore)", lat: 12.9489, lon: 77.5697 },
  { name: "Britannia & Co. (Mumbai)", lat: 18.9322, lon: 72.8264 },
  { name: "Dum Pukht (Kolkata)", lat: 22.5726, lon: 88.3639 },
  { name: "Flury's (Kolkata)", lat: 22.5456, lon: 88.3517 },
  { name: "Moti Mahal Delux (Delhi)", lat: 28.6353, lon: 77.2244 },
  { name: "Murugan Idli Shop (Chennai)", lat: 13.0524, lon: 80.2508 },
  { name: "Paatra (Jaipur)", lat: 26.9124, lon: 75.7873 },
  { name: "Sardar Pav Bhaji (Mumbai)", lat: 18.959, lon: 72.8327 },
  { name: "Tunday Kababi (Lucknow)", lat: 26.8467, lon: 80.9462 },
  { name: "Kesar Da Dhaba (Amritsar)", lat: 31.634, lon: 74.8737 },
  { name: "Indian Coffee House (Kochi)", lat: 9.9674, lon: 76.2833 },
  { name: "Bikanervala (Noida)", lat: 28.5855, lon: 77.3099 },
  { name: "Adigas (Bangalore)", lat: 12.9344, lon: 77.6108 },
  { name: "Punjab Grill (Mumbai)", lat: 19.0708, lon: 72.8335 },
  { name: "Oh! Calcutta (Kolkata)", lat: 22.5337, lon: 88.3519 },
  { name: "Jamavar (New Delhi)", lat: 28.5972, lon: 77.2192 },
  { name: "Thalassa (Goa)", lat: 15.5025, lon: 73.7596 },
  { name: "Indian Accent (New Delhi)", lat: 28.5915, lon: 77.2088 },
  { name: "Bukhara (New Delhi)", lat: 28.5475, lon: 77.1931 },
  { name: "Khyber (Mumbai)", lat: 18.9272, lon: 72.8311 },
  { name: "Rajdhani (Ahmedabad)", lat: 23.0225, lon: 72.5714 },
  { name: "Bikanerwala (Hyderabad)", lat: 17.4123, lon: 78.4459 },
  { name: "Nizam's Kathi Kabab (Delhi)", lat: 28.6139, lon: 77.2294 },
  { name: "Swati Snacks (Mumbai)", lat: 19.0242, lon: 72.8204 },
];

interface RestaurantSelectProps {
  value: { name: string; lat: number; lon: number } | null;
  onChange: (restaurant: { name: string; lat: number; lon: number }) => void;
}

export function RestaurantSelect({ value, onChange }: RestaurantSelectProps) {
  return (
    <div>
      <Label className="text-xs">Restaurant</Label>
      <Select
        value={value?.name ?? ""}
        onValueChange={(name) => {
          const found = RESTAURANTS.find((r) => r.name === name);
          if (found) onChange(found);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a restaurant" />
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {RESTAURANTS.map((r) => (
            <SelectItem key={r.name} value={r.name}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}