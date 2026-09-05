const AI_API_URL = 'http://localhost:3000/api/ai/explain'

export interface AiContext {
  prevLine: string
  currentLine: string
  nextLine: string
  videoTitle: string
}

export interface VocabularyResponse {
  type: 'vocabulary'
  word: string
  definition: string
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
): Promise<VocabularyResponse> {
  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'vocabulary', selectedText, context, numExamples }),
  })
  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  return res.json()
}

export async function explainGrammar(
  selectedText: string,
  context: AiContext,
  question: string,
): Promise<GrammarResponse> {
  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'grammar', selectedText, context, question }),
  })
  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  return res.json()
}
