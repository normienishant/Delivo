"use client";
import dynamic from "next/dynamic";

const PredictionForm = dynamic(
  () =>
    import("@/components/predict/prediction-form").then((mod) => ({
      default: mod.PredictionForm,
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

export default function PredictContent() {
  return <PredictionForm />;
}