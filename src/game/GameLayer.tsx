import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Trophy, X, Lock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ACHIEVEMENTS, game, type UnlockEvent } from './store';
import { useGame } from './useGame';

const ease = [0.16, 1, 0.3, 1] as const;

// Small, self-dismissing toast. Never blocks anything; one at a time.
const Toast = ({ event, onDone, rushed }: { event: UnlockEvent; onDone: () => void; rushed: boolean }) => {
  const reduce = useReducedMotion();
  useEffect(() => {
    // When several unlocks are waiting, move through them faster.
    const t = setTimeout(onDone, event.complete ? 6500 : rushed ? 1800 : 4200);
    return () => clearTimeout(t);
  }, [event, onDone, rushed]);
  const { achievement, complete } = event;
  return (
    <motion.div
      role="status"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.45, ease }}
      className="pointer-events-auto relative w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-accent/40 bg-surface/95 p-4 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.6)] backdrop-blur"
    >
      {/* A sweep of light across the toast as it arrives. */}
      {!reduce && (
        <motion.span
          aria-hidden
          initial={{ x: '-120%' }}
          animate={{ x: '220%' }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.15 }}
          className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-accent/25 to-transparent"
        />
      )}
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
          <Trophy className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-accent-fg">{complete ? 'All achievements unlocked' : 'Achievement unlocked'}</p>
          <p className="mt-0.5 font-semibold">{achievement.title}</p>
          <p className="mt-0.5 text-sm text-muted">
            {complete ? "You found everything. I'd genuinely like to hear what you thought." : achievement.hint}
          </p>
          {achievement.reward && (
            <Link to={achievement.reward.href} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-fg">
              {achievement.reward.label} <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          )}
          {complete && (
            <a href="mailto:yash113gadia@gmail.com" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-fg">
              Tell me <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          )}
        </div>
        <button type="button" onClick={onDone} aria-label="Dismiss" className="text-faint hover:text-ink">
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </motion.div>
  );
};

const GameLayer = () => {
  const state = useGame();
  const [queue, setQueue] = useState<UnlockEvent[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const count = Object.keys(state.unlocked).length;
  const total = ACHIEVEMENTS.length;

  useEffect(() => game.onUnlock((e) => setQueue((q) => [...q, e])), []);

  // Close the panel on Escape or an outside click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  if (state.hidden) return null;
  const current = queue[0];

  return (
    <>
      {/* Toasts sit under the nav, where the page is empty sky on desktop. */}
      <div className="pointer-events-none fixed inset-x-4 top-20 z-50 flex justify-center sm:inset-x-auto sm:right-6">
        <AnimatePresence>
          {current && (
            <Toast key={current.achievement.id} event={current} rushed={queue.length > 1} onDone={() => setQueue((q) => q.slice(1))} />
          )}
        </AnimatePresence>
      </div>
    <div ref={panelRef} className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            id="achievements"
            role="dialog"
            aria-label="Achievements"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease }}
            className="pointer-events-auto w-[min(360px,calc(100vw-2rem))] rounded-xl border border-line bg-surface/95 p-5 backdrop-blur"
          >
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">Explore the site</p>
              <p className="font-mono text-sm text-muted">{count}/{total}</p>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-sunken">
              <motion.div className="h-full bg-accent" initial={false} animate={{ width: `${(count / total) * 100}%` }} transition={{ duration: 0.6, ease }} />
            </div>
            <ul className="mt-4 space-y-3">
              {ACHIEVEMENTS.map((a) => {
                const done = Boolean(state.unlocked[a.id]);
                return (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${done ? 'bg-accent text-accent-ink' : 'border border-line text-faint'}`}>
                      {done ? <Trophy className="h-3 w-3" strokeWidth={2.25} /> : <Lock className="h-3 w-3" strokeWidth={2} />}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${done ? '' : 'text-muted'}`}>{a.title}</p>
                      <p className="text-xs text-faint">{a.hint}</p>
                      {done && a.reward && (
                        <Link to={a.reward.href} onClick={() => setOpen(false)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent-fg">
                          {a.reward.label} <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-faint">Deliveries you dispatched: {state.delivered}</p>
            <div className="mt-4 flex gap-4 border-t border-line pt-3 text-xs">
              <button type="button" onClick={() => game.reset()} className="text-muted hover:text-ink">Reset progress</button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  game.setHidden(true);
                }}
                className="text-muted hover:text-ink"
              >
                Hide this (bring it back with ⌘K)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="achievements"
        aria-label={`Achievements, ${count} of ${total} unlocked`}
        key={count}
        initial={reduce || count === 0 ? false : { scale: 1.25 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-surface/85 px-3 py-2 text-sm backdrop-blur transition-colors hover:border-accent/60"
      >
        <Trophy className={`h-4 w-4 ${count ? 'text-accent-fg' : 'text-faint'}`} strokeWidth={2} />
        <span className="font-mono tabular-nums">
          {count}/{total}
        </span>
      </motion.button>
    </div>
    </>
  );
};

export default GameLayer;
