import { Controller, Get, Query } from '@nestjs/common'
import { SubtitlesService } from './subtitles.service.js'
import { appLogger } from '../logger/logger.module.js'

// WHY: Replaced NestJS `new Logger(SubtitlesController.name)` with appLogger.
// Consistent logging across all services — pino writes to files, not just console.

@Controller('api/subtitles')
export class SubtitlesController {
  constructor(private readonly subtitlesService: SubtitlesService) {}

  @Get()
  async getSubtitles(
    @Query('v') videoId: string,
    @Query('lang') lang?: string,
  ) {
    appLogger.info({ videoId, lang }, 'GET /api/subtitles')

    if (!videoId) {
      appLogger.warn('Missing video ID parameter')
      return { error: 'Missing video ID' }
    }

    const result = await this.subtitlesService.getSubtitles(videoId, lang || 'es')
    appLogger.info({ videoId, count: Array.isArray(result) ? result.length : 0 }, 'Returning subtitles')
    return result
  }
}
