import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../auth/auth'
import { Lock, Mail, ChevronRight, AlertCircle, Building2 } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-500">
      {/* Dynamic decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow-delay" />

      {/* Background Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in duration-700">
        {/* Logo/Brand Area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-500/40 mb-6 transform hover:rotate-6 transition-transform duration-300 group">
            <Building2 className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Building Management <span className="text-indigo-600">System</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg font-medium">
            Next-generation building management system.
          </p>
        </div>

        <div className="glass-panel p-10 backdrop-blur-3xl border-slate-200/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/60 shadow-2xl overflow-hidden relative group/card">
          {/* Subtle card glow on hover */}
          <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="space-y-2.5">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  required
                  className="form-input pl-12 h-14 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base rounded-2xl"
                  placeholder="name@company.com"
                  type="email"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  required
                  className="form-input pl-12 h-14 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base rounded-2xl"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-1 font-medium">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              className="button w-full h-14 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-600/20 group relative overflow-hidden transition-all duration-300 disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In to Portal
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-white/5 text-center">
            <p className="text-base text-slate-500 dark:text-slate-500">
              Need access?{' '}
              <button className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-all">
                Contact Administration
              </button>
            </p>
          </div>
        </div>

        {/* Footer credits */}
        <div className="flex items-center justify-center space-x-4 mt-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          <p className="text-xs text-slate-600 dark:text-white font-bold tracking-[0.2em] uppercase">
            Powered by Skylink Technologies &copy; 2026
          </p>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.2; }
        }
        @keyframes pulse-slow-delay {
          0%, 100% { transform: scale(1.1); opacity: 0.2; }
          50% { transform: scale(1); opacity: 0.1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-in-top {
          from { transform: translateY(-12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-pulse-slow-delay { animation: pulse-slow-delay 8s ease-in-out infinite; }
        .animate-in { animation-duration: 0.8s; animation-fill-mode: both; }
        .fade-in { animation-name: fade-in; }
        .zoom-in { animation-name: zoom-in; }
        .slide-in-from-top-1 { animation-name: slide-in-top; animation-duration: 0.4s; }
      `}</style>
    </div>
  )
}
