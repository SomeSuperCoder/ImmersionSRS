import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from './logger/logger.module.js'
import { SubtitlesModule } from './subtitles/subtitles.module.js'
import { AiModule } from './ai/ai.module.js'
import { SettingsModule } from './settings/settings.module.js'
import path from 'path'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.resolve(process.cwd(), '..', '..', '.env'),
    }),
    LoggerModule,
    SubtitlesModule,
    AiModule,
    SettingsModule,
  ],
})
export class AppModule {}
