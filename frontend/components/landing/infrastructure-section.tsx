"use client";

import { useEffect, useState, useRef } from "react";

const zones = [
  { city: "Bengaluru", region: "Metropolitian", latency: "p50 24.1 min" },
  { city: "Mumbai", region: "Metropolitian", latency: "p50 27.8 min" },
  { city: "Delhi NCR", region: "Urban", latency: "p50 25.3 min" },
  { city: "Hyderabad", region: "Urban", latency: "p50 23.6 min" },
  { city: "Pune", region: "Urban", latency: "p50 22.4 min" },
  { city: "Coimbatore", region: "Semi-Urban", latency: "p50 29.7 min" },
];

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeLocation, setActiveLocation] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLocation((prev) => (prev + 1) % zones.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-primary/60" />
              Coverage
            </span>
            <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-8">
              Trained on real
              <br />
              Indian cities.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-12">
              The model learns from 45,593 actual delivery records across Metropolitian, Urban, and Semi-Urban zones — capturing weather, traffic, and driver patterns that synthetic data can&apos;t match.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-4xl lg:text-5xl font-display mb-2 text-primary">3</div>
                <div className="text-sm text-muted-foreground">City tiers</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-display mb-2 text-primary">45k+</div>
                <div className="text-sm text-muted-foreground">Real records</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-display mb-2 text-primary">1.3k</div>
                <div className="text-sm text-muted-foreground">Drivers tracked</div>
              </div>
            </div>
          </div>

          {/* Right: Location list */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="border border-foreground/10">
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
                <span className="text-sm font-mono text-muted-foreground">Zone Coverage</span>
                <span className="flex items-center gap-2 text-xs font-mono text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Model active
                </span>
              </div>

              {/* Locations */}
              <div>
                {zones.map((location, index) => (
                  <div
                    key={location.city}
                    className={`px-6 py-5 border-b border-foreground/5 last:border-b-0 flex items-center justify-between transition-all duration-300 ${
                      activeLocation === index ? "bg-primary/[0.04]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span 
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          activeLocation === index ? "bg-primary" : "bg-foreground/20"
                        }`}
                      />
                      <div>
                        <div className="font-medium">{location.city}</div>
                        <div className="text-sm text-muted-foreground">{location.region}</div>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">{location.latency}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
