import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { game } from '../game/store';
import { ArrowUpRight, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import RevealText from './RevealText';
import CountUp from './CountUp';
import { featured, moreProjects, type FeaturedProject } from '../data/site';

// Firebase is loaded on demand so it stays out of the initial bundle.
const track = (id: string) => {
  void import('../services/firestore').then((m) => m.trackProjectView(id));
};

type Tone = 'accent' | 'surface' | 'sunken';
const tones: Record<Tone, { card: string; muted: string; chip: string; link: string }> = {
  accent: {
    card: 'bg-accent text-accent-ink border-transparent',
    muted: 'text-accent-ink/70',
    chip: 'border-accent-ink/25 text-accent-ink/80',
    link: 'text-accent-ink',
  },
  surface: { card: 'bg-surface text-ink border-line', muted: 'text-muted', chip: 'border-line text-muted', link: 'text-ink' },
  sunken: { card: 'bg-sunken text-ink border-line', muted: 'text-muted', chip: 'border-line text-muted', link: 'text-ink' },
};
const toneOrder: Tone[] = ['accent', 'surface', 'sunken', 'surface'];

const providers = ['Anthropic', 'OpenAI', 'Google', 'Ollama'];

// Keep in sync with the `stack` screen in tailwind.config.js.
const STACK_QUERY = '(min-width: 1024px) and (min-height: 700px)';
const useStacked = () =>
  useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(STACK_QUERY);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(STACK_QUERY).matches,
    () => false,
  );

const ProjectVisual = ({ p }: { p: FeaturedProject }) => {
  if (p.image) {
    const [w, h] = p.imageSize ?? [1280, 720];
    return (
      <div className="overflow-hidden rounded-lg border border-black/10" style={{ aspectRatio: `${w} / ${h}` }}>
        <img src={p.image} alt={p.imageAlt} loading="lazy" width={w} height={h} className="h-full w-full object-cover" />
      </div>
    );
  }
  // CodePilot has no screenshot; show the idea instead: one agent, any provider.
  return (
    <div className="flex h-full flex-col justify-center gap-1 rounded-lg border border-line bg-canvas p-6 sm:min-h-[220px] sm:p-8">
      <p className="mb-3 font-mono text-sm text-faint">$ codepilot --provider</p>
      {providers.map((name, i) => (
        <span
          key={name}
          className="provider-cycle display text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none"
          style={{ animationDelay: `${i * 1.2}s` }}
        >
          {name}
        </span>
      ))}
    </div>
  );
};

