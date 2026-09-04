import type { Plugin } from 'vite'
import { handleSubtitles } from './subtitles.ts'

export function subtitlesPlugin(): Plugin {
  return {
    name: 'subtitles-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/subtitles')) {
          handleSubtitles(req, res)
        } else {
          next()
        }
      })
    },
  }
}
