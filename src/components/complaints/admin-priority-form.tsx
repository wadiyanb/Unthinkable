'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { PRIORITY_LABELS, PRIORITY_DOT_COLORS } from '@/lib/utils'
import { Priority } from '@prisma/client'
import { Loader2 } from 'lucide-react'

interface Props {
  complaintId: string
  currentPriority: Priority
}

export function AdminPriorityForm({ complaintId, currentPriority }: Props) {
  const router = useRouter()
  const [priority, setPriority] = useState<Priority>(currentPriority)
  const [loading, setLoading] = useState(false)

  const handleChange = async (newPriority: Priority) => {
    if (newPriority === priority) return
    setPriority(newPriority)
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })

      const json = await res.json()

      if (!res.ok) {
        setPriority(currentPriority)
        toast({ title: 'Failed to update priority', description: json.error, variant: 'error' })
        return
      }

      toast({
        title: 'Priority updated',
        description: `Set to ${PRIORITY_LABELS[newPriority]}.`,
        variant: 'success',
      })

      router.refresh()
    } catch {
      setPriority(currentPriority)
      toast({ title: 'Something went wrong', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-text-muted">Current:</p>
        <div className="flex items-center gap-1.5">
          <span className={`priority-dot ${PRIORITY_DOT_COLORS[priority]}`} />
          <span className="text-xs font-semibold text-text-primary">{PRIORITY_LABELS[priority]}</span>
        </div>
        {loading && <Loader2 size={12} className="animate-spin text-text-muted" />}
      </div>
      <div className="flex gap-2">
        {(['HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => (
          <button
            key={p}
            id={`priority-${p.toLowerCase()}`}
            type="button"
            onClick={() => handleChange(p)}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium border transition-all ${
              priority === p
                ? 'border-brand-action bg-primary-light text-brand-action'
                : 'border-border bg-surface text-text-secondary hover:border-border-strong'
            }`}
          >
            <span className={`priority-dot ${PRIORITY_DOT_COLORS[p]}`} />
            {PRIORITY_LABELS[p]}
          </button>
        ))}
      </div>
    </div>
  )
}
