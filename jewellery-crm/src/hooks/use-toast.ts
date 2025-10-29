import * as React from 'react'

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning'

type ToastOptions = {
  title?: string
  description?: string
  variant?: ToastVariant
}

type ToastFn = (opts: ToastOptions) => void

// Simple in-memory toast queue (placeholder implementation)
type State = {
  toasts: Array<ToastOptions & { id: number }>
}

let idCounter = 1
let memoryState: State = { toasts: [] }
const listeners = new Set<(state: State) => void>()

function setState(next: State) {
  memoryState = next
  listeners.forEach((l) => l(memoryState))
}

export function toast(options: ToastOptions) {
  const newToast = { ...options, id: idCounter++ }
  setState({ toasts: [newToast, ...memoryState.toasts].slice(0, 5) })

  // Fallback visual for now
  if (typeof window !== 'undefined') {
    const prefix = options.variant === 'destructive' ? 'Error: ' : options.variant === 'success' ? 'Success: ' : ''
    // eslint-disable-next-line no-console
    console.info(`${prefix}${options.title || ''} ${options.description || ''}`.trim())
  }
}

export function useToast() {
  const [state, setLocal] = React.useState<State>(memoryState)

  React.useEffect(() => {
    const listener = (s: State) => setLocal(s)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const api: { toast: ToastFn } = React.useMemo(() => ({ toast }), [])
  return { ...api, toasts: state.toasts }
}

export default useToast

