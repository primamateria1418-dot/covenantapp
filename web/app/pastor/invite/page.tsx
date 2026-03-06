'use client'

import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'

export default function InvitePage() {
  const [joinLink, setJoinLink] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    generateInviteLink()
  }, [])

  const generateInviteLink = async () => {
    const churchId = localStorage.getItem('church_id')
    if (!churchId) return

    // Get or create church join code
    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('id', churchId)
      .single()

    if (church) {
      const link = `https://covenantapp.com/join/church/${church.id}`
      setJoinLink(link)

      // Generate QR code
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, link, {
          width: 200,
          margin: 2,
          color: {
            dark: '#2c1810',
            light: '#ffffff',
          },
        })
      }
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendEmail = async () => {
    if (!email) return

    setSending(true)

    // In production, this would trigger a Supabase edge function
    // to send an email invitation
    console.log('Sending invitation to:', email, 'with link:', joinLink)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSending(false)
    setSent(true)
    setEmail('')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-3xl font-heading text-brown-deep">Invite Couples</h1>

      {/* Join Link & QR Code */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-4">
          Church Join Link
        </h2>
        <p className="text-gray-600 mb-6">
          Share this link with couples in your congregation. When they join using this 
          link, they'll be automatically connected to your church.
        </p>

        <div className="flex items-center gap-6 mb-6">
          <div className="flex-1 bg-gray-50 p-4 rounded-lg">
            <code className="text-brown-warm break-all">{joinLink}</code>
          </div>
          <button
            onClick={handleCopyLink}
            className="btn-secondary whitespace-nowrap"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>

        <div className="flex justify-center">
          <div className="text-center">
            <canvas ref={canvasRef} className="mx-auto mb-2" />
            <p className="text-sm text-gray-500">Scan to join</p>
          </div>
        </div>
      </div>

      {/* Send Email Invite */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-4">
          Send Invitation Email
        </h2>
        <p className="text-gray-600 mb-6">
          Enter email addresses to send invitation emails directly
        </p>

        <div className="flex gap-4">
          <input
            type="email"
            className="input flex-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="couple@email.com"
            onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
          />
          <button
            onClick={handleSendEmail}
            disabled={sending || !email}
            className="btn-primary"
          >
            {sending ? 'Sending...' : 'Send Invite'}
          </button>
        </div>

        {sent && (
          <p className="text-green-600 mt-4">✓ Invitation sent successfully!</p>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Email Preview:</strong><br />
            Subject: "Join Covenant - Your Church Marriage Companion"<br />
            Body: "We're excited to invite you to use Covenant, a free app designed 
            to help couples grow closer together. Click here to get started: [link]"
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="card bg-gold-light">
        <h2 className="text-xl font-heading text-brown-deep mb-4">
          Tips for Inviting Couples
        </h2>
        <ul className="space-y-2 text-brown-mid">
          <li>• Share the link during church announcements</li>
          <li>• Include it in your weekly bulletin or newsletter</li>
          <li>• Print QR codes for display in the lobby</li>
          <li>• Send personal invitations to engaged and newlywed couples</li>
        </ul>
      </div>
    </div>
  )
}
