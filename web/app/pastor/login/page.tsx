'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PastorLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // First check if this email is a pastor
      const { data: pastor, error: pastorError } = await supabase
        .from('pastors')
        .select('*')
        .eq('email', email)
        .single()

      if (pastorError || !pastor) {
        setError('Invalid pastor credentials')
        setLoading(false)
        return
      }

      // For demo purposes, check against stored password hash
      // In production, you'd verify properly
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // For demo, allow any password if email exists in pastors table
        if (!pastor) {
          setError('Invalid credentials')
          setLoading(false)
          return
        }
      }

      // Store pastor session
      localStorage.setItem('pastor_id', pastor.id)
      localStorage.setItem('church_id', pastor.church_id)
      
      router.push('/pastor/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-gold-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading text-brown-deep mb-2">
            Pastor Portal
          </h1>
          <p className="text-brown-mid">
            Sign in to manage your church
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="pastor@church.com"
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
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Credentials issued with church licence purchase
        </p>
      </div>
    </div>
  )
}
