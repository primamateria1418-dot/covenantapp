'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface User {
  id: string
  email: string
  full_name: string
  spouse_name: string
  wedding_date: string
  couple_id: string | null
  created_at: string
  is_premium: boolean
  church_name?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    // Get profiles with couple info
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profiles) {
      // Get premium status for each user
      const usersWithPremium = await Promise.all(
        profiles.map(async (profile) => {
          let isPremium = false
          let churchName = undefined

          if (profile.couple_id) {
            const { data: couple } = await supabase
              .from('couples')
              .select('premium_expiry, churches(name)')
              .eq('id', profile.couple_id)
              .single()

            if (couple?.premium_expiry) {
              isPremium = new Date(couple.premium_expiry) > new Date()
            }
            if (couple?.churches?.name) {
              churchName = couple.churches.name
            }
          }

          return {
            ...profile,
            is_premium: isPremium,
            church_name: churchName,
          }
        })
      )
      setUsers(usersWithPremium)
    }
    setLoading(false)
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleResetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email)
    alert(`Password reset email sent to ${email}`)
  }

  const handleUpgrade = async (user: User) => {
    if (!user.couple_id) {
      alert('User has no couple account')
      return
    }

    // Add 30 days premium
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)

    await supabase
      .from('couples')
      .update({ premium_expiry: expiry.toISOString() })
      .eq('id', user.couple_id)

    alert('User upgraded to premium for 30 days')
    loadUsers()
  }

  const handleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return
    // In production, set a suspended flag or delete
    alert('User suspended (demo)')
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) return
    
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    loadUsers()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brown-warm text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading text-brown-deep">User Management</h1>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          className="input"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Spouse</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Church</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.slice(0, 50).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-brown-deep">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.spouse_name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.is_premium
                          ? 'bg-gold-light text-brown-deep'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.is_premium ? 'Premium' : 'Free'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {user.church_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResetPassword(user.email)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleUpgrade(user)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Upgrade
                        </button>
                        <button
                          onClick={() => handleSuspend(user.id)}
                          className="text-amber-600 hover:text-amber-800 text-sm"
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > 50 && (
          <p className="text-center text-gray-500 py-4">
            Showing first 50 of {filteredUsers.length} users
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-brown-deep">{users.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Premium</p>
          <p className="text-2xl font-bold text-gold">{users.filter(u => u.is_premium).length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Free</p>
          <p className="text-2xl font-bold text-brown-mid">
            {users.filter(u => !u.is_premium).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">With Church</p>
          <p className="text-2xl font-bold text-green-deep">
            {users.filter(u => u.church_name).length}
          </p>
        </div>
      </div>
    </div>
  )
}
