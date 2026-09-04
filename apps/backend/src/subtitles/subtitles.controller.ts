import { Controller, Get, Query, Logger } from '@nestjs/common'
import { SubtitlesService } from './subtitles.service.js'

@Controller('api/subtitles')
export class SubtitlesController {
  private readonly logger = new Logger(SubtitlesController.name)

  constructor(private readonly subtitlesService: SubtitlesService) {}

  @Get()
  async getSubtitles(
    @Query('v') videoId: string,
    @Query('lang') lang?: string,
  ) {
    this.logger.log(`GET /api/subtitles?v=${videoId}&lang=${lang || 'es'}`)

    if (!videoId) {
      this.logger.warn('Missing video ID parameter')
      return { error: 'Missing video ID' }
    }

    const result = await this.subtitlesService.getSubtitles(videoId, lang || 'es')
    this.logger.log(`Returning ${Array.isArray(result) ? result.length : 0} subtitles`)
    return result
  }
}
