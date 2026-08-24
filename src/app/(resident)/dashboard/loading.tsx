export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="skeleton h-6 w-48 mb-2 rounded" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4">
            <div className="skeleton h-3 w-16 rounded mb-2" />
            <div className="skeleton h-8 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="card p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
            <div className="skeleton h-5 w-16 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
