export default function Loading() {
  return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="skeleton h-6 w-40 rounded mb-2" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="skeleton h-8 w-28 rounded" />
      </div>
      <div className="flex gap-2 mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-7 w-20 rounded-full" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="skeleton h-4 w-3/4 rounded mb-2" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
              <div className="skeleton h-5 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
