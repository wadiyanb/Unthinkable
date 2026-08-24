export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="skeleton h-6 w-40 rounded mb-2" />
        <div className="skeleton h-4 w-64 rounded" />
      </div>
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-4">
            <div className="skeleton h-3 w-14 rounded mb-3" />
            <div className="skeleton h-8 w-10 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 card p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-1">
                <div className="skeleton h-3.5 w-2/3 rounded mb-1.5" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
              <div className="skeleton h-5 w-16 rounded" />
            </div>
          ))}
        </div>
        <div className="col-span-2 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-3">
              <div className="skeleton h-3.5 w-3/4 rounded mb-1.5" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
