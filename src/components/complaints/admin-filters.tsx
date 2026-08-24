'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef, useTransition } from 'react'
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils'
import { X } from 'lucide-react'

interface Props {
  search: string
  status: string
  category: string
  priority: string
  date: string
  overdueFilter: string
  hasFilters: boolean
}

export function AdminComplaintsFilters({
  search,
  status,
  category,
  priority,
  date,
  overdueFilter,
  hasFilters,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams()
      const current = { search, status, category, priority, date, overdue: overdueFilter }
      Object.entries(current).forEach(([k, v]) => {
        if (v) params.set(k, v)
      })
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      startTransition(() => {
        router.push(`/admin/complaints?${params.toString()}`)
      })
    },
    [router, search, status, category, priority, date, overdueFilter]
  )

  const clearAll = useCallback(() => {
    startTransition(() => router.push('/admin/complaints'))
  }, [router])

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <input
          id="admin-search"
          type="text"
          defaultValue={search}
          placeholder="Search complaints, residents..."
          className="input pl-3 pr-8 text-xs"
          onChange={(e) => {
            const v = e.target.value
            clearTimeout(searchTimeoutRef.current)
            searchTimeoutRef.current = setTimeout(() => updateFilter('search', v), 300)
          }}
        />
        {search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Status filter */}
      <select
        id="admin-status-filter"
        value={status}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="input text-xs w-auto min-w-[110px]"
      >
        <option value="">All statuses</option>
        {Object.entries(STATUS_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>

      {/* Category filter */}
      <select
        id="admin-category-filter"
        value={category}
        onChange={(e) => updateFilter('category', e.target.value)}
        className="input text-xs w-auto min-w-[120px]"
      >
        <option value="">All categories</option>
        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        id="admin-priority-filter"
        value={priority}
        onChange={(e) => updateFilter('priority', e.target.value)}
        className="input text-xs w-auto min-w-[110px]"
      >
        <option value="">All priorities</option>
        {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>

      {/* Date filter */}
      <select
        id="admin-date-filter"
        value={date}
        onChange={(e) => updateFilter('date', e.target.value)}
        className="input text-xs w-auto min-w-[110px]"
      >
        <option value="">Any time</option>
        <option value="today">Today</option>
        <option value="7days">Past 7 days</option>
        <option value="30days">Past 30 days</option>
      </select>

      {/* Overdue toggle */}
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          id="admin-overdue-filter"
          type="checkbox"
          checked={overdueFilter === 'true'}
          onChange={(e) => updateFilter('overdue', e.target.checked ? 'true' : '')}
          className="accent-brand-action"
        />
        <span className="text-xs text-text-secondary">Overdue only</span>
      </label>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="btn-sm btn-ghost text-text-muted hover:text-overdue flex items-center gap-1"
        >
          <X size={12} />
          Clear filters
        </button>
      )}

      {isPending && (
        <span className="text-xs text-text-muted animate-pulse">Filtering...</span>
      )}
    </div>
  )
}
