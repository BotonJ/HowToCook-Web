export function ExploreSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center space-y-2">
        <div className="h-10 bg-surface-container rounded-lg w-72 mx-auto" />
        <div className="h-5 bg-surface-container rounded w-56 mx-auto" />
      </div>
      <p className="text-center text-on-surface-variant font-body text-body-md">
        Loading ingredient model...
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="h-10 bg-surface-container rounded-full" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-surface-container rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="h-8 bg-surface-container rounded w-48" />
            <div className="h-10 bg-surface-container rounded-full" />
            <div className="h-8 bg-surface-container rounded-lg" />
          </div>
          <div className="space-y-3">
            <div className="h-8 bg-surface-container rounded w-40" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface-container rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
