import { useState, useRef, useCallback, useEffect } from 'react'
import Markdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  explainVocabulary,
  explainGrammar,
  explainGrammarAuto,
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
  // Persist selection data for the grammar dialog — selection gets cleared by
  // handleClickOutside when the user interacts with the portaled Dialog content
  const [grammarSelectedText, setGrammarSelectedText] = useState('')
  const [grammarSubtitleIndex, setGrammarSubtitleIndex] = useState(-1)

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
      const result = await explainVocabulary(selection.text, ctx, settings.numExamples, settings.nativeLanguage)
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

  // Handle grammar click — open dialog with input
  const handleGrammarClick = useCallback(() => {
    if (!selection) return
    // Capture selection data before the dialog opens — handleClickOutside will
    // clear `selection` when the user interacts with the portaled Dialog content
    setGrammarSelectedText(selection.text)
    setGrammarSubtitleIndex(selection.subtitleIndex)
    setGrammarQuestion('')
    setGrammarResult(null)
    setGrammarOpen(true)
  }, [selection])

  // Handle specific question submission
  const handleGrammarSubmit = useCallback(async () => {
    if (!grammarSelectedText || !grammarQuestion.trim()) return

    setGrammarLoading(true)
    setGrammarResult(null)

    try {
      const ctx = getContext(grammarSubtitleIndex)
      const result = await explainGrammar(grammarSelectedText, ctx, grammarQuestion, settings.nativeLanguage)
      setGrammarResult(result)
    } catch {
      setGrammarResult({
        type: 'grammar',
        explanation: 'Error loading explanation. Please try again.',
      })
    } finally {
      setGrammarLoading(false)
    }
  }, [grammarSelectedText, grammarSubtitleIndex, grammarQuestion, getContext])

  // Handle skip — auto-explain everything
  const handleGrammarSkip = useCallback(async () => {
    if (!grammarSelectedText) return

    setGrammarLoading(true)
    setGrammarResult(null)
    setGrammarQuestion('')

    try {
      const ctx = getContext(grammarSubtitleIndex)
      const result = await explainGrammarAuto(grammarSelectedText, ctx, settings.nativeLanguage)
      setGrammarResult(result)
    } catch {
      setGrammarResult({
        type: 'grammar',
        explanation: 'Error loading explanation. Please try again.',
      })
    } finally {
      setGrammarLoading(false)
    }
  }, [grammarSelectedText, grammarSubtitleIndex, getContext])

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
            <div className="space-y-4 overflow-y-auto flex-1">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Definición
                </h4>
                <div className="markdown-content text-sm leading-relaxed">
                  <Markdown>{vocabResult.definition}</Markdown>
                </div>
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
          setGrammarQuestion('')
          setGrammarResult(null)
          setGrammarSelectedText('')
          setGrammarSubtitleIndex(-1)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📙 Gramática
              {grammarSelectedText && (
                <Badge variant="outline" className="text-xs">
                  "{grammarSelectedText}"
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Escribe tu pregunta o salta para una explicación completa
            </DialogDescription>
          </DialogHeader>

          {/* Input section - fixed at top */}
          <div className="space-y-3 shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="¿Qué quieres entender? Ej: ¿Por qué usa presente continuo?"
                value={grammarQuestion}
                onChange={(e) => setGrammarQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !grammarLoading && grammarQuestion.trim()) {
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
              onClick={handleGrammarSkip}
              disabled={grammarLoading}
            >
              ⏭️ Saltar — explicar todo sobre esta gramática
            </Button>
          </div>

          {/* Result section - fills remaining space, scrollable */}
          {grammarLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Consultando IA...</div>
            </div>
          ) : grammarResult ? (
            <div className="flex-1 overflow-y-auto text-sm leading-relaxed markdown-content">
              <Markdown>{grammarResult.explanation}</Markdown>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Escribe una pregunta o haz click en "Saltar" para una explicación completa
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}