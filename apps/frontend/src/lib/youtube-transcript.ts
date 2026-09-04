export interface Subtitle {
  startTime: number
  endTime: number
  text: string
}

export async function fetchSubtitles(
  videoId: string,
  lang = 'es',
): Promise<Subtitle[]> {
  try {
    const response = await fetch(`/api/subtitles?v=${videoId}&lang=${lang}`)
    if (!response.ok) {
      console.warn('Subtitle API returned', response.status)
      return []
    }
    return await response.json()
  } catch (error) {
    console.warn('Failed to fetch subtitles:', error)
    return []
  }
}
