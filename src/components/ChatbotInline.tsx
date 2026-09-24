import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp } from 'lucide-react';
import { profile } from '../data/site';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}

interface ChatbotProps {
  mode?: 'general' | 'architecture';
  title?: string;
  placeholder?: string;
  suggestedQuestions?: string[];
}

const greeting = "Ask me anything about Yash's projects, experience or stack. Answers come from what he has written about his own work.";

// Render **bold** and line breaks from model output as React nodes, never as raw HTML.
const renderText = (text: string): ReactNode =>
  text.split('\n').map((line, i) => (
    <p key={i} className="mb-1 last:mb-0">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={j}>{part}</Fragment>
        ),
      )}
    </p>
  ));

const ChatbotInline = ({
  mode = 'general',
  title = 'Ask about my work',
  placeholder = 'Ask a question',
  suggestedQuestions = [
    'How does SpeedoExpress track drivers live?',
    'How is BiteSite kept multi-tenant?',
    'What is Yash looking for next?',
  ],
}: ChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, text: greeting, isBot: true }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isTyping) return;

    setMessages((prev) => [...prev, { id: Date.now(), text: messageText, isBot: false }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, mode }),
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: String(data.response ?? ''), isBot: true }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `I couldn't reach the assistant just now. You can email Yash directly at ${profile.email}.`,
          isBot: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[460px] flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-faint">AI answers, may be imperfect</span>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.isBot ? 'bg-sunken text-ink/90' : 'bg-accent text-accent-ink'
              }`}
            >
              {m.isBot ? renderText(m.text) : m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex">
            <div className="flex gap-1 rounded-xl bg-sunken px-3.5 py-3" aria-label="Assistant is typing">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              className="rounded-full border border-line px-3 py-1.5 text-left text-xs text-muted transition-colors hover:border-ink/25 hover:text-ink"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <label htmlFor={`chat-${title}`} className="sr-only">{placeholder}</label>
        <input
          id={`chat-${title}`}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          maxLength={1000}
          className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          aria-label="Send"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition-opacity disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
};

export default ChatbotInline;
