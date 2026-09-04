import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { appLogger } from './logger/logger.module.js'

async function bootstrap() {
  // WHY logger: false — we replace NestJS's built-in logger with pino
  const app = await NestFactory.create(AppModule, { logger: false })

  // WHY: NestJS Logger interface has log/error/warn/debug/verbose methods.
  // We bridge each to the corresponding pino level.
  app.useLogger({
    log: (msg) => appLogger.info(msg),
    error: (msg, trace) => appLogger.error({ trace }, msg),
    warn: (msg) => appLogger.warn(msg),
    debug: (msg) => appLogger.debug(msg),
    verbose: (msg) => appLogger.trace(msg),
  })

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET'],
  })

  await app.listen(3000)
  appLogger.info('Backend running on http://localhost:3000')
}
bootstrap()
