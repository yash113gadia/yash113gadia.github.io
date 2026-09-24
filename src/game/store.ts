// A tiny, optional exploration game layered on the portfolio. Progress lives in this
// visitor's browser only; everything degrades to "nothing unlocked" if storage is blocked.

export interface Achievement {
  id: string;
  title: string;
  hint: string;
  reward?: { label: string; href: string };
}

// Few, and each one is about the work: playing the dispatch challenge teaches the two ideas
// behind SpeedoExpress's tracking (road distance, expiring positions); the rest are reading.
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'dispatcher',
    title: 'Took the dispatch challenge',
    hint: 'Finish all five rounds of "Beat the dispatcher" on the map.',
    reward: { label: 'How the real dispatch works', href: '/project_description#speedoexpress' },
  },
  { id: 'sharp', title: 'Sharp dispatcher', hint: 'Score 90 or more against the road-distance algorithm.' },
  { id: 'ttl', title: 'Saw a ghost', hint: 'Find out why an old driver position can’t be trusted.' },
  { id: 'deep-dive', title: 'Deep dive', hint: 'Scroll through all four featured projects.' },
  { id: 'under-the-hood', title: 'Under the hood', hint: 'Read how a project is built.' },
];

export interface GameState {
  unlocked: Record<string, number>;
  delivered: number;
  hidden: boolean;
}

export interface UnlockEvent {
  achievement: Achievement;
  complete: boolean;
}

const KEY = 'yg-game-v1';
const empty: GameState = { unlocked: {}, delivered: 0, hidden: false };

const load = (): GameState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const unlocked: Record<string, number> = {};
    for (const a of ACHIEVEMENTS) {
      const t = parsed.unlocked?.[a.id];
      if (typeof t === 'number') unlocked[a.id] = t;
    }
    return {
      unlocked,
      delivered: typeof parsed.delivered === 'number' && parsed.delivered >= 0 ? Math.floor(parsed.delivered) : 0,
      hidden: parsed.hidden === true,
    };
  } catch {
    return empty;
  }
};

let state: GameState = typeof window === 'undefined' ? empty : load();
const listeners = new Set<() => void>();
const unlockListeners = new Set<(e: UnlockEvent) => void>();
// Unlocks that happen before the toast layer subscribes (e.g. on first render) wait here.
let pendingUnlocks: UnlockEvent[] = [];

const commit = (next: GameState) => {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: progress just won't persist */
  }
  listeners.forEach((l) => l());
};

export const game = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  onUnlock(fn: (e: UnlockEvent) => void) {
    unlockListeners.add(fn);
    const waiting = pendingUnlocks;
    pendingUnlocks = [];
    waiting.forEach(fn);
    return () => {
      unlockListeners.delete(fn);
    };
  },
  unlock(id: string) {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement || state.unlocked[id]) return;
    commit({ ...state, unlocked: { ...state.unlocked, [id]: Date.now() } });
    const complete = ACHIEVEMENTS.every((a) => state.unlocked[a.id]);
    const event = { achievement, complete };
    if (unlockListeners.size) unlockListeners.forEach((l) => l(event));
    else pendingUnlocks.push(event);
  },
  delivered() {
    commit({ ...state, delivered: state.delivered + 1 });
  },
  setHidden(hidden: boolean) {
    commit({ ...state, hidden });
  },
  reset() {
    commit({ ...empty, hidden: state.hidden });
  },
};

// Lets the command palette ask the hero map to dispatch without a direct reference.
export const DISPATCH_EVENT = 'yg:dispatch';
export const CHALLENGE_EVENT = 'yg:challenge';
export const startChallenge = () => window.dispatchEvent(new Event(CHALLENGE_EVENT));
export const requestDispatch = () => window.dispatchEvent(new Event(DISPATCH_EVENT));

// Opens the command palette from anywhere (nav button, mobile menu).
export const PALETTE_EVENT = 'yg:palette';
export const openPalette = () => window.dispatchEvent(new Event(PALETTE_EVENT));

// Average efficiency against the road-distance optimum, 0..100.
export const scoreOf = (results: { efficiency: number }[]) =>
  results.length ? Math.round((results.reduce((a, r) => a + r.efficiency, 0) / results.length) * 100) : 0;
