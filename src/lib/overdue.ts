import { db } from '@/lib/db'

const DEFAULT_OVERDUE_DAYS = 14

export async function getOverdueThreshold(): Promise<number> {
  try {
    const setting = await db.setting.findUnique({
      where: { key: 'overdueThresholdDays' },
    })
    if (setting) {
      const days = parseInt(setting.value, 10)
      if (!isNaN(days) && days > 0) return days
    }
  } catch {
    // Silently fall back to default
  }
  return DEFAULT_OVERDUE_DAYS
}

export function isComplaintOverdue(
  createdAt: Date,
  status: string,
  thresholdDays: number
): boolean {
  // Resolved complaints are never overdue
  if (status === 'RESOLVED') return false

  const now = new Date()
  const diffMs = now.getTime() - new Date(createdAt).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  return diffDays > thresholdDays
}

export function getOverdueDate(thresholdDays: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - thresholdDays)
  return date
}

export function getDaysOpen(createdAt: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - new Date(createdAt).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
