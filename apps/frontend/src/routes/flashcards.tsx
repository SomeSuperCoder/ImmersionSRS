import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFlashcards, deleteFlashcard, type Flashcard } from '@/lib/flashcards-api'

export const Route = createFileRoute('/flashcards')({
  component: Flashcards,
})

function Flashcards() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCards = async () => {
    try {
      setLoading(true)
      setError(null)
      const cards = await getFlashcards()
      setFlashcards(cards)
    } catch {
      setError('Error loading flashcards. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await deleteFlashcard(id)
      setFlashcards((prev) => prev.filter((card) => card.id !== id))
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <a
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver
        </a>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🃏 Flashcards
              {!loading && (
                <Badge variant="secondary" className="text-xs">
                  {flashcards.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                <div className="animate-pulse">Cargando flashcards...</div>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>{error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchCards}>
                  🔄 Reintentar
                </Button>
              </div>
            ) : flashcards.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No hay flashcards aún. ¡Guarda una desde una búsqueda de palabras!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flashcards.map((card) => (
                  <Card key={card.id} size="sm">
                    <CardContent className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{card.word}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {card.explanation}
                        </p>
                        {card.sourceSentence && (
                          <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                            "{card.sourceSentence}"
                          </p>
                        )}
                        {card.videoId && (
                          <a
                            href={`/watch/${card.videoId}`}
                            className="text-xs text-primary hover:underline"
                          >
                            🎬 Ver video
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(card.id)}
                      >
                        🗑️
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
