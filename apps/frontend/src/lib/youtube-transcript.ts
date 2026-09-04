import { YoutubeTranscript } from 'youtube-transcript'

export interface Subtitle {
  startTime: number
  endTime: number
  text: string
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

/**
 * Custom fetch that routes YouTube requests through Vite's proxy
 * to bypass CORS restrictions.
 */
async function proxyFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url

  if (url.startsWith('https://www.youtube.com/')) {
    const relativePath = url.replace('https://www.youtube.com', '/yt-proxy')
    return fetch(relativePath, init)
  }

  return fetch(input, init)
}

async function fetchWithProxy(
  videoId: string,
  lang: string,
): Promise<Subtitle[]> {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
    lang,
    fetch: proxyFetch,
  })

  return transcript.map((item) => ({
    startTime: item.offset / 1000, // ms → seconds
    endTime: (item.offset + item.duration) / 1000,
    text: cleanText(item.text),
  }))
}

export async function fetchSubtitles(
  videoId: string,
  lang = 'es',
): Promise<Subtitle[]> {
  try {
    return await fetchWithProxy(videoId, lang)
  } catch {
    // Fallback to English if Spanish not available
    if (lang !== 'en') {
      try {
        return await fetchWithProxy(videoId, 'en')
      } catch {
        console.warn('No subtitles available for this video')
        return []
      }
    }
    console.warn('No subtitles available for this video')
    return []
  }
}
