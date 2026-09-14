const API_BASE = 'http://localhost:3000'

export interface Flashcard {
  id: number
  word: string
  explanation: string
  sourceSentence: string | null
  videoId: string | null
  createdAt: string
}

export async function saveFlashcard(data: {
  word: string
  explanation: string
  sourceSentence?: string
  videoId?: string
}): Promise<Flashcard> {
  const res = await fetch(`${API_BASE}/api/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Flashcards API error: ${res.status}`)
  return res.json()
}

export async function getFlashcards(): Promise<Flashcard[]> {
  const res = await fetch(`${API_BASE}/api/flashcards`)
  if (!res.ok) throw new Error(`Flashcards API error: ${res.status}`)
  return res.json()
}

export async function deleteFlashcard(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/flashcards/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Flashcards API error: ${res.status}`)
}
