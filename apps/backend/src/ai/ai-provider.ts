import * as fs from 'fs'
import * as path from 'path'
import { proxyFetch } from '../proxy-fetch.js'
import { appLogger } from '../logger/logger.module.js'
import type { ChatMessage } from './prompts.js'

export interface ChatProvider {
  name: string
  chat(messages: ChatMessage[]): Promise<string>
}

export interface ProviderConfig {
  groqApiKey?: string
  opencodeModel?: string
}

// ============================================================================
// Groq Provider (primary)
// ============================================================================

export class GroqProvider implements ChatProvider {
  name = 'groq'
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'qwen/qwen3.6-27b') {
    if (!apiKey) {
      throw new Error('[AI] Groq API key is required')
    }
    this.apiKey = apiKey
    this.model = model
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = new Error(`Groq API error: ${response.status} ${response.statusText}`)
      // Re-throw as-is so caller can distinguish (e.g., rate limit 429)
      throw error
    }

    const data = await response.json() as any
    return data.choices?.[0]?.message?.content ?? ''
  }
}

// ============================================================================
// OpenCode Zen Provider (fallback)
// ============================================================================

export class OpenCodeZenProvider implements ChatProvider {
  name = 'opencode_zen'
  private model: string

  constructor(model = 'big-pickle') {
    this.model = model
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await proxyFetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'opencode/1.18.15',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
      }),
    })

    const data = await response.json() as any
    return data.choices?.[0]?.message?.content ?? ''
  }
}

// ============================================================================
// Fallback Chain — tries providers in order, tracks failures
// ============================================================================

export class FallbackChain {
  private providers: ChatProvider[]
  private fallbackCounts: Record<string, number>
  private fallbacksPath: string

  constructor(providers: ChatProvider[]) {
    this.providers = providers
    this.fallbackCounts = { groq: 0, opencode_zen: 0 }
    this.fallbacksPath = path.resolve(process.cwd(), 'fallbacks.json')
    this.loadFallbacks()
  }

  async chat(messages: ChatMessage[]): Promise<{ result: string; provider: string }> {
    let lastError: Error | null = null

    for (const provider of this.providers) {
      try {
        const result = await provider.chat(messages)
        return { result, provider: provider.name }
      } catch (err) {
        lastError = err as Error
        console.warn(`[AI] Provider ${provider.name} failed: ${lastError.message}`)

        // Count this as a fallback (failure that triggers replacement)
        if (this.fallbackCounts[provider.name] !== undefined) {
          this.fallbackCounts[provider.name]++
          this.saveFallbacks()
        }
      }
    }

    throw lastError || new Error('All providers failed')
  }

  // Expose counts for observability / admin endpoint
  getFallbackCounts(): Record<string, number> {
    return { ...this.fallbackCounts }
  }

  private loadFallbacks() {
    try {
      const data = fs.readFileSync(this.fallbacksPath, 'utf-8')
      this.fallbackCounts = JSON.parse(data)
    } catch {
      // File doesn't exist yet, use defaults
    }
  }

  private saveFallbacks() {
    try {
      fs.writeFileSync(this.fallbacksPath, JSON.stringify(this.fallbackCounts, null, 2))
    } catch (err) {
      console.error('[AI] Failed to save fallback counts:', err)
    }
  }
}