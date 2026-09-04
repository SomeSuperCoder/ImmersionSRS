import { Injectable } from '@nestjs/common'
import { YoutubeTranscript } from 'youtube-transcript'
import { appLogger } from '../logger/logger.module.js'
import { proxyFetch } from '../proxy-fetch.js'

// WHY: Replaced NestJS `new Logger(SubtitlesService.name)` with appLogger.
// NestJS Logger goes to console only; appLogger writes to files + console.

export interface Subtitle {
  startTime: number
  endTime: number
  text: string
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

@Injectable()
export class SubtitlesService {
  async getSubtitles(videoId: string, lang = 'es'): Promise<Subtitle[]> {
    appLogger.info({ videoId, lang }, 'Fetching subtitles')

    try {
      appLogger.debug({ videoId, lang }, 'Calling YoutubeTranscript.fetchTranscript via proxy')
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang, fetch: proxyFetch })
      appLogger.info({ videoId, lang, count: transcript.length }, 'Received transcript segments')

      const subtitles = transcript.map((item) => ({
        startTime: item.offset / 1000,
        endTime: (item.offset + item.duration) / 1000,
        text: cleanText(item.text),
      }))

      if (subtitles.length > 0) {
        appLogger.debug({ first: subtitles[0] }, 'First subtitle segment')
      }

      return subtitles
    } catch (error) {
      appLogger.warn({ videoId, lang, error: String(error) }, 'Failed to fetch subtitles')

      if (lang !== 'en') {
        appLogger.info({ videoId }, 'Falling back to English')
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en', fetch: proxyFetch })
          appLogger.info({ videoId, count: transcript.length }, 'Received English transcript')

          return transcript.map((item) => ({
            startTime: item.offset / 1000,
            endTime: (item.offset + item.duration) / 1000,
            text: cleanText(item.text),
          }))
        } catch (fallbackError) {
          appLogger.error({ videoId, error: String(fallbackError) }, 'English fallback also failed')
          return []
        }
      }

      appLogger.error({ videoId, error: String(error) }, 'No subtitles available')
      return []
    }
  }
}
