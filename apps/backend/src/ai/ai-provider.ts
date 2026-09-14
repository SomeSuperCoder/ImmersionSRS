import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import { proxyFetch } from '../proxy-fetch.js'
import { appLogger } from '../logger/logger.module.js'
import type { ChatMessage } from './prompts.js'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Strip `<think>...</think>` tags from AI responses (Qwen models emit these). */
export function stripThinkingTags(content: string): string {
  // First pass: remove properly closed <think>...</think> blocks
  let result = content.replace(/<think>[\s\S]*?<\/think>/g, '')
  // Second pass: remove unclosed <think> blocks (from opening tag to end of string)
  result = result.replace(/<think>[\s\S]*$/g, '')
  return result.trim()
}

/** Strip markdown code blocks from AI responses (models often wrap JSON in ```json...```). */
function stripMarkdownCodeBlocks(content: string): string {
  return content.replace(/^```(?:json)?\n/gm, '').replace(/\n```$/gm, '').trim()
}

/** Escape a string for safe use in a shell double-quoted argument. */
function shellEscape(str: string): string {
  // Replace backslash, double-quote, dollar, and backtick with escaped versions
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`')
}

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

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey ?? ''
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('No GROQ_API_KEY configured')
    }

    // Groq REQUIRES the proxy from this network — use proxyFetch
    const response = await proxyFetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-27b',
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      appLogger.error({ status: response.status, body: errorBody }, '[Groq] API error')
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as any
    return stripThinkingTags(data.choices?.[0]?.message?.content ?? '')
  }
}

// ============================================================================
// OpenCode CLI Provider (fallback)
// ============================================================================

export class OpenCodeCLIProvider implements ChatProvider {
  name = 'opencode_cli'
  private static readonly MAX_RETRIES = 2
  private static readonly TIMEOUT_MS = 60_000

  async chat(messages: ChatMessage[]): Promise<string> {
    if (messages.length === 0) {
      throw new Error('[OpenCodeCLI] Empty messages array')
    }

    // Extract system messages and join them
    const systemMessages = messages.filter(m => m.role === 'system')
    const systemPrompt = systemMessages.length > 0
      ? systemMessages.map(m => m.content).join('\n')
      : ''

    // Extract the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) {
      throw new Error('[OpenCodeCLI] No user message found in messages array')
    }

    // Build the combined prompt: embed system prompt if present
    const prompt = systemPrompt
      ? `[SYSTEM]\n${systemPrompt}\n\n[MESSAGE]\n${lastUserMsg.content}`
      : lastUserMsg.content

    const escapedPrompt = shellEscape(prompt)

    // Resolve the opencode config path relative to the compiled output (dist/ai/)
    const configPath = path.resolve(__dirname, '../../../../container/opencode.json')

    let lastRawOutput = ''

    for (let attempt = 0; attempt <= OpenCodeCLIProvider.MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        appLogger.warn(
          { attempt, maxRetries: OpenCodeCLIProvider.MAX_RETRIES },
          '[OpenCodeCLI] Retrying after failure'
        )
      }

      try {
        appLogger.debug({ configPath, attempt }, '[OpenCodeCLI] Running opencode run')

        const { stdout } = await execAsync(
          `opencode run --format json -m opencode/big-pickle "${escapedPrompt}"`,
          {
            env: {
              ...process.env,
              OPENCODE_CONFIG: configPath,
              OPENCODE_DISABLE_PROJECT_CONFIG: 'true',
            },
            encoding: 'utf-8',
            timeout: OpenCodeCLIProvider.TIMEOUT_MS,
          }
        )
        lastRawOutput = stdout

        // Parse newline-delimited JSON events, concatenate all text events
        const lines = lastRawOutput.trim().split('\n')
        const textChunks: string[] = []

        for (const line of lines) {
          try {
            const event = JSON.parse(line)
            if (event.type === 'text' && event.part?.text) {
              textChunks.push(event.part.text)
            }
          } catch {
            // Skip non-JSON lines (e.g. stderr output, partial writes)
          }
        }

        if (textChunks.length === 0) {
          throw new Error(
            `[OpenCodeCLI] No text events found in output (${lines.length} lines parsed)`
          )
        }

        const combined = textChunks.join('')
        return stripMarkdownCodeBlocks(stripThinkingTags(combined))

      } catch (err) {
        const isLastAttempt = attempt === OpenCodeCLIProvider.MAX_RETRIES
        const errorMessage = err instanceof Error ? err.message : String(err)

        appLogger.warn(
          { attempt, error: errorMessage, isLastAttempt },
          '[OpenCodeCLI] Attempt failed'
        )

        if (isLastAttempt) {
          throw new Error(
            `[OpenCodeCLI] All ${OpenCodeCLIProvider.MAX_RETRIES + 1} attempts failed. ` +
            `Last error: ${errorMessage}\nRaw output:\n${lastRawOutput}`
          )
        }
      }
    }

    // Unreachable — TypeScript needs this for the return type
    throw new Error('[OpenCodeCLI] Unexpected: exhausted retry loop without throw')
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
    this.fallbacksPath = path.resolve(process.cwd(), 'fallbacks.json')
    appLogger.info({ path: this.fallbacksPath }, '[FallbackChain] Initializing')
    this.loadFallbacks()
    this.saveFallbacks() // ensure file always exists
  }

  async chat(messages: ChatMessage[]): Promise<{ result: string; provider: string }> {
    let lastError: Error | null = null

    for (const provider of this.providers) {
      try {
        const result = await provider.chat(messages)
        return { result, provider: provider.name }
      } catch (err) {
        lastError = err as Error
        appLogger.warn({ provider: provider.name, error: lastError.message }, '[FallbackChain] Provider failed')

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
      const loaded = JSON.parse(data)
      // Merge with defaults so new providers get counted
      this.fallbackCounts = { groq: 0, opencode_cli: 0, ...loaded }
    } catch {
      // File doesn't exist yet, use defaults
      this.fallbackCounts = { groq: 0, opencode_cli: 0 }
    }
  }

  private saveFallbacks() {
    try {
      fs.writeFileSync(this.fallbacksPath, JSON.stringify(this.fallbackCounts, null, 2))
      appLogger.debug({ path: this.fallbacksPath, counts: this.fallbackCounts }, '[FallbackChain] Saved fallback counts')
    } catch (err) {
      appLogger.error({ path: this.fallbacksPath, error: String(err) }, '[FallbackChain] Failed to save fallback counts')
    }
  }
}