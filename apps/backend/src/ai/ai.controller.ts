import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { AiService } from './ai.service.js'
import { appLogger } from '../logger/logger.module.js'

// WHY: Controller is thin — delegates all logic to AiService.
// Keeps HTTP layer separate from business logic (Single Responsibility).

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('explain')
  @HttpCode(HttpStatus.OK)
  async explain(@Body() body: any) {
    appLogger.info({ type: body.type, selectedText: body.selectedText }, 'POST /api/ai/explain')
    return this.aiService.explain(body)
  }
}
