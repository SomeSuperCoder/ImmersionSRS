import { Injectable } from '@nestjs/common'
import { db } from '../db/index.js'
import { userSettings } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { appLogger } from '../logger/logger.module.js'

export interface UserSettings {
  nativeLanguage: string
  learnedLanguage: string
  numExamples: number
}

@Injectable()
export class SettingsService {
  getSettings(): UserSettings {
    const rows = db.select().from(userSettings).where(eq(userSettings.id, 1)).all()
    const row = rows[0]
    if (!row) {
      return { nativeLanguage: 'es', learnedLanguage: 'en', numExamples: 3 }
    }
    return {
      nativeLanguage: row.nativeLanguage,
      learnedLanguage: row.learnedLanguage,
      numExamples: row.numExamples,
    }
  }

  updateSettings(partial: Partial<UserSettings>): UserSettings {
    const current = this.getSettings()
    const updated = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    }

    db.update(userSettings)
      .set({
        nativeLanguage: updated.nativeLanguage,
        learnedLanguage: updated.learnedLanguage,
        numExamples: updated.numExamples,
        updatedAt: updated.updatedAt,
      })
      .where(eq(userSettings.id, 1))
      .run()

    appLogger.info({ settings: updated }, 'Settings updated')
    return updated
  }
}
