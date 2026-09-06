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
    ? `Include etymology, morphological breakdown, register, dialectal variations. Use linguistic terminology.`
    : `Explain simply like a friend. Focus on meaning, usage, common mistakes. No jargon.`

  return [
    {
      role: 'system',
      content: `Language tutor. Native: ${nativeLanguage}. Answer in ${nativeLanguage}. ${levelInstructions}

Return JSON only:
{"word":"infinitive","selectedForm":"selected word","definition":"meaning in context","infinitiveDefinition":"infinitive meaning","examples":["ex1","ex2","ex3"]}

Rules: word=infinitive base form. selectedForm=exact word selected. If already infinitive, selectedForm=word.`,
    },
    {
      role: 'user',
      content: `${contextBlock}\n\n"${selectedText}" — explain, ${numExamples} examples.`,
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
    ? `Linguistic analysis: etymology, morphology, syntax, register, dialects. Use terminology.`
    : `Explain simply like a friend. Meaning, usage, 1-2 common mistakes. No jargon.`

  return [
    {
      role: 'system',
      content: `Language tutor. Native: ${nativeLanguage}. Answer in ${nativeLanguage}. ${levelInstructions} Be concise.`,
    },
    {
      role: 'user',
      content: `${contextBlock}\n\nQuestion: "${question}"`,
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
    ? `Linguistic analysis: etymology, morphology, syntax, register, dialects.`
    : `Explain simply. Meaning, usage, 1-2 common mistakes. No jargon.`

  return [
    {
      role: 'system',
      content: `Language tutor. Native: ${nativeLanguage}. Answer in ${nativeLanguage}. ${levelInstructions} Max 200 words.`,
    },
    {
      role: 'user',
      content: `${contextBlock}\n\n"${selectedText}"`,
    },
  ]
}
