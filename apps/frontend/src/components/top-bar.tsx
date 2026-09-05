import { useSettings } from '@/lib/settings-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
          <Select
            value={settings.nativeLanguage ?? 'es'}
            onValueChange={(v) => v && updateSettings({ nativeLanguage: v })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Learned language */}
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground whitespace-nowrap">
            📚 Aprendiendo
          </label>
          <Select
            value={settings.learnedLanguage ?? 'en'}
            onValueChange={(v) => v && updateSettings({ learnedLanguage: v })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Number of examples */}
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground whitespace-nowrap">
            📝 Ejemplos
          </label>
          <Select
            value={String(settings.numExamples ?? 3)}
            onValueChange={(v) => v && updateSettings({ numExamples: parseInt(v, 10) })}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXAMPLE_COUNTS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
