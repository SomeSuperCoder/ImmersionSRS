import { Injectable } from '@nestjs/common'
import { db } from '../db/index.js'
import { flashcards } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'
import { appLogger } from '../logger/logger.module.js'

export interface CreateFlashcardDto {
  word: string
  explanation: string
  sourceSentence?: string
  videoId?: string
}

export interface Flashcard {
  id: number
  word: string
  explanation: string
  sourceSentence: string | null
  videoId: string | null
  createdAt: string
}

@Injectable()
export class FlashcardsService {
  create(dto: CreateFlashcardDto): Flashcard {
    const result = db.insert(flashcards).values({
      word: dto.word,
      explanation: dto.explanation,
      sourceSentence: dto.sourceSentence ?? null,
      videoId: dto.videoId ?? null,
      createdAt: new Date().toISOString(),
    }).returning().get()

    appLogger.info({ id: result.id, word: dto.word }, 'Flashcard created')
    return result
  }

  findAll(): Flashcard[] {
    return db.select().from(flashcards).orderBy(desc(flashcards.createdAt)).all()
  }

  remove(id: number): boolean {
    const result = db.delete(flashcards).where(eq(flashcards.id, id)).run()
    const found = result.changes > 0
    if (found) {
      appLogger.info({ id }, 'Flashcard deleted')
    }
    return found
  }
}
