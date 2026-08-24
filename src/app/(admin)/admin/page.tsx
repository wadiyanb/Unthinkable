import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ArrowRight, AlertCircle, Clock, CheckCircle2, ClipboardList, TrendingUp } from 'lucide-react'
import {
  CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS,
  PRIORITY_DOT_COLORS, formatRelativeTime
} from '@/lib/utils'
import { getOverdueThreshold, isComplaintOverdue } from '@/lib/overdue'
import { Metadata } from 'next'
import { AdminDashboardChart } from '@/components/dashboard/admin-chart'

export const metadata: Metadata = { title: 'Admin Dashboard' }
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return null

  const thresholdDays = await getOverdueThreshold()

  const [
    totalComplaints,
    openComplaints,
    inProgressComplaints,
    resolvedComplaints,
    allUnresolved,
    categoryStats,
    recentComplaints,
    highPriorityOpen,
  ] = await Promise.all([
    db.complaint.count(),
    db.complaint.count({ where: { status: 'OPEN' } }),
    db.complaint.count({ where: { status: 'IN_PROGRESS' } }),
    db.complaint.count({ where: { status: 'RESOLVED' } }),
    db.complaint.findMany({
      where: { status: { notIn: ['RESOLVED'] } },
      select: { id: true, createdAt: true, status: true, title: true, priority: true, category: true },
    }),
    db.complaint.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    }),
    db.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { resident: { select: { name: true, flatNumber: true } } },
    }),
    db.complaint.count({
      where: { priority: 'HIGH', status: { notIn: ['RESOLVED'] } },
    }),
  ])

  const overdueComplaints = allUnresolved.filter((c) =>
    isComplaintOverdue(c.createdAt, c.status, thresholdDays)
  )

  const overdueCount = overdueComplaints.length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {overdueCount > 0
            ? `${overdueCount} overdue · ${highPriorityOpen} high priority open — attention needed`
            : `${openComplaints + inProgressComplaints} active complaints · No overdue issues`}
        </p>
      </div>

      {/* Alert banner for overdue */}
      {overdueCount > 0 && (
        <div className="bg-overdue-light border border-overdue/30 rounded-md px-4 py-3 mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-overdue flex-shrink-0" />
            <p className="text-sm text-overdue-dark">
              <span className="font-semibold">{overdueCount} complaint{overdueCount !== 1 ? 's' : ''}</span>{' '}
              {overdueCount === 1 ? 'has' : 'have'} been open for more than {thresholdDays} days without resolution.
            </p>
          </div>
          <Link
            href="/admin/complaints?overdue=true"
            className="btn-sm btn-danger flex-shrink-0"
          >
            View overdue <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          label="Total"
          value={totalComplaints}
          sub="all time"
          icon={<ClipboardList size={14} />}
        />
        <StatCard
          label="Open"
          value={openComplaints}
          sub="awaiting action"
          icon={<Clock size={14} />}
          accent="text-red-600"
        />
        <StatCard
          label="In Progress"
          value={inProgressComplaints}
          sub="being worked on"
          icon={<TrendingUp size={14} />}
          accent="text-amber-600"
        />
        <StatCard
          label="Resolved"
          value={resolvedComplaints}
          sub="closed"
          icon={<CheckCircle2 size={14} />}
          accent="text-success-dark"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          sub={`> ${thresholdDays} days`}
          icon={<AlertCircle size={14} />}
          accent={overdueCount > 0 ? 'text-overdue' : undefined}
          highlight={overdueCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent complaints */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Recent activity</h2>
            <Link href="/admin/complaints" className="text-xs text-brand-action hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>

          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Resident</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => {
                  const isOD = isComplaintOverdue(c.createdAt, c.status, thresholdDays)
                  return (
                    <tr key={c.id}>
                      <td className="max-w-[200px]">
                        <Link href={`/admin/complaints/${c.id}`} className="hover:text-brand-action transition-colors">
                          <p className="font-medium text-text-primary truncate">{c.title}</p>
                          <p className="text-2xs text-text-muted">{formatRelativeTime(c.createdAt)}</p>
                        </Link>
                        {isOD && (
                          <span className="badge-overdue mt-1">
                            <AlertCircle size={8} /> Overdue
                          </span>
                        )}
                      </td>
                      <td>
                        <p className="text-xs text-text-primary">{c.resident.name}</p>
                        {c.resident.flatNumber && (
                          <p className="text-2xs text-text-muted">Flat {c.resident.flatNumber}</p>
                        )}
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category stats + Chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category breakdown */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">By category</h2>
            <div className="card p-4">
              <div className="space-y-2.5">
                {categoryStats.slice(0, 6).map((c) => {
                  const pct = totalComplaints > 0
                    ? Math.round((c._count.category / totalComplaints) * 100)
                    : 0
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-secondary">
                          {CATEGORY_LABELS[c.category]}
                        </span>
                        <span className="text-xs font-medium text-text-primary">
                          {c._count.category}
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-accent rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Overdue list */}
          {overdueCount > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-overdue" />
                Overdue complaints
              </h2>
              <div className="space-y-2">
                {overdueComplaints.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/complaints/${c.id}`}
                    className="card-hover p-3 block"
                  >
                    <p className="text-xs font-semibold text-text-primary line-clamp-1">{c.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`priority-dot ${PRIORITY_DOT_COLORS[c.priority]}`} />
                      <span className="text-2xs text-text-muted">{PRIORITY_LABELS[c.priority]}</span>
                      <span className="text-2xs text-text-muted">·</span>
                      <span className="text-2xs text-overdue font-medium">
                        Open {Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000)} days
                      </span>
                    </div>
                  </Link>
                ))}
                {overdueCount > 3 && (
                  <Link
                    href="/admin/complaints?overdue=true"
                    className="text-xs text-brand-action hover:underline block text-center py-1.5"
                  >
                    +{overdueCount - 3} more overdue
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  highlight,
}: {
  label: string
  value: number
  sub: string
  icon: React.ReactNode
  accent?: string
  highlight?: boolean
}) {
  return (
    <div className={`card p-4 ${highlight ? 'border-overdue/30 bg-overdue-light/20' : ''}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-text-muted">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${accent || 'text-text-primary'}`}>{value}</p>
      <p className="text-2xs text-text-muted mt-0.5">{sub}</p>
    </div>
  )
}
