type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: unknown
}

class Logger {
  private buffer: LogEntry[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Flush logs every 5 seconds
    this.flushInterval = setInterval(() => this.flush(), 5000)
  }

  private createEntry(level: LogLevel, context: string, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    }
  }

  debug(context: string, message: string, data?: unknown) {
    const entry = this.createEntry('debug', context, message, data)
    this.buffer.push(entry)
    console.debug(`[${context}] ${message}`, data ?? '')
  }

  info(context: string, message: string, data?: unknown) {
    const entry = this.createEntry('info', context, message, data)
    this.buffer.push(entry)
    console.info(`[${context}] ${message}`, data ?? '')
  }

  warn(context: string, message: string, data?: unknown) {
    const entry = this.createEntry('warn', context, message, data)
    this.buffer.push(entry)
    console.warn(`[${context}] ${message}`, data ?? '')
  }

  error(context: string, message: string, data?: unknown) {
    const entry = this.createEntry('error', context, message, data)
    this.buffer.push(entry)
    console.error(`[${context}] ${message}`, data ?? '')
  }

  private async flush() {
    if (this.buffer.length === 0) return

    const entries = [...this.buffer]
    this.buffer = []

    try {
      // In development, logs go to console only
      // In production, this could POST to a logging endpoint
      if (import.meta.env.DEV) {
        // Store in localStorage as fallback
        const existing = JSON.parse(localStorage.getItem('app-logs') || '[]')
        const allLogs = [...existing, ...entries].slice(-500) // Keep last 500
        localStorage.setItem('app-logs', JSON.stringify(allLogs))
      }
    } catch {
      // Silently fail — logging should never crash the app
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

export const logger = new Logger()
