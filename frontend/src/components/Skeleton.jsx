export function Skeleton({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-200/70 dark:bg-slate-800 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-white/5 to-transparent" />
    </div>
  );
}

Skeleton.Text = function Text({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
};

Skeleton.Stat = function Stat() {
  return (
    <div className="card p-6">
      <Skeleton className="w-11 h-11 rounded-xl mb-4" />
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  );
};

Skeleton.Row = function Row() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <Skeleton className="w-4 h-4 rounded" />
    </div>
  );
};

Skeleton.Table = function Table({ rows = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-slate-50/70 dark:bg-slate-900/50 px-6 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-6">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
};

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-3 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton.Stat /><Skeleton.Stat /><Skeleton.Stat />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="space-y-4">
            <Skeleton.Row /><Skeleton.Row /><Skeleton.Row /><Skeleton.Row />
          </div>
        </div>
        <div className="card p-6">
          <Skeleton className="h-5 w-32 mb-6" />
          <Skeleton className="w-full aspect-square rounded-full" />
        </div>
      </div>
      <div className="card p-6">
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}