import { Module } from '@nestjs/common'
import pino from 'pino'
import * as fs from 'fs'
import * as path from 'path'

// WHY: nestjs-pino transport configuration produces 0-byte log files.
// Direct pino with multistream gives us full control over file + console output.

const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
const logFilePath = path.join(logsDir, `backend-${runTimestamp}.log`)

// File transport — writes ALL levels (trace+) to a timestamped log file
const fileTransport = pino.destination(logFilePath)

// Console transport — pretty-prints info+ to stdout
const consoleTransport = pino.transport({
  target: 'pino-pretty',
  options: { colorize: true, translateTime: 'SYS:standard' },
})

// WHY multistream: file gets everything (trace+), console gets info+ (avoids debug noise)
export const appLogger = pino(
  {
    level: 'trace',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream([
    { stream: fileTransport, level: 'trace' },
    { stream: consoleTransport, level: 'info' },
  ]),
)

@Module({})
export class LoggerModule {}
