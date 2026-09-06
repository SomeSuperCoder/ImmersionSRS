import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  fetchSubtitles,
  type Subtitle,
} from '@/lib/youtube-transcript'
import { logger } from '@/lib/logger'
import { SubtitleTooltip } from '@/components/subtitle-tooltip'
import { useSettings } from '@/lib/settings-context'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const Route = createFileRoute('/watch/$videoId')({
  component: Watch,
})

function Watch() {
  const { videoId } = useParams({ from: '/watch/$videoId' })
  const { settings } = useSettings()
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const subtitleListRef = useRef<HTMLDivElement>(null)
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [isLoadingSubs, setIsLoadingSubs] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)

  // Fetch real subtitles
  useEffect(() => {
    const lang = settings.learnedLanguage || 'es'
    logger.info('Watch', `Fetching subtitles for videoId=${videoId}, lang=${lang}`)
    setIsLoadingSubs(true)

    fetchSubtitles(videoId, lang)
      .then((subs) => {
        logger.info('Watch', `Loaded ${subs.length} subtitle segments`, { videoId, count: subs.length })
        setSubtitles(subs)
        setIsLoadingSubs(false)
      })
      .catch((err) => {
        logger.error('Watch', `Failed to fetch subtitles: ${err}`, { videoId, error: String(err) })
        setIsLoadingSubs(false)
      })
  }, [videoId, settings.learnedLanguage])

  // Reset current index when subtitles change
  useEffect(() => {
    setCurrentIndex(-1)
  }, [subtitles])

  // Load YouTube IFrame API
  useEffect(() => {
    logger.info('Watch', `Loading YouTube IFrame API for videoId=${videoId}`)

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      logger.info('Watch', 'YouTube IFrame API ready, creating player')
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
      const idx = subtitles.findIndex(
        (s) => currentTime >= s.startTime && currentTime < s.endTime,
      )
      setCurrentIndex(idx)
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, subtitles])

  // Autoscroll to active subtitle
  useEffect(() => {
    if (currentIndex < 0) return
    const el = document.getElementById(`sub-${currentIndex}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentIndex])

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <a
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver
        </a>

        {/* Main content: video + subtitles side by side */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Video — 75% on desktop */}
          <div className="lg:w-[75%] shrink-0">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video">
                  <div ref={containerRef} className="h-full w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subtitle list — 25% on desktop, scrollable */}
          <div className="lg:w-[25%] lg:min-h-0">
            <Card className="lg:h-full">
              <CardContent className="p-0">
                <SubtitleTooltip
                  subtitles={subtitles}
                  videoTitle={`Video ${videoId}`}
                >
                  {isLoadingSubs ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-sm text-muted-foreground">
                        Cargando subtítulos...
                      </p>
                    </div>
                  ) : subtitles.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-sm text-muted-foreground">
                        No hay subtítulos disponibles
                      </p>
                    </div>
                  ) : (
                    <div
                      ref={subtitleListRef}
                      className="lg:h-[calc(100vh-200px)] overflow-y-auto scroll-smooth"
                    >
                      {subtitles.map((sub, i) => {
                        const isActive = i === currentIndex
                        return (
                          <div
                            key={i}
                            id={`sub-${i}`}
                            data-subtitle-index={i}
                            className={`px-4 py-3 text-sm transition-colors duration-150 cursor-pointer hover:bg-muted/50 select-text ${
                              isActive
                                ? 'bg-primary/10 text-foreground font-medium border-l-2 border-primary'
                                : 'text-muted-foreground'
                            } ${i < subtitles.length - 1 ? 'border-b border-border' : ''}`}
                          >
                            <span className="text-[10px] tabular-nums text-muted-foreground mr-2 select-none">
                              {formatTime(sub.startTime)}
                            </span>
                            {sub.text}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </SubtitleTooltip>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
