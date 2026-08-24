'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogBody
} from '@/components/ui/dialog'
import { Trash2, Loader2 } from 'lucide-react'

interface Props {
  noticeId: string
  title: string
}

export function AdminNoticeActions({ noticeId, title }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/notices/${noticeId}`, { method: 'DELETE' })
      if (!res.ok) {
        toast({ title: 'Failed to delete notice', variant: 'error' })
        return
      }
      toast({ title: 'Notice deleted', variant: 'success' })
      setOpen(false)
      router.refresh()
    } catch {
      toast({ title: 'Something went wrong', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-sm btn-ghost text-text-muted hover:text-overdue"
        title="Delete notice"
      >
        <Trash2 size={13} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete notice?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{title}&rdquo;. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="btn-md btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              id="confirm-delete-notice"
              disabled={loading}
              className="btn-md btn-danger"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Deleting...' : 'Delete notice'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
