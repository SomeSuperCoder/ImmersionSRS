import { Controller, Get, Query } from '@nestjs/common'
import { SubtitlesService } from './subtitles.service.js'

@Controller('api/subtitles')
export class SubtitlesController {
  constructor(private readonly subtitlesService: SubtitlesService) {}

  @Get()
  async getSubtitles(
    @Query('v') videoId: string,
    @Query('lang') lang?: string,
  ) {
    if (!videoId) {
      return { error: 'Missing video ID' }
    }
    return this.subtitlesService.getSubtitles(videoId, lang || 'es')
  }
}
