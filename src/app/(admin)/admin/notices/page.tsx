import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Plus, Pin, Pencil, Trash2, Bell } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Metadata } from 'next'
import { AdminNoticeActions } from '@/components/notices/admin-notice-actions'

export const metadata: Metadata = { title: 'Notice Management' }
export const dynamic = 'force-dynamic'

export default async function AdminNoticesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return null

  const notices = await db.notice.findMany({
    orderBy: [{ isImportant: 'desc' }, { createdAt: 'desc' }],
    include: { createdBy: { select: { name: true } } },
  })

  const importantCount = notices.filter((n) => n.isImportant).length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Notice Board</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {notices.length} notice{notices.length !== 1 ? 's' : ''} · {importantCount} pinned
          </p>
        </div>
        <Link href="/admin/notices/new" className="btn-sm btn-primary">
          <Plus size={14} />
          New notice
        </Link>
      </div>

      {notices.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell size={32} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-primary">No notices yet</p>
          <p className="text-text-secondary text-sm mt-1 mb-4">
            Create your first society notice for residents.
          </p>
          <Link href="/admin/notices/new" className="btn-sm btn-primary inline-flex">
            <Plus size={14} />
            Create notice
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`card p-4 ${notice.isImportant ? 'border-brand-secondary/40 bg-purple-50/20' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {notice.isImportant && (
                      <span className="badge-important">
                        <Pin size={9} />
                        Pinned
                      </span>
                    )}
                    <span className="text-xs text-text-muted">{formatDate(notice.createdAt)}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-text-primary">{notice.title}</h2>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{notice.content}</p>
                  <p className="text-2xs text-text-muted mt-2">
                    Posted by {notice.createdBy.name} · {formatRelativeTime(notice.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/admin/notices/${notice.id}/edit`}
                    className="btn-sm btn-ghost text-text-muted hover:text-text-primary"
                    title="Edit notice"
                  >
                    <Pencil size={13} />
                  </Link>
                  <AdminNoticeActions noticeId={notice.id} title={notice.title} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
