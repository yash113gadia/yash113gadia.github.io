import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import '@fontsource/press-start-2p';
import { ArrowUpRight, ChartBar, ChevronDown, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Trophy, Users, Volume2, VolumeX, X } from 'lucide-react';
import { SwarmEngine, type DamageRow, type DamageSource, type Hud, type Offer, type RunResult } from './engine';
import { HEROES, hero as heroDef, type HeroId } from './content';
import { sourceIcon, upgradeIcon, type Icon } from './icons';
import { LEADERBOARD_ENABLED, cleanName, nameProblem, submitScore, topScores, type Board, type Placement } from './leaderboard';
import { profile } from '../data/site';

const BEST_KEY = 'pixel-swarm-best';
const MUTE_KEY = 'pixel-swarm-muted';
const HERO_KEY = 'pixel-swarm-hero';
const DMG_KEY = 'pixel-swarm-dmg-open';
const NAME_KEY = 'pixel-swarm-name';
const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage blocked: these are conveniences, nothing breaks without them */
  }
};
// Fallback when storage is blocked, so "new best" still means something within a visit.
let sessionBest = 0;

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}k` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));
const ease = [0.16, 1, 0.3, 1] as const;
const INK = '#2a170b';

type UiPhase = 'title' | 'play' | 'levelup' | 'paused' | 'over';

/** A hero from the sheet, facing the camera; optionally walking in place. */
const HeroSprite = ({ id, scale, walk = true }: { id: HeroId; scale: number; walk?: boolean }) => (
  <span
    aria-hidden
    className={`px-sprite inline-block ${walk ? 'px-walk' : ''}`}
    style={
      {
        width: 16 * scale,
        height: 16 * scale,
        backgroundImage: `url(/swarm/heroes/${id}.png)`,
        backgroundSize: `${64 * scale}px ${112 * scale}px`,
        backgroundPosition: '0 0',
        '--frame': `${16 * scale}px`,
      } as CSSProperties
    }
  />
);

const Item = ({ src, size = 22 }: { src: string; size?: number }) => (
  <img src={src} alt="" aria-hidden className="shrink-0 object-contain" style={{ width: size, height: size, imageRendering: 'pixelated' }} />
);

/** A pixel icon at the largest whole-number scale that fits the box, so pixels stay square. */
const PixelIcon = ({ icon, box }: { icon: Icon; box: number }) => {
  const s = Math.max(1, Math.floor(box / Math.max(icon.w, icon.h)));
  if (icon.frame)
    return (
      <span
        aria-hidden
        className="px-sprite inline-block shrink-0"
        style={{
          width: icon.w * s,
          height: icon.h * s,
          backgroundImage: `url(${icon.src})`,
          backgroundSize: `${icon.frame.sheetW * s}px ${icon.frame.sheetH * s}px`,
          backgroundPosition: `-${icon.frame.x * s}px 0`,
        }}
      />
    );
  return <img src={icon.src} alt="" aria-hidden className="shrink-0" width={icon.w * s} height={icon.h * s} style={{ imageRendering: 'pixelated' }} />;
};

const SourceIcon = ({ k, hero }: { k: DamageSource; hero: HeroId }) => <PixelIcon icon={sourceIcon(k, heroDef(hero).weapon)} box={32} />;

/** Which weapon did how much: total, share of all damage, and damage per second. */
const DamageList = ({ rows, hero, dense = false }: { rows: DamageRow[]; hero: HeroId; dense?: boolean }) => {
  const top = Math.max(1, ...rows.map((r) => r.total));
  const sum = Math.max(1, rows.reduce((s, r) => s + r.total, 0));
  if (!rows.length) return <p className="text-sm opacity-70">No damage yet.</p>;
  return (
    <ul className={dense ? 'space-y-2' : 'space-y-2.5'}>
      {rows.map((r) => (
        <li key={r.key} className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded border-2 bg-white/70" style={{ borderColor: INK }}>
            <SourceIcon k={r.key} hero={hero} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[13px] font-semibold">{r.name}</span>
              <span className="px-font shrink-0 text-[10px] tabular-nums">{short(r.total)}</span>
            </span>
            <span className="mt-1 block h-2 overflow-hidden rounded-sm border" style={{ borderColor: INK, background: '#e8d9b0' }}>
              <span className="block h-full bg-[#e5412d]" style={{ width: `${(r.total / top) * 100}%` }} />
            </span>
            {!dense && (
              <span className="mt-0.5 flex justify-between text-[11px] opacity-70">
                <span>{Math.round((r.total / sum) * 100)}% of damage</span>
                <span className="tabular-nums">{Math.round(r.dps)} dps</span>
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
};

const Stat = ({ label, value, max }: { label: string; value: number; max: number }) => (
  <div className="flex items-center gap-2 text-[11px]">
    <span className="px-font w-14 shrink-0 text-[8px]">{label}</span>
    <span className="h-2 flex-1 overflow-hidden rounded-sm border" style={{ borderColor: INK, background: '#e8d9b0' }}>
      <span className="block h-full bg-[#3aa84e]" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </span>
  </div>
);

/** Top runs, best per player; the given player's row is highlighted. */
const BoardList = ({ board, me }: { board: Board | null; me?: string }) => {
  if (!board) return <p className="text-sm opacity-70">Loading scores…</p>;
  if (!board.entries.length) return <p className="text-sm opacity-80">No scores yet. Be the first!</p>;
  const medal = ['#ffd23f', '#d6dde6', '#e0a066'];
  return (
    <ol className="space-y-1">
      {board.entries.map((e, i) => {
        const mine = !!me && e.name.toLowerCase() === me.toLowerCase();
        return (
          <li key={e.id} className={`flex items-center gap-2 rounded px-2 py-1 ${mine ? 'bg-[#ffd23f] ring-2 ring-[#2a170b]' : i % 2 ? 'bg-white/45' : ''}`}>
            <span className="px-font grid h-6 w-6 shrink-0 place-items-center rounded-sm text-[9px] tabular-nums" style={i < 3 ? { background: medal[i], border: `2px solid ${INK}` } : undefined}>
              {i + 1}
            </span>
            <HeroSprite id={e.hero} scale={1.5} walk={false} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {e.name}
              {mine && <span className="px-font ml-1.5 text-[7px]">YOU</span>}
            </span>
            <span className="text-xs tabular-nums opacity-70">{fmt(e.time)}</span>
            <span className="px-font w-14 text-right text-[10px] tabular-nums">{short(e.score)}</span>
          </li>
        );
      })}
    </ol>
  );
};

const SwarmGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SwarmEngine | null>(null);
  const overAt = useRef(0);
  const levelAt = useRef(0);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<UiPhase>('title');
  const [ready, setReady] = useState(false);
  const [hud, setHud] = useState<Hud | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [treasure, setTreasure] = useState(false);
  const [result, setResult] = useState<(RunResult & { best: boolean }) | null>(null);
  const [best, setBest] = useState(() => Number(read(BEST_KEY)) || 0);
  const [muted, setMuted] = useState(() => read(MUTE_KEY) === '1');
  const [heroId, setHeroId] = useState<HeroId>(() => (HEROES.some((h) => h.id === read(HERO_KEY)) ? (read(HERO_KEY) as HeroId) : 'hiro'));
  const [dmgOpen, setDmgOpen] = useState(() => read(DMG_KEY) === '1');
  const [banner, setBanner] = useState<{ id: number; text: string; tone: 'good' | 'danger' | 'info' } | null>(null);
  const [touch] = useState(() => window.matchMedia?.('(pointer: coarse)').matches ?? false);
  const [savedName] = useState(() => cleanName(read(NAME_KEY) ?? ''));
  const [name, setName] = useState(savedName);
  const [nameTried, setNameTried] = useState(false);
  const nameRef = useRef(savedName);
  const nameInput = useRef<HTMLInputElement>(null);
  const playBtn = useRef<HTMLButtonElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);

  useEffect(() => {
    const engine = new SwarmEngine(canvasRef.current!, {
      onHud: setHud,
      onLevelUp: (o, t) => {
        levelAt.current = performance.now();
        setOffers(o);
        setTreasure(t);
        setPhase('levelup');
      },
      onGameOver: (r) => {
        const prev = Math.max(Number(read(BEST_KEY)) || 0, sessionBest);
        const isBest = r.score > prev;
        if (isBest) {
          sessionBest = r.score;
          write(BEST_KEY, String(r.score));
          setBest(r.score);
        }
        overAt.current = performance.now();
        setResult({ ...r, best: isBest });
        setPhase('over');
        setPlacement(null);
        setBoard(null);
        if (!LEADERBOARD_ENABLED) return;
        // Save the run, then show where it landed.
        void submitScore({ name: nameRef.current, score: r.score, time: r.time, kills: r.kills, level: r.level, hero: r.hero })
          .then((pl) => {
            setPlacement(pl);
            return topScores(10);
          })
          .then(setBoard);
      },
      onAnnounce: (text, tone) => setBanner({ id: performance.now(), text, tone }),
      onPause: (p) => setPhase(p ? 'paused' : 'play'),
      onReady: () => setReady(true),
    });
    engine.setMuted(read(MUTE_KEY) === '1');
    engineRef.current = engine;
    if (new URLSearchParams(window.location.search).has('debug'))
      Object.assign(window as unknown as Record<string, unknown>, { __swarm: engine.debugApi(), __swarmIcons: { upgradeIcon, sourceIcon } });
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Play is disabled while the art loads, so autofocus can't land on it; focus it once ready.
  useEffect(() => {
    if (ready && (savedName || !LEADERBOARD_ENABLED)) playBtn.current?.focus();
  }, [ready, savedName]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 1700);
    return () => clearTimeout(t);
  }, [banner]);

  const start = useCallback(() => {
    const engine = engineRef.current;
    if (!engine?.isReady) return;
    const nm = cleanName(nameRef.current);
    if (LEADERBOARD_ENABLED && nameProblem(nm)) {
      // A name is needed for the leaderboard: back to the title with the field focused.
      setNameTried(true);
      setPhase('title');
      setTimeout(() => nameInput.current?.focus(), 50);
      return;
    }
    if (LEADERBOARD_ENABLED) {
      nameRef.current = nm;
      setName(nm);
      write(NAME_KEY, nm);
    }
    write(HERO_KEY, heroId);
    engine.start(heroId);
    setResult(null);
    setOffers([]);
    setHud(null);
    setPhase('play');
  }, [heroId]);

  const pick = useCallback((i: number) => {
    const engine = engineRef.current;
    // Cards ignore input for a moment, so a tap meant for steering can't pick one by accident.
    if (!engine || performance.now() - levelAt.current < 380) return;
    engine.pick(i);
    // Picking can roll straight into another level-up.
    setPhase(engine.phase === 'levelup' ? 'levelup' : 'play');
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    write(MUTE_KEY, next ? '1' : '0');
    engineRef.current?.setMuted(next);
  }, [muted]);

  const toggleDmg = useCallback(() => {
    const next = !dmgOpen;
    setDmgOpen(next);
    write(DMG_KEY, next ? '1' : '0');
  }, [dmgOpen]);

  const cycleHero = useCallback(
    (step: number) => {
      const i = HEROES.findIndex((h) => h.id === heroId);
      setHeroId(HEROES[(i + step + HEROES.length) % HEROES.length].id);
    },
    [heroId],
  );

  const setPaused = (p: boolean) => engineRef.current?.setPaused(p);

  const openBoard = () => {
    setBoard(null);
    setBoardOpen(true);
    void topScores(10).then(setBoard);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT') {
        if (k === 'enter') {
          e.preventDefault();
          start();
        }
        return;
      }
      if (boardOpen) {
        if (k === 'escape') setBoardOpen(false);
        return;
      }
      const onButton = tag === 'BUTTON';
      if (k === 'm' && !e.repeat) toggleMute();
      else if (phase === 'title') {
        if (k === 'arrowleft' || k === 'a') cycleHero(-1);
        else if (k === 'arrowright' || k === 'd') cycleHero(1);
        else if ((k === 'enter' || k === ' ') && !onButton) {
          e.preventDefault();
          start();
        }
      } else if (phase === 'over' && (k === 'enter' || k === ' ' || k === 'r') && !onButton) {
        // A beat before restarting, so a held dash key doesn't skip the results.
        if (performance.now() - overAt.current < 700) return;
        e.preventDefault();
        start();
      } else if (phase === 'levelup' && ['1', '2', '3'].includes(k)) pick(Number(k) - 1);
      else if (phase === 'play' && k === 'tab') {
        e.preventDefault();
        toggleDmg();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, start, pick, toggleMute, toggleDmg, cycleHero, boardOpen]);

  const inRun = phase === 'play' || phase === 'levelup' || phase === 'paused';
  const low = !!hud && inRun && hud.hp / hud.maxHp < 0.3;
  const H = heroDef(heroId);
  const runHero = result?.hero ?? heroId;
  const problem = LEADERBOARD_ENABLED ? nameProblem(cleanName(name)) : null;

  return (
    <div className="dark fixed inset-0 select-none overflow-hidden bg-[#1f4a2a] text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" aria-hidden />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${low && !reduce ? 'animate-pulse' : ''}`}
        style={{ opacity: low ? 1 : 0, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(220,20,40,0.45) 100%)' }}
      />

      <nav className="sr-only" aria-label="Portfolio">
        <h1>{profile.name}: Pixel Swarm, a small arcade game</h1>
        <p>The portfolio itself is one link away.</p>
        <Link to="/">Portfolio</Link>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </nav>

      {/* ---- HUD -------------------------------------------------------------- */}
      {inRun && hud && (
        <div className="pointer-events-none absolute inset-x-0 top-0">
          <div className="relative h-4 w-full border-b-4" style={{ borderColor: INK, background: '#3b2a1a' }}>
            <div className="h-full bg-[#4cc3ff] transition-[width] duration-150" style={{ width: `${Math.min(100, (hud.xp / hud.next) * 100)}%` }} />
            <span className="px-font px-outline-sm absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-white">LV {hud.level}</span>
          </div>
          <div className="flex items-start justify-between gap-2 p-2 sm:p-3">
            <div className="px-panel w-[8.5rem] px-2 py-1.5 sm:w-52 sm:px-3 sm:py-2">
              <div className="flex items-center gap-1.5">
                <Item src="/swarm/items/heart.png" size={16} />
                <span className="px-font text-[8px] tabular-nums sm:text-[10px]">
                  {hud.hp}/{hud.maxHp}
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-sm border-2" style={{ borderColor: INK, background: '#5a1e14' }}>
                <div className="h-full bg-[#ff4b3a] transition-[width] duration-200" style={{ width: `${(hud.hp / hud.maxHp) * 100}%` }} />
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-center">
              <p className="px-font px-outline text-xl tabular-nums sm:text-3xl">{fmt(hud.time)}</p>
              <p className="px-font px-outline-sm mt-1.5 text-[8px] tabular-nums sm:text-[10px]">
                {hud.kills} KO · {short(hud.score)}
              </p>
              {hud.combo >= 5 && (
                <motion.p
                  key={Math.floor(hud.combo / 5)}
                  initial={reduce ? false : { scale: 1.6 }}
                  animate={{ scale: 1 }}
                  className="px-font px-outline-sm mt-1.5 text-[10px] text-[#ffd23f] sm:text-xs"
                >
                  x{hud.combo} COMBO
                </motion.p>
              )}
              {hud.boss && (
                <div className="mt-2 w-[min(420px,52vw)]">
                  <p className="px-font px-outline-sm truncate text-center text-[8px] text-[#ffb4a8] sm:text-[10px]">{hud.boss.name}</p>
                  <div className="mt-1 h-3 overflow-hidden rounded-sm border-[3px]" style={{ borderColor: INK, background: '#3b1410' }}>
                    <div className="h-full bg-[#e5412d] transition-[width] duration-150" style={{ width: `${(hud.boss.hp / hud.boss.max) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="pointer-events-auto relative flex shrink-0 justify-end gap-1.5 sm:w-52 sm:gap-2">
              <button type="button" onClick={toggleDmg} aria-expanded={dmgOpen} aria-controls="dmg-panel" aria-label="Damage by weapon" className="px-btn h-10 bg-[#fff4d6] px-2 text-[8px] text-[#2a170b] sm:px-3">
                <ChartBar className="h-4 w-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">DMG</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dmgOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
              </button>
              <button type="button" onClick={toggleMute} aria-label={muted ? 'Sound on' : 'Mute'} className="px-btn h-10 w-10 bg-[#fff4d6] text-[#2a170b]">
                {muted ? <VolumeX className="h-4 w-4" strokeWidth={2.5} /> : <Volume2 className="h-4 w-4" strokeWidth={2.5} />}
              </button>
              <button type="button" onClick={() => setPaused(phase === 'play')} aria-label="Pause" className="px-btn h-10 w-10 bg-[#fff4d6] text-[#2a170b]">
                <Pause className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <AnimatePresence>
                {dmgOpen && (
                  <motion.div
                    id="dmg-panel"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="px-panel absolute right-0 top-14 w-64 p-3"
                  >
                    <p className="px-font mb-2.5 text-[9px]">Damage by weapon</p>
                    <DamageList rows={hud.damage} hero={heroId} dense />
                    {!touch && <p className="mt-2.5 text-[11px] opacity-60">Tab toggles this</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {phase === 'play' && hud && hud.time < 7 && (
        <p className={`px-panel pointer-events-none absolute left-1/2 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 px-3 py-2 text-center text-xs sm:text-sm ${touch ? 'bottom-32' : 'bottom-6'}`}>
          {touch ? 'Drag anywhere to move · tap DASH to dodge' : 'Move with WASD or arrows · Space to dash through danger'}
        </p>
      )}

      {touch && phase === 'play' && hud && (
        <button
          type="button"
          aria-label="Dash"
          onPointerDown={(e) => {
            e.preventDefault();
            engineRef.current?.dash();
          }}
          className="px-font absolute bottom-7 right-7 grid h-20 w-20 place-items-center rounded-full border-4 text-[10px] text-[#2a170b]"
          style={{ borderColor: INK, boxShadow: `4px 4px 0 ${INK}`, background: `conic-gradient(#ffd23f ${hud.dash * 360}deg, #b8a57a 0deg)` }}
        >
          DASH
        </button>
      )}

      {/* Announcements: surges, elites, bosses, combos. */}
      <AnimatePresence>
        {banner && (
          <motion.p
            key={banner.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease }}
            className="px-font px-outline pointer-events-none absolute inset-x-4 top-[24%] text-center text-lg uppercase leading-snug sm:text-3xl"
            style={{ color: banner.tone === 'danger' ? '#ff5a47' : banner.tone === 'good' ? '#ffd23f' : '#8fe6ff' }}
          >
            {banner.text}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ---- Screens ------------------------------------------------------------ */}
      <AnimatePresence>
        {phase === 'title' && (
          <motion.div key="title" exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 z-20 overflow-y-auto">
            <div className="flex min-h-full flex-col items-center justify-center px-4 pb-5 pt-14 text-center">
              {LEADERBOARD_ENABLED && (
                <button type="button" onClick={openBoard} className="px-btn absolute left-3 top-3 h-10 bg-[#ffd23f] px-3 text-[9px] text-[#2a170b]">
                  <Trophy className="h-4 w-4" strokeWidth={2.5} /> <span className="hidden sm:inline">Leaderboard</span>
                  <span className="sm:hidden">Top 10</span>
                </button>
              )}
              <Link to="/" className="px-btn absolute right-3 top-3 h-10 bg-[#fff4d6] px-3 text-[9px] text-[#2a170b]">
                Portfolio
              </Link>
              <motion.h1
                className="px-font px-outline text-[clamp(2.4rem,10vw,5.5rem)] leading-[1.05] text-[#ffd23f]"
                initial={reduce ? false : { y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              >
                PIXEL
                <br />
                <span className="text-[#ff6b4a]">SWARM</span>
              </motion.h1>
              <p className="px-outline-sm mt-5 max-w-md text-base font-semibold leading-snug sm:text-lg">Survive the swarm. Level up, pick your powers, beat your best.</p>

              {LEADERBOARD_ENABLED && (
                <div className="px-panel mt-6 w-full max-w-md p-3 text-left">
                  <label htmlFor="player-name" className="px-font text-[9px]">
                    Your name, for the leaderboard
                  </label>
                  <input
                    id="player-name"
                    ref={nameInput}
                    value={name}
                    onChange={(e) => {
                      const v = e.target.value.slice(0, 16);
                      setName(v);
                      nameRef.current = v;
                    }}
                    onBlur={() => name && setNameTried(true)}
                    maxLength={16}
                    autoComplete="nickname"
                    autoCapitalize="words"
                    spellCheck={false}
                    placeholder="Type your name"
                    autoFocus={!savedName}
                    aria-invalid={nameTried && !!problem}
                    aria-describedby="name-help"
                    className="mt-2 block h-11 w-full rounded-md border-4 bg-white px-3 text-base font-semibold text-[#2a170b] placeholder:text-[#2a170b]/40 focus:outline-none focus:ring-4 focus:ring-[#ffd23f]"
                    style={{ borderColor: INK }}
                  />
                  <p id="name-help" className={`mt-1.5 text-xs font-semibold ${nameTried && problem ? 'text-[#c62d1f]' : 'opacity-70'}`}>
                    {nameTried && problem ? problem : 'Up to 16 letters or numbers. Shown on the public leaderboard.'}
                  </p>
                </div>
              )}

              <div className="mt-5 w-full max-w-xl">
                <p className="px-font px-outline-sm mb-3 text-[10px]">Choose your hero</p>
                <div className="flex items-stretch justify-center gap-2 sm:gap-3" role="radiogroup" aria-label="Hero">
                  <button type="button" onClick={() => cycleHero(-1)} aria-label="Previous hero" className="px-btn hidden w-10 shrink-0 bg-[#fff4d6] text-[#2a170b] sm:inline-flex">
                    <ChevronLeft className="h-5 w-5" strokeWidth={3} />
                  </button>
                  {HEROES.map((h) => {
                    const on = h.id === heroId;
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        key={h.id}
                        onClick={() => setHeroId(h.id)}
                        className={`px-btn flex-1 flex-col gap-1 px-1 py-3 text-[#2a170b] ${on ? '-translate-y-1 bg-[#ffd23f]' : 'bg-[#fff4d6] opacity-85'}`}
                      >
                        <HeroSprite id={h.id} scale={touch ? 3 : 4} walk={on} />
                        <span className="text-[9px] sm:text-[10px]">{h.name}</span>
                        <span className="font-sans text-[11px] font-semibold opacity-80">{h.weaponName}</span>
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => cycleHero(1)} aria-label="Next hero" className="px-btn hidden w-10 shrink-0 bg-[#fff4d6] text-[#2a170b] sm:inline-flex">
                    <ChevronRight className="h-5 w-5" strokeWidth={3} />
                  </button>
                </div>
                <div className="px-panel mx-auto mt-4 max-w-md p-3 text-left">
                  <p className="text-sm font-semibold">
                    {H.name}, {H.title.toLowerCase()}
                  </p>
                  <p className="mt-1 text-sm leading-snug opacity-85">{H.blurb}</p>
                  <div className="mt-2.5 space-y-1.5">
                    <Stat label="Health" value={H.hp} max={150} />
                    <Stat label="Speed" value={H.speed} max={270} />
                    <Stat label="Armor" value={H.armor + 0.4} max={2.4} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNameTried(true);
                  start();
                }}
                disabled={!ready}
                ref={playBtn}
                aria-disabled={!!problem}
                className={`px-btn mt-6 h-14 bg-[#e5412d] px-8 text-sm text-white disabled:opacity-60 ${problem ? 'opacity-70' : ''}`}
              >
                <Play className="h-5 w-5 fill-current" /> {ready ? 'PLAY' : 'LOADING'}
              </button>
              <p className="px-outline-sm mt-4 text-sm font-semibold">{touch ? 'Drag to move · tap DASH to dodge' : '← → pick a hero · WASD to move · Space to dash · Enter to play'}</p>
              {best > 0 && (
                <p className="px-font px-outline-sm mt-3 inline-flex items-center gap-2 text-[10px] text-[#ffd23f]">
                  <Trophy className="h-4 w-4" /> BEST {best.toLocaleString()}
                </p>
              )}
              <p className="px-outline-sm mt-8 px-4 text-center text-xs font-semibold opacity-90">
                Made by {profile.name} ·{' '}
                <Link to="/" className="underline underline-offset-4">
                  see my work
                </Link>{' '}
                · Art: Pixel-boy (CC0)
              </p>
            </div>
          </motion.div>
        )}

        {phase === 'levelup' && hud && (
          <motion.div key="levelup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 z-30 grid place-items-center overflow-y-auto bg-black/45 p-4">
            <div role="dialog" aria-modal="true" aria-label={treasure ? 'Treasure: choose an upgrade' : 'Level up: choose an upgrade'} className="w-full max-w-3xl text-center">
              <motion.p
                initial={reduce ? false : { scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease }}
                className="px-font px-outline text-3xl text-[#ffd23f] sm:text-5xl"
              >
                {treasure ? 'TREASURE!' : 'LEVEL UP!'}
              </motion.p>
              <p className="px-outline-sm mt-3 font-semibold">{treasure ? 'A free upgrade. Pick one.' : `Level ${hud.level}. Pick one.`}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {offers.map((o, i) => {
                  const weapon = o.kind === 'weapon';
                  return (
                    <motion.button
                      type="button"
                      key={o.id}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + i * 0.07, type: 'spring', stiffness: 260, damping: 18 }}
                      onClick={() => pick(i)}
                      className="px-panel group relative flex items-start gap-3 p-3 text-left transition hover:-translate-y-1 sm:flex-col sm:items-center sm:p-5 sm:text-center"
                    >
                      <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-md border-4 ${weapon ? 'bg-[#e5412d]' : 'bg-[#3a7bd5]'}`} style={{ borderColor: INK }}>
                        <PixelIcon icon={upgradeIcon(o.id, H.weapon)} box={48} />
                      </span>
                      <span className="block">
                        <span className="px-font block text-[11px] leading-relaxed">{o.name}</span>
                        <span className={`px-font mt-1 inline-block rounded px-1.5 py-1 text-[8px] text-white ${o.isNew ? 'bg-[#3aa84e]' : 'bg-[#2a170b]'}`}>
                          {o.isNew ? (weapon ? 'NEW WEAPON' : 'NEW') : `LV ${o.level}`}
                        </span>
                        <span className="mt-2 block text-sm font-medium leading-snug">{o.desc}</span>
                      </span>
                      {!touch && <kbd className="px-font absolute right-2 top-2 rounded border-2 px-1 text-[9px]" style={{ borderColor: INK }}>{i + 1}</kbd>}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'paused' && hud && (
          <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 grid place-items-center overflow-y-auto bg-black/50 p-4">
            <div role="dialog" aria-modal="true" aria-label="Paused" className="flex w-full max-w-sm flex-col items-stretch gap-3 text-center">
              <p className="px-font px-outline text-4xl text-[#ffd23f]">PAUSED</p>
              <button type="button" autoFocus onClick={() => setPaused(false)} className="px-btn mt-3 h-12 bg-[#e5412d] text-xs text-white">
                <Play className="h-4 w-4 fill-current" /> RESUME
              </button>
              <button type="button" onClick={start} className="px-btn h-12 bg-[#fff4d6] text-xs text-[#2a170b]">
                <RotateCcw className="h-4 w-4" /> RESTART
              </button>
              <button type="button" onClick={toggleMute} className="px-btn h-12 bg-[#fff4d6] text-xs text-[#2a170b]">
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} SOUND {muted ? 'OFF' : 'ON'}
              </button>
              <div className="px-panel p-3 text-left">
                <p className="px-font mb-2.5 text-[9px]">Damage so far</p>
                <DamageList rows={hud.damage} hero={heroId} />
              </div>
              <Link to="/" className="px-outline-sm text-sm font-semibold underline underline-offset-4">
                Leave for the portfolio
              </Link>
            </div>
          </motion.div>
        )}

        {phase === 'over' && result && (
          <motion.div key="over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 z-30 overflow-y-auto bg-black/40">
            <div className="flex min-h-full items-center justify-center p-4">
              <div role="dialog" aria-modal="true" aria-label="Game over" className="w-full max-w-md text-center">
                <motion.p
                  initial={reduce ? false : { y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="px-font px-outline text-3xl text-[#ff5a47] sm:text-4xl"
                >
                  GAME OVER
                </motion.p>
                <div className="px-panel mt-5 p-4">
                  <div className="flex items-center justify-center gap-3">
                    <HeroSprite id={runHero} scale={3} walk={false} />
                    <div className="text-left">
                      <p className="text-xs font-semibold opacity-70">
                        {LEADERBOARD_ENABLED && name ? `${name} (${heroDef(runHero).name})` : heroDef(runHero).name} survived
                      </p>
                      <p className="px-font text-2xl tabular-nums">{fmt(result.time)}</p>
                    </div>
                    {result.best && (
                      <motion.span
                        initial={reduce ? false : { scale: 0, rotate: -12 }}
                        animate={{ scale: 1, rotate: -6 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 12 }}
                        className="px-font ml-1 inline-flex items-center gap-1 rounded border-2 bg-[#ffd23f] px-2 py-1 text-[8px]"
                        style={{ borderColor: INK }}
                      >
                        <Trophy className="h-3 w-3" /> NEW BEST
                      </motion.span>
                    )}
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ['Score', short(result.score)],
                      ['KO', String(result.kills)],
                      ['Level', String(result.level)],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded border-2 bg-white/60 px-1 py-2" style={{ borderColor: INK }}>
                        <dd className="px-font text-sm tabular-nums">{v}</dd>
                        <dt className="mt-1 text-[11px] font-semibold opacity-70">{k}</dt>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 text-xs font-semibold opacity-70">Best score on this device {best.toLocaleString()}</p>
                  {LEADERBOARD_ENABLED && (
                    <div className="mt-4 border-t-2 pt-3 text-left" style={{ borderColor: INK }}>
                      <div className="mb-2.5 flex items-baseline justify-between gap-2">
                        <p className="px-font text-[9px]">Leaderboard</p>
                        <p className="text-xs font-semibold" aria-live="polite">
                          {/* The board shows each player's best run, so give their place on it when they're there. */}
                          {!placement
                            ? 'Saving your score…'
                            : board && board.entries.some((e) => e.name.toLowerCase() === name.toLowerCase())
                              ? `You're #${board.entries.findIndex((e) => e.name.toLowerCase() === name.toLowerCase()) + 1} on the board`
                              : `This run: #${placement.rank} of ${placement.total}`}
                        </p>
                      </div>
                      <BoardList board={board} me={name} />
                      {board && !board.global && <p className="mt-2 text-xs font-semibold opacity-70">The global board isn’t reachable, so these are scores from this device.</p>}
                    </div>
                  )}
                  <div className="mt-4 border-t-2 pt-3 text-left" style={{ borderColor: INK }}>
                    <p className="px-font mb-2.5 text-[9px]">Damage by weapon</p>
                    <DamageList rows={result.damage} hero={runHero} />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={start} autoFocus className="px-btn h-12 bg-[#e5412d] px-5 text-xs text-white">
                    <RotateCcw className="h-4 w-4" /> PLAY AGAIN
                  </button>
                  <button type="button" onClick={() => setPhase('title')} className="px-btn h-12 bg-[#fff4d6] px-4 text-xs text-[#2a170b]">
                    <Users className="h-4 w-4" /> HERO
                  </button>
                </div>
                {!touch && <p className="px-outline-sm mt-3 text-xs font-semibold">Enter or R to play again</p>}
                <p className="px-outline-sm mt-5 text-sm font-semibold">
                  Made by {profile.name}.{' '}
                  <Link to="/" className="inline-flex items-center gap-1 underline underline-offset-4">
                    See my portfolio <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {boardOpen && (
        <div className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-black/55 p-4" onMouseDown={(e) => e.target === e.currentTarget && setBoardOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Leaderboard" className="px-panel w-full max-w-md p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="px-font text-sm">
                <Trophy className="-mt-1 mr-1.5 inline h-4 w-4" strokeWidth={2.5} />
                TOP 10
              </p>
              <button type="button" onClick={() => setBoardOpen(false)} aria-label="Close leaderboard" autoFocus className="px-btn h-9 w-9 bg-[#fff4d6] text-[#2a170b]">
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
            <BoardList board={board} me={cleanName(name)} />
            {board && !board.global && <p className="mt-3 text-xs font-semibold opacity-70">The global board isn’t reachable, so these are scores from this device.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwarmGame;
