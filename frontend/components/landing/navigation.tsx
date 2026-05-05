"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/predict", label: "Predict" },
  { href: "/simulate", label: "Simulate" },
  { href: "/insights", label: "Insights" },
];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "pt-4" : ""
      }`}
    >
      {/* The main pill/bar – height changes smoothly */}
      <div
        className={`
          mx-auto max-w-5xl flex items-center
          px-6 lg:px-8
          transition-all duration-500
          ${
            scrolled
              ? "h-14 bg-background/70 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg shadow-amber-500/5"
              : "h-16 lg:h-20 bg-transparent border-none rounded-none"
          }
        `}
      >
        {/* Logo – larger when not scrolled */}
        <Link
          href="/"
          className={`flex items-center gap-2 font-display text-primary shrink-0 transition-all duration-500 ${
            scrolled ? "text-lg" : "text-2xl lg:text-3xl"
          }`}
        >
          Delivo
          <span className="text-xs font-mono text-muted-foreground">AI</span>
        </Link>

        {/* Centered links */}
        <div className="hidden lg:flex flex-1 justify-center">
          <div className="flex items-center gap-6 text-sm font-medium">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-1 py-2 text-foreground hover:text-primary transition-colors duration-300 group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right – button */}
        <div className="hidden lg:flex items-center shrink-0 ml-4">
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-full text-sm"
          >
            <Link href="/predict">Try Prediction</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden ml-auto p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className="block w-5 h-0.5 bg-foreground mb-1" />
          <span className="block w-5 h-0.5 bg-foreground mb-1" />
          <span className="block w-5 h-0.5 bg-foreground" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-5xl bg-background/95 backdrop-blur-xl border border-foreground/10 rounded-2xl px-6 py-4 space-y-3">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="block text-sm">
              {item.label}
            </Link>
          ))}
          <Button asChild className="w-full mt-2 bg-primary text-primary-foreground rounded-full text-sm">
            <Link href="/predict">Try Prediction</Link>
          </Button>
        </div>
      )}
    </header>
  );
}