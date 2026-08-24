'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { useForm } from 'react-hook-form'
import { Loader2, Clock, Info } from 'lucide-react'

interface Props {
  settings: {
    overdueThresholdDays: number
    societyName: string
  }
}

interface SettingsForm {
  overdueThresholdDays: number
}

export function AdminSettingsForm({ settings }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SettingsForm>({
    defaultValues: { overdueThresholdDays: settings.overdueThresholdDays },
  })

  const thresholdValue = watch('overdueThresholdDays')

  const onSubmit = async (data: SettingsForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overdueThresholdDays: Number(data.overdueThresholdDays) }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: 'Failed to save settings', description: json.error, variant: 'error' })
        return
      }
      toast({ title: 'Settings saved', description: 'Overdue threshold updated.', variant: 'success' })
      router.refresh()
    } catch {
      toast({ title: 'Something went wrong', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Overdue threshold */}
      <div className="card p-5">
        <div className="flex items-start gap-2 mb-4">
          <Clock size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Overdue complaint threshold</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Complaints that remain unresolved beyond this number of days will be marked as overdue.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="overdue-threshold" className="label">Threshold (days)</label>
              <input
                id="overdue-threshold"
                type="number"
                min={1}
                max={365}
                className={`input ${errors.overdueThresholdDays ? 'input-error' : ''}`}
                {...register('overdueThresholdDays', {
                  required: 'Required',
                  min: { value: 1, message: 'Must be at least 1 day' },
                  max: { value: 365, message: 'Must not exceed 365 days' },
                  valueAsNumber: true,
                })}
              />
              {errors.overdueThresholdDays && (
                <p className="error-msg">{errors.overdueThresholdDays.message}</p>
              )}
            </div>
            <button
              type="submit"
              id="save-settings"
              disabled={loading}
              className="btn-md btn-primary flex-shrink-0"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="flex items-start gap-2 mt-3 p-3 bg-surface-secondary border border-border rounded text-xs">
            <Info size={13} className="text-text-muted flex-shrink-0 mt-0.5" />
            <p className="text-text-secondary">
              Currently: complaints open for more than{' '}
              <strong className="text-text-primary">{thresholdValue || settings.overdueThresholdDays} days</strong>{' '}
              without resolution are marked as overdue. Resolved complaints are never considered overdue.
            </p>
          </div>
        </form>
      </div>

      {/* Society info */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Society information</h2>
        <p className="text-xs text-text-muted mb-3">Read-only — contact your system administrator to change.</p>
        <div className="space-y-2">
          <InfoRow label="Society name" value={settings.societyName} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="input bg-surface-tertiary cursor-not-allowed text-text-secondary">{value}</p>
    </div>
  )
}
