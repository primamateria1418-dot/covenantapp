'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, differenceInDays } from 'date-fns'

interface LicenceInfo {
  status: 'active' | 'expired' | 'expiring_soon'
  expiryDate: string | null
  daysRemaining: number
  autoRenew: boolean
  couplesCount: number
  pricePerYear: number
}

export default function LicencePage() {
  const [licence, setLicence] = useState<LicenceInfo>({
    status: 'expired',
    expiryDate: null,
    daysRemaining: 0,
    autoRenew: false,
    couplesCount: 0,
    pricePerYear: 199,
  })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadLicenceInfo()
  }, [])

  const loadLicenceInfo = async () => {
    const churchId = localStorage.getItem('church_id')
    if (!churchId) return

    // Get church and licence info
    const { data: church } = await supabase
      .from('churches')
      .select('*, couples(count)')
      .eq('id', churchId)
      .single()

    if (church?.licence_expiry) {
      const expiry = new Date(church.licence_expiry)
      const now = new Date()
      const daysRemaining = differenceInDays(expiry, now)

      let status: 'active' | 'expired' | 'expiring_soon' = 'active'
      if (daysRemaining < 0) status = 'expired'
      else if (daysRemaining <= 30) status = 'expiring_soon'

      setLicence({
        status,
        expiryDate: church.licence_expiry,
        daysRemaining: Math.max(0, daysRemaining),
        autoRenew: false, // Would come from subscription
        couplesCount: church.couples?.[0]?.count || 0,
        pricePerYear: 199,
      })
    } else {
      // No licence yet
      setLicence(prev => ({
        ...prev,
        couplesCount: church?.couples?.[0]?.count || 0,
      }))
    }

    setLoading(false)
  }

  const handleRenew = async () => {
    setProcessing(true)
    
    // In production, this would:
    // 1. Create a Stripe checkout session
    // 2. Handle the payment
    // 3. Update the licence_expiry in Supabase
    // 4. Generate and email an invoice
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    alert('In production, this would redirect to Stripe checkout for $199/year')
    
    setProcessing(false)
  }

  const handleToggleAutoRenew = async () => {
    // In production, update auto-renewal setting
    setLicence(prev => ({ ...prev, autoRenew: !prev.autoRenew }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brown-warm text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-3xl font-heading text-brown-deep">Licence & Billing</h1>

      {/* Current Licence Status */}
      <div className={`card border-2 ${
        licence.status === 'active' ? 'border-green-300 bg-green-50' :
        licence.status === 'expiring_soon' ? 'border-amber-300 bg-amber-50' :
        'border-red-300 bg-red-50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading text-brown-deep">
            Church Licence
          </h2>
          <span className={`px-4 py-2 rounded-full font-semibold ${
            licence.status === 'active' ? 'bg-green-200 text-green-800' :
            licence.status === 'expiring_soon' ? 'bg-amber-200 text-amber-800' :
            'bg-red-200 text-red-800'
          }`}>
            {licence.status === 'active' ? '✓ Active' :
             licence.status === 'expiring_soon' ? '⚠️ Expiring Soon' :
             '✗ Expired'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Expiry Date</p>
            <p className="font-semibold text-brown-deep">
              {licence.expiryDate 
                ? format(new Date(licence.expiryDate), 'MMMM d, yyyy')
                : 'No licence'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Days Remaining</p>
            <p className="font-semibold text-brown-deep">
              {licence.status === 'expired' ? '0' : licence.daysRemaining}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Linked Couples</p>
            <p className="font-semibold text-brown-deep">{licence.couplesCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Annual Price</p>
            <p className="font-semibold text-brown-deep">${licence.pricePerYear}</p>
          </div>
        </div>

        {licence.status === 'expiring_soon' && (
          <p className="text-amber-700 text-sm mt-4">
            ⚠️ Your licence expires in {licence.daysRemaining} days. 
            Renew now to keep your congregation's premium features.
          </p>
        )}
      </div>

      {/* Renew Button */}
      {licence.status !== 'active' && (
        <div className="card">
          <h2 className="text-xl font-heading text-brown-deep mb-4">
            Renew Your Licence
          </h2>
          <p className="text-gray-600 mb-4">
            Keep your congregation's premium features active
          </p>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
            <div>
              <p className="font-semibold text-brown-deep">Church Licence</p>
              <p className="text-sm text-gray-600">Annual subscription</p>
            </div>
            <p className="text-2xl font-bold text-brown-deep">$199/year</p>
          </div>

          <button
            onClick={handleRenew}
            disabled={processing}
            className="btn-primary w-full"
          >
            {processing ? 'Processing...' : 'Renew Now — $199'}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Secure payment powered by Stripe
          </p>
        </div>
      )}

      {/* Auto-Renewal Toggle */}
      {licence.status === 'active' && (
        <div className="card">
          <h2 className="text-xl font-heading text-brown-deep mb-4">
            Auto-Renewal
          </h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-brown-deep">Enable Auto-Renewal</p>
              <p className="text-sm text-gray-600">
                Automatically renew your licence each year
              </p>
            </div>
            <button
              onClick={handleToggleAutoRenew}
              className={`w-14 h-8 rounded-full transition-colors ${
                licence.autoRenew ? 'bg-brown-warm' : 'bg-gray-300'
              }`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                licence.autoRenew ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </label>
          
          {licence.autoRenew && (
            <p className="text-sm text-green-600 mt-4">
              ✓ Auto-renewal is enabled. You'll be charged ${licence.pricePerYear} on{' '}
              {licence.expiryDate 
                ? format(new Date(licence.expiryDate), 'MMMM d, yyyy')
                : 'your renewal date'}.
            </p>
          )}
        </div>
      )}

      {/* Invoice History */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-4">
          Invoice History
        </h2>
        
        <div className="text-center py-8 text-gray-500">
          <p>No invoices yet</p>
          <p className="text-sm">Invoices will appear here after purchase</p>
        </div>
      </div>

      {/* Church Licence Info */}
      <div className="card bg-gold-light">
        <h2 className="text-xl font-heading text-brown-deep mb-4">
          About Church Licence
        </h2>
        <ul className="space-y-2 text-brown-mid">
          <li>• $199/year for unlimited couples</li>
          <li>• All couples get premium features</li>
          <li>• Pastor portal access</li>
          <li>• Retreat mode included</li>
          <li>• Custom sermon series devotionals</li>
          <li>• Priority support</li>
        </ul>
      </div>
    </div>
  )
}
