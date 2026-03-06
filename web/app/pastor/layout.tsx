'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function PastorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [churchName, setChurchName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const churchId = localStorage.getItem('church_id')
    if (!churchId) {
      router.push('/pastor/login')
      return
    }

    // In production, fetch church name from Supabase
    setChurchName('Grace Community Church')
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-brown-warm text-xl">Loading...</div>
      </div>
    )
  }

  const navItems = [
    { href: '/pastor/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/pastor/congregation', label: 'Congregation', icon: '👥' },
    { href: '/pastor/settings', label: 'Settings', icon: '⚙️' },
    { href: '/pastor/retreat', label: 'Retreat', icon: '⛪' },
    { href: '/pastor/invite', label: 'Invite', icon: '📧' },
    { href: '/pastor/licence', label: 'Licence', icon: '🔒' },
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-brown-deep text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pastor/dashboard" className="text-xl font-heading">
              ⛪ {churchName}
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-brown-warm text-white'
                    : 'text-gold-light hover:bg-brown-mid'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                localStorage.removeItem('pastor_id')
                localStorage.removeItem('church_id')
                router.push('/pastor/login')
              }}
              className="text-gold-light hover:text-white transition-colors ml-4"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
