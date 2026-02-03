import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, ChevronDown } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}

type Personality = 'professional' | 'genz' | 'boomer' | 'stoned';

const personalities: { id: Personality; label: string; emoji: string }[] = [
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'genz', label: 'GenZ', emoji: '✨' },
  { id: 'boomer', label: 'Boomer', emoji: '👴' },
  { id: 'stoned', label: 'Stoned', emoji: '🌿' },
];

const greetings: Record<Personality, string> = {
  professional: "Hello! I'm here to help you learn about Yash's qualifications, experience, and skills. How may I assist you?",
  genz: "yooo what's good!! 💀✨ ask me anything about yash, he's literally so goated no cap frfr",
  boomer: "Well hello there! Welcome to Yash's cyber page. I'm here to tell you about this talented young man. What would you like to know?",
  stoned: "heyyy... duuude... welcome... 🌿 so like... yash is pretty cool maaaan... ask me whatever... i got time...",
};

// Fallback responses if API fails
const getFallbackResponse = (): string => {
  return "Hmm, I'm having trouble connecting right now. Feel free to reach out to Yash directly at yash113gadia@gmail.com!";
};

const suggestedQuestions = [
  "What are his skills?",
  "Tell me about Qlaa",
  "Why hire Yash?",
];

const ChatbotInline = () => {
  const [personality, setPersonality] = useState<Personality>('professional');
  const [showPersonalityMenu, setShowPersonalityMenu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: greetings.professional, isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePersonalityChange = (newPersonality: Personality) => {
    setPersonality(newPersonality);
    setShowPersonalityMenu(false);
    setMessages([{ id: Date.now(), text: greetings[newPersonality], isBot: true }]);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now(), text: messageText, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, personality }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const botMessage: Message = { id: Date.now() + 1, text: data.response, isBot: true };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallback = getFallbackResponse();
      const botMessage: Message = { id: Date.now() + 1, text: fallback, isBot: true };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-emerald-400">$1</strong>');
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  const currentPersonality = personalities.find(p => p.id === personality)!;

  return (
    <div className="bento-card h-[400px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-white font-semibold">Ask about Yash</h4>
            <p className="text-xs text-neutral-500">Powered by Gemini AI</p>
          </div>
        </div>

        {/* Personality Selector */}
        <div className="relative">
          <button
            onClick={() => setShowPersonalityMenu(!showPersonalityMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors"
          >
            <span>{currentPersonality.emoji}</span>
            <span className="hidden sm:inline">{currentPersonality.label}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <AnimatePresence>
            {showPersonalityMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 bg-neutral-800 rounded-lg overflow-hidden shadow-xl border border-neutral-700 z-10"
              >
                {personalities.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePersonalityChange(p.id)}
                    className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-neutral-700 transition-colors ${
                      personality === p.id ? 'bg-neutral-700 text-emerald-400' : 'text-neutral-300'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-4 space-y-3">
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
          disabled={!input.trim() || isTyping}
          className="w-9 h-9 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-700 rounded-xl flex items-center justify-center transition-colors"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
};

export default ChatbotInline;
