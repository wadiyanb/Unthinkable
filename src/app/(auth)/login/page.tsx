'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Building2, Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface LoginForm {
  email: string
  password: string
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')

    try {
      // Wrap signIn with a 15s timeout to avoid infinite buffering
      const signInPromise = signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Sign in timed out. Check your connection.')), 15000)
      )

      const result = await Promise.race([signInPromise, timeoutPromise])

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
        setLoading(false)
        return
      }

      // Redirect to dashboard — middleware will route admins to /admin automatically
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-brand-dark p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-accent rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-brand-dark" />
          </div>
          <div>
            <p className="text-white font-semibold text-base">Green Park Residency</p>
            <p className="text-white/40 text-xs">Maintenance Portal</p>
          </div>
        </div>

        <div>
          <h1 className="text-white text-3xl font-bold leading-tight mb-4">
            Society maintenance,<br />
            <span className="text-brand-accent">made simple.</span>
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Report complaints, track progress, and stay informed about
            your society in one place.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Track complaint status in real time' },
            { label: 'Receive email updates automatically' },
            { label: 'Stay informed with society notices' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent flex-shrink-0" />
              <p className="text-white/50 text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-brand-accent" />
            </div>
            <p className="font-semibold text-text-primary">Green Park Residency</p>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Welcome back</h2>
          <p className="text-text-secondary text-sm mb-8">
            Sign in to your resident or admin account.
          </p>

          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-overdue-light border border-overdue/20 rounded mb-5 text-sm text-overdue">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="label">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pr-9 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="btn-md btn-primary w-full mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-text-secondary text-center">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-action hover:underline font-medium">
              Register as resident
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-3 bg-surface-tertiary rounded border border-border">
            <p className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-2">Demo credentials</p>
            <div className="space-y-1 text-xs text-text-secondary">
              <p><span className="font-medium text-text-primary">Admin:</span> admin@greenparkresidency.com</p>
              <p><span className="font-medium text-text-primary">Resident:</span> priya.sharma@email.com</p>
              <p><span className="font-medium text-text-primary">Password:</span> Admin@123 / Resident@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-secondary" />}>
      <LoginForm />
    </Suspense>
  )
}
