import { Controller, Get, Put, Body } from '@nestjs/common'
import { SettingsService } from './settings.service.js'
import { appLogger } from '../logger/logger.module.js'

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    appLogger.debug('GET /api/settings')
    return this.settingsService.getSettings()
  }

  @Put()
  updateSettings(@Body() body: any) {
    appLogger.info({ body }, 'PUT /api/settings')
    return this.settingsService.updateSettings(body)
  }
}
