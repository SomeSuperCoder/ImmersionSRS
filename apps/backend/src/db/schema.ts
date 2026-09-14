import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const userSettings = sqliteTable('user_settings', {
  id: integer('id').primaryKey().default(1),
  nativeLanguage: text('native_language').notNull().default('es'),
  learnedLanguage: text('learned_language').notNull().default('en'),
  numExamples: integer('num_examples').notNull().default(3),
  explanationLevel: text('explanation_level').notNull().default('simple'),
  updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
})

export const flashcards = sqliteTable('flashcards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  word: text('word').notNull(),
  explanation: text('explanation').notNull(),
  sourceSentence: text('source_sentence'),
  videoId: text('video_id'),
  createdAt: text('created_at').notNull().default(''),
})
