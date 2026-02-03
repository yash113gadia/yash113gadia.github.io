import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}

// Knowledge base about Yash
const knowledgeBase = {
  greeting: [
    "Hi! I'm Yash's AI assistant. Ask me anything about his skills, projects, or experience! 🚀",
    "Hello! I can tell you about Yash's work, skills, and achievements. What would you like to know?"
  ],

  skills: `Yash is a Full-Stack Developer with expertise in:

**Frontend:** React, Next.js, React Native, TypeScript, Tailwind CSS
**Backend:** Node.js, Express, FastAPI, Firebase, Spring Boot
**Databases:** PostgreSQL, MongoDB, SQLite, Firestore
**Tools:** Docker, Git, Razorpay, Stripe, Gemini AI

He builds production-ready applications from scratch!`,

  projects: `Yash has built several impressive projects:

🚀 **Qlaa (qlaa.in)** - Live marketplace with payments & real-time chat
📊 **WhatsMyScore** - Quiz platform with clinical & viral modes
🍎 **FitTrack** - AI nutrition app with Gemini AI
🏢 **DevAge** - Agency dashboard with FastAPI + Docker
📋 **AttendEase** - Attendance system with Spring Boot`,

  qlaa: `**Qlaa (qlaa.in)** is Yash's flagship project - a live marketplace platform.

**Features:** Razorpay payments, real-time chat, Google OAuth, reviews & ratings, artist onboarding

**Tech:** React + TypeScript + Firebase + Zustand

It's LIVE with real users and transactions!`,

  experience: `**Qlaa** - Co-Founder & Lead Developer (Present)
• Built entire platform from scratch
• Real payments, real users

**Impact Career Solution** - Co-Founder
• Top 43/500+ at MIT Pune Startup Event
• AI-powered career guidance platform`,

  achievements: `🏆 **Rank 6/150+** - Techvanya 2.0 Promptathon (2025)
🏆 **Top 43/500+** - MIT Pune Startup Event
🥇 **Winner** - Voice & Verdict Debate (1st/54 teams)
🥇 **Winner** - Le Discourse 2
🌍 **Delegate (Sweden)** - UNHRC MUN 2025
🏓 **Winner** - Inter-District Table Tennis`,

  contact: `📧 **Email:** yash113gadia@gmail.com
📱 **Phone:** +91-9950094483
💼 **LinkedIn:** linkedin.com/in/yashgadia
🐙 **GitHub:** github.com/yash113gadia

He's **available immediately** for opportunities!`,

  availability: `Yes! Yash is actively seeking opportunities and can join **immediately**.

Open to Full-Stack, Frontend, Backend roles - remote or hybrid.

Contact: yash113gadia@gmail.com`,

  why_hire: `Why hire Yash?

✅ **Ships Real Products** - Qlaa.in is live with real users
✅ **True Full-Stack** - Database to deployment
✅ **Modern Stack** - TypeScript, React, Firebase
✅ **Great Communicator** - Multiple debate winner
✅ **Quick Learner** - Self-taught most of his stack`,

  default: "I can tell you about Yash's skills, projects (like Qlaa), experience, achievements, or contact info. What interests you?"
};

const getResponse = (input: string): string => {
  const lowered = input.toLowerCase();

  if (lowered.match(/^(hi|hello|hey|hii+)/)) {
    return knowledgeBase.greeting[Math.floor(Math.random() * knowledgeBase.greeting.length)];
  }
  if (lowered.match(/skill|tech|stack|language|framework|proficient/)) {
    return knowledgeBase.skills;
  }
  if (lowered.match(/project|built|portfolio|work|created/) && !lowered.match(/qlaa/)) {
    return knowledgeBase.projects;
  }
  if (lowered.match(/qlaa|marketplace|flagship/)) {
    return knowledgeBase.qlaa;
  }
  if (lowered.match(/experience|job|entrepreneur|co-?founder/)) {
    return knowledgeBase.experience;
  }
  if (lowered.match(/achievement|award|win|hackathon|competition|debate/)) {
    return knowledgeBase.achievements;
  }
  if (lowered.match(/contact|email|phone|reach|linkedin|github|hire/)) {
    return knowledgeBase.contact;
  }
  if (lowered.match(/available|hiring|intern|opportunity|join|open to/)) {
    return knowledgeBase.availability;
  }
  if (lowered.match(/why|what makes|special|different|value/)) {
    return knowledgeBase.why_hire;
  }
  if (lowered.match(/who is|about|tell me about|introduce/)) {
    return `**Yash Gadia** - Full-Stack Developer & Co-founder of Qlaa (qlaa.in).

B.Tech + M.Tech CS at NIET (2024-2029).
Tech: React, TypeScript, Node.js, Firebase, PostgreSQL

What would you like to know more about?`;
  }
  if (lowered.match(/thank|thanks/)) {
    return "You're welcome! Feel free to reach out to Yash at yash113gadia@gmail.com 😊";
  }
  if (lowered.match(/bye|goodbye/)) {
    return "Thanks for chatting! Check out qlaa.in and reach out at yash113gadia@gmail.com 👋";
  }

  return knowledgeBase.default;
};

const suggestedQuestions = [
  "What are his skills?",
  "Tell me about Qlaa",
  "Why hire Yash?",
];

const ChatbotInline = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi! Ask me anything about Yash - his skills, projects, or experience! 🚀", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = { id: Date.now(), text: messageText, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    const response = getResponse(messageText);
    const botMessage: Message = { id: Date.now() + 1, text: response, isBot: true };

    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-emerald-400">$1</strong>');
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <div className="bento-card h-[400px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-white font-semibold">Ask about Yash</h4>
          <p className="text-xs text-neutral-500">AI-powered assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex gap-2 max-w-[90%] ${message.isBot ? '' : 'flex-row-reverse'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${message.isBot ? 'bg-emerald-500/20' : 'bg-neutral-700'}`}>
                {message.isBot ? <Bot className="w-3 h-3 text-emerald-400" /> : <User className="w-3 h-3 text-neutral-400" />}
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm ${message.isBot ? 'bg-neutral-800 text-neutral-200' : 'bg-emerald-500 text-black'}`}>
                {message.isBot ? formatMessage(message.text) : message.text}
              </div>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Bot className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="px-3 py-2 bg-neutral-800 rounded-2xl flex gap-1">
              <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-neutral-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about Yash..."
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="w-9 h-9 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-700 rounded-xl flex items-center justify-center transition-colors"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
};

export default ChatbotInline;
