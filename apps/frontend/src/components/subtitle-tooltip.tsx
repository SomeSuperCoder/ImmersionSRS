import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  explainVocabulary,
  explainGrammar,
  type AiContext,
  type VocabularyResponse,
  type GrammarResponse,
} from '@/lib/ai-api'
import { useSettings } from '@/lib/settings-context'

interface SubtitleTooltipProps {
  subtitles: { text: string; startTime: number; endTime: number }[]
  videoTitle?: string
  children: React.ReactNode
}

export function SubtitleTooltip({
  subtitles,
  videoTitle = '',
  children,
}: SubtitleTooltipProps) {
  const [selection, setSelection] = useState<{
    text: string
    x: number
    y: number
    subtitleIndex: number
  } | null>(null)

  const [vocabResult, setVocabResult] = useState<VocabularyResponse | null>(null)
  const [vocabLoading, setVocabLoading] = useState(false)
  const [vocabOpen, setVocabOpen] = useState(false)

  const [grammarOpen, setGrammarOpen] = useState(false)
  const [grammarQuestion, setGrammarQuestion] = useState('')
  const [grammarResult, setGrammarResult] = useState<GrammarResponse | null>(null)
  const [grammarLoading, setGrammarLoading] = useState(false)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const { settings } = useSettings()

  const getContext = useCallback(
    (idx: number): AiContext => ({
      prevLine: idx > 0 ? subtitles[idx - 1]?.text ?? '' : '',
      currentLine: subtitles[idx]?.text ?? '',
      nextLine: idx < subtitles.length - 1 ? subtitles[idx + 1]?.text ?? '' : '',
      videoTitle,
    }),
    [subtitles, videoTitle]
  )

  // Handle text selection
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const sel = window.getSelection()
    const selectedText = sel?.toString().trim() ?? ''

    if (!selectedText || selectedText.length < 2) {
      setSelection(null)
      return
    }

    // Find which subtitle was selected
    const target = e.target as HTMLElement
    const subEl = target.closest('[data-subtitle-index]')
    const subtitleIndex = subEl
      ? parseInt(subEl.getAttribute('data-subtitle-index') ?? '-1', 10)
      : -1

    // Get position
    const range = sel?.getRangeAt(0)
    const rect = range?.getBoundingClientRect()
    if (!rect) return

    setSelection({
      text: selectedText,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      subtitleIndex,
    })
  }, [])

  // Handle vocabulary click
  const handleVocabClick = useCallback(async () => {
    if (!selection) return

    setVocabLoading(true)
    setVocabOpen(true)
    setVocabResult(null)

    try {
      const ctx = getContext(selection.subtitleIndex)
      const result = await explainVocabulary(selection.text, ctx, settings.numExamples)
      setVocabResult(result)
    } catch {
      setVocabResult({
        type: 'vocabulary',
        word: selection.text,
        definition: 'Error loading definition. Please try again.',
        examples: [],
      })
    } finally {
      setVocabLoading(false)
    }
  }, [selection, getContext, settings.numExamples])

  // Handle grammar click
  const handleGrammarClick = useCallback(() => {
    setGrammarOpen(true)
    setGrammarQuestion('')
    setGrammarResult(null)
  }, [])

  // Handle grammar submit
  const handleGrammarSubmit = useCallback(async () => {
    if (!selection || !grammarQuestion.trim()) return

    setGrammarLoading(true)
    setGrammarResult(null)

    try {
      const ctx = getContext(selection.subtitleIndex)
      const result = await explainGrammar(selection.text, ctx, grammarQuestion)
      setGrammarResult(result)
    } catch {
      setGrammarResult({
        type: 'grammar',
        explanation: 'Error loading explanation. Please try again.',
      })
    } finally {
      setGrammarLoading(false)
    }
  }, [selection, grammarQuestion, getContext])

  // Close selection on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelection(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear selection when clicking elsewhere in the subtitle list
  const handleSubtitleListClick = useCallback(() => {
    // Delay to let selection finish
    setTimeout(() => {
      const sel = window.getSelection()?.toString().trim()
      if (!sel || sel.length < 2) {
        setSelection(null)
      }
    }, 10)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Subtitle list with selection detection */}
      <div onMouseUp={handleMouseUp} onClick={handleSubtitleListClick}>
        {children}
      </div>

      {/* Floating tooltip */}
      {selection && (
        <div
          className="fixed z-50 flex gap-1 p-1 bg-popover border rounded-lg shadow-lg"
          style={{
            left: `${Math.max(16, Math.min(selection.x - 60, window.innerWidth - 140))}px`,
            top: `${Math.max(8, selection.y - 40)}px`,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleVocabClick}
          >
            📗 Vocabulario
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleGrammarClick}
          >
            📙 Gramática
          </Button>
        </div>
      )}

      {/* Vocabulary dialog */}
      <Dialog open={vocabOpen} onOpenChange={setVocabOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📗 Vocabulario
              {vocabResult && <Badge variant="secondary">{vocabResult.word}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {vocabLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <div className="animate-pulse">Consultando IA...</div>
            </div>
          ) : vocabResult ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Definición
                </h4>
                <p className="text-sm">{vocabResult.definition}</p>
              </div>

              {vocabResult.examples.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Ejemplos
                  </h4>
                  <ul className="space-y-1">
                    {vocabResult.examples.map((ex, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground pl-3 border-l-2 border-border"
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Grammar dialog */}
      <Dialog open={grammarOpen} onOpenChange={(open) => {
        setGrammarOpen(open)
        if (!open) {
          setShowSkipWarning(false)
          setGrammarQuestion('')
          setGrammarResult(null)
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📙 Gramática
              {selection && (
                <Badge variant="outline" className="text-xs">
                  "{selection.text}"
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Escribe tu pregunta sobre la gramática de esta expresión
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="¿Qué quieres entender? Ej: ¿Por qué usa presente continuo?"
                value={grammarQuestion}
                onChange={(e) => setGrammarQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !grammarLoading) {
                    handleGrammarSubmit()
                  }
                }}
                disabled={grammarLoading}
              />
              <Button
                onClick={handleGrammarSubmit}
                disabled={grammarLoading || !grammarQuestion.trim()}
              >
                {grammarLoading ? '...' : '→'}
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground text-xs"
              onClick={() => setShowSkipWarning(true)}
            >
              Saltar explicación
            </Button>

            {grammarLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                <div className="animate-pulse">Consultando IA...</div>
              </div>
            ) : grammarResult ? (
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {grammarResult.explanation}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      {/* Skip confirmation dialog */}
      <Dialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>⚠️ ¿Saltar explicación?</DialogTitle>
            <DialogDescription>
              Si no entiendes la gramática, es recomendable que revises la explicación antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowSkipWarning(false)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowSkipWarning(false)
                setGrammarOpen(false)
                setGrammarQuestion('')
                setGrammarResult(null)
              }}
            >
              Saltar de todos modos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}