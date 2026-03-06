import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-gold-light flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-heading text-brown-deep mb-6">
          Covenant
        </h1>
        <p className="text-xl text-brown-mid mb-12">
          Marriage Companion App — Building stronger marriages together
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            href="/pastor"
            className="block bg-brown-warm text-white p-8 rounded-xl hover:bg-brown-mid transition-colors shadow-lg"
          >
            <div className="text-4xl mb-4">⛪</div>
            <h2 className="text-2xl font-heading mb-2">Pastor Portal</h2>
            <p className="text-gold-light">
              Manage your church's couples, track engagement, and renew your licence
            </p>
          </Link>

          <Link 
            href="/admin"
            className="block bg-brown-deep text-white p-8 rounded-xl hover:bg-brown-mid transition-colors shadow-lg"
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-heading mb-2">Admin Portal</h2>
            <p className="text-gold-light">
              Platform analytics, user management, and church licence oversight
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
