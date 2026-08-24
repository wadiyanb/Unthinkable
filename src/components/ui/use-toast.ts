'use client'

import * as React from 'react'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 4000

type ToastVariant = 'default' | 'success' | 'error' | 'warning'

interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: ToastVariant
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'UPDATE'; toast: Partial<Toast> & { id: string } }
  | { type: 'DISMISS'; toastId?: string }
  | { type: 'REMOVE'; toastId?: string }

const actionTypes = {
  ADD: 'ADD',
  UPDATE: 'UPDATE',
  DISMISS: 'DISMISS',
  REMOVE: 'REMOVE',
} as const

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: 'REMOVE', toastId })
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case 'ADD':
      return [action.toast, ...state].slice(0, TOAST_LIMIT)
    case 'UPDATE':
      return state.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t))
    case 'DISMISS': {
      if (action.toastId) {
        addToRemoveQueue(action.toastId)
      } else {
        state.forEach((t) => addToRemoveQueue(t.id))
      }
      return state.map((t) =>
        !action.toastId || t.id === action.toastId ? { ...t, open: false } : t
      )
    }
    case 'REMOVE':
      return action.toastId ? state.filter((t) => t.id !== action.toastId) : []
    default:
      return state
  }
}

const listeners: Array<(state: Toast[]) => void> = []
let memoryState: Toast[] = []

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

export function toast(props: Omit<Toast, 'id'>) {
  const id = genId()
  const { duration = TOAST_REMOVE_DELAY } = props

  dispatch({ type: 'ADD', toast: { ...props, id, open: true, onOpenChange: (open) => {
    if (!open) dispatch({ type: 'DISMISS', toastId: id })
  }}})

  setTimeout(() => dispatch({ type: 'DISMISS', toastId: id }), duration)

  return { id, dismiss: () => dispatch({ type: 'DISMISS', toastId: id }) }
}

export function useToast() {
  const [state, setState] = React.useState<Toast[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [state])

  return {
    toasts: state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS', toastId }),
  }
}
