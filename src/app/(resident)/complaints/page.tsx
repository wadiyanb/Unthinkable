import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Plus, ClipboardX, AlertCircle } from 'lucide-react'
import {
  CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS,
  PRIORITY_DOT_COLORS, formatDate, formatRelativeTime
} from '@/lib/utils'
import { getOverdueThreshold, isComplaintOverdue } from '@/lib/overdue'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Complaints' }
export const dynamic = 'force-dynamic'

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED']

interface Props {
  searchParams: { status?: string }
}

export default async function MyComplaintsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) return null

  const statusFilter = searchParams.status || 'ALL'
  const where: any = { residentId: session.user.id }
  if (statusFilter !== 'ALL') where.status = statusFilter

  const [complaints, totalCount, thresholdDays] = await Promise.all([
    db.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { history: true } },
      },
    }),
    db.complaint.count({ where: { residentId: session.user.id } }),
    getOverdueThreshold(),
  ])

  const complaintsWithOverdue = complaints.map((c) => ({
    ...c,
    isOverdue: isComplaintOverdue(c.createdAt, c.status, thresholdDays),
  }))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">My complaints</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {totalCount} total · {complaints.filter((c) => c.status !== 'RESOLVED').length} active
          </p>
        </div>
        <Link href="/complaints/new" className="btn-sm btn-primary">
          <Plus size={14} />
          New complaint
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {STATUS_FILTERS.map((status) => {
          const count = status === 'ALL'
            ? totalCount
            : complaints.filter((c) => c.status === status).length
          const isActive = statusFilter === status

          return (
            <Link
              key={status}
              href={status === 'ALL' ? '/complaints' : `/complaints?status=${status}`}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                isActive
                  ? 'bg-brand-action text-white'
                  : 'bg-surface border border-border text-text-secondary hover:border-border-strong hover:text-text-primary'
              }`}
            >
              {status === 'ALL' ? 'All' : STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              <span className={`ml-1.5 ${isActive ? 'text-white/70' : 'text-text-muted'}`}>
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* List */}
      {complaintsWithOverdue.length === 0 ? (
        <div className="card p-10 text-center">
          <ClipboardX size={32} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-primary">
            {statusFilter === 'ALL' ? 'No complaints yet' : `No ${STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS]?.toLowerCase()} complaints`}
          </p>
          <p className="text-text-secondary text-sm mt-1 mb-5">
            {statusFilter === 'ALL'
              ? 'Submit your first maintenance complaint to get started.'
              : 'Try changing your filter or check other statuses.'}
          </p>
          {statusFilter === 'ALL' && (
            <Link href="/complaints/new" className="btn-sm btn-primary inline-flex">
              <Plus size={14} />
              Submit a complaint
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {complaintsWithOverdue.map((complaint) => (
            <Link
              key={complaint.id}
              href={`/complaints/${complaint.id}`}
              className="card-hover p-4 block group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-2xs text-text-muted">
                      #{complaint.id.slice(-6).toUpperCase()}
                    </span>
                    {complaint.isOverdue && (
                      <span className="badge-overdue">
                        <AlertCircle size={9} />
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-text-primary group-hover:text-brand-action transition-colors line-clamp-1">
                    {complaint.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-text-muted">{CATEGORY_LABELS[complaint.category]}</span>
                    <span className="text-2xs text-border-strong">·</span>
                    <span className="text-xs text-text-muted">{formatDate(complaint.createdAt)}</span>
                    <span className="text-2xs text-border-strong">·</span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <span className={`priority-dot ${PRIORITY_DOT_COLORS[complaint.priority]}`} />
                      {PRIORITY_LABELS[complaint.priority]}
                    </span>
                  </div>
                </div>
                <span className={`badge text-2xs flex-shrink-0 ${
                  complaint.status === 'OPEN' ? 'badge-open' :
                  complaint.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-resolved'
                }`}>
                  {STATUS_LABELS[complaint.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
