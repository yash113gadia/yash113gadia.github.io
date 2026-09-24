import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleChat } from '../src/server/chat';

// Same-origin only: no CORS headers, so other sites can't call this from a browser.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const result = await handleChat(req.body, process.env.GROQ_API_KEY);
  return res.status(result.status).json(result.body);
}
