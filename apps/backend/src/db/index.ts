import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { userSettings } from './schema.js'
import { appLogger } from '../logger/logger.module.js'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.resolve(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'settings.db')
const sqlite = new Database(DB_PATH)
export const db = drizzle(sqlite)

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    native_language TEXT NOT NULL DEFAULT 'es',
    learned_language TEXT NOT NULL DEFAULT 'en',
    num_examples INTEGER NOT NULL DEFAULT 3,
    updated_at TEXT NOT NULL DEFAULT ''
  )
`)

const existing = db.select().from(userSettings).all()
if (existing.length === 0) {
  db.insert(userSettings).values({
    id: 1,
    nativeLanguage: 'es',
    learnedLanguage: 'en',
    numExamples: 3,
    updatedAt: new Date().toISOString(),
  }).run()
  appLogger.info('Seeded default user settings')
}

appLogger.info({ path: DB_PATH }, 'Database initialized')
