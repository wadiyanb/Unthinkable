import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOverdueThreshold, isComplaintOverdue } from '@/lib/overdue'
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS, PRIORITY_DOT_COLORS, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AlertCircle, Search } from 'lucide-react'
import { Metadata } from 'next'
import { AdminComplaintsFilters } from '@/components/complaints/admin-filters'
import { Complaint, User } from '@prisma/client'

export const metadata: Metadata = { title: 'All Complaints' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: {
    search?: string
    status?: string
    category?: string
    priority?: string
    date?: string
    overdue?: string
    page?: string
  }
}

type ComplaintWithResident = Complaint & {
  resident: Pick<User, 'id' | 'name' | 'email' | 'flatNumber'>
  _count: { history: number }
  isOverdue: boolean
}

export default async function AdminComplaintsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return null

  const {
    search = '',
    status = '',
    category = '',
    priority = '',
    date = '',
    overdue: overdueFilter = '',
    page: pageStr = '1',
  } = searchParams

  const page = Math.max(1, parseInt(pageStr) || 1)
  const limit = 20
  const skip = (page - 1) * limit

  const thresholdDays = await getOverdueThreshold()

  const where: any = {}
  if (status && status !== 'ALL') where.status = status
  if (category && category !== 'ALL') where.category = category
  if (priority && priority !== 'ALL') where.priority = priority

  if (overdueFilter === 'true') {
    const overdueDate = new Date()
    overdueDate.setDate(overdueDate.getDate() - thresholdDays)
    where.status = { notIn: ['RESOLVED'] }
    where.createdAt = { lt: overdueDate }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { id: { contains: search, mode: 'insensitive' } },
      { resident: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [complaints, total] = await Promise.all([
    db.complaint.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: {
        resident: { select: { id: true, name: true, email: true, flatNumber: true } },
        _count: { select: { history: true } },
      },
    }),
    db.complaint.count({ where }),
  ])

  const complaintsWithOverdue: ComplaintWithResident[] = complaints.map((c) => ({
    ...c,
    isOverdue: isComplaintOverdue(c.createdAt, c.status, thresholdDays),
  }))

  // Sort: overdue first, then HIGH priority, then date
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  complaintsWithOverdue.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
    if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority]
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const totalPages = Math.ceil(total / limit)
  const hasFilters = !!(search || status || category || priority || date || overdueFilter)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">All complaints</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {total} complaint{total !== 1 ? 's' : ''}
            {hasFilters && ' matching filters'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <AdminComplaintsFilters
        search={search}
        status={status}
        category={category}
        priority={priority}
        date={date}
        overdueFilter={overdueFilter}
        hasFilters={hasFilters}
      />

      {/* Table */}
      {complaintsWithOverdue.length === 0 ? (
        <div className="card p-10 text-center mt-4">
          <Search size={28} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-primary">
            {hasFilters ? 'No complaints match your filters' : 'No complaints yet'}
          </p>
          <p className="text-text-secondary text-sm mt-1">
            {hasFilters ? 'Try changing or clearing the filters.' : 'Complaints will appear here once residents submit them.'}
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrapper mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Resident</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {complaintsWithOverdue.map((c) => (
                  <tr key={c.id} className={c.isOverdue ? 'bg-overdue-light/20' : ''}>
                    <td className="max-w-[240px]">
                      <p className="font-medium text-text-primary truncate">{c.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-2xs text-text-muted">
                          #{c.id.slice(-6).toUpperCase()}
                        </span>
                        {c.isOverdue && (
                          <span className="badge-overdue">
                            <AlertCircle size={8} />
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <p className="text-xs text-text-primary">{c.resident.name}</p>
                      {c.resident.flatNumber && (
                        <p className="text-2xs text-text-muted">Flat {c.resident.flatNumber}</p>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-text-secondary">{CATEGORY_LABELS[c.category]}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`priority-dot ${PRIORITY_DOT_COLORS[c.priority]}`} />
                        <span className="text-xs text-text-secondary">{PRIORITY_LABELS[c.priority]}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge text-2xs ${
                        c.status === 'OPEN' ? 'badge-open' :
                        c.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-resolved'
                      }`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-text-muted">{formatDate(c.createdAt)}</span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/complaints/${c.id}`}
                        className="btn-sm btn-ghost text-brand-action hover:text-brand-action hover:bg-primary-light"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-text-muted">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-1.5">
                {page > 1 && (
                  <Link
                    href={buildPageUrl(searchParams, page - 1)}
                    className="btn-sm btn-secondary"
                  >
                    ← Prev
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildPageUrl(searchParams, page + 1)}
                    className="btn-sm btn-secondary"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function buildPageUrl(searchParams: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams()
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v && k !== 'page') params.set(k, v)
  })
  params.set('page', page.toString())
  return `/admin/complaints?${params.toString()}`
}
