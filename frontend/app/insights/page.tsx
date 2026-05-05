import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import InsightsContent from "./InsightsContent";

export const metadata = {
  title: "Insights — Delivo",
  description: "Deep analytics derived from 45,593 real Indian delivery records.",
};

export default function InsightsPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay bg-background">
      <Navigation />

      <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-primary/60" />
            Deep Analytics
          </span>
          <h1 className="font-display text-5xl lg:text-7xl tracking-tight leading-[0.95] mb-4">
            45,593 records.
            <br />
            <span className="text-primary">Zero guesswork</span>.
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Hourly demand, weather and traffic impact, city-level breakdowns, and live model
            performance — all derived from real Indian delivery data.
          </p>
        </div>
      </section>

      <section className="relative pb-24 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <InsightsContent />
        </div>
      </section>

      <FooterSection />
    </main>
  );
}