'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Verse {
  id: string
  reference: string
  text: string
  topic: string
  is_active: boolean
}

const TOPICS = [
  'Love', 'Marriage', 'Faith', 'Hope', 'Communication', 
  'Forgiveness', 'Commitment', 'Trust', 'Patience', 'Unity'
]

export default function VersesPage() {
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVerse, setEditingVerse] = useState<Verse | null>(null)

  const [formData, setFormData] = useState({
    reference: '',
    text: '',
    topic: verse.topic,
  })

  useEffect(() => {
    loadVerses()
  }, [])

  const loadVerses = async () => {
    const { data } = await supabase
      .from('verses')
      .select('*')
      .order('topic', { ascending: true })

    if (data) {
      setVerses(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingVerse) {
      await supabase
        .from('verses')
        .update(formData)
        .eq('id', editingVerse.id)
    } else {
      await supabase
        .from('verses')
        .insert({ ...formData, is_active: true })
    }

    setShowModal(false)
    setEditingVerse(null)
    setFormData({ reference: '', text: '', topic: 'Love'es()
  }

  const handleEdit })
    loadVers = (verse: Verse) => {
    setEditingVerse(verse)
    setFormData({
      reference: verse.reference,
      text: verse.text,
      topic: verse.topic,
    })
    setShowModal(true)
  }

  const handleToggleActive = async (verse: Verse) => {
    await supabase
      .from('verses')
      .update({ is_active: !verse.is_active })
      .eq('id', verse.id)
    loadVerses()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this verse?')) return
    await supabase
      .from('verses')
      .delete()
      .eq('id', id)
    loadVerses()
  }

  const filteredVerses = verses.filter(v => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && v.is_active) ||
      (filter === 'inactive' && !v.is_active) ||
      v.topic === filter
    const matchesSearch = search === '' ||
      v.reference.toLowerCase().includes(search.toLowerCase()) ||
      v.text.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

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
        <h1 className="text-3xl font-heading text-brown-deep">Verse Library</h1>
        <button
          onClick={() => {
            setEditingVerse(null)
            setFormData({ reference: '', text: '', topic: 'Love' })
            setShowModal(true)
          }}
          className="btn-primary"
        >
          + Add Verse
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            className="input flex-1 min-w-[200px]"
            placeholder="Search verses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Topics</option>
            {TOPICS.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Verse Count */}
      <div className="flex gap-4">
        <div className="card flex-1">
          <p className="text-sm text-gray-500">Total Verses</p>
          <p className="text-2xl font-bold text-brown-deep">{verses.length}</p>
        </div>
        <div className="card flex-1">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{verses.filter(v => v.is_active).length}</p>
        </div>
        <div className="card flex-1">
          <p className="text-sm text-gray-500">Topics</p>
          <p className="text-2xl font-bold text-purple">{new Set(verses.map(v => v.topic)).size}</p>
        </div>
      </div>

      {/* Verse Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVerses.length === 0 ? (
          <div className="col-span-full card text-center text-gray-500 py-8">
            No verses found
          </div>
        ) : (
          filteredVerses.map((verse) => (
            <div
              key={verse.id}
              className={`card ${!verse.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gold bg-gold-light px-2 py-1 rounded">
                  {verse.topic}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  verse.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {verse.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="font-heading text-lg text-brown-deep mb-2">{verse.reference}</p>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{verse.text}</p>
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => handleEdit(verse)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(verse)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  {verse.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(verse.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-heading text-brown-deep mb-4">
              {editingVerse ? 'Edit Verse' : 'Add Verse'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Reference</label>
                <input
                  type="text"
                  className="input"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g., 1 Corinthians 13:4-7"
                  required
                />
              </div>
              <div>
                <label className="label">Topic</label>
                <select
                  className="input"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                >
                  {TOPICS.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Verse Text</label>
                <textarea
                  className="input min-h-[120px]"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Enter the verse text..."
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingVerse ? 'Save' : 'Add Verse'}
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
