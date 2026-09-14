import { Controller, Get, Post, Delete, Body, Param, NotFoundException } from '@nestjs/common'
import { FlashcardsService } from './flashcards.service.js'
import { appLogger } from '../logger/logger.module.js'

@Controller('api/flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  create(@Body() body: { word: string; explanation: string; sourceSentence?: string; videoId?: string }) {
    appLogger.info({ word: body.word }, 'POST /api/flashcards')
    return this.flashcardsService.create(body)
  }

  @Get()
  findAll() {
    appLogger.debug('GET /api/flashcards')
    return this.flashcardsService.findAll()
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10)
    appLogger.info({ id: numericId }, 'DELETE /api/flashcards/:id')
    const deleted = this.flashcardsService.remove(numericId)
    if (!deleted) {
      throw new NotFoundException(`Flashcard with id ${numericId} not found`)
    }
    return { success: true }
  }
}
