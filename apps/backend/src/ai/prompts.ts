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
  nativeLanguage: string = 'es',
  explanationLevel: string = 'simple',
): ChatMessage[] {
  const contextBlock = buildContextBlock(ctx)

  const levelInstructions = explanationLevel === 'profound'
    ? `Provide a PROFOUND analysis: etymology, morphological breakdown, register/formality, dialectal variations, usage frequency, collocations. Use linguistic terminology.`
    : `Keep it SIMPLE and practical. Explain like talking to a friend learning the language. Focus on: what it means, how to use it, common mistakes. Short paragraphs. No jargon.`

  return [
    {
      role: 'system',
      content: `You are a language tutor. The user's native language is ${nativeLanguage}. The user is watching a video and wants to understand a word in context.

${levelInstructions}

Respond ONLY with valid JSON (no markdown, no code fences). Answer in ${nativeLanguage}:
{
  "word": "the infinitive (base form) of the selected word",
  "selectedForm": "the exact word the user selected",
  "definition": "the selected form's meaning and grammatical role in this context",
  "infinitiveDefinition": "the infinitive's basic meaning and conjugation class",
  "examples": ["${numExamples} example sentences using the same word with the same meaning, each in a different realistic context"]
}

Rules:
- The "word" field MUST be the infinitive (base form) of the selected word.
- The "selectedForm" field is the exact word the user selected.
- The "definition" field explains the selected form's meaning in context.
- The "infinitiveDefinition" field explains the infinitive's basic meaning.
- If the selected word is already an infinitive, set selectedForm equal to word and provide one combined definition.`,
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
  nativeLanguage: string = 'es',
  explanationLevel: string = 'simple',
): ChatMessage[] {
  const contextBlock = buildContextBlock(ctx)

  const levelInstructions = explanationLevel === 'profound'
    ? `Provide a PROFOUND linguistic analysis: etymology, morphological breakdown, syntactic role, comparison with related structures, register/formality level, dialectal variations. Use linguistic terminology.`
    : `Keep it SIMPLE and practical. Explain like talking to a friend learning the language. Focus on: what it means, how to use it, 1-2 common mistakes. No linguistic jargon. Short paragraphs.`

  return [
    {
      role: 'system',
      content: `You are a language tutor. The user's native language is ${nativeLanguage}. Answer in ${nativeLanguage}.

${levelInstructions}

Be concise. No unnecessary filler.`,
    },
    {
      role: 'user',
      content: `Context:\n${contextBlock}\n\nQuestion: "${question}"`,
    },
  ]
}

// ---------------------------------------------------------------------------
// GRAMMAR AUTO (no user question — AI explains everything)
// ---------------------------------------------------------------------------

export function grammarAutoPrompt(
  selectedText: string,
  ctx: PromptContext,
  nativeLanguage: string = 'es',
  explanationLevel: string = 'simple',
): ChatMessage[] {
  const contextBlock = buildContextBlock(ctx)

  const levelInstructions = explanationLevel === 'profound'
    ? `Provide PROFOUND linguistic analysis: etymology, morphological breakdown, syntactic function, paradigm, register, dialectal variants. Use linguistic terminology. Be thorough.`
    : `Keep it SIMPLE. Explain like a helpful friend. Cover: what it means, how to use it, 1-2 common mistakes. Short. Practical. No jargon.`

  return [
    {
      role: 'system',
      content: `You are a language tutor. Native language: ${nativeLanguage}. Answer in ${nativeLanguage}.

${levelInstructions}

Be concise. Maximum 200 words.`,
    },
    {
      role: 'user',
      content: `Context:\n${contextBlock}\n\nPhrase: "${selectedText}"`,
    },
  ]
}
