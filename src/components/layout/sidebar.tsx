'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  User,
  Plus,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  exact?: boolean
}

interface SidebarProps {
  role: 'ADMIN' | 'RESIDENT'
  userName: string
  flatNumber?: string | null
}

const residentNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} />, exact: true },
  { label: 'My Complaints', href: '/complaints', icon: <ClipboardList size={16} /> },
  { label: 'Notice Board', href: '/notices', icon: <Bell size={16} /> },
  { label: 'Profile', href: '/profile', icon: <User size={16} /> },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={16} />, exact: true },
  { label: 'All Complaints', href: '/admin/complaints', icon: <ClipboardList size={16} /> },
  { label: 'Notice Board', href: '/admin/notices', icon: <Bell size={16} /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings size={16} /> },
]

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all duration-100 group',
        isActive
          ? 'bg-brand-action/10 text-brand-action font-medium'
          : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
      )}
    >
      <span className={cn('flex-shrink-0', isActive ? 'text-brand-action' : 'text-text-muted group-hover:text-text-secondary')}>
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight size={12} className="text-brand-action/60" />}
    </Link>
  )
}

export function Sidebar({ role, userName, flatNumber }: SidebarProps) {
  const pathname = usePathname()
  const navItems = role === 'ADMIN' ? adminNav : residentNav

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-brand-dark border-r border-white/5 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-accent rounded flex items-center justify-center flex-shrink-0">
            <Building2 size={14} className="text-brand-dark" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Green Park</p>
            <p className="text-white/40 text-2xs leading-tight">Residency</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-2xs font-semibold text-white/30 uppercase tracking-widest">
          {role === 'ADMIN' ? 'Administration' : 'Resident Portal'}
        </p>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {role === 'RESIDENT' && (
          <div className="pt-3">
            <Link
              href="/complaints/new"
              className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium bg-brand-action/10 text-brand-action hover:bg-brand-action/20 transition-colors"
            >
              <Plus size={16} />
              New Complaint
            </Link>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-7 h-7 bg-brand-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-brand-secondary text-xs font-semibold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{userName}</p>
            <p className="text-white/40 text-2xs truncate">
              {role === 'ADMIN' ? 'Administrator' : flatNumber || 'Resident'}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-3 py-2 w-full rounded text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
