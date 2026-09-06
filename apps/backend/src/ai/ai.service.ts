import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { appLogger } from '../logger/logger.module.js'
import { vocabularyPrompt, grammarPrompt, grammarAutoPrompt, type ChatMessage } from './prompts.js'
import { GroqProvider, OpenCodeZenProvider, FallbackChain } from './ai-provider.js'

export interface AiRequest {
  type: 'vocabulary' | 'grammar' | 'grammar_auto'
  selectedText: string
  context: {
    prevLine: string
    currentLine: string
    nextLine: string
    videoTitle: string
  }
  question?: string
  numExamples?: number
  nativeLanguage?: string
  explanationLevel?: string
}

@Injectable()
export class AiService implements OnModuleInit {
  private chain!: FallbackChain

  constructor(private config: ConfigService) {}

  onModuleInit() {
    // Groq ALWAYS first — if no API key, chat() throws → fallback to OpenCode
    const groqKey = this.config.get<string>('GROQ_API_KEY')
    const providers: any[] = [new GroqProvider(groqKey)]

    // OpenCode Zen as fallback
    const opencodeModel = this.config.get<string>('OPENCODE_ZEN_MODEL') ?? 'big-pickle'
    providers.push(new OpenCodeZenProvider(opencodeModel))

    this.chain = new FallbackChain(providers)
    appLogger.info({ groq: !!groqKey, opencodeModel }, 'AI providers initialized')
  }

  async explain(req: AiRequest): Promise<any> {
    const messages = this.buildMessages(req)
    appLogger.info({ type: req.type, selectedText: req.selectedText }, 'AI explain request')

    try {
      const { result: content, provider } = await this.chain.chat(messages)
      appLogger.info({ type: req.type, responseLength: content.length, provider }, 'AI response received')

      if (req.type === 'vocabulary') {
        return this.parseVocabulary(content, req.selectedText)
      }

      if (req.type === 'grammar_auto') {
        return { type: 'grammar', explanation: content }
      }

      return { type: 'grammar', explanation: content }
    } catch (error) {
      appLogger.error({ error: String(error) }, 'AI API call failed')
      throw error
    }
  }

  private buildMessages(req: AiRequest): ChatMessage[] {
    const lang = req.nativeLanguage ?? 'es'
    const level = req.explanationLevel ?? 'simple'
    if (req.type === 'vocabulary') {
      return vocabularyPrompt(req.selectedText, req.context, req.numExamples, lang)
    }
    if (req.type === 'grammar_auto') {
      return grammarAutoPrompt(req.selectedText, req.context, lang, level)
    }
    return grammarPrompt(req.selectedText, req.context, req.question ?? '', lang, level)
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
