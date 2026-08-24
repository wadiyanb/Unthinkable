'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Loader2, Pin } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface NoticeForm {
  title: string
  content: string
  isImportant: boolean
}

export default function NewNoticePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<NoticeForm>({
    defaultValues: { isImportant: false }
  })

  const isImportant = watch('isImportant')
  const contentValue = watch('content', '')

  const onSubmit = async (data: NoticeForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: 'Failed to publish notice', description: json.error, variant: 'error' })
        return
      }
      toast({
        title: 'Notice published',
        description: data.isImportant ? 'Important notice published and residents notified by email.' : 'Notice is now visible to residents.',
        variant: 'success',
      })
      router.push('/admin/notices')
      router.refresh()
    } catch {
      toast({ title: 'Something went wrong', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin/notices" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-5">
        <ArrowLeft size={14} />
        Back to notices
      </Link>

      <h1 className="text-xl font-bold text-text-primary mb-5">Create notice</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card p-5 space-y-4">
          <div>
            <label htmlFor="notice-title" className="label">Title *</label>
            <input
              id="notice-title"
              type="text"
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Water Supply Interruption Notice"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' },
              })}
            />
            {errors.title && <p className="error-msg">{errors.title.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="notice-content" className="label !mb-0">Content *</label>
              <span className={`text-2xs ${contentValue.length > 4500 ? 'text-overdue' : 'text-text-muted'}`}>
                {contentValue.length}/5000
              </span>
            </div>
            <textarea
              id="notice-content"
              rows={8}
              className={`input resize-none ${errors.content ? 'input-error' : ''}`}
              placeholder="Write your notice here. Be clear and concise."
              {...register('content', {
                required: 'Content is required',
                minLength: { value: 10, message: 'Content must be at least 10 characters' },
              })}
            />
            {errors.content && <p className="error-msg">{errors.content.message}</p>}
          </div>

          <div>
            <label className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
              isImportant
                ? 'border-brand-secondary/50 bg-purple-50/30'
                : 'border-border hover:border-border-strong'
            }`}>
              <input
                id="notice-important"
                type="checkbox"
                className="mt-0.5 accent-brand-action"
                {...register('isImportant')}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <Pin size={13} className={isImportant ? 'text-brand-secondary' : 'text-text-muted'} />
                  <span className="text-sm font-medium text-text-primary">Mark as important</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Important notices are pinned to the top of the board. Residents will be notified by email.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <Link href="/admin/notices" className="btn-md btn-secondary">Cancel</Link>
          <button
            type="submit"
            id="publish-notice"
            disabled={loading}
            className="btn-md btn-primary"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Publishing...' : 'Publish notice'}
          </button>
        </div>
      </form>
    </div>
  )
}
