import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../auth/auth'
import { Lock, Mail, ChevronRight, AlertCircle, Building2, Eye } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      nav('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans relative transition-colors duration-300">
      {/* App Logo Top Center */}
      <div className="absolute top-12 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <Building2 size={20} className="text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          BMS <span className="text-indigo-600">PRO</span>
        </span>
      </div>

      <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-[32px] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 z-10 my-auto mt-28">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Access your building management dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                required
                className="w-full pl-11 pr-4 h-14 bg-slate-50 dark:bg-slate-950/50 border-none rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-600/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium text-[15px]"
                placeholder="admin@building.com"
                type="email"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center ml-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                required
                className="w-full pl-11 pr-12 h-14 bg-slate-50 dark:bg-slate-950/50 border-none rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-600/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium text-lg tracking-[0.2em]"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                <Eye size={18} />
              </button>
            </div>
          </div>


          {error && (
            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium animate-in slide-in-from-top-1">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in to Dashboard
                  <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>

    </div>
  )
}
