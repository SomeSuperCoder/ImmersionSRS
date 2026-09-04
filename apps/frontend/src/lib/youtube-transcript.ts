import { Innertube } from 'youtubei.js'

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

export async function fetchSubtitles(
  videoId: string,
  _lang = 'es',
): Promise<Subtitle[]> {
  try {
    const yt = await Innertube.create()
    const info = await yt.getInfo(videoId)
    const transcriptInfo = await info.getTranscript()

    if (!transcriptInfo?.transcript?.content?.body?.initial_segments) {
      console.warn('No transcript segments found')
      return []
    }

    const segments = transcriptInfo.transcript.content.body.initial_segments

    return segments.map((seg: any) => {
      const text = seg.snippet?.text || seg.snippet?.runs?.map((r: any) => r.text).join('') || ''
      const startMs = parseInt(seg.start_ms || '0', 10)
      const endMs = parseInt(seg.end_ms || '0', 10)

      return {
        startTime: startMs / 1000,
        endTime: endMs / 1000,
        text: cleanText(text),
      }
    })
  } catch (error) {
    console.warn('Failed to fetch subtitles:', error)
    return []
  }
}
