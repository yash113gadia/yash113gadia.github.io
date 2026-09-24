import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RoundResult } from '../components/LiveMap';
import { scoreOf, startChallenge } from './store';

export type ChallengeUI =
  | { mode: 'idle' }
  | { mode: 'await'; round: number; total: number; missed: boolean }
  | { mode: 'result'; result: RoundResult }
  | { mode: 'done'; results: RoundResult[] };

const pad = (n: number) => String(n).padStart(2, '0');
const kmText = (km: number) => (km < 0.1 ? "under 0.1 km" : `${km.toFixed(1)} km`);

// One plain sentence per round, each explaining what actually happened.
const explain = (r: RoundResult) => {
  if (r.staleFor !== null) {
    return {
      title: `Driver ${pad(r.chosen)} wasn’t really there.`,
      body: `That position was ${r.staleFor} s old. In production every position is written to Redis with a short TTL, so a driver who stops reporting drops off the map instead of getting the job. Driver ${pad(r.best)} took it: ${kmText(r.bestKm)} by road.`,
    };
  }
  if (r.chosen === r.best) {
    return {
      title: 'Perfect. Same pick as the algorithm.',
      body: `Driver ${pad(r.best)} was the nearest by road: ${kmText(r.bestKm)}.`,
    };
  }
  if (r.decoy && r.decoy.driver === r.chosen) {
    return {
      title: `Driver ${pad(r.chosen)} only looked closest.`,
      body: `As the crow flies, yes. By road it’s ${kmText(r.chosenKm!)}; driver ${pad(r.best)} was ${kmText(r.bestKm)}. That’s why dispatch measures along streets (PostGIS routing), not in straight lines.`,
    };
  }
  return {
    title: `${Math.round(r.efficiency * 100)}% efficient.`,
    body: `You sent driver ${pad(r.chosen)}: ${kmText(r.chosenKm!)} by road. Driver ${pad(r.best)} was ${kmText(r.bestKm)}; its route is the dotted line.`,
  };
};

const verdict = (score: number) =>
  score >= 95 ? 'You dispatch like the algorithm.' : score >= 80 ? 'Sharp. A few metres off.' : score >= 50 ? 'Not bad for eyeballing it.' : 'Streets are harder than they look.';

const ChallengePanel = ({ ui, compact = false }: { ui: ChallengeUI; compact?: boolean }) => {
  const reduce = useReducedMotion();
  const key = ui.mode === 'await' ? `a${ui.round}${ui.missed}` : ui.mode === 'result' ? `r${ui.result.round}` : ui.mode;

  return (
    <div aria-live="polite" className="relative">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {ui.mode === 'idle' && (
            <>
              <p className="text-sm font-semibold">Beat the dispatcher</p>
              <p className={`mt-1 text-muted ${compact ? 'text-xs' : 'text-[13px] leading-relaxed'}`}>
                Five pickups. Tap the driver you’d send. The algorithm picks the nearest by road; see if you can match it.
              </p>
              <button type="button" onClick={startChallenge} className="btn-primary mt-3 px-4 py-2 text-[13px]">
                Play, 5 rounds
              </button>
            </>
          )}

          {ui.mode === 'await' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Pickup {ui.round} of {ui.total}</p>
                <Dots done={ui.round - 1} total={ui.total} />
              </div>
              <p className={`mt-1 ${ui.missed ? 'text-accent-fg' : 'text-muted'} ${compact ? 'text-xs' : 'text-[13px]'}`}>
                {ui.missed ? 'Tap a driver dot, not the street.' : 'Tap the driver you’d send to the glowing pickup.'}
              </p>
            </>
          )}

          {ui.mode === 'result' && (() => {
            const e = explain(ui.result);
            return (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{e.title}</p>
                  <Dots done={ui.result.round} total={ui.result.total} />
                </div>
                <p className={`mt-1 text-muted ${compact ? 'text-xs' : 'text-[13px] leading-relaxed'}`}>{e.body}</p>
              </>
            );
          })()}

          {ui.mode === 'done' && (() => {
            const score = scoreOf(ui.results);
            const sawGhost = ui.results.some((r) => r.staleFor !== null);
            const sawDecoy = ui.results.some((r) => r.decoy !== null);
            return (
              <>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold">Your dispatch score</p>
                  <p className="display text-3xl font-bold tabular-nums text-accent-fg">{score}</p>
                </div>
                <p className={`mt-1 ${compact ? 'text-xs' : 'text-[13px]'}`}>{verdict(score)}</p>
                {!compact && (
                  <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted">
                    {sawDecoy && <li>The nearest-looking driver often isn’t the nearest by road.</li>}
                    <li>
                      {sawGhost
                        ? 'Stale positions expire; a driver who stopped reporting shouldn’t get jobs.'
                        : 'You didn’t pick a ghost. The dashed dots were positions that stopped updating.'}
                    </li>
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                  <Link to="/project_description#speedoexpress" className="inline-flex items-center gap-1 font-medium text-accent-fg">
                    How the real one works <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                  <button type="button" onClick={startChallenge} className="inline-flex items-center gap-1 text-muted hover:text-ink">
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} /> Again
                  </button>
                </div>
              </>
            );
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const Dots = ({ done, total }: { done: number; total: number }) => (
  <span className="flex shrink-0 gap-1" aria-label={`${done} of ${total} done`}>
    {Array.from({ length: total }, (_, i) => (
      <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < done ? 'bg-accent' : 'bg-line'}`} />
    ))}
  </span>
);

export default ChallengePanel;
