'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Church {
  id: string
  name: string
  denomination: string
  pastor_name: string
  pastor_email: string
  licence_expiry: string | null
  created_at: string
  couples_count?: number
}

export default function ChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingChurch, setEditingChurch] = useState<Church | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    denomination: '',
    pastor_name: '',
    pastor_email: '',
    licence_expiry: '',
  })

  useEffect(() => {
    loadChurches()
  }, [])

  const loadChurches = async () => {
    const { data } = await supabase
      .from('churches')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      // Get couple counts for each church
      const churchesWithCounts = await Promise.all(
        data.map(async (church) => {
          const { count } = await supabase
            .from('couples')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', church.id)
          
          return { ...church, couples_count: count || 0 }
        })
      )
      setChurches(churchesWithCounts)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingChurch) {
      // Update existing
      await supabase
        .from('churches')
        .update(formData)
        .eq('id', editingChurch.id)
    } else {
      // Create new
      await supabase
        .from('churches')
        .insert(formData)
    }

    setShowModal(false)
    setEditingChurch(null)
    setFormData({ name: '', denomination: '', pastor_name: '', pastor_email: '', licence_expiry: '' })
    loadChurches()
  }

  const handleEdit = (church: Church) => {
    setEditingChurch(church)
    setFormData({
      name: church.name,
      denomination: church.denomination || '',
      pastor_name: church.pastor_name || '',
      pastor_email: church.pastor_email || '',
      licence_expiry: church.licence_expiry || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this church?')) return
    
    await supabase
      .from('churches')
      .delete()
      .eq('id', id)
    
    loadChurches()
  }

  const handleRenew = async (church: Church) => {
    // Add 1 year to licence
    const currentExpiry = church.licence_expiry ? new Date(church.licence_expiry) : new Date()
    const newExpiry = new Date(currentExpiry)
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)

    await supabase
      .from('churches')
      .update({ licence_expiry: newExpiry.toISOString() })
      .eq('id', church.id)

    loadChurches()
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading text-brown-deep">Church Licences</h1>
        <button
          onClick={() => {
            setEditingChurch(null)
            setFormData({ name: '', denomination: '', pastor_name: '', pastor_email: '', licence_expiry: '' })
            setShowModal(true)
          }}
          className="btn-primary"
        >
          + Add Church
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Church</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pastor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Couples</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Expiry</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Revenue</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {churches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No churches found
                  </td>
                </tr>
              ) : (
                churches.map((church) => {
                  const isExpired = church.licence_expiry && new Date(church.licence_expiry) < new Date()
                  const isExpiringSoon = church.licence_expiry && 
                    new Date(church.licence_expiry) > new Date() && 
                    new Date(church.licence_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                  return (
                    <tr key={church.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-brown-deep">{church.name}</p>
                          <p className="text-sm text-gray-500">{church.denomination}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-brown-deep">{church.pastor_name}</p>
                        <p className="text-sm text-gray-500">{church.pastor_email}</p>
                      </td>
                      <td className="px-4 py-3 text-brown-deep">{church.couples_count}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(church.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {church.licence_expiry 
                          ? format(new Date(church.licence_expiry), 'MMM d, yyyy')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isExpired 
                            ? 'bg-red-100 text-red-800'
                            : isExpiringSoon
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brown-deep">
                        ${(church.couples_count || 0) > 0 ? 199 : 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(church)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRenew(church)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => handleDelete(church.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Suspend
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total Churches</p>
          <p className="text-2xl font-bold text-brown-deep">{churches.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active Licences</p>
          <p className="text-2xl font-bold text-green-600">
            {churches.filter(c => c.licence_expiry && new Date(c.licence_expiry) > new Date()).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Church Licence Revenue</p>
          <p className="text-2xl font-bold text-brown-deep">
            ${churches.filter(c => c.licence_expiry && new Date(c.licence_expiry) > new Date()).length * 199}
          </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-heading text-brown-deep mb-4">
              {editingChurch ? 'Edit Church' : 'Add Church'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Church Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Denomination</label>
                <input
                  type="text"
                  className="input"
                  value={formData.denomination}
                  onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Pastor Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.pastor_name}
                  onChange={(e) => setFormData({ ...formData, pastor_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Pastor Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.pastor_email}
                  onChange={(e) => setFormData({ ...formData, pastor_email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Licence Expiry</label>
                <input
                  type="date"
                  className="input"
                  value={formData.licence_expiry}
                  onChange={(e) => setFormData({ ...formData, licence_expiry: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingChurch ? 'Save' : 'Add Church'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
