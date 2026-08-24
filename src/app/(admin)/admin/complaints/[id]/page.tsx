import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, Tag, MapPin, AlertCircle } from 'lucide-react'
import {
  CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS,
  PRIORITY_DOT_COLORS, VALID_STATUS_TRANSITIONS,
  formatDate, formatDateTime
} from '@/lib/utils'
import { getOverdueThreshold, isComplaintOverdue, getDaysOpen } from '@/lib/overdue'
import { AdminStatusForm } from '@/components/complaints/admin-status-form'
import { AdminPriorityForm } from '@/components/complaints/admin-priority-form'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Complaint #${params.id.slice(-6).toUpperCase()}` }
}

export default async function AdminComplaintDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return null

  const [complaint, thresholdDays] = await Promise.all([
    db.complaint.findUnique({
      where: { id: params.id },
      include: {
        resident: { select: { id: true, name: true, email: true, flatNumber: true, phone: true } },
        history: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { id: true, name: true, role: true } } },
        },
      },
    }),
    getOverdueThreshold(),
  ])

  if (!complaint) notFound()

  const isOverdue = isComplaintOverdue(complaint.createdAt, complaint.status, thresholdDays)
  const daysOpen = getDaysOpen(complaint.createdAt)
  const allowedTransitions = VALID_STATUS_TRANSITIONS[complaint.status]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/complaints"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-5"
      >
        <ArrowLeft size={14} />
        Back to all complaints
      </Link>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-mono text-xs text-text-muted bg-surface-tertiary px-2 py-0.5 rounded border border-border">
            #{complaint.id.slice(-8).toUpperCase()}
          </span>
          <span className={`badge ${
            complaint.status === 'OPEN' ? 'badge-open' :
            complaint.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-resolved'
          }`}>
            {STATUS_LABELS[complaint.status]}
          </span>
          {isOverdue && (
            <span className="badge-overdue">
              <AlertCircle size={10} />
              Overdue — {daysOpen} days open
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-text-primary leading-snug">{complaint.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="card p-4">
            <h2 className="section-title">Description</h2>
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
              {complaint.description}
            </p>
          </div>

          {/* Photo */}
          {complaint.photoUrl && (
            <div className="card p-4">
              <h2 className="section-title">Attached photo</h2>
              <div className="relative rounded overflow-hidden max-w-sm">
                <Image
                  src={complaint.photoUrl}
                  alt="Complaint photo"
                  width={600}
                  height={400}
                  className="w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Admin actions */}
          {complaint.status !== 'RESOLVED' && (
            <div className="card p-4">
              <h2 className="section-title">Update status</h2>
              <AdminStatusForm
                complaintId={complaint.id}
                currentStatus={complaint.status}
                allowedTransitions={allowedTransitions}
              />
            </div>
          )}

          {complaint.status === 'RESOLVED' && (
            <div className="card p-4 border-success-dark/20 bg-success-light/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-accent" />
                <p className="text-sm font-medium text-success-dark">
                  This complaint is resolved
                </p>
              </div>
              {complaint.resolvedAt && (
                <p className="text-xs text-text-muted mt-1">
                  Resolved on {formatDateTime(complaint.resolvedAt)}
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="card p-4">
            <h2 className="section-title">Status history</h2>
            <div className="relative">
              {complaint.history.map((entry, index) => {
                const isLast = index === complaint.history.length - 1
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${
                        entry.newStatus === 'RESOLVED' ? 'bg-brand-accent' :
                        entry.newStatus === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[24px]" />}
                    </div>
                    <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold ${
                          entry.newStatus === 'RESOLVED' ? 'text-success-dark' :
                          entry.newStatus === 'IN_PROGRESS' ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          {STATUS_LABELS[entry.newStatus]}
                        </span>
                        {entry.previousStatus && (
                          <span className="text-xs text-text-muted">
                            from {STATUS_LABELS[entry.previousStatus]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {formatDateTime(entry.createdAt)} · {entry.actor.name}
                        {entry.actor.role === 'ADMIN' && (
                          <span className="ml-1 text-2xs bg-brand-action/10 text-brand-action px-1 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </p>
                      {entry.note && (
                        <div className="mt-1.5 pl-3 border-l-2 border-brand-accent/30">
                          <p className="text-sm text-text-primary">{entry.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Priority */}
          <div className="card p-4">
            <h2 className="section-title">Priority</h2>
            <AdminPriorityForm
              complaintId={complaint.id}
              currentPriority={complaint.priority}
            />
          </div>

          {/* Details */}
          <div className="card p-4">
            <h2 className="section-title">Details</h2>
            <div className="space-y-3">
              <InfoRow icon={<Tag size={13} />} label="Category">
                {CATEGORY_LABELS[complaint.category]}
              </InfoRow>
              <InfoRow icon={<Calendar size={13} />} label="Submitted">
                {formatDate(complaint.createdAt)}
              </InfoRow>
              {complaint.status !== 'RESOLVED' && (
                <InfoRow
                  icon={<AlertCircle size={13} className={isOverdue ? 'text-overdue' : 'text-text-muted'} />}
                  label="Open for"
                >
                  <span className={isOverdue ? 'text-overdue font-medium' : ''}>
                    {daysOpen} day{daysOpen !== 1 ? 's' : ''}
                    {isOverdue && ' (overdue)'}
                  </span>
                </InfoRow>
              )}
              {complaint.resolvedAt && (
                <InfoRow icon={<Calendar size={13} />} label="Resolved">
                  {formatDate(complaint.resolvedAt)}
                </InfoRow>
              )}
            </div>
          </div>

          {/* Resident */}
          <div className="card p-4">
            <h2 className="section-title">Resident</h2>
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 bg-brand-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-brand-secondary text-xs font-semibold">
                  {complaint.resident.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{complaint.resident.name}</p>
                <p className="text-xs text-text-muted">{complaint.resident.email}</p>
                {complaint.resident.flatNumber && (
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    Flat {complaint.resident.flatNumber}
                  </p>
                )}
                {complaint.resident.phone && (
                  <p className="text-xs text-text-muted mt-0.5">{complaint.resident.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-text-muted mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-2xs text-text-muted uppercase tracking-wide">{label}</p>
        <p className="text-sm text-text-primary mt-0.5">{children}</p>
      </div>
    </div>
  )
}
