'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Building2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface RegisterForm {
  name: string
  email: string
  password: string
  flatNumber: string
  phone: string
}

const passwordRequirements = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'Special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const passwordValue = watch('password', '')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          flatNumber: data.flatNumber || undefined,
          phone: data.phone || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Registration failed. Please try again.')
        setLoading(false)
        return
      }

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        router.push('/login')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-brand-dark rounded-xl items-center justify-center mb-4">
            <Building2 size={22} className="text-brand-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Create your account</h1>
          <p className="text-text-secondary text-sm">Join Green Park Residency portal as a resident</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-overdue-light border border-overdue/20 rounded mb-5 text-sm text-overdue">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label htmlFor="reg-name" className="label">Full name *</label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Priya Sharma"
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />
                {errors.name && <p className="error-msg">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="reg-flat" className="label">Flat number</label>
                <input
                  id="reg-flat"
                  type="text"
                  className="input"
                  placeholder="A-203"
                  {...register('flatNumber')}
                />
              </div>

              <div>
                <label htmlFor="reg-phone" className="label">Phone</label>
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  className="input"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Email address *</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password" className="label">Password *</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pr-9 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Create a strong password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters required' },
                    validate: {
                      uppercase: (v) => /[A-Z]/.test(v) || 'Add an uppercase letter',
                      lowercase: (v) => /[a-z]/.test(v) || 'Add a lowercase letter',
                      number: (v) => /[0-9]/.test(v) || 'Add a number',
                      special: (v) => /[^A-Za-z0-9]/.test(v) || 'Add a special character',
                    },
                  })}
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

              {/* Password strength */}
              {passwordValue && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-1.5">
                      <CheckCircle2
                        size={12}
                        className={req.test(passwordValue) ? 'text-brand-accent' : 'text-border-strong'}
                      />
                      <span className={`text-2xs ${req.test(passwordValue) ? 'text-success-dark' : 'text-text-muted'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              id="register-submit"
              className="btn-md btn-primary w-full mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-sm text-text-secondary text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-action hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
