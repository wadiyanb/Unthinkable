'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Loader2, Pin } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Notice } from '@prisma/client'

interface NoticeForm {
  title: string
  content: string
  isImportant: boolean
}

export function EditNoticeForm({ notice }: { notice: Notice }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<NoticeForm>({
    defaultValues: {
      title: notice.title,
      content: notice.content,
      isImportant: notice.isImportant,
    },
  })

  const isImportant = watch('isImportant')

  const onSubmit = async (data: NoticeForm) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/notices/${notice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: 'Failed to update notice', description: json.error, variant: 'error' })
        return
      }
      toast({ title: 'Notice updated', variant: 'success' })
      router.push('/admin/notices')
      router.refresh()
    } catch {
      toast({ title: 'Something went wrong', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Link href="/admin/notices" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-5">
        <ArrowLeft size={14} />
        Back to notices
      </Link>

      <h1 className="text-xl font-bold text-text-primary mb-5">Edit notice</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card p-5 space-y-4">
          <div>
            <label htmlFor="edit-title" className="label">Title *</label>
            <input
              id="edit-title"
              type="text"
              className={`input ${errors.title ? 'input-error' : ''}`}
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="error-msg">{errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="edit-content" className="label">Content *</label>
            <textarea
              id="edit-content"
              rows={8}
              className={`input resize-none ${errors.content ? 'input-error' : ''}`}
              {...register('content', { required: 'Content is required' })}
            />
            {errors.content && <p className="error-msg">{errors.content.message}</p>}
          </div>
          <div>
            <label className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
              isImportant ? 'border-brand-secondary/50 bg-purple-50/30' : 'border-border hover:border-border-strong'
            }`}>
              <input
                id="edit-important"
                type="checkbox"
                className="mt-0.5 accent-brand-action"
                {...register('isImportant')}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <Pin size={13} className={isImportant ? 'text-brand-secondary' : 'text-text-muted'} />
                  <span className="text-sm font-medium text-text-primary">Mark as important</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">Important notices are pinned to top</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-4">
          <Link href="/admin/notices" className="btn-md btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-md btn-primary" id="save-notice">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  )
}
