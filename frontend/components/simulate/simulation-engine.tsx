"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import dynamic from "next/dynamic";

const ZoneMap = dynamic(() => import("./zone-map"), { ssr: false });

const API_BASE = "http://localhost:8000";

type FeedEntry = {
  id: string;
  zone: string;
  predictedMinutes: number;
  actualMinutes: number | null;
  weather: string;
  traffic: string;
  hour: number;
  status: "predicting" | "ok" | "error";
  errorMessage?: string;
  lat?: number;
  lng?: number;
};

type Stats = {
  count: number;
  sumError: number;
  within5: number;
  within10: number;
};

export function SimulationEngine() {
  const [running, setRunning] = useState(false);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [agentSuggestion, setAgentSuggestion] = useState<string>("");
  const [stats, setStats] = useState<Stats>({ count: 0, sumError: 0, within5: 0, within10: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const agentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spawnDelivery = async () => {
    try {
      const res = await fetch(`${API_BASE}/random-delivery`);
      if (!res.ok) return;
      const { payload, actual_minutes } = await res.json();

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const seedEntry: FeedEntry = {
        id,
        zone: payload.city || "Urban",
        predictedMinutes: 0,
        actualMinutes: actual_minutes ?? null,
        weather: payload.weather,
        traffic: payload.traffic,
        hour: payload.order_hour,
        status: "predicting",
        lat: payload.delivery_lat,
        lng: payload.delivery_lon,
      };
      setFeed((prev) => [seedEntry, ...prev].slice(0, 20));

      const predRes = await fetch(`${API_BASE}/predict-delivery-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!predRes.ok) return;
      const predData = await predRes.json();
      const predicted = Number(predData.predicted_minutes ?? 0);

      setFeed((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "ok", predictedMinutes: predicted } : e))
      );

      if (actual_minutes != null) {
        const error = Math.abs(predicted - actual_minutes);
        setStats((s) => ({
          count: s.count + 1,
          sumError: s.sumError + error,
          within5: s.within5 + (error <= 5 ? 1 : 0),
          within10: s.within10 + (error <= 10 ? 1 : 0),
        }));
      }
    } catch {}
  };

  const runAgent = async () => {
    try {
      const [bnRes] = await Promise.all([
        fetch(`${API_BASE}/zone-bottlenecks`, { cache: "no-store" }),
      ]);
      if (!bnRes.ok) return;
      const bn = await bnRes.json();
      const zones = bn?.zones || [];
      const hotZone = zones.find((z: any) => z.status === "critical");
      if (hotZone) {
        setAgentSuggestion(
          `⚠️ ${hotZone.zone} understaffed — Move ${Math.ceil(hotZone.demand_driver_ratio / 10)} drivers. ~${hotZone.demand_driver_ratio ? Math.round(Math.min(hotZone.demand_driver_ratio, 40) * 100 / 200) : 12}% delay reduction.`
        );
      } else {
        setAgentSuggestion("✅ All zones balanced");
      }
    } catch {
      setAgentSuggestion("");
    }
  };

  const start = () => {
    if (running) return;
    setRunning(true);
    spawnDelivery();
    runAgent();
    intervalRef.current = setInterval(spawnDelivery, 2500);
    agentIntervalRef.current = setInterval(runAgent, 7000);
  };

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (agentIntervalRef.current) clearInterval(agentIntervalRef.current);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (agentIntervalRef.current) clearInterval(agentIntervalRef.current);
    };
  }, []);

  const accuracy =
    stats.count > 0
      ? {
          mae: (stats.sumError / stats.count).toFixed(1),
          within5pct: ((stats.within5 / stats.count) * 100).toFixed(0),
          within10pct: ((stats.within10 / stats.count) * 100).toFixed(0),
        }
      : null;

  const mapMarkers = feed
    .filter((e) => e.status === "ok" && e.lat && e.lng)
    .slice(0, 20)
    .map((e) => ({
      id: e.id,
      zone: e.zone,
      lat: e.lat!,
      lng: e.lng!,
      predictedMinutes: e.predictedMinutes,
    }));

  return (
    <div className="space-y-6">
      {/* Top control bar with stats and agent suggestion */}
      <div className="glass-card rounded-xl p-4 flex items-center gap-6 justify-between flex-wrap">
        <div className="flex items-center gap-4">
          <span className={`w-2.5 h-2.5 rounded-full ${running ? "bg-primary animate-pulse" : "bg-foreground/20"}`} />
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {running ? "Replaying deliveries" : "Idle"}
          </span>
          {accuracy && (
            <span className="font-mono text-xs text-muted-foreground">
              MAE: {accuracy.mae} min · ±5min: {accuracy.within5pct}% · ±10min: {accuracy.within10pct}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {agentSuggestion && (
            <span className="text-xs font-mono text-primary max-w-md truncate hidden md:inline">{agentSuggestion}</span>
          )}
          <Button
            onClick={running ? stop : start}
            className={`rounded-full h-10 px-5 text-sm ${
              running ? "border-foreground/20" : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {running ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {running ? "Stop" : "Start Replay"}
          </Button>
        </div>
      </div>

      {/* Full‑width map */}
      <div className="h-[420px] glass-card rounded-xl overflow-hidden">
        <ZoneMap markers={mapMarkers} />
      </div>

      {/* Live feed (scrollable) */}
      <div>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">Live Replay Feed</h2>
        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
          {feed.map((entry) => (
            <div key={entry.id} className="glass-card rounded-md p-3 flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-medium w-20">{entry.zone}</span>
              <span className="text-muted-foreground w-16">{entry.weather}</span>
              <span className="text-muted-foreground w-12">{entry.traffic}</span>
              <span className="font-mono ml-auto">
                {entry.status === "predicting" && "…"}
                {entry.status === "ok" && (
                  <>
                    Pred: <span className="text-primary">{entry.predictedMinutes.toFixed(1)} min</span>
                    {entry.actualMinutes != null && (
                      <> · Real: <span className="text-muted-foreground">{entry.actualMinutes.toFixed(1)} min</span></>
                    )}
                  </>
                )}
                {entry.status === "error" && <span className="text-destructive">offline</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}