import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOverdueThreshold, isComplaintOverdue } from '@/lib/overdue'
import Link from 'next/link'
import { Plus, Clock, CheckCircle2, AlertCircle, Bell, ArrowRight, ClipboardX } from 'lucide-react'
import { CATEGORY_LABELS, STATUS_LABELS, formatRelativeTime } from '@/lib/utils'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View your active complaints, recent activity, and society notices.',
}

export const dynamic = 'force-dynamic'

export default async function ResidentDashboard() {
  const session = await auth()
  if (!session?.user) return null

  const [complaints, notices, thresholdDays] = await Promise.all([
    db.complaint.findMany({
      where: { residentId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { _count: { select: { history: true } } },
    }),
    db.notice.findMany({
      orderBy: [{ isImportant: 'desc' }, { createdAt: 'desc' }],
      take: 4,
    }),
    getOverdueThreshold(),
  ])

  const complaintsWithOverdue = complaints.map((c) => ({
    ...c,
    isOverdue: isComplaintOverdue(c.createdAt, c.status, thresholdDays),
  }))

  const active = complaintsWithOverdue.filter((c) => c.status !== 'RESOLVED')
  const resolved = complaintsWithOverdue.filter((c) => c.status === 'RESOLVED')
  const overdue = complaintsWithOverdue.filter((c) => c.isOverdue)
  const important = notices.filter((n) => n.isImportant)

  const firstName = (session.user.name || 'Resident').split(' ')[0]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          Good {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {session.user.flatNumber && (
            <span>Flat {session.user.flatNumber} · </span>
          )}
          {active.length === 0
            ? 'No active complaints — all clear!'
            : `${active.length} active complaint${active.length !== 1 ? 's' : ''} · ${overdue.length > 0 ? `${overdue.length} overdue` : 'none overdue'}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-text-muted" />
            <span className="text-xs text-text-muted">Active</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{active.length}</p>
          <p className="text-2xs text-text-muted mt-0.5">
            {active.filter((c) => c.status === 'OPEN').length} open, {active.filter((c) => c.status === 'IN_PROGRESS').length} in progress
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-brand-accent" />
            <span className="text-xs text-text-muted">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{resolved.length}</p>
          <p className="text-2xs text-text-muted mt-0.5">
            {complaints.length} total complaints
          </p>
        </div>
        <div className={`card p-4 ${overdue.length > 0 ? 'border-overdue/30 bg-overdue-light/30' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className={overdue.length > 0 ? 'text-overdue' : 'text-text-muted'} />
            <span className="text-xs text-text-muted">Overdue</span>
          </div>
          <p className={`text-2xl font-bold ${overdue.length > 0 ? 'text-overdue' : 'text-text-primary'}`}>
            {overdue.length}
          </p>
          <p className="text-2xs text-text-muted mt-0.5">
            &gt; {thresholdDays} days unresolved
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Complaints column */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Recent complaints</h2>
            <Link
              href="/complaints"
              className="text-xs text-brand-action hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {complaintsWithOverdue.length === 0 ? (
            <div className="card p-8 text-center">
              <ClipboardX size={28} className="text-text-muted mx-auto mb-3" />
              <p className="font-medium text-text-primary text-sm">No complaints yet</p>
              <p className="text-text-secondary text-xs mt-1 mb-4">
                Need something fixed? Submit your first complaint.
              </p>
              <Link href="/complaints/new" className="btn-sm btn-primary inline-flex">
                <Plus size={13} />
                New complaint
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {complaintsWithOverdue.slice(0, 5).map((complaint) => (
                <Link
                  key={complaint.id}
                  href={`/complaints/${complaint.id}`}
                  className="card-hover p-3.5 block group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusDot status={complaint.status} />
                        {complaint.isOverdue && (
                          <span className="badge-overdue text-2xs">Overdue</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-text-primary truncate group-hover:text-brand-action transition-colors">
                        {complaint.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {CATEGORY_LABELS[complaint.category]} · {formatRelativeTime(complaint.createdAt)}
                      </p>
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

              {complaintsWithOverdue.length > 5 && (
                <Link
                  href="/complaints"
                  className="block text-center text-xs text-brand-action hover:underline py-2"
                >
                  +{complaintsWithOverdue.length - 5} more complaints
                </Link>
              )}
            </div>
          )}

          <Link
            href="/complaints/new"
            className="btn-md btn-primary w-full mt-3 inline-flex"
          >
            <Plus size={15} />
            Submit a new complaint
          </Link>
        </div>

        {/* Notices column */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Notices</h2>
            <Link
              href="/notices"
              className="text-xs text-brand-action hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {notices.length === 0 ? (
            <div className="card p-6 text-center">
              <Bell size={24} className="text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No notices published yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notices.map((notice) => (
                <div key={notice.id} className={`card p-3.5 ${notice.isImportant ? 'border-brand-secondary/30 bg-purple-50/30' : ''}`}>
                  {notice.isImportant && (
                    <span className="badge-important text-2xs mb-1.5 inline-flex">Important</span>
                  )}
                  <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2">
                    {notice.title}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatRelativeTime(notice.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: 'bg-red-500',
    IN_PROGRESS: 'bg-amber-500',
    RESOLVED: 'bg-brand-accent',
  }
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || 'bg-text-muted'} inline-block`} />
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
