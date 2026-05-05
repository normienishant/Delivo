"use client";

import { useEffect, useState, useRef } from "react";

const stack = [
  { name: "Python", category: "Runtime" },
  { name: "FastAPI", category: "API Framework" },
  { name: "XGBoost", category: "ML Model" },
  { name: "SHAP", category: "Explainability" },
  { name: "PyTorch", category: "Deep Learning" },
  { name: "Next.js", category: "Frontend" },
  { name: "Tailwind CSS", category: "Styling" },
  { name: "Framer Motion", category: "Animation" },
  { name: "Recharts", category: "Visualization" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Docker", category: "Containers" },
  { name: "AWS", category: "Cloud" },
];

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false);
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

  return (
    <section id="integrations" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 lg:mb-24 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-primary/60" />
            Tech Stack
            <span className="w-8 h-px bg-primary/60" />
          </span>
          <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-6">
            Production-grade tools.
            <br />
            Battle-tested at scale.
          </h2>
          <p className="text-xl text-muted-foreground">
            Every layer chosen for reliability — from the model server to the UI.
          </p>
        </div>

      </div>
      
      {/* Full-width marquees outside container */}
      <div className="w-full mb-6">
        <div className="flex gap-6 marquee">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 shrink-0">
              {stack.map((tech) => (
                <div
                  key={`${tech.name}-${setIndex}`}
                  className="shrink-0 px-8 py-6 border border-foreground/10 hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300 group"
                >
                  <div className="text-lg font-medium group-hover:translate-x-1 group-hover:text-primary transition-all">
                    {tech.name}
                  </div>
                  <div className="text-sm text-muted-foreground">{tech.category}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Reverse marquee */}
      <div className="w-full">
        <div className="flex gap-6 marquee-reverse">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 shrink-0">
              {[...stack].reverse().map((tech) => (
                <div
                  key={`${tech.name}-reverse-${setIndex}`}
                  className="shrink-0 px-8 py-6 border border-foreground/10 hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300 group"
                >
                  <div className="text-lg font-medium group-hover:translate-x-1 group-hover:text-primary transition-all">
                    {tech.name}
                  </div>
                  <div className="text-sm text-muted-foreground">{tech.category}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
