import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Knowledge base about Yash
const knowledgeBase = {
  greeting: [
    "Hi! I'm Yash's AI assistant. I can tell you about his skills, projects, experience, and more. What would you like to know?",
    "Hello! Welcome to Yash's portfolio. I'm here to answer any questions about his work, skills, or experience. How can I help you?"
  ],

  skills: `Yash is a Full-Stack Developer with expertise in:

**Frontend:** React, Next.js, React Native, TypeScript, Tailwind CSS, Framer Motion
**Backend:** Node.js, Express, FastAPI (Python), Spring Boot, Firebase
**Databases:** PostgreSQL, MongoDB, SQLite, Firebase Firestore
**Tools:** Docker, Git, Razorpay, Stripe, Gemini AI API

He's proficient in building production-ready applications from scratch!`,

  projects: `Yash has built several impressive projects:

🚀 **Qlaa (qlaa.in)** - A live marketplace platform with Razorpay payments, real-time chat, and full authentication system

📊 **WhatsMyScore** - Dual-mode quiz platform with clinical assessments (ADHD, Anxiety, Depression) and viral quizzes

🍎 **FitTrack** - AI-powered nutrition app using Gemini AI with offline support

🏢 **DevAge Platform** - Agency management dashboard with FastAPI + Docker

📋 **AttendEase** - Enterprise attendance system with Spring Boot + PostgreSQL`,

  qlaa: `**Qlaa (qlaa.in)** is Yash's flagship project - a live hyper-local marketplace connecting clients with creative professionals.

**Tech Stack:** React + TypeScript + Firebase + Razorpay

**Key Features:**
• Complete payment integration with Razorpay
• Real-time chat using Firestore listeners
• Google OAuth + Email authentication
• Artist onboarding wizard
• Reviews & ratings system
• CI/CD deployment on Netlify

This is a LIVE production platform with real users and transactions!`,

  experience: `Yash has real entrepreneurial experience:

**Qlaa** (Co-Founder & Lead Developer) - Present
• Built the entire platform from scratch
• Handles real payments and real users
• Full-stack development + DevOps

**Impact Career Solution** (Co-Founder)
• Top 43/500+ at MIT Pune Startup Event
• AI-powered career guidance platform
• Pitched to investors successfully`,

  achievements: `Yash's notable achievements:

🏆 **Rank 6/150+** - Techvanya 2.0 Promptathon, GLA University (2025)
🏆 **Top 43/500+** - MIT Pune Startup Event
🥇 **Winner** - Voice & Verdict Debate (1st among 54 teams)
🥇 **Winner** - Le Discourse 2 (Socio-political Debate)
🥇 **Winner** - Intra-College AI Ethics Debate
🌍 **Delegate (Sweden)** - UNHRC MUN 2025
🏓 **Winner** - Inter-District Table Tennis Championship`,

  education: `**Integrated B.Tech + M.Tech in Computer Science**
Noida Institute of Engineering & Technology (NIET)
2024 - 2029

Yash is also certified in:
• Next Gen Technologies
• Python Fundamentals
• Programming in C`,

  contact: `You can reach Yash at:

📧 **Email:** yash113gadia@gmail.com
📱 **Phone:** +91-9950094483
💼 **LinkedIn:** linkedin.com/in/yashgadia
🐙 **GitHub:** github.com/yash113gadia
🌐 **Portfolio:** yash113gadia.github.io

He's **available immediately** for internships and full-time opportunities!`,

  availability: `Yes! Yash is actively seeking opportunities and can join **immediately**.

He's open to:
• Full-Stack Developer roles
• Frontend/Backend Developer positions
• Software Engineer Internships
• Remote or Hybrid work (Greater Noida area)

Feel free to reach out at yash113gadia@gmail.com!`,

  why_hire: `Why hire Yash?

1️⃣ **Ships Real Products** - Qlaa.in is live with real users and payments
2️⃣ **True Full-Stack** - From database design to CI/CD pipelines
3️⃣ **Modern Tech Stack** - TypeScript, React, Firebase, PostgreSQL
4️⃣ **AI-Augmented Development** - Leverages AI tools for rapid delivery
5️⃣ **Great Communicator** - Multiple debate competition winner
6️⃣ **Quick Learner** - Self-taught most of his stack through building

He doesn't just write code—he builds products that solve problems!`,

  technologies: `Yash works with modern technologies:

**Languages:** TypeScript, JavaScript, Python, Java, C++, SQL
**Frontend:** React, Next.js, React Native, Tailwind CSS
**Backend:** Node.js, Express, FastAPI, Spring Boot
**Databases:** PostgreSQL, MongoDB, Firebase Firestore
**Cloud:** Firebase, Netlify, Vercel, Docker
**APIs:** Razorpay, Stripe, Gemini AI`,

  default: "I'm not sure about that specific topic. You can ask me about Yash's skills, projects (like Qlaa), experience, achievements, education, or how to contact him. What would you like to know?"
};

