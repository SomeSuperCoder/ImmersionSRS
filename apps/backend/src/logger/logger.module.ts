import { Module } from '@nestjs/common'
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino'
import * as fs from 'fs'
import * as path from 'path'

const logsDir = path.join(process.cwd(), 'logs')

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Create a new log file for this run — timestamped to separate runs
const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
const logFilePath = path.join(logsDir, `backend-${runTimestamp}.log`)

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        transport: {
          targets: [
            {
              target: 'pino/file',
              options: { destination: logFilePath, mkdir: true },
              level: 'trace',
            },
            {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' },
              level: 'info',
            },
          ],
        },
      },
    }),
  ],
})
export class LoggerModule {}
