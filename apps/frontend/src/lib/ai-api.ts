const AI_API_URL = 'http://localhost:3000/api/ai/explain'

export interface AiContext {
  prevLine: string
  currentLine: string
  nextLine: string
  videoTitle: string
}

export interface VocabularyResponse {
  type: 'vocabulary'
  word: string           // the infinitive
  selectedForm?: string  // the original selected word (may differ from word)
  definition: string     // explanation of the selected form
  infinitiveDefinition?: string  // explanation of the infinitive (if different from selectedForm)
  examples: string[]
}

export interface GrammarResponse {
  type: 'grammar'
  explanation: string
}

export async function explainVocabulary(
  selectedText: string,
  context: AiContext,
  numExamples: number = 3,
  nativeLanguage: string = 'es',
): Promise<VocabularyResponse> {
  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'vocabulary', selectedText, context, numExamples, nativeLanguage }),
  })
  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  return res.json()
}

export async function explainGrammar(
  selectedText: string,
  context: AiContext,
  question: string,
  nativeLanguage: string = 'es',
  explanationLevel: string = 'simple',
): Promise<GrammarResponse> {
  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'grammar', selectedText, context, question, nativeLanguage, explanationLevel }),
  })
  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  return res.json()
}

export async function explainGrammarAuto(
  selectedText: string,
  context: AiContext,
  nativeLanguage: string = 'es',
  explanationLevel: string = 'simple',
): Promise<GrammarResponse> {
  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'grammar_auto', selectedText, context, nativeLanguage, explanationLevel }),
  })
  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  return res.json()
}
