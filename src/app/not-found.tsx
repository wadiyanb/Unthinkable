import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-surface-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion size={22} className="text-text-muted" />
        </div>
        <h1 className="text-lg font-bold text-text-primary mb-1">Page not found</h1>
        <p className="text-sm text-text-secondary mb-6">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/" className="btn-sm btn-primary inline-flex">
          Go home
        </Link>
      </div>
    </div>
  )
}
