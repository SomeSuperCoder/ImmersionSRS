import { Injectable } from '@nestjs/common'
import { YoutubeTranscript } from 'youtube-transcript'

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
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang })
      return transcript.map((item) => ({
        startTime: item.offset / 1000,
        endTime: (item.offset + item.duration) / 1000,
        text: cleanText(item.text),
      }))
    } catch {
      // Fallback to English if requested language fails
      if (lang !== 'en') {
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
          return transcript.map((item) => ({
            startTime: item.offset / 1000,
            endTime: (item.offset + item.duration) / 1000,
            text: cleanText(item.text),
          }))
        } catch {
          return []
        }
      }
      return []
    }
  }
}
