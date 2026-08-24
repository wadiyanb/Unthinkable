import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) redirect('/login')
  if (session.user.role !== 'RESIDENT') redirect('/admin')

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          role="RESIDENT"
          userName={session.user.name ?? ''}
          flatNumber={session.user.flatNumber}
        />
      </div>

      {/* Mobile navigation */}
      <div className="lg:hidden w-full">
        <MobileNav
          role="RESIDENT"
          userName={session.user.name ?? ''}
          flatNumber={session.user.flatNumber}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
