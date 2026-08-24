import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Bell, Pin } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notice Board' }
export const dynamic = 'force-dynamic'

export default async function NoticesPage() {
  const session = await auth()
  if (!session?.user) return null

  const notices = await db.notice.findMany({
    orderBy: [{ isImportant: 'desc' }, { createdAt: 'desc' }],
    include: { createdBy: { select: { name: true } } },
  })

  const important = notices.filter((n) => n.isImportant)
  const regular = notices.filter((n) => !n.isImportant)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={18} className="text-text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Notice Board</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Society announcements and updates from the management
        </p>
      </div>

      {notices.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell size={32} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-primary">No notices yet</p>
          <p className="text-text-secondary text-sm mt-1">
            Society announcements will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {important.length > 0 && (
            <div>
              <p className="section-title flex items-center gap-1.5">
                <Pin size={11} />
                Pinned notices
              </p>
              <div className="space-y-3">
                {important.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            </div>
          )}

          {regular.length > 0 && (
            <div>
              {important.length > 0 && <p className="section-title">Other notices</p>}
              <div className="space-y-3">
                {regular.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NoticeCard({ notice }: { notice: any }) {
  return (
    <div className={`card p-5 ${notice.isImportant ? 'border-brand-secondary/40 bg-purple-50/20' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {notice.isImportant && (
            <span className="badge-important">
              <Pin size={9} />
              Important
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted flex-shrink-0">{formatDate(notice.createdAt)}</span>
      </div>
      <h2 className="text-base font-semibold text-text-primary leading-snug mb-2">
        {notice.title}
      </h2>
      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
        {notice.content}
      </p>
      <p className="text-2xs text-text-muted mt-3 pt-3 border-t border-border">
        Posted by {notice.createdBy.name} · {formatRelativeTime(notice.createdAt)}
      </p>
    </div>
  )
}
