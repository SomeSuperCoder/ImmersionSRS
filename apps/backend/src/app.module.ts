import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from './logger/logger.module.js'
import { SubtitlesModule } from './subtitles/subtitles.module.js'
import { AiModule } from './ai/ai.module.js'
import { SettingsModule } from './settings/settings.module.js'

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule,
    SubtitlesModule,
    AiModule,
    SettingsModule,
  ],
})
export class AppModule {}
