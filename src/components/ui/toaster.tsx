'use client'

import * as React from 'react'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './toast'
import { useToast } from './use-toast'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'

const icons = {
  default: <Info className="h-4 w-4 text-brand-action flex-shrink-0 mt-0.5" />,
  success: <CheckCircle2 className="h-4 w-4 text-brand-accent flex-shrink-0 mt-0.5" />,
  error: <XCircle className="h-4 w-4 text-overdue flex-shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant = 'default', ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          {icons[variant]}
          <div className="flex-1 min-w-0">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
            {action}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
