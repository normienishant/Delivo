"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatedWave } from "./animated-wave";

const footerLinks = {
  Product: [
    { name: "Home", href: "/" },
    { name: "Predict", href: "/predict" },
    { name: "Simulate", href: "/simulate" },
    { name: "Insights", href: "/insights" },
  ],
  Built With: [
  { name: "FastAPI",       href: "https://fastapi.tiangolo.com" },
  { name: "XGBoost",       href: "https://xgboost.readthedocs.io" },
  { name: "Next.js",       href: "https://nextjs.org/docs" },
  { name: "GitHub Repo",   href: "https://github.com/normienishant/Delivo" },
],
  Model: [
    { name: "45,593 real deliveries", href: "/insights" },
    { name: "XGBoost + SHAP", href: "/predict" },
    { name: "Dataset", href: "https://kaggle.com/datasets/gauravmalik26/food-delivery-dataset" },
  ],
  Legal: [
    { name: "MIT License", href: "https://github.com/normienishant/Delivo" },
  ],
};

const socialLinks = [
  { name: "GitHub", href: "https://github.com/normienishant/Delivo" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/designsbynishant/" }
];

export function FooterSection() {
  return (
    <footer className="relative border-t border-foreground/10">
      {/* Animated wave background */}
      <div className="absolute inset-0 h-64 opacity-30 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 lg:gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-6">
                <span className="text-2xl font-display">Delivo</span>
                <span className="text-xs text-primary font-mono">AI</span>
              </Link>

              <p className="text-muted-foreground leading-relaxed mb-4 max-w-xs">
                Delivo — AI Delivery Twin. Predict, simulate, and optimize your fleet in real time.
              </p>
              <p className="text-xs font-mono text-muted-foreground mb-8">
                Built with FastAPI, XGBoost, Next.js
              </p>

              {/* Social Links */}
              <div className="flex gap-6">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                        {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Delivo. All rights reserved.
          </p>

         
        </div>
      </div>
    </footer>
  );
}