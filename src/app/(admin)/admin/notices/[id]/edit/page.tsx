import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { EditNoticeForm } from '@/components/notices/edit-notice-form'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Notice' }

interface Props {
  params: { id: string }
}

export default async function EditNoticePage({ params }: Props) {
  const notice = await db.notice.findUnique({ where: { id: params.id } })
  if (!notice) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <EditNoticeForm notice={notice} />
    </div>
  )
}
