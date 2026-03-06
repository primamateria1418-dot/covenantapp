'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Retreat {
  id: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface RetreatQuestion {
  id: string
  question_text: string
  order_index: number
}

export default function RetreatPage() {
  const [retreats, setRetreats] = useState<Retreat[]>([])
  const [activeRetreat, setActiveRetreat] = useState<Retreat | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // New retreat form
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)

  // Retreat questions
  const [questions, setQuestions] = useState<RetreatQuestion[]>([])
  const [showQuestions, setShowQuestions] = useState(false)
  const [newQuestions, setNewQuestions] = useState<string[]>([
    'What are you most grateful for in your marriage?',
    'What is one area you want to grow in together?',
    'How can you better support each other spiritually?',
    'What brings you the most joy as a couple?',
    'What would you like to improve about your communication?',
    'How can you prioritize each other more?',
    'What are your hopes and dreams for the future?',
    'How can you show more love and appreciation daily?',
  ])

  useEffect(() => {
    loadRetreats()
  }, [])

  const loadRetreats = async () => {
    const churchId = localStorage.getItem('church_id')
    if (!churchId) return

    const { data } = await supabase
      .from('retreats')
      .select('*')
      .eq('church_id', churchId)
      .order('start_date', { ascending: false })

    if (data) {
      setRetreats(data)
      const active = data.find((r: Retreat) => r.is_active)
      setActiveRetreat(active || null)
    }
    setLoading(false)
  }

  const handleCreateRetreat = async () => {
    if (!startDate || !endDate) return
    
    setCreating(true)
    const churchId = localStorage.getItem('church_id')
    if (!churchId) return

    // Deactivate any existing active retreat
    await supabase
      .from('retreats')
      .update({ is_active: false })
      .eq('church_id', churchId)
      .eq('is_active', true)

    // Create new retreat
    const { data, error } = await supabase
      .from('retreats')
      .insert({
        church_id: churchId,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      })
      .select()
      .single()

    if (!error && data) {
      // Create retreat questions
      const questionInserts = newQuestions.map((q, i) => ({
        retreat_id: data.id,
        question_text: q,
        order_index: i + 1,
      }))

      await supabase
        .from('retreat_questions')
        .insert(questionInserts)

      setActiveRetreat(data)
      setShowForm(false)
      setStartDate('')
      setEndDate('')
    }

    setCreating(false)
    loadRetreats()
  }

  const handleEndRetreat = async () => {
    if (!activeRetreat) return

    await supabase
      .from('retreats')
      .update({ is_active: false })
      .eq('id', activeRetreat.id)

    setActiveRetreat(null)
    loadRetreats()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brown-warm text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-3xl font-heading text-brown-deep">Retreat Mode</h1>

      {/* Active Retreat Banner */}
      {activeRetreat && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-heading text-green-800 mb-2">
                🎯 Retreat Active
              </h2>
              <p className="text-green-700">
                {format(new Date(activeRetreat.start_date), 'MMM d')} — {format(new Date(activeRetreat.end_date), 'MMM d, yyyy')}
              </p>
              <p className="text-green-600 text-sm mt-2">
                Couples see retreat content in their app. No streaks counted during this time.
              </p>
            </div>
            <button
              onClick={handleEndRetreat}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              End Retreat
            </button>
          </div>

          {/* Retreat Summary Card Preview */}
          <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3">What couples see:</h3>
            <ul className="space-y-2 text-green-700">
              <li>📝 8 reflection questions (one per day)</li>
              <li>📖 3 special devotionals (Friday, Saturday, Sunday)</li>
              <li>💌 Evening couple journal prompts</li>
              <li>🙏 Shared group prayer focus</li>
            </ul>
          </div>
        </div>
      )}

      {/* Create New Retreat */}
      {!activeRetreat && (
        <div className="card">
          <h2 className="text-xl font-heading text-brown-deep mb-4">
            Start a New Retreat
          </h2>
          <p className="text-gray-600 mb-6">
            Create a weekend retreat experience for couples in your congregation
          </p>

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Schedule Retreat Weekend
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-brown-deep mb-3">Retreat Questions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Customize the reflection questions couples will answer each day
                </p>
                {newQuestions.map((q, i) => (
                  <div key={i} className="mb-2">
                    <input
                      type="text"
                      className="input text-sm"
                      value={q}
                      onChange={(e) => {
                        const updated = [...newQuestions]
                        updated[i] = e.target.value
                        setNewQuestions(updated)
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCreateRetreat}
                  disabled={creating || !startDate || !endDate}
                  className="btn-primary"
                >
                  {creating ? 'Creating...' : 'Activate Retreat'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Retreats */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-4">Past Retreats</h2>
        
        {retreats.length === 0 ? (
          <p className="text-gray-500">No retreats scheduled yet</p>
        ) : (
          <div className="space-y-3">
            {retreats.map((retreat) => (
              <div
                key={retreat.id}
                className={`p-4 rounded-lg border ${
                  retreat.is_active
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-brown-deep">
                      {format(new Date(retreat.start_date), 'MMM d')} — {format(new Date(retreat.end_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {retreat.is_active ? 'Currently active' : 'Completed'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    retreat.is_active
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {retreat.is_active ? 'Active' : 'Ended'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
