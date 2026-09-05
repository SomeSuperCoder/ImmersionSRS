import { Module } from '@nestjs/common'
import { SubtitlesModule } from './subtitles/subtitles.module.js'
import { LoggerModule } from './logger/logger.module.js'
import { AiModule } from './ai/ai.module.js'

@Module({
  imports: [LoggerModule, SubtitlesModule, AiModule],
})
export class AppModule {}
