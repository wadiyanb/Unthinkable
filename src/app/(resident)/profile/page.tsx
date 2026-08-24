import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile' }
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) return null

  const [user, stats] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, flatNumber: true,
        phone: true, role: true, createdAt: true,
      },
    }),
    db.complaint.groupBy({
      by: ['status'],
      where: { residentId: session.user.id },
      _count: { status: true },
    }),
  ])

  if (!user) return null

  const statusCounts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 }
  for (const s of stats) statusCounts[s.status as keyof typeof statusCounts] = s._count.status
  const total = statusCounts.OPEN + statusCounts.IN_PROGRESS + statusCounts.RESOLVED

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-text-primary mb-5">My Profile</h1>

      <div className="grid grid-cols-1 gap-4">
        {/* Profile card */}
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-brand-dark rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-brand-accent text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-text-primary">{user.name}</h2>
              <p className="text-sm text-text-secondary">
                {user.role === 'ADMIN' ? 'Society Administrator' : 'Resident'}
              </p>
              {user.flatNumber && (
                <span className="inline-flex items-center gap-1 text-xs text-brand-action bg-primary-light px-2 py-0.5 rounded mt-1.5">
                  <MapPin size={10} />
                  Flat {user.flatNumber}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-border">
            <InfoField icon={<Mail size={13} />} label="Email">
              {user.email}
            </InfoField>
            {user.phone && (
              <InfoField icon={<Phone size={13} />} label="Phone">
                {user.phone}
              </InfoField>
            )}
            {user.flatNumber && (
              <InfoField icon={<MapPin size={13} />} label="Flat">
                {user.flatNumber}
              </InfoField>
            )}
            <InfoField icon={<Calendar size={13} />} label="Member since">
              {formatDate(user.createdAt)}
            </InfoField>
            <InfoField icon={<Shield size={13} />} label="Account type">
              {user.role === 'ADMIN' ? 'Administrator' : 'Resident'}
            </InfoField>
          </div>
        </div>

        {/* Complaint stats */}
        <div className="card p-5">
          <h3 className="section-title">Complaint summary</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: total, color: 'text-text-primary' },
              { label: 'Open', value: statusCounts.OPEN, color: 'text-red-600' },
              { label: 'In Progress', value: statusCounts.IN_PROGRESS, color: 'text-amber-600' },
              { label: 'Resolved', value: statusCounts.RESOLVED, color: 'text-success-dark' },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 bg-surface-secondary rounded border border-border">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-2xs text-text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-text-muted mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-2xs text-text-muted uppercase tracking-wide">{label}</p>
        <p className="text-sm text-text-primary mt-0.5">{children}</p>
      </div>
    </div>
  )
}
