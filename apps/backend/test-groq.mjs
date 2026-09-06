#!/usr/bin/env node
// Test script to verify Groq API works
// Run: node test-groq.mjs

import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read .env manually
const envPath = path.resolve(__dirname, '..', '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const apiKey = envContent.match(/GROQ_API_KEY=(.+)/)?.[1]?.trim()

console.log('API Key:', apiKey ? `${apiKey.slice(0, 10)}...` : 'NOT SET')
console.log('Env path:', envPath)

if (!apiKey) {
  console.error('No GROQ_API_KEY in .env')
  process.exit(1)
}

const client = new Groq({ apiKey })

console.log('\n--- Test 1: Simple request ---')
try {
  const res = await client.chat.completions.create({
    model: 'qwen/qwen3.6-27b',
    messages: [{ role: 'user', content: 'Say hi in 3 words' }],
    max_tokens: 100,
  })
  console.log('SUCCESS:', res.choices[0].message.content)
} catch (e) {
  console.error('FAILED:', e.message)
  console.error('Status:', e.status)
  console.error('Body:', JSON.stringify(e.error))
}

console.log('\n--- Test 2: With system prompt ---')
try {
  const res = await client.chat.completions.create({
    model: 'qwen/qwen3.6-27b',
    messages: [
      { role: 'system', content: 'You are a language tutor. Answer in Spanish.' },
      { role: 'user', content: 'Explain the word "hablando"' },
    ],
    max_tokens: 200,
  })
  console.log('SUCCESS:', res.choices[0].message.content.slice(0, 100))
} catch (e) {
  console.error('FAILED:', e.message)
  console.error('Status:', e.status)
  console.error('Body:', JSON.stringify(e.error))
}

console.log('\n--- Test 3: Vocabulary prompt format ---')
try {
  const res = await client.chat.completions.create({
    model: 'qwen/qwen3.6-27b',
    messages: [
      { role: 'system', content: 'Language tutor. Native: es. Answer in es. Return JSON only: {"word":"infinitive","selectedForm":"selected","definition":"meaning"}' },
      { role: 'user', content: '"muchas" — explain, 3 examples.' },
    ],
    max_tokens: 300,
  })
  console.log('SUCCESS:', res.choices[0].message.content.slice(0, 150))
} catch (e) {
  console.error('FAILED:', e.message)
  console.error('Status:', e.status)
  console.error('Body:', JSON.stringify(e.error))
}
