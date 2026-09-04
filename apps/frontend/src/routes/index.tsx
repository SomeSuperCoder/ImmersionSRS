import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: Home,
})

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

function Home() {
  const [url, setUrl] = useState('')
  const [videoId, setVideoId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoaded(false)
    const id = extractVideoId(url)
    if (id) {
      setVideoId(id)
    } else {
      setError('URL no válida. Usa una URL de YouTube como: https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      setVideoId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            YouTube Player
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Pega una URL de YouTube y reproduce el video
          </p>
        </div>

        {/* URL Input Form */}
        <Card className="mb-10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ingresa una URL</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                aria-label="URL de YouTube"
              />
              <Button type="submit" className="sm:w-auto">
                Reproducir
              </Button>
            </form>
            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Video Player or Empty State */}
        {videoId ? (
          <Card className="overflow-hidden shadow-md">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-muted">
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <p className="text-sm">Cargando video…</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                  title="Reproductor de video de YouTube"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={() => setIsLoaded(true)}
                  className="h-full w-full"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
                aria-hidden="true"
              >
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                <path d="m10 15 5-3-5-3z" />
              </svg>
            </div>
            <p className="text-base text-muted-foreground">
              Ingresa una URL de YouTube arriba para comenzar a reproducir
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