// Pattern matching function
const getResponse = (input: string): string => {
  const lowered = input.toLowerCase();

  // Greetings
  if (lowered.match(/^(hi|hello|hey|hii+|greetings|howdy)/)) {
    return knowledgeBase.greeting[Math.floor(Math.random() * knowledgeBase.greeting.length)];
  }

  // Skills & Technologies
  if (lowered.match(/skill|tech|stack|language|framework|what (does|can) (he|yash) (do|know|use)|proficient|expertise/)) {
    return knowledgeBase.skills;
  }

  // Specific technologies
  if (lowered.match(/technologies|tools|programming/)) {
    return knowledgeBase.technologies;
  }

  // Projects
  if (lowered.match(/project|built|portfolio|work|created|developed/) && !lowered.match(/qlaa/)) {
    return knowledgeBase.projects;
  }

  // Qlaa specific
  if (lowered.match(/qlaa|marketplace|startup project|main project|flagship/)) {
    return knowledgeBase.qlaa;
  }

  // Experience
  if (lowered.match(/experience|job|work history|entrepreneur|co-?founder|professional/)) {
    return knowledgeBase.experience;
  }

  // Achievements
  if (lowered.match(/achievement|award|accomplish|win|won|hackathon|competition|debate|mun/)) {
    return knowledgeBase.achievements;
  }

  // Education
  if (lowered.match(/education|study|college|university|degree|btech|mtech|certif/)) {
    return knowledgeBase.education;
  }

  // Contact
  if (lowered.match(/contact|email|phone|reach|linkedin|github|connect|hire/)) {
    return knowledgeBase.contact;
  }

  // Availability
  if (lowered.match(/available|hiring|intern|opportunity|job|position|join|looking|open to/)) {
    return knowledgeBase.availability;
  }

  // Why hire
  if (lowered.match(/why (should|would|hire)|what makes|special|unique|different|stand out|value/)) {
    return knowledgeBase.why_hire;
  }

  // About / Who is
  if (lowered.match(/who is|about|tell me about|introduce|summary|overview/)) {
    return `**Yash Gadia** is a Full-Stack Developer and entrepreneur from Greater Noida, India.

He's currently pursuing B.Tech + M.Tech in CS at NIET (2024-2029).

🚀 **Co-founder of Qlaa** (qlaa.in) - a live marketplace platform
💻 **Tech:** React, TypeScript, Node.js, Firebase, PostgreSQL
🏆 **Achievements:** Rank 6/150+ at Techvanya Hackathon, Top 43/500+ at MIT Pune

He ships real products, not just tutorial projects!

What specific aspect would you like to know more about?`;
  }

  // Thank you
  if (lowered.match(/thank|thanks|thx|appreciate/)) {
    return "You're welcome! Feel free to reach out to Yash at yash113gadia@gmail.com if you'd like to discuss opportunities. Is there anything else you'd like to know?";
  }

  // Bye
  if (lowered.match(/bye|goodbye|see you|later|exit|quit/)) {
    return "Thanks for visiting! Don't forget to check out Yash's projects, especially Qlaa at qlaa.in. Feel free to reach out at yash113gadia@gmail.com. Have a great day! 👋";
  }

  return knowledgeBase.default;
};

const suggestedQuestions = [
  "What are Yash's skills?",
  "Tell me about Qlaa",
  "What projects has he built?",
  "Is Yash available for hire?",
  "Why should I hire Yash?",
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm Yash's AI assistant. Ask me anything about his skills, projects, or experience! 🚀",
      isBot: true,
      timestamp: new Date()
    }
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

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Get bot response
    const response = getResponse(messageText);
    const botMessage: Message = {
      id: Date.now() + 1,
      text: response,
      isBot: true,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format message text with markdown-like styling
  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-emerald-400">$1</strong>');
      // Emoji bullets stay as is
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full shadow-lg flex items-center justify-center transition-all ${isOpen ? 'scale-0' : 'scale-100'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
      >
        <MessageCircle className="w-6 h-6 text-black" />
        {/* Pulse animation */}
        <span className="absolute w-full h-full rounded-full bg-emerald-500 animate-ping opacity-30" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Ask about Yash</h3>
                  <p className="text-emerald-100 text-xs">AI-powered assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${message.isBot ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${message.isBot ? 'bg-emerald-500/20' : 'bg-neutral-700'}`}>
                      {message.isBot ? (
                        <Bot className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <User className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <div className={`px-4 py-2 rounded-2xl ${message.isBot ? 'bg-neutral-800 text-neutral-200' : 'bg-emerald-500 text-black'}`}>
                      <div className="text-sm leading-relaxed">
                        {message.isBot ? formatMessage(message.text) : message.text}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="px-4 py-3 bg-neutral-800 rounded-2xl">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-neutral-500 mb-2">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-neutral-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about Yash..."
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
