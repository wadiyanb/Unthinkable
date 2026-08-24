'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/use-toast'
import {
  Upload, X, Loader2, ArrowLeft, Image as ImageIcon, AlertCircle, CheckCircle2
} from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/utils'
import { Category } from '@prisma/client'
import { Metadata } from 'next'

interface ComplaintForm {
  title: string
  description: string
  category: string
}

export default function NewComplaintPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState('')

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ComplaintForm>()
  const descValue = watch('description', '')

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please use JPG, PNG, or WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`)
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const removePhoto = useCallback(() => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setUploadedUrl('')
    setUploadError('')
  }, [])

  const uploadPhoto = useCallback(async (): Promise<string | null> => {
    if (!photoFile) return null

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', photoFile)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setUploadError(json.error || 'Upload failed')
        return null
      }

      setUploadedUrl(json.url)
      return json.url
    } catch {
      setUploadError('Upload failed. Please try again.')
      return null
    } finally {
      setUploading(false)
    }
  }, [photoFile])

  const onSubmit = async (data: ComplaintForm) => {
    setSubmitting(true)

    let photoUrl = uploadedUrl

    if (photoFile && !uploadedUrl) {
      const url = await uploadPhoto()
      if (photoFile && !url) {
        setSubmitting(false)
        return
      }
      photoUrl = url || ''
    }

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          category: data.category,
          photoUrl: photoUrl || '',
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast({
          title: 'Failed to submit complaint',
          description: json.error || 'Please try again.',
          variant: 'error',
        })
        setSubmitting(false)
        return
      }

      toast({
        title: 'Complaint submitted',
        description: 'We\'ll look into it and keep you updated.',
        variant: 'success',
      })

      router.push(`/complaints/${json.complaint.id}`)
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'error',
      })
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft size={14} />
          Back to complaints
        </Link>
        <h1 className="text-xl font-bold text-text-primary">Submit a complaint</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Describe the issue and we&apos;ll get it resolved as soon as possible.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card p-5 space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="complaint-title" className="label">Complaint title *</label>
            <input
              id="complaint-title"
              type="text"
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Water leakage in master bedroom ceiling"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 5, message: 'Title must be at least 5 characters' },
                maxLength: { value: 200, message: 'Title must not exceed 200 characters' },
              })}
            />
            {errors.title && <p className="error-msg">{errors.title.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="complaint-category" className="label">Category *</label>
            <select
              id="complaint-category"
              className={`input ${errors.category ? 'input-error' : ''}`}
              {...register('category', { required: 'Please select a category' })}
              defaultValue=""
            >
              <option value="" disabled>Select a category...</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.category && <p className="error-msg">{errors.category.message}</p>}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="complaint-desc" className="label !mb-0">Description *</label>
              <span className={`text-2xs ${descValue.length > 1800 ? 'text-overdue' : 'text-text-muted'}`}>
                {descValue.length}/2000
              </span>
            </div>
            <textarea
              id="complaint-desc"
              rows={5}
              className={`input resize-none ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe the issue in detail. Include the location, when it started, and any other relevant information..."
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 20, message: 'Please provide more detail (at least 20 characters)' },
                maxLength: { value: 2000, message: 'Description must not exceed 2000 characters' },
              })}
            />
            {errors.description && <p className="error-msg">{errors.description.message}</p>}
          </div>

          {/* Photo upload */}
          <div>
            <label className="label">Photo (optional)</label>
            <p className="text-xs text-text-muted mb-2">
              Attach a photo to help us understand the issue better. JPG, PNG, or WEBP · Max 5MB
            </p>

            {!photoPreview ? (
              <label
                htmlFor="complaint-photo"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-brand-action hover:bg-primary-light/30 transition-colors"
              >
                <ImageIcon size={24} className="text-text-muted mb-2" />
                <p className="text-sm text-text-secondary">Click to upload photo</p>
                <p className="text-xs text-text-muted mt-0.5">or drag and drop</p>
                <input
                  id="complaint-photo"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-48 h-32 object-cover rounded-md border border-border"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-overdue rounded-full flex items-center justify-center text-white hover:bg-overdue-dark"
                >
                  <X size={10} />
                </button>
                {photoFile && !uploadedUrl && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-brand-accent" />
                    <span className="text-xs text-text-secondary">
                      {photoFile.name} · {(photoFile.size / 1024).toFixed(0)}KB
                    </span>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-overdue">
                <AlertCircle size={12} />
                {uploadError}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 mt-4">
          <Link href="/complaints" className="btn-md btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            id="submit-complaint"
            disabled={submitting || uploading}
            className="btn-md btn-primary"
          >
            {(submitting || uploading) && <Loader2 size={15} className="animate-spin" />}
            {uploading ? 'Uploading photo...' : submitting ? 'Submitting...' : 'Submit complaint'}
          </button>
        </div>
      </form>
    </div>
  )
}
