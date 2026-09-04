import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  fetchSubtitles,
  type Subtitle,
} from '@/lib/youtube-transcript'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export const Route = createFileRoute('/watch/$videoId')({
  component: Watch,
})

function Watch() {
  const { videoId } = useParams({ from: '/watch/$videoId' })
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentSubtitle, setCurrentSubtitle] = useState('')
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [isLoadingSubs, setIsLoadingSubs] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  const findSubtitle = useCallback(
    (time: number) => {
      const sub = subtitles.find((s) => time >= s.startTime && time < s.endTime)
      return sub ? sub.text : ''
    },
    [subtitles],
  )

  // Fetch real subtitles
  useEffect(() => {
    setIsLoadingSubs(true)
    fetchSubtitles(videoId, 'es').then((subs) => {
      setSubtitles(subs)
      setIsLoadingSubs(false)
    })
  }, [videoId])

  // Load YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          cc_load_policy: 0,
          cc_lang_pref: 'es',
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            setIsPlaying(event.data === 1)
          },
        },
      })
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy()
      }
    }
  }, [videoId])

  // Subtitle sync loop
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const currentTime = playerRef.current?.getCurrentTime?.() ?? 0
      setCurrentSubtitle(findSubtitle(currentTime))
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, findSubtitle])

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <a
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver
        </a>

        <Card>
          <CardContent className="p-0">
            <div className="aspect-video">
              <div ref={containerRef} className="h-full w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Custom subtitle display — NO OVERFLOW */}
        <div className="mx-auto max-w-3xl text-center px-4">
          <div className="min-h-[3rem] flex items-center justify-center">
            {isLoadingSubs ? (
              <p className="text-sm text-muted-foreground">
                Cargando subtítulos...
              </p>
            ) : (
              <p className="text-base sm:text-lg font-medium text-foreground bg-background/80 px-4 py-2 rounded-md backdrop-blur-sm leading-relaxed break-words overflow-hidden text-ellipsis max-w-full">
                {currentSubtitle || '\u00A0'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
