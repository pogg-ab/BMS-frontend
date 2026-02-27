import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../auth/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(username, password)
      nav('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-12">
      <div className="w-full max-w-md">
        <div className="card">
          <h2 className="text-2xl font-semibold text-primary mb-4">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" placeholder="you@example.com" type="email" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <button className="button" type="submit">Sign in</button>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}
