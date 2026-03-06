'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ChurchSettings {
  name: string
  denomination: string
  pastor_name: string
  pastor_email: string
  logo_url: string
  cobranding_enabled: boolean
  sermon_series_banner: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ChurchSettings>({
    name: '',
    denomination: '',
    pastor_name: '',
    pastor_email: '',
    logo_url: '',
    cobranding_enabled: false,
    sermon_series_banner: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Sermon series form
  const [seriesTitle, setSeriesTitle] = useState('')
  const [seriesDuration, setSeriesDuration] = useState(4)
  const [seriesThemes, setSeriesThemes] = useState<{ week: number; theme: string; verse: string }[]>([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const churchId = localStorage.getItem('church_id')
    if (!churchId) return

    const { data } = await supabase
      .from('churches')
      .select('*')
      .eq('id', churchId)
      .single()

    if (data) {
      setSettings({
        name: data.name || '',
        denomination: data.denomination || '',
        pastor_name: data.pastor_name || '',
        pastor_email: data.pastor_email || '',
        logo_url: data.logo_url || '',
        cobranding_enabled: data.cobranding_enabled || false,
        sermon_series_banner: data.sermon_series_banner || '',
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const churchId = localStorage.getItem('church_id')
    if (!churchId) return

    await supabase
      .from('churches')
      .update({
        name: settings.name,
        denomination: settings.denomination,
        pastor_name: settings.pastor_name,
        pastor_email: settings.pastor_email,
        logo_url: settings.logo_url,
        cobranding_enabled: settings.cobranding_enabled,
        sermon_series_banner: settings.sermon_series_banner,
      })
      .eq('id', churchId)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleGenerateSeries = () => {
    setGenerating(true)
    const themes = []
    for (let i = 1; i <= seriesDuration; i++) {
      themes.push({
        week: i,
        theme: `Week ${i} Theme`,
        verse: 'Psalm 127:1',
      })
    }
    setSeriesThemes(themes)
    setGenerating(false)
  }

  const handlePublishSeries = async () => {
    if (!seriesTitle || seriesThemes.length === 0) return
    
    // In production, this would save to a sermon_series table
    // and trigger notifications to all church couples
    alert(`Sermon series "${seriesTitle}" would be published to ${seriesThemes.length} couples`)
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-3xl font-heading text-brown-deep">Church Settings</h1>

      {/* Basic Info */}
      <div className="card space-y-4">
        <h2 className="text-xl font-heading text-brown-deep">Basic Information</h2>
        
        <div>
          <label className="label">Church Name</label>
          <input
            type="text"
            className="input"
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Denomination</label>
          <input
            type="text"
            className="input"
            value={settings.denomination}
            onChange={(e) => setSettings({ ...settings, denomination: e.target.value })}
            placeholder="e.g., Baptist, Methodist, Non-denominational"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Pastor Name</label>
            <input
              type="text"
              className="input"
              value={settings.pastor_name}
              onChange={(e) => setSettings({ ...settings, pastor_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Contact Email</label>
            <input
              type="email"
              className="input"
              value={settings.pastor_email}
              onChange={(e) => setSettings({ ...settings, pastor_email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Church Logo URL</label>
          <input
            type="url"
            className="input"
            value={settings.logo_url}
            onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Co-branding */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-4">Co-branding</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.cobranding_enabled}
            onChange={(e) => setSettings({ ...settings, cobranding_enabled: e.target.checked })}
            className="w-5 h-5 text-brown-warm rounded"
          />
          <span className="text-brown-mid">
            Show church name in app header for my congregation
          </span>
        </label>
      </div>

      {/* Sermon Series Banner */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-4">Sermon Series Banner</h2>
        <p className="text-sm text-gray-600 mb-4">
          Custom message shown in the devotional tab for your congregation
        </p>
        <input
          type="text"
          className="input"
          value={settings.sermon_series_banner}
          onChange={(e) => setSettings({ ...settings, sermon_series_banner: e.target.value })}
          placeholder="e.g., This week: 'Building a Love That Lasts' sermon series"
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-green-600">✓ Changes saved successfully</span>
        )}
      </div>

      {/* Sermon Series Creator */}
      <div className="card space-y-4">
        <h2 className="text-xl font-heading text-brown-deep">
          Create Sermon Series Devotional Pack
        </h2>
        <p className="text-sm text-gray-600">
          Generate a custom devotional plan for your congregation tied to your sermon series
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Series Title</label>
            <input
              type="text"
              className="input"
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
              placeholder="e.g., Building a Love That Lasts"
            />
          </div>
          <div>
            <label className="label">Duration</label>
            <select
              className="input"
              value={seriesDuration}
              onChange={(e) => setSeriesDuration(Number(e.target.value))}
            >
              <option value={4}>4 Weeks</option>
              <option value={6}>6 Weeks</option>
              <option value={8}>8 Weeks</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateSeries}
          disabled={generating || !seriesTitle}
          className="btn-secondary"
        >
          {generating ? 'Generating...' : 'Generate Plan'}
        </button>

        {seriesThemes.length > 0 && (
          <div className="space-y-4 mt-6">
            {seriesThemes.map((week) => (
              <div key={week.week} className="border rounded-lg p-4">
                <h3 className="font-semibold text-brown-deep mb-2">Week {week.week}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    className="input"
                    value={week.theme}
                    onChange={(e) => {
                      const updated = [...seriesThemes]
                      updated[week.week - 1].theme = e.target.value
                      setSeriesThemes(updated)
                    }}
                    placeholder="Theme"
                  />
                  <input
                    type="text"
                    className="input"
                    value={week.verse}
                    onChange={(e) => {
                      const updated = [...seriesThemes]
                      updated[week.week - 1].verse = e.target.value
                      setSeriesThemes(updated)
                    }}
                    placeholder="Key verse"
                  />
                </div>
              </div>
            ))}
            
            <div className="pt-4">
              <button
                onClick={handlePublishSeries}
                className="btn-primary"
              >
                Publish to Congregation
              </button>
              <p className="text-sm text-gray-500 mt-2">
                This will push the devotional plan to all couples in your church
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
