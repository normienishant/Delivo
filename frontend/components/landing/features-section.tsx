"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    number: "01",
    title: "ML-Powered Predictions",
    description:
      "XGBoost model with chronological split, 3.2 min MAE, SHAP explainability. Every prediction comes with confidence ranges and factor breakdowns.",
    visual: "predict",
  },
  {
    number: "02",
    title: "Live Simulation Engine",
    description:
      "Watch orders spawn in real-time on a live feed. Each order calls the ML API and returns predicted delivery time with full explainability.",
    visual: "simulate",
  },
  {
    number: "03",
    title: "AI Agent Copilot",
    description:
      "Automatically detects zone bottlenecks and driver shortages. Suggests real-time redistribution: \"Move 3 drivers to Semi-Urban to cut 18% delay.\"",
    visual: "agent",
  },
  {
    number: "04",
    title: "Deep Analytics",
    description:
      "Hourly demand charts, weather & traffic impact analysis, city-level comparisons — all derived from 45,593 real Indian delivery records.",
    visual: "analytics",
  },
];

function PredictVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <defs>
        <clipPath id="predictClip">
          <rect x="30" y="20" width="140" height="120" rx="4" />
        </clipPath>
      </defs>
      
      {/* Container */}
      <rect x="30" y="20" width="140" height="120" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      
      {/* Distribution curve bars */}
      <g clipPath="url(#predictClip)">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const heights = [12, 22, 36, 58, 80, 70, 48, 28, 16];
          return (
            <rect
              key={i}
              x={36 + i * 14}
              y={130 - heights[i]}
              width="10"
              height={heights[i]}
              fill="currentColor"
              opacity="0.3"
            >
              <animate
                attributeName="opacity"
                values="0.15;0.7;0.15"
                dur="2s"
                begin={`${i * 0.12}s`}
                repeatCount="indefinite"
              />
            </rect>
          );
        })}
      </g>
      
      {/* Mean indicator */}
      <line x1="92" y1="20" x2="92" y2="140" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      <text x="92" y="14" fontSize="9" fontFamily="monospace" textAnchor="middle" fill="currentColor" opacity="0.7">μ=26.3</text>
    </svg>
  );
}

function SimulateVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {/* Live feed container */}
      <rect x="20" y="20" width="160" height="120" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      
      {/* Feed entries */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="30" y={32 + i * 26} width="140" height="20" rx="2" fill="currentColor" opacity="0.08">
            <animate attributeName="opacity" values="0.3;0.08" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
          </rect>
          <circle cx="40" cy={42 + i * 26} r="3" fill="currentColor">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <rect x="50" y={38 + i * 26} width="60" height="3" fill="currentColor" opacity="0.5" />
          <rect x="120" y={38 + i * 26} width="40" height="3" fill="currentColor" opacity="0.3" />
          <rect x="50" y={45 + i * 26} width="40" height="2" fill="currentColor" opacity="0.25" />
        </g>
      ))}
      
      {/* Live indicator */}
      <circle cx="170" cy="30" r="3" fill="currentColor">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function AgentVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {/* Zones */}
      <g>
        <rect x="20" y="30" width="50" height="100" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <text x="45" y="50" fontSize="9" fontFamily="monospace" textAnchor="middle" fill="currentColor" opacity="0.7">Urban</text>
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={30 + (i % 3) * 12} cy={70 + Math.floor(i / 3) * 12} r="3" fill="currentColor" opacity="0.5" />
        ))}
      </g>
      
      <g>
        <rect x="80" y="30" width="50" height="100" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="105" y="50" fontSize="9" fontFamily="monospace" textAnchor="middle" fill="currentColor">Semi-U</text>
        <circle cx="90" cy="70" r="3" fill="currentColor">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>
      
      <g>
        <rect x="140" y="30" width="50" height="100" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <text x="165" y="50" fontSize="9" fontFamily="monospace" textAnchor="middle" fill="currentColor" opacity="0.7">Metro</text>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <circle key={i} cx={148 + (i % 3) * 12} cy={70 + Math.floor(i / 3) * 12} r="3" fill="currentColor" opacity="0.5" />
        ))}
      </g>
      
      {/* Redistribution arrows */}
      <path d="M 75 80 L 80 80" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow1)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M 135 80 L 130 80" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow2)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.5s" repeatCount="indefinite" />
      </path>
      
      <defs>
        <marker id="arrow1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
        </marker>
        <marker id="arrow2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}

function AnalyticsVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {/* Axes */}
      <line x1="30" y1="130" x2="180" y2="130" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="30" y1="20" x2="30" y2="130" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      
      {/* Bars - hourly demand pattern */}
      {[15, 22, 30, 50, 75, 95, 80, 60, 45, 70, 88, 72].map((h, i) => (
        <rect
          key={i}
          x={36 + i * 12}
          y={130 - h}
          width="9"
          height={h}
          fill="currentColor"
          opacity="0.5"
        >
          <animate
            attributeName="height"
            values={`${h * 0.5};${h};${h * 0.5}`}
            dur="3s"
            begin={`${i * 0.15}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            values={`${130 - h * 0.5};${130 - h};${130 - h * 0.5}`}
            dur="3s"
            begin={`${i * 0.15}s`}
            repeatCount="indefinite"
          />
        </rect>
      ))}
    </svg>
  );
}

function AnimatedVisual({ type }: { type: string }) {
  switch (type) {
    case "predict":
      return <PredictVisual />;
    case "simulate":
      return <SimulateVisual />;
    case "agent":
      return <AgentVisual />;
    case "analytics":
      return <AnalyticsVisual />;
    default:
      return <PredictVisual />;
  }
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 lg:py-20 border-b border-foreground/10">
        {/* Number */}
        <div className="shrink-0">
          <span className="font-mono text-sm text-primary">{feature.number}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-3xl lg:text-4xl font-display mb-4 group-hover:translate-x-2 transition-transform duration-500">
              {feature.title}
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
          
          {/* Visual */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-48 h-40 text-primary">
              <AnimatedVisual type={feature.visual} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 lg:py-32"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-primary/60" />
            Capabilities
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Everything you need.
            <br />
            <span className="text-muted-foreground">Trained on real data.</span>
          </h2>
        </div>

        {/* Features List */}
        <div>
          {features.map((feature, index) => (
            <FeatureCard key={feature.number} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
