'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Verify admin exists
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .single()

      if (adminError || !admin) {
        setError('Invalid admin credentials')
        setLoading(false)
        return
      }

      // For demo, allow any password if email exists
      // In production, verify password hash
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // For demo purposes, continue anyway
        if (!admin) {
          setError('Invalid credentials')
          setLoading(false)
          return
        }
      }

      // If TOTP is required, ask for code
      if (admin?.totp_secret) {
        setStep('totp')
        setLoading(false)
        return
      }

      // No TOTP, log in directly
      localStorage.setItem('admin_id', admin.id)
      router.push('/admin')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Verify TOTP code
    // In production, use an authenticator library
    if (totpCode.length !== 6) {
      setError('Please enter a 6-digit code')
      setLoading(false)
      return
    }

    // Demo: accept any 6-digit code
    const adminId = localStorage.getItem('admin_id') || 'demo-admin-id'
    localStorage.setItem('admin_id', adminId)
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-brown-deep flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📊</div>
          <h1 className="text-3xl font-heading text-brown-deep mb-2">
            Admin Portal
          </h1>
          <p className="text-brown-mid">
            Covenant Platform Management
          </p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@covenantapp.com"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotpSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="text-center mb-4">
              <p className="text-gray-600 mb-2">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div>
              <label className="label">Authentication Code</label>
              <input
                type="text"
                className="input text-center text-2xl tracking-widest"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="btn-primary w-full"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setStep('credentials')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to login
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-gray-500">
          Authorized personnel only
        </p>
      </div>
    </div>
  )
}
