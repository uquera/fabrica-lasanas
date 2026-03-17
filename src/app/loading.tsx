export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-7 w-32 bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-zinc-900 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-64 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
        </div>

        {/* KPI cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-zinc-800 rounded-xl animate-pulse" />
                <div className="w-10 h-4 bg-zinc-800 rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
              <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-20 bg-zinc-900 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chart + sidebar skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 h-64 animate-pulse" />
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 h-36 animate-pulse" />
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/50 last:border-0">
                  <div className="h-4 w-28 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ranking + recent skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="divide-y divide-zinc-800/50">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-2 h-2 rounded-full bg-zinc-800 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-zinc-900 rounded animate-pulse" />
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
                      <div className="h-3 w-10 bg-zinc-900 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
