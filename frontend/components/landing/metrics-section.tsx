"use client";

import { useEffect, useState, useRef } from "react";

const API_BASE = "http://localhost:8000";

function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  decimals = 0,
  active,
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  active: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const duration = 1800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, active]);

  const formatted =
    decimals > 0
      ? count.toFixed(decimals)
      : Math.floor(count).toLocaleString();

  return (
    <div className="text-5xl lg:text-7xl font-display tracking-tight">
      {prefix}
      <span className="text-primary">{formatted}</span>
      {suffix}
    </div>
  );
}

type Metric = {
  key: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
  rawDisplay?: string;
};

const fallbackMetrics: Metric[] = [
  { key: "records", value: 45593, label: "Total Records" },
  { key: "avgTime", value: 26.3, decimals: 1, suffix: " min", label: "Avg Delivery Time" },
  { key: "mae", value: 3.2, decimals: 1, suffix: " min", label: "Model MAE" },
  { key: "peak", value: 0, label: "Peak Hours", rawDisplay: "11–14 · 17–21" },
  { key: "cities", value: 3, label: "Cities Covered", rawDisplay: "Metro · Urban · Semi-Urban" },
  { key: "drivers", value: 1320, label: "Unique Drivers" },
];

export function MetricsSection() {
  const [time, setTime] = useState<Date | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>(fallbackMetrics);
  const [status, setStatus] = useState<"idle" | "live" | "fallback">("idle");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
  setTime(new Date());   // ✅ set initial time right away on client
  const interval = setInterval(() => setTime(new Date()), 1000);
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchInsights = async () => {
      try {
        const res = await fetch(`${API_BASE}/dataset-insights`, { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (cancelled) return;

        // ✅ FIXED: using actual backend response field names
        const next: Metric[] = [
          {
            key: "records",
            value: Number(data.total_records ?? fallbackMetrics[0].value),
            label: "Total Records",
          },
          {
            key: "avgTime",
            value: Number(data.overall_avg_delivery_min ?? fallbackMetrics[1].value),
            decimals: 1,
            suffix: " min",
            label: "Avg Delivery Time",
          },
          {
            key: "mae",
            value: Number(
              data.model_performance?.delivery_time_model?.mae_minutes ??
                fallbackMetrics[2].value
            ),
            decimals: 1,
            suffix: " min",
            label: "Model MAE",
          },
          {
            key: "peak",
            value: 0,
            label: "Peak Hours",
            rawDisplay: Array.isArray(data.peak_hours)
              ? data.peak_hours.join(" · ")
              : fallbackMetrics[3].rawDisplay,
          },
          {
            key: "cities",
            value: Array.isArray(data.city_stats) ? data.city_stats.length : 3,
            label: "Cities Covered",
            rawDisplay: Array.isArray(data.city_stats)
              ? data.city_stats.map((c: any) => c.City || c.city).join(" · ")
              : fallbackMetrics[4].rawDisplay,
          },
          {
            key: "drivers",
            value: Number(data.unique_drivers ?? fallbackMetrics[5].value),
            label: "Unique Drivers",
          },
        ];
        setMetrics(next);
        setStatus("live");
      } catch {
        if (cancelled) return;
        setStatus("fallback");
      }
    };
    fetchInsights();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="studio" ref={sectionRef} className="relative py-24 lg:py-32 border-y border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16 lg:mb-24">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-primary/60" />
              Live metrics
            </span>
            <h2
              className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Performance you
              <br />
              can measure.
            </h2>
          </div>
          <div className="flex items-center gap-4 font-mono text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  status === "live" ? "bg-primary" : status === "fallback" ? "bg-foreground/40" : "bg-primary"
                }`}
              />
              {status === "live" ? "Live" : status === "fallback" ? "Cached" : "Loading"}
            </span>
            <span className="text-foreground/30">|</span>
            {time && <span>{time.toLocaleTimeString()}</span>}
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10">
          {metrics.map((metric, index) => (
            <div
              key={metric.key}
              className={`bg-background p-8 lg:p-10 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              {metric.rawDisplay ? (
                <div className="text-3xl lg:text-4xl font-display tracking-tight text-primary leading-tight">
                  {metric.rawDisplay}
                </div>
              ) : (
                <AnimatedCounter
                  end={metric.value}
                  suffix={metric.suffix}
                  prefix={metric.prefix}
                  decimals={metric.decimals}
                  active={hasAnimated}
                />
              )}
              <div className="mt-4 text-sm uppercase tracking-widest font-mono text-muted-foreground">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}