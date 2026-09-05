import { ProxyAgent, fetch as undiciFetch } from 'undici'
import net from 'net'
import { appLogger } from './logger/logger.module.js'

const PROXY_HOST = '127.0.0.1'
const PROXY_PORT = 10809

let proxyAvailable = false

function checkProxy(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(2000)
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.on('error', () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(port, host)
  })
}

async function initProxy() {
  proxyAvailable = await checkProxy(PROXY_HOST, PROXY_PORT)
  if (proxyAvailable) {
    appLogger.info({ host: PROXY_HOST, port: PROXY_PORT }, 'HTTP proxy detected, routing through proxy')
  } else {
    appLogger.info('No HTTP proxy detected, making direct requests')
  }
}

// Run at module load
initProxy()

// WHY: Wrapper around undici's fetch that injects the proxy dispatcher.
// youtube-transcript expects `typeof globalThis.fetch`; this satisfies that contract
// while routing through the proxy when configured.
export const proxyFetch: typeof globalThis.fetch = async (input, init) => {
  const dispatcher = proxyAvailable
    ? new ProxyAgent({
        uri: `http://${PROXY_HOST}:${PROXY_PORT}`,
        requestTls: { rejectUnauthorized: true },
      })
    : undefined

  return undiciFetch(input as any, {
    ...init,
    dispatcher,
  } as any) as any
}
