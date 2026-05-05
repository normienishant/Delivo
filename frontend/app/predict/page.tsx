import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import PredictContent from "./PredictContent";

export const metadata = {
  title: "Predict — Delivo",
  description: "Predict delivery times in real-time with full SHAP explainability.",
};

export default function PredictPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay bg-background">
      <Navigation />

      <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-primary/60" />
            Delivery Time Prediction
          </span>
          <h1 className="font-display text-5xl lg:text-7xl tracking-tight leading-[0.95] mb-4">
            Predict any
            <br />
            <span className="text-primary">delivery time</span>.
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Submit an order and Delivo&apos;s XGBoost model returns a predicted delivery time with confidence range and SHAP explainability — all in under 40&nbsp;ms.
          </p>
        </div>
      </section>

      <section className="relative pb-24 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <PredictContent />
        </div>
      </section>

      <FooterSection />
    </main>
  );
}