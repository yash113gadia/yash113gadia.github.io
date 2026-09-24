import { useCallback, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import LiveMap, { type ChallengeEvent, type DispatchStats } from './LiveMap';
import ChallengePanel, { type ChallengeUI } from '../game/ChallengePanel';
import { game, scoreOf } from '../game/store';
import Magnetic from './Magnetic';
import { profile } from '../data/site';

const live = [
  { label: 'speedoexpress.org', href: 'https://www.speedoexpress.org' },
  { label: 'bitesite.in', href: 'https://www.bitesite.in' },
  { label: 'worldexpress.in', href: 'https://worldexpress.in' },
];

const ease = [0.16, 1, 0.3, 1] as const;

// Each letter rises out of a mask, one after another.
const RisingWord = ({ word, delay, reduce }: { word: string; delay: number; reduce: boolean | null }) => (
  <span className="block whitespace-nowrap" aria-hidden>
    {word.split('').map((ch, i) => (
      <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
        <motion.span
          className="inline-block"
          initial={reduce ? false : { y: '105%' }}
          animate={{ y: 0 }}
          transition={{ duration: 1.1, delay: delay + i * 0.045, ease }}
        >
          {ch}
        </motion.span>
      </span>
    ))}
  </span>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div>
    <dt className="text-[11px] text-faint">{label}</dt>
    <dd className="mt-0.5 font-mono text-xl tabular-nums text-ink">{value}</dd>
  </div>
);

const Hero = () => {
  const reduce = useReducedMotion();
  const [stats, setStats] = useState<DispatchStats | null>(null);
  const onStats = useCallback((s: DispatchStats) => setStats(s), []);
  const [ui, setUi] = useState<ChallengeUI>({ mode: 'idle' });
  const onChallenge = useCallback((e: ChallengeEvent) => {
    if (e.type === 'await') setUi({ mode: 'await', round: e.round, total: e.total, missed: false });
    else if (e.type === 'miss') setUi((u) => (u.mode === 'await' ? { ...u, missed: true } : u));
    else if (e.type === 'result') {
      setUi({ mode: 'result', result: e.result });
      if (e.result.staleFor !== null) game.unlock('ttl');
    } else {
      setUi({ mode: 'done', results: e.results });
      game.unlock('dispatcher');
      if (scoreOf(e.results) >= 90) game.unlock('sharp');
    }
  }, []);
  const playing = ui.mode === 'await' || ui.mode === 'result';

  // The hero pins while you scroll through it: the camera pitches down over the city
  // and the copy lifts away, then the page continues.
  const pinRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ['start start', 'end end'] });
  const tilt = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const copyY = useTransform(scrollYProgress, [0, 0.8], ['0%', '-35%']);
  const copyOpacity = useTransform(scrollYProgress, [0.05, 0.6], [1, 0]);
  const hudOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease },
        };

  const summary = stats
    ? `${stats.online} drivers, ${stats.enRoute} en route, ${stats.delivered} delivered`
    : 'Dispatch simulation';

  return (
    <>
      <div ref={pinRef} className={reduce ? '' : 'h-[175dvh]'}>
        <section className="relative isolate flex h-[calc(100dvh-4rem)] min-h-[560px] flex-col overflow-hidden motion-safe:sticky motion-safe:top-16">
          <LiveMap onStats={onStats} onChallenge={onChallenge} tilt={reduce ? undefined : tilt} className="absolute inset-0 -z-10 h-full w-full" />
          {/* Keeps the copy legible over the map without hiding it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgb(var(--canvas))_0%,rgb(var(--canvas)/0.8)_38%,transparent_58%)] lg:bg-[radial-gradient(ellipse_at_15%_85%,rgb(var(--canvas)/0.95)_0%,rgb(var(--canvas)/0.7)_30%,transparent_60%)]"
          />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-canvas to-transparent" />

          <motion.div
            style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}
            className="page-x pointer-events-none grid gap-10 pb-10 pt-10 lg:mt-auto lg:grid-cols-12 lg:items-end lg:pb-16 lg:pt-24"
          >
            <div data-occlude className="lg:col-span-8">
              <motion.p {...enter(0.1)} className="text-sm font-medium text-accent-fg">
                Founding engineer at SpeedoExpress
              </motion.p>
              <h1
                aria-label={profile.name}
                className="display mt-3 text-[23vw] font-bold leading-[0.84] sm:mt-4 sm:text-[clamp(3.6rem,12vw,10.5rem)] sm:leading-[0.86]"
              >
                <RisingWord word="Yash" delay={0.15} reduce={reduce} />
                <RisingWord word="Gadia" delay={0.33} reduce={reduce} />
              </h1>
              <motion.p {...enter(0.7)} className="mt-6 max-w-[34ch] text-lg leading-snug text-ink/90 sm:mt-7 sm:text-xl md:text-2xl">
                I build production systems, end to end. <span className="text-muted">Below is a small one you can play.</span>
              </motion.p>
              <motion.div {...enter(0.8)} className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <a href="#work" className="btn-primary px-6 py-3 text-[15px]">
                    See work <ArrowDown className="h-4 w-4" strokeWidth={2} />
                  </a>
                </Magnetic>
                <Magnetic>
                  <a href={profile.resume} className="btn-ghost bg-canvas/60 px-6 py-3 text-[15px] backdrop-blur">
                    Resume
                  </a>
                </Magnetic>
              </motion.div>
              {/* Phones get a one-line version of the dispatch panel. */}
              <motion.p {...enter(1)} className="mt-6 flex items-center gap-2 font-mono text-xs text-muted lg:hidden">
                <span className="relative flex h-1.5 w-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Simulated: {summary}
              </motion.p>
            </div>

            <motion.aside
              {...enter(1.1)}
              data-occlude
              style={reduce ? undefined : { opacity: hudOpacity }}
              aria-label="Dispatch simulation"
              className="pointer-events-auto hidden rounded-xl border border-line bg-surface/75 p-5 backdrop-blur-md lg:col-span-4 lg:block"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Dispatch, simulated</p>
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                <Stat label="Drivers" value={stats?.online ?? 0} />
                <Stat label="En route" value={stats?.enRoute ?? 0} />
                <Stat label="Delivered" value={stats?.delivered ?? 0} />
              </dl>
              <div className="mt-4 rounded-lg border border-accent/25 bg-accent/[0.07] p-3">
                <ChallengePanel ui={ui} />
              </div>
              <p className={`mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted ${playing ? 'hidden' : ''}`}>
                {stats?.lastMatch
                  ? `Last match: driver ${String(stats.lastMatch.driver).padStart(2, '0')}, ${stats.lastMatch.km.toFixed(1)} km by road. Trails expire after 2.2 s, like the Redis TTLs in production.`
                  : 'Nearest driver is picked by road distance (Dijkstra), not straight-line distance.'}
              </p>
            </motion.aside>
          </motion.div>

          {/* Phones: the challenge card floats over the city, clear of the headline. */}
          <motion.div
            {...enter(1.1)}
            style={reduce ? undefined : { opacity: hudOpacity }}
            data-occlude
            className="absolute inset-x-4 bottom-16 rounded-xl border border-accent/25 bg-surface/85 p-4 backdrop-blur-md lg:hidden"
          >
            <ChallengePanel ui={ui} compact />
          </motion.div>
        </section>
      </div>

      <section aria-label="Live products" className="relative border-y border-line bg-canvas">
        <div className="page-x flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-8">
          <p className="text-sm text-muted">Running in production</p>
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {live.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 font-mono text-sm text-ink"
                >
                  {l.label}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-fg"
                    strokeWidth={2}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

export default Hero;
