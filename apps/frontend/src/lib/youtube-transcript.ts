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

export async function fetchSubtitles(
  videoId: string,
  lang = 'es',
): Promise<Subtitle[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang })

    return transcript.map((item) => ({
      startTime: item.offset / 1000, // ms → seconds
      endTime: (item.offset + item.duration) / 1000,
      text: cleanText(item.text),
    }))
  } catch {
    // Fallback to English if Spanish not available
    if (lang !== 'en') {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: 'en',
        })
        return transcript.map((item) => ({
          startTime: item.offset / 1000,
          endTime: (item.offset + item.duration) / 1000,
          text: cleanText(item.text),
        }))
      } catch {
        console.warn('No subtitles available for this video')
        return []
      }
    }
    console.warn('No subtitles available for this video')
    return []
  }
}
