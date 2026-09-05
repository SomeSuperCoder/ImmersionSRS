import { Injectable } from '@nestjs/common'
import { proxyFetch } from '../proxy-fetch.js'
import { appLogger } from '../logger/logger.module.js'

// WHY: Interfaces define the contract for AI explain requests.
// Separating vocabulary and grammar into a discriminated union keeps type safety clean.

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

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
    const contextBlock = [
      req.context.prevLine && `Previous: "${req.context.prevLine}"`,
      `Current: "${req.context.currentLine}"`,
      req.context.nextLine && `Next: "${req.context.nextLine}"`,
      req.context.videoTitle && `Video: "${req.context.videoTitle}"`,
    ].filter(Boolean).join('\n')

    if (req.type === 'vocabulary') {
      return [
        {
          role: 'system',
          content: `You are a language tutor. The user is watching a video and wants to understand a word in context.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "word": "the selected word",
  "definition": "clear contextual definition of the word as used in this sentence",
  "examples": ["3-5 example sentences using the same word with the same meaning, each in a different realistic context"]
}

Be concise. The definition should match how the word is used in THIS specific context, not all possible meanings.`,
        },
        {
          role: 'user',
          content: `Context:\n${contextBlock}\n\nSelected word/phrase: "${req.selectedText}"\n\nExplain this word in this context.`,
        },
      ]
    }

    // Grammar type
    return [
      {
        role: 'system',
        content: `You are a language tutor. The user is watching a video and has a grammar question about a sentence. Explain clearly and concisely in plain text. Use examples if helpful. Answer in the same language as the question.`,
      },
      {
        role: 'user',
        content: `Context:\n${contextBlock}\n\nUser question: "${req.question}"`,
      },
    ]
  }

  private parseVocabulary(content: string, selectedText: string): any {
    try {
      // WHY: AI may wrap JSON in markdown code fences — extract the raw JSON object.
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { type: 'vocabulary', ...parsed }
      }
    } catch {
      appLogger.warn({ content }, 'Failed to parse vocabulary JSON')
    }

    // Fallback: return raw content as definition
    return {
      type: 'vocabulary',
      word: selectedText,
      definition: content,
      examples: [],
    }
  }
}
