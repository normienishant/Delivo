"use client";
import dynamic from "next/dynamic";

const SimulationEngine = dynamic(
  () =>
    import("@/components/simulate/simulation-engine").then((mod) => ({
      default: mod.SimulationEngine,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function SimulateContent() {
  return <SimulationEngine />;
}