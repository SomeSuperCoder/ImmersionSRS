import { YoutubeTranscript } from 'youtube-transcript'
import type { IncomingMessage, ServerResponse } from 'http'

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

export async function handleSubtitles(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, `http://${req.headers.host}`)
  const videoId = url.searchParams.get('v')
  const lang = url.searchParams.get('lang') || 'es'

  if (!videoId) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Missing video ID' }))
    return
  }

  try {
    // Try requested language first, then English fallback
    let transcript
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang })
    } catch {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
    }

    const subtitles: Subtitle[] = transcript.map((item) => ({
      startTime: item.offset / 1000,
      endTime: (item.offset + item.duration) / 1000,
      text: cleanText(item.text),
    }))

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(JSON.stringify(subtitles))
  } catch (error) {
    console.warn('Subtitle fetch failed:', error)
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(JSON.stringify([]))
  }
}
