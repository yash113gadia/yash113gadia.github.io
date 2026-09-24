import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Serves /api/chat during `npm run dev` with the same handler the Vercel and Netlify
// functions use, reading GROQ_API_KEY from .env.
const localChatApi = (apiKey: string | undefined): Plugin => ({
  name: 'local-chat-api',
  configureServer(server) {
    server.middlewares.use('/api/chat', async (req, res) => {
      const send = (status: number, body: unknown) => {
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(body))
      }
      if (req.method !== 'POST') return send(405, { error: 'Method not allowed' })
      let raw = ''
      for await (const chunk of req) {
        raw += chunk
        if (raw.length > 20_000) return send(413, { error: 'Payload too large' })
      }
      let parsed: unknown = null
      try {
        parsed = raw ? JSON.parse(raw) : null
      } catch {
        return send(400, { error: 'Invalid JSON' })
      }
      const { handleChat } = await server.ssrLoadModule('/src/server/chat.ts')
      const result = await handleChat(parsed, apiKey)
      send(result.status, result.body)
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), localChatApi(env.GROQ_API_KEY)],
  }
})
