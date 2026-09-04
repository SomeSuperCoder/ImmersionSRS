import { Module } from '@nestjs/common'
import { SubtitlesModule } from './subtitles/subtitles.module.js'

@Module({
  imports: [SubtitlesModule],
})
export class AppModule {}
