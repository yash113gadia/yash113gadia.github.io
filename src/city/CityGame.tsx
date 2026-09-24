import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Home, Package, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CityEngine } from './engine';
import { landmark } from './map';
import { MISSIONS, type Marker, type MissionRun } from './missions';
import CaseFile from './CaseFile';
import { featured, profile } from '../data/site';

const SAVE_KEY = 'yg-city-v1';
const loadDone = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return Array.isArray(v.done) ? v.done.filter((d: unknown) => typeof d === 'string') : [];
  } catch {
    return [];
  }
};
const saveDone = (done: string[]) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ done }));
  } catch {
    /* storage blocked: progress just won't persist */
  }
};

type Overlay =
  | { kind: 'intro' }
  | { kind: 'brief'; index: number }
  | { kind: 'place'; id: string }
  | { kind: 'complete'; index: number }
  | { kind: 'failed'; index: number; reason: string }
  | { kind: 'finale' }
  | null;

interface Hud {
  objective: string;
  time: number | null;
  cargo: string[];
}

let noteId = 0;
const ease = [0.16, 1, 0.3, 1] as const;

const CityGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CityEngine | null>(null);
  // The running mission and its index travel together so the loop never sees one without the other.
  const runRef = useRef<{ run: MissionRun; index: number } | null>(null);
  const reduce = useReducedMotion();

  const [done, setDone] = useState<string[]>(loadDone);
  const [active, setActive] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'intro' });
  const [hud, setHud] = useState<Hud | null>(null);
  const [near, setNear] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ id: number; text: string }[]>([]);
  const [moved, setMoved] = useState(false);

  const nextIndex = (d: string[]) => MISSIONS.findIndex((m) => !d.includes(m.id));

  const note = useCallback((text: string) => {
    const id = ++noteId;
    setNotes((n) => [...n.slice(-2), { id, text }]);
    setTimeout(() => setNotes((n) => n.filter((x) => x.id !== id)), 5200);
  }, []);

  // Keep the latest callbacks reachable from the engine loop without restarting it.
  const handlers = useRef({ onDone: (i: number) => void i, onFail: (i: number, r: string) => void [i, r], note });

  const startMission = useCallback((index: number) => {
    runRef.current = { run: MISSIONS[index].create(), index };
    setActive(index);
    setOverlay(null);
  }, []);

  handlers.current = {
    note,
    onDone: (index) => {
      runRef.current = null;
      setHud(null);
      setActive(null);
      const id = MISSIONS[index].id;
      setDone((d) => {
        const next = d.includes(id) ? d : [...d, id];
        saveDone(next);
        return next;
      });
      setOverlay({ kind: 'complete', index });
    },
    onFail: (index, reason) => {
      runRef.current = null;
      setHud(null);
      setActive(null);
      setOverlay({ kind: 'failed', index, reason });
    },
  };

  // Engine lifetime.
  useEffect(() => {
    const canvas = canvasRef.current!;
    let lastHud = '';
    const engine = new CityEngine(canvas, {
      tick: (p, dt) => {
        const current = runRef.current;
        if (!current) return [];
        const { run, index } = current;
        const { status, notes: n } = run.update(p, dt);
        n.forEach((t) => handlers.current.note(t));
        if (status === 'done') {
          handlers.current.onDone(index);
          return [];
        }
        if (typeof status === 'object') {
          handlers.current.onFail(index, status.failed);
          return [];
        }
        const t = run.timeLeft();
        const next: Hud = { objective: run.objective(), time: t === null ? null : Math.max(0, Math.ceil(t)), cargo: run.cargo() };
        const key = JSON.stringify(next);
        if (key !== lastHud) {
          lastHud = key;
          setHud(next);
        }
        return run.markers() as Marker[];
      },
      onNear: (id) => setNear(id),
      onMoved: () => setMoved(true),
    });
    engineRef.current = engine;
    engine.start();
    // Automation hook for tests: read position and teleport, nothing else.
    (window as unknown as { __city?: unknown }).__city = { state: () => engine.state(), teleport: (x: number, y: number) => engine.teleport(x, y) };
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);


  // Pause the world whenever something is open on top of it.
  useEffect(() => {
    if (engineRef.current) engineRef.current.paused = overlay !== null;
  }, [overlay]);

  // Keyboard: E / Enter opens the place you're at; Escape closes overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && !overlay && near) {
        e.preventDefault();
        setOverlay({ kind: 'place', id: near });
      } else if (e.key === 'Escape' && overlay && overlay.kind !== 'intro') setOverlay(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlay, near]);

  const begin = () => {
    const i = nextIndex(done);
    if (i === -1) setOverlay(null);
    else setOverlay({ kind: 'brief', index: i });
  };

  const afterComplete = (index: number) => {
    const i = nextIndex(done);
    if (i === -1 || index === MISSIONS.length - 1) setOverlay({ kind: 'finale' });
    else setOverlay({ kind: 'brief', index: i });
  };

  const replay = () => {
    setDone([]);
    saveDone([]);
    engineRef.current?.respawn();
    setOverlay({ kind: 'brief', index: 0 });
  };

  const nearLm = near ? landmark(near) : null;
  const doneCount = done.length;

  return (
    // Always dark, in the city's blue-night palette, whatever the site theme is.
    <div className="dark city fixed inset-0 overflow-hidden bg-canvas text-ink">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none select-none" aria-hidden />
      {/* Vignette in CSS so the GPU composites it instead of the canvas filling it every frame. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,3,9,0)_45%,rgba(2,3,9,0.72)_100%)]" />

      {/* Screen readers and search engines get the portfolio directly. */}
      <nav className="sr-only" aria-label="Portfolio">
        <h1>{profile.name}, full-stack engineer</h1>
        <p>This page is a small delivery game through a city of my projects. The same work is on the classic portfolio.</p>
        <ul>
          <li>
            <Link to="/">Classic portfolio</Link>
          </li>
          {featured.map((f) => (
            <li key={f.id}>
              <Link to={`/project_description#${f.id}`}>{f.title}: {f.summary}</Link>
            </li>
          ))}
          <li>
            <a href={profile.resume}>Resume (PDF)</a>
          </li>
          <li>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
        </ul>
      </nav>

      {/* Top bar: mission on the left, skip on the right. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto min-w-0 max-w-[min(420px,calc(100vw-9rem))]">
          {hud && active !== null ? (
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-line bg-surface/85 p-3 backdrop-blur-md sm:p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-accent-fg">
                  Mission {active + 1}/{MISSIONS.length} · {MISSIONS[active].title}
                </p>
                {hud.time !== null && (
                  <p className={`flex items-center gap-1 font-mono text-sm tabular-nums ${hud.time <= 15 ? 'text-red-400' : 'text-ink'}`}>
                    <Timer className="h-3.5 w-3.5" strokeWidth={2} />
                    {Math.floor(hud.time / 60)}:{String(hud.time % 60).padStart(2, '0')}
                  </p>
                )}
              </div>
              <p className="mt-1 text-sm font-semibold leading-snug sm:text-[15px]">{hud.objective}</p>
              {hud.cargo.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {hud.cargo.map((c) => (
                    <li key={c} className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
                      <Package className="h-3 w-3 text-accent-fg" strokeWidth={2} />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ) : (
            overlay === null && (
              <div className="rounded-xl border border-line bg-surface/85 p-3 backdrop-blur-md">
                <p className="text-[11px] font-medium text-accent-fg">Free ride · {doneCount}/{MISSIONS.length} missions done</p>
                <p className="mt-1 text-sm">Ride up to any building to open its case file.</p>
                {nextIndex(done) !== -1 ? (
                  <button type="button" onClick={begin} className="mt-2 text-sm font-medium text-accent-fg">
                    Start the next mission
                  </button>
                ) : (
                  <button type="button" onClick={replay} className="mt-2 text-sm font-medium text-accent-fg">
                    Replay the missions
                  </button>
                )}
              </div>
            )
          )}

          {/* Mission notes: short, stacked, self-dismissing. */}
          <div className="mt-2 space-y-2" aria-live="polite">
            <AnimatePresence>
              {notes.map((n) => (
                <motion.p
                  key={n.id}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="rounded-lg border border-accent/25 bg-canvas/85 px-3 py-2 text-[13px] leading-snug backdrop-blur"
                >
                  {n.text}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => engineRef.current?.respawn()}
            aria-label="Back to HQ"
            title="Back to HQ"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface/85 text-muted backdrop-blur hover:text-ink"
          >
            <Home className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <Link to="/" className="btn-ghost h-10 bg-surface/85 px-4 text-[13px] backdrop-blur">
            Skip to portfolio
          </Link>
        </div>
      </div>

      {/* Prompt at a building's door. Centred by a static wrapper: Framer's inline transform
          would override a translate class on the animated button itself. */}
      <div className="pointer-events-none absolute inset-x-4 bottom-24 flex justify-center sm:bottom-20">
        <AnimatePresence>
          {nearLm && overlay === null && (
            <motion.button
              type="button"
              onClick={() => setOverlay({ kind: 'place', id: nearLm.id })}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="pointer-events-auto flex max-w-full items-center gap-3 whitespace-nowrap rounded-full border border-accent/40 bg-surface/90 px-4 py-2.5 text-sm backdrop-blur"
            >
              <span className="truncate font-semibold">{nearLm.name}</span>
              <span className="shrink-0 text-muted">Open case file</span>
              <kbd className="hidden shrink-0 rounded border border-line px-1.5 font-mono text-[11px] text-faint sm:inline">E</kbd>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Controls hint until the first move. */}
      {!moved && overlay === null && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-canvas/70 px-4 py-2 text-xs text-muted backdrop-blur">
          <span className="hidden sm:inline">Ride with the arrow keys or WASD. Or drag anywhere.</span>
          <span className="sm:hidden">Touch and drag anywhere to ride.</span>
        </p>
      )}

      {/* ---- Overlays -------------------------------------------------- */}
      <AnimatePresence>
        {overlay?.kind === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-30 flex flex-col justify-end bg-gradient-to-t from-canvas via-canvas/85 to-canvas/30 p-6 pb-10 sm:justify-center sm:bg-gradient-to-r sm:from-canvas sm:from-35% sm:via-canvas/85 sm:via-55% sm:to-canvas/20 sm:p-16"
          >
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-accent-fg">Founding engineer at SpeedoExpress</p>
              <h1 className="display mt-3 text-[clamp(3.5rem,14vw,9rem)] font-bold leading-[0.85]">Yash Gadia</h1>
              <p className="mt-6 max-w-[40ch] text-lg leading-snug text-ink/90 sm:text-xl">
                I build production systems, end to end. This portfolio is a city: each building is something I built. Deliver
                orders to see how they work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={begin} className="btn-primary px-6 py-3 text-[15px]" autoFocus>
                  {doneCount > 0 && doneCount < MISSIONS.length ? 'Continue riding' : 'Start riding'}
                </button>
                <Link to="/" className="btn-ghost px-6 py-3 text-[15px]">
                  Skip to portfolio
                </Link>
              </div>
              <p className="mt-6 text-xs text-faint">
                Five short missions, a few minutes in total. Progress is saved on this device.
              </p>
            </div>
          </motion.div>
        )}

        {overlay?.kind === 'brief' && (
          <motion.div
            key={`brief-${overlay.index}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="absolute inset-0 z-30 grid place-items-center bg-canvas/40 p-4 backdrop-blur-[2px]"
          >
            <div role="dialog" aria-modal="true" aria-label="Mission briefing" className="w-full max-w-md rounded-2xl border border-accent/30 bg-surface p-6">
              <p className="text-xs font-medium text-accent-fg">
                Mission {overlay.index + 1} of {MISSIONS.length}
              </p>
              <h2 className="display mt-1 text-4xl font-bold leading-none">{MISSIONS[overlay.index].title}</h2>
              <p className="mt-4 leading-relaxed text-ink/90">{MISSIONS[overlay.index].brief}</p>
              <p className="mt-2 text-sm text-muted">Follow the glowing markers. Arrows at the screen edge point to them.</p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => startMission(overlay.index)} className="btn-primary" autoFocus>
                  Go
                </button>
                <button type="button" onClick={() => setOverlay(null)} className="btn-ghost">
                  Just ride around
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {overlay?.kind === 'failed' && (
          <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 grid place-items-center bg-canvas/50 p-4 backdrop-blur-[2px]">
            <div role="dialog" aria-modal="true" aria-label="Mission failed" className="w-full max-w-md rounded-2xl border border-line bg-surface p-6">
              <p className="text-xs font-medium text-red-400">Mission failed</p>
              <h2 className="display mt-1 text-3xl font-bold leading-none">{MISSIONS[overlay.index].title}</h2>
              <p className="mt-4 text-ink/90">{overlay.reason}</p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => startMission(overlay.index)} className="btn-primary" autoFocus>
                  Try again
                </button>
                <button type="button" onClick={() => setOverlay(null)} className="btn-ghost">
                  Ride around
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {overlay?.kind === 'finale' && (
          <motion.div key="finale" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 grid place-items-center bg-canvas/70 p-4 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-label="All missions complete" className="w-full max-w-lg rounded-2xl border border-accent/40 bg-surface p-7">
              <p className="text-xs font-medium text-accent-fg">All five delivered</p>
              <h2 className="display mt-2 text-5xl font-bold leading-[0.9]">That’s the job.</h2>
              <p className="mt-5 leading-relaxed text-ink/90">
                Live tracking that forgets stale drivers, tenants that can’t see each other, tracking numbers customers can
                follow, fingerprints that catch edits, and sandboxes that assume the worst. You just rode through the real
                problems behind my work.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`mailto:${profile.email}`} className="btn-primary">
                  Email me <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </a>
                <Link to="/" className="btn-ghost">
                  See the full portfolio
                </Link>
                <button type="button" onClick={() => setOverlay(null)} className="btn-ghost">
                  Keep riding
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {overlay?.kind === 'place' && <CaseFile place={overlay.id} onClose={() => setOverlay(null)} />}
      {overlay?.kind === 'complete' && (
        <CaseFile
          mission={{
            title: MISSIONS[overlay.index].title,
            lesson: MISSIONS[overlay.index].lesson,
            project: MISSIONS[overlay.index].card,
            last: nextIndex(done) === -1,
          }}
          onClose={() => setOverlay(null)}
          onNext={() => afterComplete(overlay.index)}
        />
      )}

    </div>
  );
};

export default CityGame;
