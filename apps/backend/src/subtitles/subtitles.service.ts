import { Injectable, Logger } from '@nestjs/common'
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
  private readonly logger = new Logger(SubtitlesService.name)

  async getSubtitles(videoId: string, lang = 'es'): Promise<Subtitle[]> {
    this.logger.log(`Fetching subtitles for videoId=${videoId} lang=${lang}`)

    try {
      this.logger.debug(`Calling YoutubeTranscript.fetchTranscript(${videoId}, { lang: ${lang} })`)
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang })
      this.logger.log(`Received ${transcript.length} transcript segments for lang=${lang}`)

      const subtitles = transcript.map((item) => ({
        startTime: item.offset / 1000,
        endTime: (item.offset + item.duration) / 1000,
        text: cleanText(item.text),
      }))

      this.logger.debug(`Mapped ${subtitles.length} subtitles, first: ${JSON.stringify(subtitles[0])}`)
      return subtitles
    } catch (error) {
      this.logger.warn(`Failed to fetch subtitles for lang=${lang}: ${error}`)

      if (lang !== 'en') {
        this.logger.log(`Falling back to English subtitles`)
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
          this.logger.log(`Received ${transcript.length} English transcript segments`)

          return transcript.map((item) => ({
            startTime: item.offset / 1000,
            endTime: (item.offset + item.duration) / 1000,
            text: cleanText(item.text),
          }))
        } catch (fallbackError) {
          this.logger.error(`English fallback also failed: ${fallbackError}`)
          return []
        }
      }

      this.logger.error(`No subtitles available: ${error}`)
      return []
    }
  }
}
