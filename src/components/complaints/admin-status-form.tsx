'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { STATUS_LABELS } from '@/lib/utils'
import { ComplaintStatus } from '@prisma/client'
import { Loader2, ArrowRight } from 'lucide-react'

interface Props {
  complaintId: string
  currentStatus: ComplaintStatus
  allowedTransitions: ComplaintStatus[]
}

const STATUS_DESCRIPTIONS: Record<ComplaintStatus, string> = {
  OPEN: 'Complaint received, awaiting assignment',
  IN_PROGRESS: 'Being worked on by maintenance team',
  RESOLVED: 'Issue has been fixed and verified',
}

export function AdminStatusForm({ complaintId, currentStatus, allowedTransitions }: Props) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | ''>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStatus) return

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, note: note || undefined }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast({
          title: 'Failed to update status',
          description: json.error || 'Please try again.',
          variant: 'error',
        })
        return
      }

      toast({
        title: 'Status updated',
        description: `Complaint moved to ${STATUS_LABELS[selectedStatus]}.`,
        variant: 'success',
      })

      setSelectedStatus('')
      setNote('')
      router.refresh()
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  if (allowedTransitions.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No further status transitions available.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Move to status</label>
        <div className="space-y-2">
          {allowedTransitions.map((status) => (
            <label
              key={status}
              className={`flex items-start gap-2.5 p-2.5 rounded border cursor-pointer transition-colors ${
                selectedStatus === status
                  ? 'border-brand-action bg-primary-light'
                  : 'border-border hover:border-border-strong hover:bg-surface-secondary'
              }`}
            >
              <input
                type="radio"
                name="status"
                value={status}
                checked={selectedStatus === status}
                onChange={() => setSelectedStatus(status)}
                className="mt-0.5 accent-brand-action"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">
                    {STATUS_LABELS[status]}
                  </span>
                  <ArrowRight size={10} className="text-text-muted" />
                </div>
                <p className="text-2xs text-text-muted">{STATUS_DESCRIPTIONS[status]}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {selectedStatus && (
        <div>
          <label htmlFor="admin-note" className="label">
            Admin note
            <span className="font-normal text-text-muted normal-case ml-1">(optional)</span>
          </label>
          <textarea
            id="admin-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            className="input resize-none text-sm"
            placeholder="Add a note for the resident about this update..."
          />
          <p className="text-2xs text-text-muted text-right mt-0.5">{note.length}/500</p>
        </div>
      )}

      <button
        type="submit"
        id="admin-update-status"
        disabled={!selectedStatus || loading}
        className="btn-md btn-primary w-full"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? 'Updating...' : 'Update status'}
      </button>
    </form>
  )
}
