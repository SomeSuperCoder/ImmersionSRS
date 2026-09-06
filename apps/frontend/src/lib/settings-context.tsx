import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

export interface AppSettings {
  nativeLanguage: string
  learnedLanguage: string
  numExamples: number
  explanationLevel: string
}

const DEFAULT_SETTINGS: AppSettings = {
  nativeLanguage: 'es',
  learnedLanguage: 'en',
  numExamples: 3,
  explanationLevel: 'simple',
}

const SettingsContext = createContext<{
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
  loading: boolean
}>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  loading: true,
})

export function useSettings() {
  return useContext(SettingsContext)
}

const API_URL = 'http://localhost:3000/api/settings'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  // Load from API on mount
  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((data: AppSettings) => {
        setSettings(data)
        setLoading(false)
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem('immersion-settings')
          if (saved) setSettings(JSON.parse(saved))
        } catch {}
        setLoading(false)
      })
  }, [])

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }

      // Save to API (fire and forget)
      fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {})

      // Also save to localStorage as backup
      try {
        localStorage.setItem('immersion-settings', JSON.stringify(next))
      } catch {}

      return next
    })
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}