const Card = ({
  p,
  i,
  count,
  progress,
  stacked,
}: {
  p: FeaturedProject;
  i: number;
  count: number;
  progress: MotionValue<number>;
  stacked: boolean;
}) => {
  const reduce = useReducedMotion();
  const tone = tones[toneOrder[i % toneOrder.length]];
  // Reaching the last card counts as having seen them all.
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { amount: 0.5 });
  useEffect(() => {
    if (seen && i === count - 1) game.unlock('deep-dive');
  }, [seen, i, count]);
  // Earlier cards shrink slightly as later ones slide over them.
  const scale = useTransform(progress, [i / count, 1], [1, 1 - (count - 1 - i) * 0.045]);

  return (
    <div className="stack:sticky stack:top-20 stack:flex stack:h-[calc(100dvh-5rem)] stack:items-start stack:pt-4">
      <motion.article
        ref={ref}
        id={`work-${p.id}`}
        style={reduce || !stacked ? undefined : { scale, top: i * 18 }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
          e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
        }}
        className={`spotlight ${toneOrder[i % toneOrder.length] === 'accent' ? 'is-accent' : ''} relative grid w-full origin-top gap-8 overflow-hidden rounded-2xl border p-6 stack:h-[min(640px,calc(100dvh-8rem))] md:grid-cols-12 md:p-10 ${tone.card}`}
      >
        <div className="flex min-w-0 flex-col [container-type:inline-size] md:col-span-5">
          <p className={`text-sm font-medium ${tone.muted}`}>{p.kind}</p>
          {/* Sized to the column (cqi), so long names like "SpeedoExpress" never run under the visual. */}
          <h3 className="display mt-3 text-[min(4.6rem,13.5cqi)] font-bold leading-[0.9]">{p.title}</h3>
          <p className="mt-4 text-base leading-relaxed sm:mt-5 sm:text-[17px]">{p.summary}</p>
          <ul className={`mt-4 hidden space-y-2 text-sm leading-relaxed sm:block ${tone.muted}`}>
            {p.highlights.slice(0, 2).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {p.tech.map((t) => (
              <li key={t} className={`rounded-full border px-2.5 py-0.5 font-mono text-[12px] ${tone.chip}`}>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm stack:mt-auto stack:pt-6">
            {p.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track(p.id)}
                className={`group inline-flex items-center gap-1 font-semibold ${tone.link}`}
              >
                {l.label}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2} />
              </a>
            ))}
            <Link to={`/project_description#${p.id}`} className={`underline decoration-1 underline-offset-4 ${tone.muted} hover:opacity-100`}>
              How it works
            </Link>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-6 md:col-span-7">
          <ProjectVisual p={p} />
          {p.stats && (
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {p.stats.map((s) => (
                <div key={s.label}>
                  <dd className="display text-4xl font-bold tabular-nums md:text-5xl">
                    <CountUp value={Number(s.value)} />
                  </dd>
                  <dt className={`mt-1 text-xs ${tone.muted}`}>{s.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </motion.article>
    </div>
  );
};

const Work = () => {
  const stackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stackRef, offset: ['start start', 'end end'] });
  const stacked = useStacked();

  return (
    <section id="work" className="page-x pt-24 md:pt-32">
      <Reveal>
        <RevealText text="Selected work" className="display text-[clamp(3rem,9vw,6rem)] font-bold leading-[0.9]" />
        <p className="mt-5 max-w-[52ch] text-lg text-muted">
          Four products with real users, each built and run by me. Scroll through them.
        </p>
      </Reveal>

      <div ref={stackRef} className="mt-12 space-y-6 md:mt-16 stack:space-y-0">
        {featured.map((p, i) => (
          <Card key={p.id} p={p} i={i} count={featured.length} progress={scrollYProgress} stacked={stacked} />
        ))}
      </div>

      <MoreProjects />
    </section>
  );
};

const PHONE_LIMIT = 3;

const MoreProjects = () => {
  const [showAll, setShowAll] = useState(false);
  return (
  <div className="pt-24 md:pt-32">
    <Reveal>
      <RevealText text="More projects" className="display text-[clamp(2.4rem,6vw,4rem)] font-bold leading-[0.95]" />
    </Reveal>
    {moreProjects.map((group) => (
      <div key={group.group} className="mt-12">
        <h3 className="mb-2 text-sm font-medium text-muted">{group.group}</h3>
        <ul>
          {group.items.map((p, idx) => {
            const primary = p.href ?? p.source;
            // On phones, long groups start collapsed.
            const collapsed = !showAll && idx >= PHONE_LIMIT;
            return (
              <Reveal as="li" key={p.title} className={`group relative border-t border-line last:border-b ${collapsed ? 'hidden sm:list-item' : ''}`}>
                <div className="grid gap-2 py-6 transition-[padding] duration-300 ease-out md:grid-cols-12 md:items-baseline md:gap-6 md:group-hover:pl-4">
                  <h4 className="display text-3xl font-semibold md:col-span-4 md:text-4xl">
                    {primary ? (
                      <a
                        href={primary}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="after:absolute after:inset-0 group-hover:text-accent-fg"
                      >
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}
                  </h4>
                  <p className="text-muted md:col-span-5">{p.blurb}</p>
                  <div className="flex items-center justify-between gap-4 md:col-span-3 md:justify-end">
                    <span className="font-mono text-xs text-faint">{p.tech.join(' / ')}</span>
                    <span className="relative z-10 flex gap-2 text-faint">
                      {p.source && (
                        <a href={p.source} target="_blank" rel="noopener noreferrer" aria-label={`${p.title} source on GitHub`} className="hover:text-ink">
                          <Github className="h-4 w-4" strokeWidth={1.75} />
                        </a>
                      )}
                      {primary && (
                        <ArrowUpRight
                          aria-hidden
                          className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45 group-hover:text-accent-fg"
                          strokeWidth={1.75}
                        />
                      )}
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
        {!showAll && group.items.length > PHONE_LIMIT && (
          <button type="button" onClick={() => setShowAll(true)} className="btn-ghost mt-6 w-full sm:hidden">
            Show all {group.items.length} projects
          </button>
        )}
      </div>
    ))}
    <a
      href="https://github.com/yash113gadia"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-10 inline-flex items-center gap-1 text-sm font-medium text-ink link-underline"
    >
      Everything else is on GitHub <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
    </a>
  </div>
  );
};

export default Work;
