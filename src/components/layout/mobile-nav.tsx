'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, ClipboardList, Bell, Settings,
  LogOut, User, Plus, Building2, X, Menu
} from 'lucide-react'
import { cn } from '@/components/ui/utils'

interface MobileNavProps {
  role: 'ADMIN' | 'RESIDENT'
  userName: string
  flatNumber?: string | null
}

const residentNav = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} />, exact: true },
  { label: 'My Complaints', href: '/complaints', icon: <ClipboardList size={16} /> },
  { label: 'Notices', href: '/notices', icon: <Bell size={16} /> },
  { label: 'Profile', href: '/profile', icon: <User size={16} /> },
]

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={16} />, exact: true },
  { label: 'Complaints', href: '/admin/complaints', icon: <ClipboardList size={16} /> },
  { label: 'Notices', href: '/admin/notices', icon: <Bell size={16} /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings size={16} /> },
]

export function MobileNav({ role, userName, flatNumber }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const navItems = role === 'ADMIN' ? adminNav : residentNav

  return (
    <>
      {/* Mobile header */}
      <header className="flex lg:hidden items-center justify-between px-4 py-3 bg-brand-dark border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-accent rounded flex items-center justify-center">
            <Building2 size={12} className="text-brand-dark" />
          </div>
          <span className="text-white text-sm font-semibold">Green Park</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-white/60 hover:text-white p-1"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-brand-dark flex flex-col lg:hidden transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-accent rounded flex items-center justify-center">
              <Building2 size={12} className="text-brand-dark" />
            </div>
            <span className="text-white text-sm font-semibold">Green Park Residency</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded text-sm transition-colors',
                  isActive
                    ? 'bg-brand-action/10 text-brand-action font-medium'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
          {role === 'RESIDENT' && (
            <Link
              href="/complaints/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 mt-2 rounded text-sm font-medium text-brand-action hover:bg-brand-action/10 transition-colors"
            >
              <Plus size={16} />
              New Complaint
            </Link>
          )}
        </nav>

        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-7 h-7 bg-brand-secondary/20 rounded-full flex items-center justify-center">
              <span className="text-brand-secondary text-xs font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white text-xs font-medium">{userName}</p>
              <p className="text-white/40 text-2xs">{flatNumber || (role === 'ADMIN' ? 'Admin' : 'Resident')}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}
