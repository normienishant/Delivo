"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowRight,
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Search,
  User,
  Package,
  ChevronDown,
} from "lucide-react";
import { LocationSearch } from "./location-search";
import NearbyRestaurants, { Restaurant } from "./nearby-restaurants";

const API_BASE = "http://localhost:8000";

const WEATHER = ["Sunny", "Cloudy", "Windy", "Fog", "Stormy", "Sandstorms"];
const TRAFFIC = ["Low", "Medium", "High", "Jam"];
const CITY = ["Semi-Urban", "Urban", "Metropolitian"];
const VEHICLE = ["bicycle", "electric_scooter", "scooter", "motorcycle"];
const ORDER_TYPE = ["Snack", "Drinks", "Buffet", "Meal"];

// ✅ Helper: Calculate distance between two lat/lng points (in km)
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type FormState = {
  rest_lat: string;
  rest_lon: string;
  del_lat: string;
  del_lon: string;
  hour: string;
  weather: string;
  traffic: string;
  city: string;
  vehicle: string;
  order_type: string;
  driver_age: string;
  driver_rating: string;
  vehicle_condition: string;
  multiple_deliveries: string;
  festival: boolean;
  weekend: boolean;
};

const defaults: FormState = {
  rest_lat: "12.9716",
  rest_lon: "77.5946",
  del_lat: "12.9352",
  del_lon: "77.6245",
  hour: "19",
  weather: "Cloudy",
  traffic: "High",
  city: "Urban",
  vehicle: "motorcycle",
  order_type: "Meal",
  driver_age: "29",
  driver_rating: "4.6",
  vehicle_condition: "1",
  multiple_deliveries: "1",
  festival: false,
  weekend: false,
};

type Prediction = {
  minutes: number;
  range?: [number, number];
};

type ShapFactor = {
  feature: string;
  impact: number;
  direction: "increases" | "decreases";
};

