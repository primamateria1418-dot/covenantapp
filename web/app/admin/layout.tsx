'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const adminId = localStorage.getItem('admin_id')
    if (!adminId) {
      router.push('/admin/login')
      return
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gold text-xl">Loading...</div>
      </div>
    )
  }

  const navItems = [
    { href: '/admin', label: 'Overview', icon: '📊' },
    { href: '/admin/growth', label: 'Growth', icon: '📈' },
    { href: '/admin/revenue', label: 'Revenue', icon: '💰' },
    { href: '/admin/churches', label: 'Churches', icon: '⛪' },
    { href: '/admin/usage', label: 'Usage', icon: '📱' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/promos', label: 'Promos', icon: '🏷️' },
    { href: '/admin/verses', label: 'Verses', icon: '📖' },
    { href: '/admin/referrals', label: 'Referrals', icon: '🎁' },
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-brown-deep text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xl font-heading">
              📊 Covenant Admin
            </Link>
          </div>
          <nav className="flex items-center gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
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
                localStorage.removeItem('admin_id')
                router.push('/admin/login')
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
