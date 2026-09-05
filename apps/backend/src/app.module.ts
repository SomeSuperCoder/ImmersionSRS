import { Module } from '@nestjs/common'
import { LoggerModule } from './logger/logger.module.js'
import { SubtitlesModule } from './subtitles/subtitles.module.js'
import { AiModule } from './ai/ai.module.js'
import { SettingsModule } from './settings/settings.module.js'

@Module({
  imports: [LoggerModule, SubtitlesModule, AiModule, SettingsModule],
})
export class AppModule {}
