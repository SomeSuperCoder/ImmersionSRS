// ============================================================================
// AI PROMPTS — Single Source of Truth
// ============================================================================
// Every AI prompt in the application lives here.
// Edit prompts here only — the service imports from this file.
//
// Conventions:
// - Each export is a function that receives context and returns messages[]
// - Templates use tagged template literals for readability
// - Context blocks are built with buildContextBlock()
// ============================================================================

export interface PromptContext {
  prevLine: string
  currentLine: string
  nextLine: string
  videoTitle: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function buildContextBlock(ctx: PromptContext): string {
  return [
    ctx.prevLine && `Previous: "${ctx.prevLine}"`,
    `Current: "${ctx.currentLine}"`,
    ctx.nextLine && `Next: "${ctx.nextLine}"`,
    ctx.videoTitle && `Video: "${ctx.videoTitle}"`,
  ]
    .filter(Boolean)
    .join('\n')
}

// ---------------------------------------------------------------------------
// VOCABULARY
// ---------------------------------------------------------------------------

export function vocabularyPrompt(
  selectedText: string,
  ctx: PromptContext,
  numExamples: number = 3,
): ChatMessage[] {
  const contextBlock = buildContextBlock(ctx)

  return [
    {
      role: 'system',
      content: `You are a language tutor. The user is watching a video and wants to understand a word in context.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "word": "the selected word",
  "definition": "clear contextual definition of the word as used in this sentence",
  "examples": ["${numExamples} example sentences using the same word with the same meaning, each in a different realistic context"]
}

Be concise. The definition should match how the word is used in THIS specific context, not all possible meanings.`,
    },
    {
      role: 'user',
      content: `Context:\n${contextBlock}\n\nSelected word/phrase: "${selectedText}"\n\nExplain this word in this context. Provide exactly ${numExamples} example sentences.`,
    },
  ]
}

// ---------------------------------------------------------------------------
// GRAMMAR
// ---------------------------------------------------------------------------

export function grammarPrompt(
  selectedText: string,
  ctx: PromptContext,
  question: string,
): ChatMessage[] {
  const contextBlock = buildContextBlock(ctx)

  return [
    {
      role: 'system',
      content: `You are a language tutor. The user is watching a video and has a grammar question about a sentence. Explain clearly and concisely in plain text. Use examples if helpful. Answer in the same language as the question.`,
    },
    {
      role: 'user',
      content: `Context:\n${contextBlock}\n\nUser question: "${question}"`,
    },
  ]
}

// ---------------------------------------------------------------------------
// GRAMMAR AUTO (no user question — AI explains everything)
// ---------------------------------------------------------------------------

export function grammarAutoPrompt(
  selectedText: string,
  ctx: PromptContext,
): ChatMessage[] {
  const contextBlock = buildContextBlock(ctx)

  return [
    {
      role: 'system',
      content: `You are a language tutor. The user is watching a video and selected a phrase they don't fully understand. They haven't asked a specific question — your job is to explain EVERYTHING they might not understand about this grammar.

Cover ALL of the following as relevant:
- Tense and why it's used here
- Conjugation details
- Any irregular forms
- How this grammar pattern works in general
- How to form similar sentences
- Common mistakes learners make with this pattern
- 2-3 usage examples in different contexts

Be thorough but organized. Use headers or bullet points for readability. Answer in the same language as the selected text's context.`,
    },
    {
      role: 'user',
      content: `Context:\n${contextBlock}\n\nSelected phrase: "${selectedText}"\n\nExplain everything about this grammar that a language learner might not understand.`,
    },
  ]
}
