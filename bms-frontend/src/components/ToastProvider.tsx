import React, { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: number; message: string; type?: 'info' | 'success' | 'error' }

const ToastContext = createContext<{ addToast: (m: string, t?: Toast['type']) => void } | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts(s => [...s, { id, message, type }])
    setTimeout(() => setToasts(s => s.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 6, background: t.type === 'error' ? '#fee2e2' : t.type === 'success' ? '#dcfce7' : '#e6f0ff', color: '#0f172a', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
