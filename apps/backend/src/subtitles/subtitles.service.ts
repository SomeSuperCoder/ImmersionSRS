import { Injectable } from '@nestjs/common'
import { YoutubeTranscript } from 'youtube-transcript'
import { appLogger } from '../logger/logger.module.js'
import { proxyFetch } from '../proxy-fetch.js'

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

// WHY: Maps common base languages to their regional variants that YouTube actually uses.
// The youtube-transcript library is strict — it throws if the exact code isn't available.
// Videos commonly publish with variants like en-US, pt-BR, es-419 rather than bare 'en'.
const LANGUAGE_FALLBACKS: Record<string, string[]> = {
  es: ['es', 'es-419', 'es-ES', 'es-MX'],
  en: ['en', 'en-US', 'en-GB'],
  pt: ['pt', 'pt-BR', 'pt-PT'],
  fr: ['fr', 'fr-FR'],
  de: ['de', 'de-DE'],
}

// WHY: Unknown languages get a generic two-step fallback: try exact code, then the base language.
// Covers any language not in the hardcoded map without exploding the config.
function getLanguageChain(lang: string): string[] {
  const fallbacks = LANGUAGE_FALLBACKS[lang]
  if (fallbacks) return fallbacks
  const base = lang.split('-')[0]
  return base === lang ? [lang] : [lang, base]
}

@Injectable()
export class SubtitlesService {
  async getSubtitles(videoId: string, lang = 'es'): Promise<Subtitle[]> {
    appLogger.info({ videoId, lang }, 'Fetching subtitles')

    const chain = getLanguageChain(lang)
    appLogger.debug({ videoId, chain }, 'Language fallback chain')

    for (const tryLang of chain) {
      try {
        appLogger.debug({ videoId, lang: tryLang }, 'Trying language')
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: tryLang, fetch: proxyFetch })
        appLogger.info({ videoId, lang: tryLang, count: transcript.length }, 'Received transcript')

        return transcript.map((item) => ({
          startTime: item.offset / 1000,
          endTime: (item.offset + item.duration) / 1000,
          text: cleanText(item.text),
        }))
      } catch (error) {
        appLogger.debug({ videoId, lang: tryLang, error: String(error) }, 'Language not available, trying next')
      }
    }

    appLogger.warn({ videoId, chain }, 'No subtitles found for any language in chain')
    return []
  }
}
