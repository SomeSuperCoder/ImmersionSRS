import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { type Subtitle, exampleSubtitles } from '@/data/subtitles'

// YouTube Player API types
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
  const [isPlaying, setIsPlaying] = useState(false)

  const findSubtitle = useCallback(
    (time: number) => {
      const sub = exampleSubtitles.find(
        (s: Subtitle) => time >= s.startTime && time < s.endTime,
      )
      return sub ? sub.text : ''
    },
    [],
  )

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          cc_load_policy: 0, // Disable native CC
          cc_lang_pref: 'es',
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1
            setIsPlaying(event.data === 1)
          },
        },
      })
    }

    return () => {
      // Cleanup
      if (playerRef.current?.destroy) {
        playerRef.current.destroy()
      }
    }
  }, [videoId])

  // Subtitle sync loop — only runs when playing
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const currentTime = playerRef.current?.getCurrentTime?.() ?? 0
      setCurrentSubtitle(findSubtitle(currentTime))
    }, 100) // Check every 100ms for smooth sync

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

        {/* Custom subtitle display */}
        <div className="text-center min-h-[3rem] flex items-center justify-center">
          <p className="text-lg font-medium text-foreground bg-background/80 px-4 py-2 rounded-md backdrop-blur-sm">
            {currentSubtitle || '\u00A0'}
          </p>
        </div>
      </div>
    </div>
  )
}
