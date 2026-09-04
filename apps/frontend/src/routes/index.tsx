import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const id = extractVideoId(url)
    if (id) {
      navigate({ to: '/watch/$videoId', params: { videoId: id } })
    } else {
      setError('URL no válida. Usa una URL de YouTube como: https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold text-center">YouTube Player</h1>

        <Card>
          <CardHeader>
            <CardTitle>Ingresa una URL de YouTube</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Reproducir</Button>
            </form>
            {error && (
              <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}