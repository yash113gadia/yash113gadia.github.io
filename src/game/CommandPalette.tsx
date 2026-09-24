import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Copy, FileText, Github, Linkedin, MapPin, Moon, Search, Trophy, BookOpen } from 'lucide-react';
import { profile } from '../data/site';
import { game, PALETTE_EVENT, requestDispatch, startChallenge } from './store';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  run: () => void;
}

const icon = (C: typeof Search) => <C className="h-4 w-4" strokeWidth={1.75} />;

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const show = () => {
    setQuery('');
    setActive(0);
    setOpen(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      } else if (e.key === 'Escape') setOpen(false);
    };
    const onOpen = () => show();
    window.addEventListener('keydown', onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const go = (hash: string) => () => {
    navigate(`/${hash}`);
    setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  const commands: Command[] = useMemo(
    () => [
      { id: 'challenge', label: 'Play: beat the dispatcher', hint: '5 rounds', icon: icon(Trophy), run: () => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(startChallenge, 450); } },
      { id: 'swarm', label: 'Play Neon Swarm', hint: 'The arcade game', icon: icon(MapPin), run: () => navigate('/play') },
      { id: 'dispatch', label: 'Dispatch a driver', hint: 'On the hero map', icon: icon(MapPin), run: () => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(requestDispatch, 350); } },
      { id: 'work', label: 'Go to selected work', icon: icon(ArrowRight), run: go('#work') },
      { id: 'experience', label: 'Go to experience', icon: icon(ArrowRight), run: go('#experience') },
      { id: 'about', label: 'Go to about', icon: icon(ArrowRight), run: go('#about') },
      { id: 'contact', label: 'Go to contact', icon: icon(ArrowRight), run: go('#contact') },
      { id: 'how', label: 'Read how the projects work', icon: icon(BookOpen), run: () => navigate('/project_description') },
      {
        id: 'theme',
        label: 'Switch theme',
        icon: icon(Moon),
        run: () => document.querySelector<HTMLButtonElement>('button[aria-label^="Switch to"]')?.click(),
      },
      {
        id: 'email',
        label: 'Copy email address',
        hint: profile.email,
        icon: icon(Copy),
        run: () => {
          void navigator.clipboard?.writeText(profile.email).catch(() => undefined);
        },
      },
      { id: 'resume', label: 'Open resume (PDF)', icon: icon(FileText), run: () => window.open(profile.resume, '_blank', 'noopener') },
      { id: 'github', label: 'Open GitHub', icon: icon(Github), run: () => window.open(profile.github, '_blank', 'noopener') },
      { id: 'linkedin', label: 'Open LinkedIn', icon: icon(Linkedin), run: () => window.open(profile.linkedin, '_blank', 'noopener') },
      {
        id: 'achievements',
        label: game.get().hidden ? 'Show achievements' : 'Hide achievements',
        icon: icon(Trophy),
        run: () => game.setHidden(!game.get().hidden),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => `${c.label} ${c.hint ?? ''}`.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  const runAt = (i: number) => {
    const c = filtered[i];
    if (!c) return;
    setOpen(false);
    c.run();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-canvas/60 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={reduce ? false : { opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-4 w-4 text-faint" strokeWidth={1.75} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActive((a) => Math.min(filtered.length - 1, a + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    runAt(active);
                  }
                }}
                placeholder="Type a command or search"
                aria-label="Search commands"
                aria-controls="palette-list"
                aria-activedescendant={filtered[active] ? `cmd-${filtered[active].id}` : undefined}
                className="h-12 flex-1 bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-faint">esc</kbd>
            </div>
            <ul id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matching commands.</li>}
              {filtered.map((c, i) => (
                <li
                  key={c.id}
                  id={`cmd-${c.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runAt(i)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${i === active ? 'bg-sunken text-ink' : 'text-muted'}`}
                >
                  <span className={i === active ? 'text-accent-fg' : 'text-faint'}>{c.icon}</span>
                  <span className="flex-1">{c.label}</span>
                  {c.hint && <span className="truncate font-mono text-xs text-faint">{c.hint}</span>}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