export function PredictionForm() {
  const [form, setForm] = useState<FormState>(defaults);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Prediction | null>(null);
  const [shap, setShap] = useState<ShapFactor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deliveryDisplay, setDeliveryDisplay] = useState("");
  const [restaurantDisplay, setRestaurantDisplay] = useState("");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ---------- GPS with building‑level reverse geocoding ----------
  const useGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        update("del_lat", lat.toFixed(4));
        update("del_lon", lon.toFixed(4));

        try {
          const res = await fetch(`/api/places/reverse-geocode?latlng=${lat},${lon}`);
          const data = await res.json();
          const address = data?.results?.[0]?.formatted_address || data?.results?.[0]?.name;
          setDeliveryDisplay(address || `GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        } catch {
          setDeliveryDisplay(`GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        }
      },
      () => setError("Could not access location.")
    );
  };

  const buildPayload = () => ({
    restaurant_lat: Number(form.rest_lat),
    restaurant_lon: Number(form.rest_lon),
    delivery_lat: Number(form.del_lat),
    delivery_lon: Number(form.del_lon),
    order_hour: Number(form.hour),
    weather: form.weather,
    traffic: form.traffic,
    city: form.city,
    vehicle: form.vehicle,
    order_type: form.order_type,
    driver_age: Number(form.driver_age),
    driver_rating: Number(form.driver_rating),
    vehicle_condition: Number(form.vehicle_condition),
    multiple_deliveries: Number(form.multiple_deliveries),
    festival: form.festival ? 1 : 0,
    is_weekend: form.weekend ? 1 : 0,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ Validate that restaurant is within 50 km of delivery
    const dLat = parseFloat(form.del_lat);
    const dLon = parseFloat(form.del_lon);
    const rLat = parseFloat(form.rest_lat);
    const rLon = parseFloat(form.rest_lon);

    if (!isNaN(dLat) && !isNaN(dLon) && !isNaN(rLat) && !isNaN(rLon)) {
      const dist = haversineKm(dLat, dLon, rLat, rLon);
      if (dist > 21) {
        setError(`Restaurant is ${dist.toFixed(0)} km away. Please select a restaurant within 21 km.`);
        return;
      }
    }
    setError(null);
    setResult(null);
    setShap(null);

    startTransition(async () => {
      const payload = buildPayload();
      try {
        const res = await fetch(`${API_BASE}/predict-delivery-time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Predict failed: ${res.status}`);
        const data = await res.json();

        const minutes = Number(
          data.predicted_minutes ?? data.minutes ?? data.predicted_delivery_time ?? data.prediction
        );
        const rangeRaw = data.confidence_range ?? data.range ?? data.confidence;
        const range: [number, number] | undefined =
          Array.isArray(rangeRaw) && rangeRaw.length === 2
            ? [Number(rangeRaw[0]), Number(rangeRaw[1])]
            : rangeRaw && typeof rangeRaw === "object" && "min" in rangeRaw
              ? [Number((rangeRaw as any).min), Number((rangeRaw as any).max)]
              : undefined;

        setResult({ minutes, range });
      } catch (err: any) {
        setError(err.message || "Prediction failed. Is the backend running?");
        return;
      }

      try {
        const exRes = await fetch(`${API_BASE}/explain-prediction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!exRes.ok) return;
        const ex = await exRes.json();
        setShap(
  (ex.top_factors ?? [])
    .slice(0, 5)
    .map((f: any) => {
      const raw = Number(f.impact_min ?? f.impact ?? f.importance ?? 0);
      return {
        feature: f.feature ?? "factor",
        impact: isNaN(raw) ? 0 : raw,
        direction: (raw >= 0 ? "increases" : "decreases") as "increases" | "decreases",
      };
    })
    .filter((f: any) => f.impact !== 0)   // optional, lekin ab sahi values ayengi
);
      } catch {}
    });
  };

  const reset = () => {
    setForm(defaults);
    setResult(null);
    setShap(null);
    setError(null);
    setDeliveryDisplay("");
    setRestaurantDisplay("");
    setShowAdvanced(false);
  };

  const deliveryLat = form.del_lat ? parseFloat(form.del_lat) : null;
  const deliveryLon = form.del_lon ? parseFloat(form.del_lon) : null;

  return (
    <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
      {/* ---------- FORM ---------- */}
      <form onSubmit={onSubmit} className="lg:col-span-3 space-y-5">
        
        {/* DELIVERY CARD (Fixed z-index) */}
        <div className="glass-card rounded-2xl p-5 overflow-visible z-20 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Where should we deliver?
              </h3>
            </div>
            <button
              type="button"
              onClick={useGps}
              className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" /> Use my location
            </button>
          </div>
          <LocationSearch
            id="delivery"
            label=""
            type="address"
            value={form.del_lat}
            onChange={(lat, lon, display) => {
              update("del_lat", lat);
              update("del_lon", lon);
              setDeliveryDisplay(display);
            }}
            displayValue={deliveryDisplay}
            onDisplayChange={setDeliveryDisplay}
          />
        </div>

        {/* RESTAURANT CARD (Fixed z-index) */}
        <div className="glass-card rounded-2xl p-5 overflow-visible z-10 relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Pick a restaurant
            </h3>
          </div>

          {/* Famous Nearby Restaurants */}
          {deliveryLat && deliveryLon && (
            <NearbyRestaurants
              deliveryLat={deliveryLat}
              deliveryLon={deliveryLon}
              onSelect={(r: Restaurant) => {
  const dist = haversineKm(
    parseFloat(form.del_lat),
    parseFloat(form.del_lon),
    r.lat,
    r.lon
  );
  if (dist > 21) {
    setError(`This restaurant is ${dist.toFixed(0)} km away. Please select within 21 km.`);
    return;
  }
  // ✅ directly set correct coordinates
  update("rest_lat", r.lat.toString());
  update("rest_lon", r.lon.toString());
  setRestaurantDisplay(r.name);
}}  
            />
          )}

          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">
              Can't find your restaurant? Search for it
            </p>
            <LocationSearch
              id="restaurant"
              label=""
              type="restaurant"
              value={form.rest_lat}
              onChange={(lat, lon, display) => {
                update("rest_lat", lat);
                update("rest_lon", lon);
                setRestaurantDisplay(display);
              }}
              nearLat={deliveryLat}
              nearLon={deliveryLon}
              maxDistanceKm={21}
              displayValue={restaurantDisplay}
              onDisplayChange={setRestaurantDisplay}
            />
          </div>
        </div>

        {/* ---------- ADVANCED OPTIONS (collapsible) ---------- */}
        <div className="glass-card rounded-2xl p-5 z-0 relative">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Order & Driver Details
              </h3>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAdvanced && (
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Order hour</Label>
                  <Input type="number" min={0} max={23} value={form.hour} onChange={e => update("hour", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">City type</Label>
                  <Select value={form.city} onValueChange={v => update("city", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CITY.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Weather</Label>
                  <Select value={form.weather} onValueChange={v => update("weather", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{WEATHER.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Traffic</Label>
                  <Select value={form.traffic} onValueChange={v => update("traffic", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TRAFFIC.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Vehicle</Label>
                  <Select value={form.vehicle} onValueChange={v => update("vehicle", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{VEHICLE.map(v => <SelectItem key={v} value={v}>{v.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Order type</Label>
                  <Select value={form.order_type} onValueChange={v => update("order_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ORDER_TYPE.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-foreground/10 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Driver</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Age</Label>
                    <Input type="number" min={18} max={75} value={form.driver_age} onChange={e => update("driver_age", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Rating (1.0–5.0)</Label>
                    <Input type="number" step={0.1} min={1} max={5} value={form.driver_rating} onChange={e => update("driver_rating", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Vehicle condition</Label>
                    <Input type="number" min={0} value={form.vehicle_condition} onChange={e => update("vehicle_condition", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Multiple deliveries</Label>
                    <Input type="number" min={0} value={form.multiple_deliveries} onChange={e => update("multiple_deliveries", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex items-center gap-3">
                  <Switch checked={form.festival} onCheckedChange={v => update("festival", v)} />
                  <Label className="text-sm cursor-pointer">Festival</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.weekend} onCheckedChange={v => update("weekend", v)} />
                  <Label className="text-sm cursor-pointer">Weekend</Label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={pending}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 font-semibold"
          >
            {pending ? <Spinner className="mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
            {pending ? "Predicting..." : "Predict Delivery Time"}
          </Button>
          <Button type="button" variant="outline" onClick={reset} className="rounded-full h-12 border-foreground/20">
            Reset
          </Button>
        </div>
      </form>

      {/* ---------- RESULT & SHAP ---------- */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="glass-card rounded-2xl p-6 border border-red-500/30 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80">{error}</p>
          </div>
        )}

        {!result && !error && (
          <div className="glass-card rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">⏱️</div>
            <p className="text-muted-foreground text-sm">
              Fill in the form on the left to see a real‑time delivery prediction.
            </p>
          </div>
        )}

        {result && (
          <div className="glass-card-amber rounded-2xl p-8 lg:p-10 amber-glow fade-in-up">
            <div className="font-mono text-xs text-primary uppercase tracking-widest mb-4">
              Predicted Delivery Time
            </div>
            <div className="font-display text-7xl lg:text-8xl text-primary leading-none mb-3">
              {result.minutes.toFixed(1)}
              <span className="text-3xl text-primary/70 ml-2">min</span>
            </div>
            {result.range && (
              <p className="text-sm text-muted-foreground font-mono">
                Confidence range · {result.range[0].toFixed(1)} – {result.range[1].toFixed(1)} min
              </p>
            )}
          </div>
        )}

        {shap && shap.length > 0 && (
          <div className="space-y-3 fade-in-up">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-1">
              Top SHAP Factors
            </div>
            {shap.map((factor, i) => (
              <div
                key={`${factor.feature}-${i}`}
                className="glass-card rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{factor.feature}</div>
                  <div className="text-xs text-muted-foreground">
                    {factor.direction === "increases" ? "Adds time" : "Saves time"}
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1.5 font-mono text-sm shrink-0 ${
                    factor.direction === "increases" ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {factor.direction === "increases" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {factor.direction === "increases" ? "+" : "−"}
                  {factor.impact.toFixed(2)} min
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}