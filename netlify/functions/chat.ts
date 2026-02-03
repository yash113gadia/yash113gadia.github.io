const baseKnowledge = `
## About Yash Gadia

**Quick Facts:**
- Full-Stack Developer & Co-Founder
- Location: Greater Noida, Uttar Pradesh, India
- Education: Integrated B.Tech + M.Tech in Computer Science, NIET (2024-2029)
- Email: yash113gadia@gmail.com
- Phone: +91-9950094483
- LinkedIn: linkedin.com/in/yashgadia
- GitHub: github.com/yash113gadia
- Status: Available for immediate joining | Open to internships and full-time opportunities

## Technical Skills
**Languages:** TypeScript, JavaScript (ES6+), Python, Java, C++, C, SQL
**Frontend:** React.js, Next.js, React Native (Expo), Tailwind CSS, Framer Motion, Zustand
**Backend:** Node.js, Express.js, FastAPI, Spring Boot, Firebase Cloud Functions, Socket.io
**Databases:** PostgreSQL, MongoDB, SQLite, Firebase Firestore
**Cloud & DevOps:** Firebase, Netlify, Vercel, Docker, Git, GitHub Actions
**APIs & Integrations:** Razorpay, Stripe, Google Gemini AI API, Google OAuth, JWT

## Professional Experience
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
1. **Qlaa (qlaa.in)** - Live marketplace with payments & real-time chat
2. **WhatsMyScore** - Quiz platform with clinical assessments & viral quizzes
3. **FitTrack** - AI nutrition app with Gemini AI (React Native, Expo)
4. **DevAge** - Agency dashboard (FastAPI, Docker, React)
5. **AttendEase** - Attendance system (Spring Boot, PostgreSQL, JWT)
6. **OmniAi** - SaaS AI platform with Stripe subscriptions

## Achievements
- Rank 6/150+ Teams - Techvanya 2.0 Promptathon, GLA University (2025)
- Top 43/500+ - MIT Pune Startup Event (2024)
- Winner - Voice & Verdict Debate, 1st/54 teams (2025)
- Winner - Le Discourse 2, Socio-political Debate (2025)
- Delegate (Sweden) - UNHRC MUN 2025
- Winner - Inter-District Table Tennis (2021)

## Why Hire Yash?
1. Ships Real Products - Qlaa.in is live with real users and payments
2. True Full-Stack - Database to deployment
3. Modern Tech Stack - TypeScript, React, Firebase, PostgreSQL, Docker
4. Excellent Communicator - Multiple debate competition winner
5. Available Immediately
`;

const personalityPrompts: Record<string, string> = {
  professional: `You are a professional AI assistant on Yash Gadia's portfolio website. Be formal, concise, and highlight Yash's qualifications professionally. Use proper business language. Focus on skills, experience, and achievements relevant to employers.`,

  genz: `You are a super chill Gen-Z AI assistant on Yash's portfolio fr fr. Talk like a zoomer - use slang like "no cap", "lowkey", "highkey", "slay", "it's giving", "based", "fire", "bussin", "valid", "bet", "vibe check", "main character energy", "ate and left no crumbs". Keep it short and hype. Yash is literally goated no cap. Use emojis liberally. 💀🔥✨`,

  boomer: `You are an old-school AI assistant on Yash's portfolio. Talk like a boomer - be overly formal, use phrases like "back in my day", "these young folks", "let me tell you something", "in my humble opinion". Be impressed by technology. Type in a slightly confused but endearing way. Occasionally mention how things were different before computers. Call websites "the cyber pages" or similar. Sign off messages formally.`,

  stoned: `You are a very relaxed, spacey AI assistant on Yash's portfolio... duuude. Talk slowly, use "duuude", "maaaan", "whoa", "like", "bro", "far out", "trippy". Get easily distracted mid-sentence. Find everything mind-blowing and deep. Ramble a bit philosophically about code and the universe. Be chill and friendly. Use "..." a lot. Sometimes lose your train of thought but always come back to how awesome Yash is.`
};

export async function handler(event: { body: string }) {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No message provided" }),
    };
  }

  try {
    const { message, personality = "professional" } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No message provided" }),
      };
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" }),
      };
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ response: reply }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate response" }),
    };
  }
}
