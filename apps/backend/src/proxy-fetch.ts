import { ProxyAgent, fetch as undiciFetch } from 'undici'

// WHY: Node.js native fetch() (undici) ignores HTTP_PROXY/HTTPS_PROXY env vars.
// youtube-transcript uses fetch() internally, so it can't reach YouTube in proxy environments.
// This module creates a proxy-aware fetch() that routes through the configured proxy.

const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  process.env.https_proxy ||
  process.env.http_proxy

// WHY: Only create a ProxyAgent if a proxy URL is configured.
// Falls back to native fetch behavior when no proxy is set.
const dispatcher = proxyUrl
  ? new ProxyAgent({
      uri: proxyUrl,
      requestTls: { rejectUnauthorized: true },
    })
  : undefined

// WHY: Wrapper around undici's fetch that injects the proxy dispatcher.
// youtube-transcript expects `typeof globalThis.fetch`; this satisfies that contract
// while routing through the proxy when configured.
export const proxyFetch: typeof globalThis.fetch = async (input, init) => {
  return undiciFetch(input as any, {
    ...init,
    dispatcher,
  } as any) as any
}
