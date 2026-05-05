export default function InsightsLoading() {
  return (
    <div className="min-h-screen pt-28 px-6 max-w-[1400px] mx-auto">
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-48 bg-neutral-800 rounded" />
        <div className="h-4 w-80 bg-neutral-800 rounded" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-80 bg-neutral-800 rounded-2xl" />
          <div className="h-80 bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}