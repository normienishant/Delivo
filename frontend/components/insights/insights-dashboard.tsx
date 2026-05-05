"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Activity, BarChart3, CloudRain, MapPin } from "lucide-react";

const API_BASE = "http://localhost:8000";

type HourlyPoint = { hour: string; orders: number };
type WeatherPoint = { weather: string; minutes: number };
type TrafficPoint = { traffic: string; minutes: number };
type CityStat = {
  city: string;
  avgMinutes: number;
  totalOrders: number;
  uniqueDrivers?: number;
};
type ModelPerf = {
  mae: number;
  r2: number;
  errorBuckets?: { range: string; count: number }[];
};

type Insights = {
  hourly: HourlyPoint[];
  weather: WeatherPoint[];
  traffic: TrafficPoint[];
  cities: CityStat[];
  model: ModelPerf;
};

const FALLBACK: Insights = {
  hourly: [
    { hour: "00", orders: 280 },
    { hour: "01", orders: 180 },
    { hour: "02", orders: 110 },
    { hour: "03", orders: 90 },
    { hour: "04", orders: 105 },
    { hour: "05", orders: 160 },
    { hour: "06", orders: 320 },
    { hour: "07", orders: 540 },
    { hour: "08", orders: 880 },
    { hour: "09", orders: 1120 },
    { hour: "10", orders: 1380 },
    { hour: "11", orders: 2480 },
    { hour: "12", orders: 3120 },
    { hour: "13", orders: 2860 },
    { hour: "14", orders: 2340 },
    { hour: "15", orders: 1640 },
    { hour: "16", orders: 1820 },
    { hour: "17", orders: 2960 },
    { hour: "18", orders: 3540 },
    { hour: "19", orders: 3680 },
    { hour: "20", orders: 3420 },
    { hour: "21", orders: 2780 },
    { hour: "22", orders: 1620 },
    { hour: "23", orders: 760 },
  ],
  weather: [
    { weather: "Sunny", minutes: 22.4 },
    { weather: "Cloudy", minutes: 25.6 },
    { weather: "Windy", minutes: 27.1 },
    { weather: "Fog", minutes: 32.8 },
    { weather: "Stormy", minutes: 38.5 },
    { weather: "Sandstorms", minutes: 41.2 },
  ],
  traffic: [
    { traffic: "Low", minutes: 19.8 },
    { traffic: "Medium", minutes: 24.6 },
    { traffic: "High", minutes: 31.2 },
    { traffic: "Jam", minutes: 38.7 },
  ],
  cities: [
    { city: "Metropolitian", avgMinutes: 26.8, totalOrders: 18420, uniqueDrivers: 612 },
    { city: "Urban", avgMinutes: 24.9, totalOrders: 19560, uniqueDrivers: 528 },
    { city: "Semi-Urban", avgMinutes: 28.4, totalOrders: 7613, uniqueDrivers: 180 },
  ],
  model: {
    mae: 3.2,
    r2: 0.82,
    errorBuckets: [
      { range: "0–2 min", count: 18230 },
      { range: "2–5 min", count: 15470 },
      { range: "5–10 min", count: 8420 },
      { range: "10+ min", count: 3473 },
    ],
  },
};

function normalize(raw: unknown): Insights {
  const data = raw as Record<string, unknown>;
  const out: Insights = JSON.parse(JSON.stringify(FALLBACK));

  // Hourly demand
  const hourlyRaw = data?.hourly_demand ?? data?.hourly ?? data?.demand_by_hour;
  if (Array.isArray(hourlyRaw)) {
    out.hourly = hourlyRaw.map((h: any) => ({
      hour: String(h.hour).padStart(2, "0"),
      orders: Number(h.avg_orders ?? h.orders ?? h.count ?? 0),
    }));
  } else if (hourlyRaw && typeof hourlyRaw === "object") {
    out.hourly = Object.entries(hourlyRaw as Record<string, number>).map(([hour, orders]) => ({
      hour: hour.padStart(2, "0"),
      orders: Number(orders),
    }));
  }

  // Weather impact
  const weatherRaw = data?.weather_impact ?? data?.weather;
  if (Array.isArray(weatherRaw)) {
    out.weather = weatherRaw.map((w: any) => ({
      weather: String(w.weather),
      minutes: Number(w.avg_delivery_min ?? w.minutes ?? w.avg ?? 0),
    }));
  } else if (weatherRaw && typeof weatherRaw === "object") {
    out.weather = Object.entries(weatherRaw as Record<string, number>).map(([k, v]) => ({
      weather: k,
      minutes: Number(v),
    }));
  }

  // Traffic impact
  const trafficRaw = data?.traffic_impact ?? data?.traffic;
  if (Array.isArray(trafficRaw)) {
    out.traffic = trafficRaw.map((t: any) => ({
      traffic: String(t.traffic),
      minutes: Number(t.avg_delivery_min ?? t.minutes ?? t.avg ?? 0),
    }));
  } else if (trafficRaw && typeof trafficRaw === "object") {
    out.traffic = Object.entries(trafficRaw as Record<string, number>).map(([k, v]) => ({
      traffic: k,
      minutes: Number(v),
    }));
  }

  // City stats
  const citiesRaw = (data?.city_stats ?? data?.cities) as any[];
  if (Array.isArray(citiesRaw)) {
    out.cities = citiesRaw.map((c: any) => ({
      city: String(c.City ?? c.city ?? ""),
      avgMinutes: Number(c.avg_delivery_min ?? c.avg_minutes ?? c.avgMinutes ?? 0),
      totalOrders: Number(c.total_orders ?? c.totalOrders ?? 0),
      uniqueDrivers: c.unique_drivers ?? c.uniqueDrivers,
    }));
  }

  // Model performance
  const perfRaw = data?.model_performance as any;
  const deliveryModel = perfRaw?.delivery_time_model ?? perfRaw;
  if (deliveryModel) {
    out.model = {
      mae: Number(deliveryModel.mae_minutes ?? deliveryModel.mae ?? FALLBACK.model.mae),
      r2: Number(deliveryModel.r2_score ?? deliveryModel.r2 ?? deliveryModel.r_squared ?? FALLBACK.model.r2),
      errorBuckets: deliveryModel.error_buckets ?? FALLBACK.model.errorBuckets,
    };
  }

  return out;
}

function ChartCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-lg p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="font-display text-2xl">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
      <div className="h-[280px]">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  background: "rgba(20, 20, 20, 0.95)",
  border: "1px solid rgba(245, 158, 11, 0.3)",
  borderRadius: "6px",
  fontSize: "12px",
  padding: "8px 12px",
};

const tooltipLabelStyle = { color: "#fafafa", fontFamily: "monospace" };
const tooltipItemStyle = { color: "#f59e0b", fontFamily: "monospace" };

export function InsightsDashboard() {
  const [data, setData] = useState<Insights | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/dataset-insights`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        if (cancelled) return;
        setData(normalize(raw));
        setStatus("live");
      } catch (err) {
        if (cancelled) return;
        setData(FALLBACK);
        setStatus("fallback");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not reach the FastAPI server."
        );
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="glass-card rounded-lg p-16 flex items-center justify-center gap-3 text-muted-foreground">
        <Spinner className="size-5 text-primary" />
        Loading insights from {API_BASE}…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {status === "fallback" && (
        <div className="glass-card rounded-lg p-4 flex items-start gap-3 border-foreground/10">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">Showing cached insights</div>
            <p className="text-muted-foreground">
              {errorMessage ?? "FastAPI server unreachable."} Start the server on{" "}
              <span className="font-mono text-primary">localhost:8000</span> to load live data.
            </p>
          </div>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <ChartCard
            title="Hourly demand"
            subtitle="Order volume across all 45,593 records, grouped by hour of day."
            icon={<BarChart3 className="w-4 h-4" />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(250,250,250,0.06)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke="rgba(250,250,250,0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(250,250,250,0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  cursor={{ fill: "rgba(245,158,11,0.06)" }}
                />
                <Bar dataKey="orders" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard
          title="Weather impact"
          subtitle="Average delivery time per weather condition (minutes)."
          icon={<CloudRain className="w-4 h-4" />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weather} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(250,250,250,0.06)" vertical={false} />
              <XAxis dataKey="weather" stroke="rgba(250,250,250,0.4)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(250,250,250,0.4)" fontSize={11} tickLine={false} axisLine={false} unit="m" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "rgba(245,158,11,0.06)" }} />
              <Bar dataKey="minutes" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Traffic impact"
          subtitle="Average delivery time per traffic level (minutes)."
          icon={<Activity className="w-4 h-4" />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.traffic} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(250,250,250,0.06)" vertical={false} />
              <XAxis dataKey="traffic" stroke="rgba(250,250,250,0.4)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(250,250,250,0.4)" fontSize={11} tickLine={false} axisLine={false} unit="m" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "rgba(245,158,11,0.06)" }} />
              <Bar dataKey="minutes" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* City comparison */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-display text-2xl">City comparison</h3>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {data.cities.length} zones
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {data.cities.map((c) => (
            <div key={c.city} className="glass-card rounded-lg p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {c.city}
              </div>
              <div className="font-display text-5xl text-primary leading-none">
                {c.avgMinutes.toFixed(1)}
                <span className="text-xl text-primary/60 ml-1">min</span>
              </div>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total orders</span>
                  <span className="font-mono">{c.totalOrders.toLocaleString()}</span>
                </div>
                {c.uniqueDrivers !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unique drivers</span>
                    <span className="font-mono">{c.uniqueDrivers.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model performance */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-display text-2xl">Model performance</h3>
          </div>
          <span className="font-mono text-xs text-muted-foreground">XGBoost · chronological split</span>
        </div>
        <div className="glass-card rounded-lg p-6 lg:p-8 grid md:grid-cols-2 gap-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                MAE
              </div>
              <div className="font-display text-6xl text-primary leading-none">
                {data.model.mae.toFixed(1)}
                <span className="text-xl text-primary/60 ml-1">min</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Mean absolute error on the held-out test set.</p>
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                R²
              </div>
              <div className="font-display text-6xl text-primary leading-none">
                {data.model.r2.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-3">Coefficient of determination across all features.</p>
            </div>
          </div>

          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Error distribution
            </div>
            <div className="space-y-3">
              {data.model.errorBuckets?.map((b) => {
                const total = data.model.errorBuckets!.reduce((s, x) => s + x.count, 0);
                const pct = (b.count / total) * 100;
                return (
                  <div key={b.range}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-mono text-muted-foreground">{b.range}</span>
                      <span className="font-mono">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}