import { Injectable } from '@nestjs/common'
import { proxyFetch } from '../proxy-fetch.js'
import { appLogger } from '../logger/logger.module.js'
import { vocabularyPrompt, grammarPrompt, type ChatMessage } from './prompts.js'

export interface AiRequest {
  type: 'vocabulary' | 'grammar'
  selectedText: string
  context: {
    prevLine: string
    currentLine: string
    nextLine: string
    videoTitle: string
  }
  question?: string
  numExamples?: number
}

@Injectable()
export class AiService {
  private readonly apiUrl = 'https://opencode.ai/zen/v1/chat/completions'

  async explain(req: AiRequest): Promise<any> {
    const messages = this.buildMessages(req)
    appLogger.info({ type: req.type, selectedText: req.selectedText }, 'AI explain request')

    try {
      const response = await proxyFetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'opencode/1.18.15',
        },
        body: JSON.stringify({
          model: 'big-pickle',
          messages,
          temperature: 0.7,
        }),
      })

      const data = await response.json() as any
      const content = data.choices?.[0]?.message?.content ?? ''

      appLogger.info({ type: req.type, responseLength: content.length }, 'AI response received')

      if (req.type === 'vocabulary') {
        return this.parseVocabulary(content, req.selectedText)
      }

      return { type: 'grammar', explanation: content }
    } catch (error) {
      appLogger.error({ error: String(error) }, 'AI API call failed')
      throw error
    }
  }

  private buildMessages(req: AiRequest): ChatMessage[] {
    if (req.type === 'vocabulary') {
      return vocabularyPrompt(req.selectedText, req.context, req.numExamples)
    }
    return grammarPrompt(req.selectedText, req.context, req.question ?? '')
  }

  private parseVocabulary(content: string, selectedText: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { type: 'vocabulary', ...parsed }
      }
    } catch {
      appLogger.warn({ content }, 'Failed to parse vocabulary JSON')
    }

    return {
      type: 'vocabulary',
      word: selectedText,
      definition: content,
      examples: [],
    }
  }
}
