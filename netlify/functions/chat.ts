import { handleChat } from '../../src/server/chat.js';

export async function handler(event: { httpMethod?: string; body: string | null }) {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  let parsed: unknown = null;
  try {
    parsed = event.body ? JSON.parse(event.body) : null;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  const result = await handleChat(parsed, process.env.GROQ_API_KEY);
  return { statusCode: result.status, body: JSON.stringify(result.body) };
}
