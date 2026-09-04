import { Module } from '@nestjs/common'
import { SubtitlesModule } from './subtitles/subtitles.module.js'
import { LoggerModule } from './logger/logger.module.js'

@Module({
  imports: [LoggerModule, SubtitlesModule],
})
export class AppModule {}
