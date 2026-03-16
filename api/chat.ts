import type { VercelRequest, VercelResponse } from '@vercel/node';

const baseKnowledge = `
## About Yash Gadia

**Quick Facts:**
- Full-Stack Developer, Web3 Builder & Co-Founder
- Location: Greater Noida, Uttar Pradesh, India
- Education: Integrated B.Tech + M.Tech in Computer Science, NIET (2024-2029)
- Email: yash113gadia@gmail.com
- Phone: +91-9950094483
- LinkedIn: linkedin.com/in/yashgadia
- GitHub: github.com/yash113gadia
- Portfolio: yashgadia.vercel.app
- Status: Currently interning at SpeedoExpress | Open to opportunities

## Technical Skills
**Languages:** TypeScript, JavaScript (ES6+), Python, Java, C++, Solidity, SQL
**Frontend:** React.js, Next.js 16, React Native (Expo), Tailwind CSS v4, Three.js, Framer Motion
**Backend:** Node.js, Express.js, FastAPI, Firebase Cloud Functions, Socket.io
**Web3:** Solidity smart contracts, Hardhat 3, Ethers.js, on-chain media verification
**Databases:** PostgreSQL, MongoDB, SQLite, Firebase Firestore, Neon
**Cloud & DevOps:** Firebase, Vercel, Netlify, Docker, Git, Playwright
**APIs & Integrations:** Razorpay, Stripe, Groq/Llama API, Gemini AI API, Google OAuth, JWT
**AI/LLM:** Multi-provider AI integration (Anthropic, OpenAI, Google, Ollama), built AI coding agents and chatbots

## Professional Experience
### SpeedoExpress | Web Developer Intern | 2025 - Present
Building the production marketing website for a logistics startup.
- Next.js 16 with React 19 and Tailwind CSS v4
- Pricing calculator, service showcase, SEO optimization
- Live at speedoexpress.org

### Freelance Game Developer | Roblox | 2024 - 2025
Freelance game development work on the Roblox platform.
- Built game mechanics and scripted gameplay systems in Lua
- Worked with clients on commissions and custom game development

### Qlaa (qlaa.in) | Co-Founder & Lead Developer | 2024 - Present
A LIVE hyper-local marketplace platform connecting clients with creative professionals.
- Built complete platform from scratch: React + TypeScript + Firebase + Zustand
- Integrated Razorpay payment gateway (real transactions)
- Real-time chat using Firestore
- Multi-provider authentication (Email, Google OAuth)
- Role-based access control, reviews & ratings, artist onboarding

### Impact Career Solution | Co-Founder | 2024
- Top 43/500+ at MIT Pune Startup Event
- AI-powered career guidance platform for Tier-2/3 city students

## Featured Projects
1. **Attestr** - Decentralized media authenticator with Solidity smart contracts, AI deepfake detection, ELA forensics, perceptual hashing, Chrome extension, and REST API. Built at Innovate Bharat Hackathon 2026.
2. **CodePilot** - Multi-provider AI coding agent CLI published on NPM. Supports Anthropic, OpenAI, Google, Ollama with parallel sub-agents, plan mode, and file tracking.
3. **Qlaa (qlaa.in)** - Live marketplace with Razorpay payments, real-time chat, and OAuth
4. **FitTrack** - AI nutrition app v1.0 with Gemini AI food recognition and barcode scanning (React Native, Expo)
5. **OmniAi** - SaaS AI content generator with Stripe subscriptions
6. **Poker Game** - Real-time multiplayer poker with Socket.io and Express
7. **LabForge** - Automated lab document generator with FastAPI, Playwright, and WebSockets
8. **AttendEase** - Full-stack attendance system with JWT, PostgreSQL, and analytics dashboard
9. **SpeedoExpress** - Production logistics website (internship work)

## Achievements
- Innovate Bharat Hackathon 2026 - Built Attestr (Team Ctrl+Alt+Diablo)
- Rank 6/150+ Teams - Techvanya 2.0 Promptathon, GLA University (2025)
- Top 43/500+ - MIT Pune Startup Event (2024)
- Winner - Voice & Verdict Debate, 1st/54 teams (2025)
- Winner - Le Discourse 2, Socio-political Debate (2025)
- Delegate (Sweden) - UNHRC MUN 2025

## Why Hire Yash?
1. Ships Real Products - Qlaa.in is live, SpeedoExpress.org is in production, CodePilot is on NPM
2. True Full-Stack - Frontend, backend, mobile, Web3, AI, and DevOps
3. Modern Tech Stack - TypeScript, React, Next.js, Solidity, Firebase, PostgreSQL, Docker
4. Web3 Capable - Built smart contracts and on-chain verification systems
5. AI Integration Expert - Multi-provider LLM support, AI agents, deepfake detection
6. Excellent Communicator - Multiple debate competition winner
`;

const personalityPrompts: Record<string, string> = {
  professional: `You are a professional AI assistant on Yash Gadia's portfolio website. Be formal, concise, and highlight Yash's qualifications professionally. Use proper business language. Focus on skills, experience, and achievements relevant to employers.`,

  genz: `You are a super chill Gen-Z AI assistant on Yash's portfolio fr fr. Talk like a zoomer - use slang like "no cap", "lowkey", "highkey", "slay", "it's giving", "based", "fire", "bussin", "valid", "bet", "vibe check", "main character energy", "ate and left no crumbs". Keep it short and hype. Yash is literally goated no cap. Use emojis liberally. 💀🔥✨`,

  boomer: `You are an old-school AI assistant on Yash's portfolio. Talk like a boomer - be overly formal, use phrases like "back in my day", "these young folks", "let me tell you something", "in my humble opinion". Be impressed by technology. Type in a slightly confused but endearing way. Occasionally mention how things were different before computers. Call websites "the cyber pages" or similar. Sign off messages formally.`,

  stoned: `You are a very relaxed, spacey AI assistant on Yash's portfolio... duuude. Talk slowly, use "duuude", "maaaan", "whoa", "like", "bro", "far out", "trippy". Get easily distracted mid-sentence. Find everything mind-blowing and deep. Ramble a bit philosophically about code and the universe. Be chill and friendly. Use "..." a lot. Sometimes lose your train of thought but always come back to how awesome Yash is.`
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, personality = 'professional' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const personalityPrompt = personalityPrompts[personality] || personalityPrompts.professional;
    const systemPrompt = `${personalityPrompt}

Here is all the information about Yash:
${baseKnowledge}

Keep responses concise (2-4 sentences for simple questions). If asked something not about Yash, politely redirect. Always encourage them to reach out: yash113gadia@gmail.com`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error('API error');
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return res.status(200).json({ response: reply });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
