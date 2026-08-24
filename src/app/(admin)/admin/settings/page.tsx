import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Metadata } from 'next'
import { AdminSettingsForm } from '@/components/settings/admin-settings-form'

export const metadata: Metadata = { title: 'System Settings' }
export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return null

  const settings = await db.setting.findMany()
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  const currentSettings = {
    overdueThresholdDays: parseInt(settingsMap['overdueThresholdDays'] ?? '14', 10),
    societyName: settingsMap['societyName'] ?? 'Green Park Residency',
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-text-primary mb-1">Settings</h1>
      <p className="text-sm text-text-secondary mb-6">Configure system-wide settings for the maintenance tracker.</p>

      <AdminSettingsForm settings={currentSettings} />
    </div>
  )
}
