import { addDoc, collection, getCountFromServer, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { HeroId } from './content';

// The Pixel Swarm leaderboard: every finished run is saved to Firestore (collection
// swarmScores, create-only, validated by firestore.rules). If Firebase isn't configured or
// can't be reached, runs are kept on this device instead and the UI says so.

/**
 * Off until the swarmScores rules in firestore.rules are deployed; without them every save
 * is refused and players would be asked for a name for a board that can't record it.
 * Flip to true after `firebase deploy --only firestore:rules`.
 */
export const LEADERBOARD_ENABLED = false;

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  time: number;
  kills: number;
  level: number;
  hero: HeroId;
}

export interface Board {
  entries: ScoreEntry[];
  /** False when showing this device's scores because the global board is unavailable. */
  global: boolean;
}

export interface Placement {
  id: string;
  rank: number;
  total: number;
  global: boolean;
}

const COLL = 'swarmScores';
const LOCAL_KEY = 'pixel-swarm-local-board';
const HEROES: HeroId[] = ['hiro', 'knight', 'mira'];
const TIMEOUT = 6000;

// Keep these in step with firestore.rules.
const NAME_RE = /^[A-Za-z0-9 _.-]{1,16}$/;
const BLOCKED = /(fuck|shit|cunt|nigg|fag|bitch|dick|cock|pussy|rape|nazi|hitler|slut|whore|porn)/i;

export const cleanName = (raw: string) => raw.replace(/\s+/g, ' ').trim().slice(0, 16);

/** Why a name can't be used, or null if it's fine. */
export const nameProblem = (name: string): string | null => {
  if (!name) return 'Enter a name to play.';
  if (!NAME_RE.test(name)) return 'Letters, numbers, spaces, _ . - only.';
  if (BLOCKED.test(name)) return 'Pick a different name.';
  return null;
};

const online = () => Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

/** Firestore calls wait for the server; give up after a few seconds and fall back. */
const within = <T,>(p: Promise<T>) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Leaderboard timed out')), TIMEOUT))]);

const isEntry = (e: unknown): e is ScoreEntry => {
  const x = e as ScoreEntry;
  return (
    !!x &&
    typeof x.name === 'string' &&
    NAME_RE.test(x.name) &&
    Number.isFinite(x.score) &&
    Number.isFinite(x.time) &&
    Number.isFinite(x.kills) &&
    Number.isFinite(x.level) &&
    HEROES.includes(x.hero)
  );
};

const byScore = (a: ScoreEntry, b: ScoreEntry) => b.score - a.score || a.time - b.time;

/** One row per player: their best run. */
const bestPerName = (list: ScoreEntry[]) => {
  const seen = new Set<string>();
  return list.filter((e) => {
    const k = e.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const readLocal = (): ScoreEntry[] => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(v) ? v.filter(isEntry) : [];
  } catch {
    return [];
  }
};

const writeLocal = (list: ScoreEntry[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    /* storage blocked: the run just isn't kept */
  }
};

export async function submitScore(run: Omit<ScoreEntry, 'id'>): Promise<Placement> {
  const data = {
    name: cleanName(run.name),
    score: Math.max(0, Math.round(run.score)),
    time: Math.round(run.time * 10) / 10,
    kills: Math.max(0, Math.round(run.kills)),
    level: Math.max(1, Math.round(run.level)),
    hero: run.hero,
  };
  if (online()) {
    try {
      const ref = await within(addDoc(collection(db, COLL), { ...data, createdAt: serverTimestamp() }));
      const [above, total] = await within(
        Promise.all([getCountFromServer(query(collection(db, COLL), where('score', '>', data.score))), getCountFromServer(collection(db, COLL))]),
      );
      return { id: ref.id, rank: above.data().count + 1, total: total.data().count, global: true };
    } catch (err) {
      console.warn('Global leaderboard unavailable, keeping the score on this device.', err);
    }
  }
  const entry: ScoreEntry = { ...data, id: `local-${Date.now()}` };
  const list = [...readLocal(), entry].sort(byScore);
  writeLocal(list);
  return { id: entry.id, rank: list.filter((e) => e.score > entry.score).length + 1, total: list.length, global: false };
}

export async function topScores(n = 10): Promise<Board> {
  if (online()) {
    try {
      const snap = await within(getDocs(query(collection(db, COLL), orderBy('score', 'desc'), limit(60))));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(isEntry);
      return { entries: bestPerName(all.sort(byScore)).slice(0, n), global: true };
    } catch (err) {
      console.warn('Global leaderboard unavailable, showing this device’s scores.', err);
    }
  }
  return { entries: bestPerName(readLocal().sort(byScore)).slice(0, n), global: false };
}
