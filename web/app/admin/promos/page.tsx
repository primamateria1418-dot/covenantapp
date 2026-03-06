'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  expires_at: string | null
  max_uses: number | null
  uses_count: number
  is_active: boolean
  created_at: string
}

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    expires_at: '',
    max_uses: '',
  })

  useEffect(() => {
    loadPromos()
  }, [])

  const loadPromos = async () => {
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setPromos(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const code = formData.code.toUpperCase().replace(/\s/g, '')
    
    await supabase
      .from('promo_codes')
      .insert({
        code,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        expires_at: formData.expires_at || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        uses_count: 0,
        is_active: true,
      })

    setShowModal(false)
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      expires_at: '',
      max_uses: '',
    })
    loadPromos()
  }

  const handleToggleActive = async (promo: PromoCode) => {
    await supabase
      .from('promo_codes')
      .update({ is_active: !promo.is_active })
      .eq('id', promo.id)
    loadPromos()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return
    await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id)
    loadPromos()
  }

  const generateCode = () => {
    const code = uuidv4().split('-')[0].toUpperCase()
    setFormData({ ...formData, code })
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
        <h1 className="text-3xl font-heading text-brown-deep">Promo Codes</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Create Promo
        </button>
      </div>

      {/* Promo Codes Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Discount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Uses</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Expires</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No promo codes yet
                  </td>
                </tr>
              ) : (
                promos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-brown-deep">{promo.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      {promo.discount_type === 'percentage' 
                        ? `${promo.discount_value}%`
                        : `$${promo.discount_value}`}
                    </td>
                    <td className="px-4 py-3">
                      {promo.uses_count}
                      {promo.max_uses && ` / ${promo.max_uses}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {promo.expires_at 
                        ? format(new Date(promo.expires_at), 'MMM d, yyyy')
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        promo.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(promo)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {promo.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
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
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-heading text-brown-deep mb-4">
              Create Promo Code
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SUMMER20"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="btn-secondary"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Discount Type</label>
                  <select
                    className="input"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="label">Value</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) })}
                    min={1}
                    max={formData.discount_type === 'percentage' ? 100 : 1000}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expires (optional)</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Max Uses (optional)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Create Code
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
