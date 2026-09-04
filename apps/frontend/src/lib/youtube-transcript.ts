import { logger } from './logger'

export interface Subtitle {
  startTime: number
  endTime: number
  text: string
}

export async function fetchSubtitles(
  videoId: string,
  lang = 'es',
): Promise<Subtitle[]> {
  const url = `http://localhost:3000/api/subtitles?v=${videoId}&lang=${lang}`
  logger.info('Subtitles', `Fetching from backend: ${url}`)

  try {
    const response = await fetch(url)
    logger.info('Subtitles', `Backend responded with status ${response.status}`)

    if (!response.ok) {
      logger.warn('Subtitles', `Backend returned non-OK status: ${response.status}`)
      return []
    }

    const data = await response.json()
    logger.info('Subtitles', `Received ${Array.isArray(data) ? data.length : 0} subtitles from backend`)
    return data
  } catch (error) {
    logger.error('Subtitles', `Fetch failed: ${error}`, { url, error: String(error) })
    return []
  }
}
