import { useSettings } from '@/lib/settings-context'

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
]

const EXAMPLE_COUNTS = [1, 2, 3, 4, 5]

export function TopBar() {
  const { settings, updateSettings, loading } = useSettings()

  if (loading) return null

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto max-w-[1400px] flex items-center gap-6 px-4 sm:px-6 py-2.5 text-sm">
        {/* Logo / title */}
        <span className="font-semibold text-foreground mr-2 hidden sm:block">
          🎬 ImmersionSRS
        </span>

        <div className="flex-1" />

        {/* Native language */}
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground whitespace-nowrap">
            🌍 Nativo
          </label>
          <select
            value={settings.nativeLanguage}
            onChange={(e) => updateSettings({ nativeLanguage: e.target.value })}
            className="bg-secondary text-foreground border border-border rounded-md px-2 py-1 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Learned language */}
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground whitespace-nowrap">
            📚 Aprendiendo
          </label>
          <select
            value={settings.learnedLanguage}
            onChange={(e) => updateSettings({ learnedLanguage: e.target.value })}
            className="bg-secondary text-foreground border border-border rounded-md px-2 py-1 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Number of examples */}
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground whitespace-nowrap">
            📝 Ejemplos
          </label>
          <select
            value={settings.numExamples}
            onChange={(e) =>
              updateSettings({ numExamples: parseInt(e.target.value, 10) })
            }
            className="bg-secondary text-foreground border border-border rounded-md px-2 py-1 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {EXAMPLE_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {settings.numExamples >= 4 && (
            <p className="text-xs text-yellow-500/80 whitespace-nowrap">
              ⚠️ Alto uso de tokens
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
