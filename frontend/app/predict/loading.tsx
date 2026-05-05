export default function PredictLoading() {
  return (
    <div className="min-h-screen pt-28 px-6 max-w-[1400px] mx-auto">
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-64 bg-neutral-800 rounded" />
        <div className="h-4 w-96 bg-neutral-800 rounded" />
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-40 bg-neutral-800 rounded-2xl" />
            <div className="h-40 bg-neutral-800 rounded-2xl" />
            <div className="h-60 bg-neutral-800 rounded-2xl" />
          </div>
          <div className="lg:col-span-2">
            <div className="h-64 bg-neutral-800 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}