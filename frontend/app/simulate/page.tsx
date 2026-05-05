import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import SimulateContent from "./SimulateContent";

export const metadata = {
  title: "Simulate — Delivo",
  description: "Live simulation of delivery orders with AI agent rebalancing.",
};

export default function SimulatePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay bg-background">
      <Navigation />

      <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-primary/60" />
            Live Simulation
          </span>
          <h1 className="font-display text-5xl lg:text-7xl tracking-tight leading-[0.95] mb-4">
            Watch orders
            <br />
            <span className="text-primary">spawn live</span>.
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Each order calls the ML API and returns a delivery time prediction. The AI agent watches
            every zone and recommends driver redistribution.
          </p>
        </div>
      </section>

      <section className="relative pb-24 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <SimulateContent />
        </div>
      </section>

      <FooterSection />
    </main>
  );
}