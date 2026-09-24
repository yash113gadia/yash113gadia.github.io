import { useEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import { CHALLENGE_EVENT, DISPATCH_EVENT } from '../game/store';

/*
  A small, self-contained version of the SpeedoExpress dispatch loop, drawn on canvas:
  - a procedurally generated street graph, seen through a tilted perspective camera,
  - drivers wandering it, leaving position trails that expire after a TTL (like Redis keys),
  - pickups (auto, or wherever the visitor clicks) matched to the nearest idle driver
    by road distance (Dijkstra), not straight-line distance.
  The simulation runs in flat "world" coordinates (x across, z into the screen); only
  drawing projects to the screen, and clicks are un-projected back onto the ground.
  Everything runs outside React state; stats are reported through a throttled callback.
*/

export interface DispatchStats {
  online: number;
  enRoute: number;
  delivered: number;
  lastMatch: { driver: number; km: number } | null;
}

interface GNode {
  x: number;
  z: number;
  adj: number[];
  // Cached projection (the camera never moves).
  sx: number;
  sy: number;
  s: number;
}

interface Job {
  pickup: number;
  drop: number;
  driver: number | null;
  /** Requested by the visitor (click, tap or command palette), not the autopilot. */
  mine: boolean;
}

export type GameEvent = 'dispatch' | 'deliver' | 'rush';

interface Driver {
  id: number;
  from: number;
  to: number;
  t: number;
  speed: number;
  route: number[];
  job: Job | null;
  phase: 'idle' | 'toPickup' | 'toDrop';
  trail: { x: number; z: number; at: number }[];
  /** A "ghost": its last reported position is this many seconds old. Frozen, never auto-assigned. */
  staleFor?: number;
  vanishAt?: number;
}

// "Beat the dispatcher": the visitor picks a driver for each pickup and is scored
// against the road-distance optimum.
export interface RoundResult {
  round: number;
  total: number;
  chosen: number;
  best: number;
  chosenKm: number | null; // null when the chosen driver was a ghost
  bestKm: number;
  staleFor: number | null;
  /** Driver that was nearest in a straight line, when that wasn't the best by road. */
  decoy: { driver: number; km: number } | null;
  efficiency: number; // 0..1
}

export type ChallengeEvent =
  | { type: 'await'; round: number; total: number }
  | { type: 'miss' }
  | { type: 'result'; result: RoundResult }
  | { type: 'done'; results: RoundResult[] };

const ROUNDS = 5;

const TRAIL_TTL = 2200; // ms a position stays "live"
const METERS_PER_UNIT = 2.4;
const INTRO_MS = 1800;

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const readVar = (name: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? v.split(/\s+/).join(',') : '128,128,128';
};

// Simple pinhole camera looking down onto the ground plane.
interface Camera {
  cx: number;
  horizon: number;
  near: number; // screen y of z = 0
  f: number;
  depth: number;
  sFar: number;
}

// `tilt` 0 looks out to the horizon; 1 pitches down over the streets (driven by scroll).
const makeCamera = (w: number, h: number, tilt = 0): Camera => {
  const portrait = h > w * 1.1;
  const depth = h * (portrait ? 1.3 : 2.2);
  const f = depth * 0.42;
  // Phones: the copy sits on top, so the city fills the lower half like a poster.
  const base = portrait ? 0.5 : 0.3;
  const horizon = h * (base - 1.05 * tilt);
  const near = h * (1.04 + 0.35 * tilt);
  return { cx: w / 2, horizon, near, f, depth, sFar: f / (f + depth) };
};

const project = (cam: Camera, x: number, z: number) => {
  const s = cam.f / (cam.f + Math.max(z, -cam.f * 0.9));
  return { sx: cam.cx + (x - cam.cx) * s, sy: cam.horizon + (cam.near - cam.horizon) * s, s };
};

const unproject = (cam: Camera, sx: number, sy: number) => {
  const s = (sy - cam.horizon) / (cam.near - cam.horizon);
  if (s <= cam.sFar) return null; // above the far edge of the city
  return { x: cam.cx + (sx - cam.cx) / s, z: cam.f / s - cam.f };
};

// 0 at the far edge (fog), 1 up close.
const nearness = (cam: Camera, s: number) => Math.max(0, Math.min(1, (s - cam.sFar) / (1 - cam.sFar)));

function buildGraph(w: number, h: number, cam: Camera, rand: () => number) {
  const spacing = Math.max(70, Math.min(120, w / 13));
  const halfFar = (w / 2 + 60) / cam.sFar;
  const x0 = cam.cx - halfFar;
  const cols = Math.ceil((halfFar * 2) / spacing) + 1;
  const rows = Math.ceil(cam.depth / spacing) + 2;
  const nodes: GNode[] = [];
  const id = (i: number, j: number) => j * cols + i;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * spacing + (rand() - 0.5) * spacing * 0.45;
      const z = (j - 1) * spacing + (rand() - 0.5) * spacing * 0.45;
      nodes.push({ x, z, adj: [], ...project(cam, x, z) });
    }
  }
  const inView = (n: GNode) => n.sx > -80 && n.sx < w + 80 && n.z <= cam.depth;
  const link = (a: number, b: number) => {
    if (!inView(nodes[a]) && !inView(nodes[b])) return;
    nodes[a].adj.push(b);
    nodes[b].adj.push(a);
  };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (i + 1 < cols && rand() < 0.84) link(id(i, j), id(i + 1, j));
      if (j + 1 < rows && rand() < 0.84) link(id(i, j), id(i, j + 1));
      if (i + 1 < cols && j + 1 < rows && rand() < 0.07) link(id(i, j), id(i + 1, j + 1));
    }
  }
  // Keep only the component containing the node nearest the middle of the view.
  const target = unproject(cam, w / 2, h * 0.62) ?? { x: w / 2, z: 0 };
  let start = 0;
  let best = Infinity;
  nodes.forEach((n, k) => {
    const d = (n.x - target.x) ** 2 + (n.z - target.z) ** 2;
    if (n.adj.length && d < best) {
      best = d;
      start = k;
    }
  });
  const seen = new Uint8Array(nodes.length);
  const stack = [start];
  seen[start] = 1;
  while (stack.length) {
    const n = stack.pop()!;
    for (const m of nodes[n].adj) if (!seen[m]) {
      seen[m] = 1;
      stack.push(m);
    }
  }
  const usable: number[] = [];
  const visible: number[] = [];
  nodes.forEach((n, k) => {
    if (!seen[k]) n.adj = [];
    else {
      usable.push(k);
      if (n.sx > 30 && n.sx < w - 30 && n.sy > cam.horizon + h * 0.12 && n.sy < h - 20) visible.push(k);
    }
  });
  return { nodes, usable, visible };
}

const edgeLen = (nodes: GNode[], a: number, b: number) => Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);

// Dijkstra from `src`; returns distances and predecessor (towards src).
function shortest(nodes: GNode[], src: number) {
  const n = nodes.length;
  const dist = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const done = new Uint8Array(n);
  dist[src] = 0;
  for (;;) {
    let u = -1;
    let du = Infinity;
    for (let k = 0; k < n; k++) if (!done[k] && dist[k] < du) {
      du = dist[k];
      u = k;
    }
    if (u === -1) break;
    done[u] = 1;
    for (const v of nodes[u].adj) {
      const alt = du + edgeLen(nodes, u, v);
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }
  return { dist, prev };
}

// Path from `from` to the Dijkstra root, excluding `from` itself.
const pathToRoot = (prev: Int32Array, from: number) => {
  const out: number[] = [];
  let cur = prev[from];
  while (cur !== -1) {
    out.push(cur);
    cur = prev[cur];
  }
  return out;
};

const makeGlow = (rgb: string) => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb},0.9)`);
  grad.addColorStop(0.25, `rgba(${rgb},0.35)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
};

interface Props {
  onStats?: (s: DispatchStats) => void;
  /** 0..1, pitches the camera down; usually scroll progress through the hero. */
  tilt?: MotionValue<number>;
  onGameEvent?: (e: GameEvent) => void;
  onChallenge?: (e: ChallengeEvent) => void;
  className?: string;
}

const LiveMap = ({ onStats, tilt, onGameEvent, onChallenge, className }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onStatsRef = useRef(onStats);
  const tiltRef = useRef(tilt);
  const gameRef = useRef(onGameEvent);
  const challengeRef = useRef(onChallenge);

  useEffect(() => {
    tiltRef.current = tilt;
    gameRef.current = onGameEvent;
    challengeRef.current = onChallenge;
  }, [tilt, onGameEvent, onChallenge]);

  useEffect(() => {
    onStatsRef.current = onStats;
  }, [onStats]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = mulberry32(20260923);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cam = makeCamera(1, 1);
    let graph = buildGraph(1, 1, cam, rand);
    let drivers: Driver[] = [];
    let jobs: Job[] = [];
    let delivered = 0;
    let lastMatch: DispatchStats['lastMatch'] = null;
    let lastAutoJob = 0;
    let pointer: { x: number; y: number } | null = null;
    let colors = { ink: '', accent: '', faint: '' };
    let dark = true;
    let glowAccent = makeGlow('255,200,61');
    let glowInk = makeGlow('240,240,230');
    const startedAt = performance.now();
    // Celebration rings where the visitor's deliveries land.
    let bursts: { x: number; z: number; at: number }[] = [];
    const roads = document.createElement('canvas');

    const readColors = () => {
      colors = { ink: readVar('--ink'), accent: readVar('--accent-fg'), faint: readVar('--faint') };
      dark = document.documentElement.classList.contains('dark');
      glowAccent = makeGlow(colors.accent);
      glowInk = makeGlow(colors.ink);
    };

    const drawRoads = () => {
      roads.width = w * dpr;
      roads.height = h * dpr;
      const r = roads.getContext('2d')!;
      r.setTransform(dpr, 0, 0, dpr, 0, 0);
      r.lineCap = 'round';
      // Bucket edges by distance so the fog is a handful of strokes, not thousands.
      const buckets = 8;
      const paths = Array.from({ length: buckets }, () => new Path2D());
      graph.nodes.forEach((n, a) => {
        for (const b of n.adj) if (b > a) {
          const m = graph.nodes[b];
          const k = Math.min(buckets - 1, Math.floor(nearness(cam, (n.s + m.s) / 2) * buckets));
          paths[k].moveTo(n.sx, n.sy);
          paths[k].lineTo(m.sx, m.sy);
        }
      });
      paths.forEach((path, k) => {
        const near = (k + 0.5) / buckets;
        r.strokeStyle = `rgba(${colors.faint},${(dark ? 0.2 : 0.2) + Math.sqrt(near) * (dark ? 0.38 : 0.45)})`;
        r.lineWidth = 0.5 + near * 1.3;
        r.stroke(path);
      });
    };

    const randomNode = () => graph.visible[Math.floor(rand() * graph.visible.length)] ?? graph.usable[0];

    const spawnDrivers = () => {
      const count = Math.round(Math.min(28, Math.max(12, (w * h) / 50000)));
      drivers = Array.from({ length: count }, (_, i) => {
        const from = randomNode();
        const to = graph.nodes[from].adj[0] ?? from;
        return { id: i + 1, from, to, t: rand(), speed: 30 + rand() * 20, route: [], job: null, phase: 'idle' as const, trail: [] };
      });
      jobs = [];
    };

    let camTilt = 0;
    // Re-project the cached screen positions when the camera pitch changes.
    const applyTilt = (t: number) => {
      const next = Math.max(0, Math.min(1, t));
      if (Math.abs(next - camTilt) < 0.001) return false;
      camTilt = next;
      cam = makeCamera(w, h, next);
      for (const n of graph.nodes) Object.assign(n, project(cam, n.x, n.z));
      drawRoads();
      return true;
    };

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      // The street graph is built for the resting camera so it always covers the view.
      cam = makeCamera(w, h, 0);
      graph = buildGraph(w, h, cam, rand);
      camTilt = 0;
      applyTilt(tiltRef.current?.get() ?? 0);
      readColors();
      drawRoads();
      spawnDrivers();
    };

    const worldPos = (d: Driver) => {
      const a = graph.nodes[d.from];
      const b = graph.nodes[d.to];
      return { x: a.x + (b.x - a.x) * d.t, z: a.z + (b.z - a.z) * d.t };
    };

    // Distance by road from a driver's current spot to the Dijkstra root, and which end of
    // its current street it should leave from.
    const roadTo = (d: Driver, dist: Float64Array) => {
      const L = edgeLen(graph.nodes, d.from, d.to);
      const viaTo = dist[d.to] + (1 - d.t) * L;
      const viaFrom = dist[d.from] + d.t * L;
      return viaTo <= viaFrom ? { m: viaTo, useTo: true } : { m: viaFrom, useTo: false };
    };

    const available = (d: Driver) => d.phase === 'idle' && d.staleFor === undefined;

    const assignTo = (job: Job, d: Driver, dist: Float64Array, prev: Int32Array) => {
      const r = roadTo(d, dist);
      if (!r.useTo) {
        [d.from, d.to] = [d.to, d.from];
        d.t = 1 - d.t;
      }
      d.route = d.to === job.pickup ? [] : pathToRoot(prev, d.to);
      d.phase = 'toPickup';
      d.job = job;
      job.driver = d.id;
      lastMatch = { driver: d.id, km: (r.m * METERS_PER_UNIT) / 1000 };
    };

    const nearestByRoad = (dist: Float64Array, onlyVisible = false) => {
      let best: Driver | null = null;
      let bestD = Infinity;
      for (const d of drivers) {
        if (!available(d) || (onlyVisible && !driverVisible(d))) continue;
        const m = roadTo(d, dist).m;
        if (m < bestD) {
          bestD = m;
          best = d;
        }
      }
      return Number.isFinite(bestD) ? { driver: best!, m: bestD } : null;
    };

    const assign = (job: Job) => {
      const { dist, prev } = shortest(graph.nodes, job.pickup);
      const best = nearestByRoad(dist);
      if (!best) return false;
      assignTo(job, best.driver, dist, prev);
      return true;
    };

    const addJob = (pickup: number, mine = false) => {
      if (jobs.length >= (mine ? 8 : 6)) return;
      let drop = randomNode();
      for (let k = 0; k < 12 && (drop === pickup || edgeLen(graph.nodes, pickup, drop) < Math.min(w, h) * 0.5); k++) drop = randomNode();
      if (drop === pickup) return;
      const job: Job = { pickup, drop, driver: null, mine };
      jobs.push(job);
      assign(job);
      if (mine) {
        gameRef.current?.('dispatch');
        if (jobs.filter((j) => j.mine).length >= 4) gameRef.current?.('rush');
      }
    };

    const nearestNode = (x: number, z: number) => {
      let best = graph.usable[0];
      let bd = Infinity;
      for (const k of graph.usable) {
        const n = graph.nodes[k];
        const d = (n.x - x) ** 2 + (n.z - z) ** 2;
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      return best;
    };

    const arrive = (d: Driver) => {
      if (d.phase === 'toPickup' && d.job && d.to === d.job.pickup) {
        d.phase = 'toDrop';
        d.route = pathToRoot(shortest(graph.nodes, d.job.drop).prev, d.to);
      } else if (d.phase === 'toDrop' && d.job && d.to === d.job.drop) {
        jobs = jobs.filter((j) => j !== d.job);
        if (d.job.mine) {
          const n = graph.nodes[d.job.drop];
          bursts.push({ x: n.x, z: n.z, at: performance.now() });
          gameRef.current?.('deliver');
        }
        d.job = null;
        d.phase = 'idle';
        delivered++;
      }
      const next = d.route.shift();
      if (next !== undefined) {
        d.from = d.to;
        d.to = next;
      } else {
        const options = graph.nodes[d.to].adj.filter((n) => n !== d.from);
        const pick = options.length ? options[Math.floor(rand() * options.length)] : d.from;
        d.from = d.to;
        d.to = pick;
      }
      d.t = 0;
    };

    // ---- Beat the dispatcher -------------------------------------------------
    let challenge: {
      round: number;
      pickup: number;
      awaiting: boolean;
      nextAt: number;
      results: RoundResult[];
      reveal: { route: number[]; start: { x: number; z: number }; until: number } | null;
    } | null = null;
    const emit = (e: ChallengeEvent) => challengeRef.current?.(e);

    // Panels drawn over the map (marked data-occlude) hide whatever is under them, so the
    // challenge never counts or offers a driver the visitor can't see or tap.
    let occluders: DOMRect[] = [];
    const readOccluders = () => {
      const c = canvas.getBoundingClientRect();
      occluders = [...(canvas.parentElement?.querySelectorAll<HTMLElement>('[data-occlude]') ?? [])]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => new DOMRect(r.left - c.left - 12, r.top - c.top - 12, r.width + 24, r.height + 24));
    };
    const onScreen = (x: number, y: number) =>
      x > 12 && x < w - 12 && y > cam.horizon + 8 && y < h - 12 &&
      !occluders.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
    const driverVisible = (d: Driver) => {
      const p = worldPos(d);
      const q = project(cam, p.x, p.z);
      return onScreen(q.sx, q.sy);
    };
    const km = (m: number) => (m * METERS_PER_UNIT) / 1000;

    // Pickups land where nothing sits on top of them: right of the headline on desktop,
    // the lower half on phones.
    const challengeNode = () => {
      const portrait = h > w * 1.1;
      const ok = graph.visible.filter((k) => {
        const n = graph.nodes[k];
        const band = portrait ? n.sy > h * 0.5 : n.sx > w * 0.4 && n.sy > cam.horizon + h * 0.12;
        return band && onScreen(n.sx, n.sy);
      });
      const pool = ok.length ? ok : graph.visible;
      return pool[Math.floor(rand() * pool.length)];
    };

    const startRound = () => {
      if (!challenge) return;
      readOccluders();
      challenge.pickup = challengeNode();
      challenge.awaiting = true;
      // Pickable driver positions, for automated tests of the challenge.
      canvas.dataset.pickable = JSON.stringify(
        drivers
          .filter((d) => d.phase === 'idle' && d.vanishAt === undefined && driverVisible(d))
          .map((d) => {
            const p = worldPos(d);
            const q = project(cam, p.x, p.z);
            return { id: d.id, x: Math.round(q.sx), y: Math.round(q.sy), ghost: d.staleFor !== undefined };
          }),
      );
      emit({ type: 'await', round: challenge.round, total: ROUNDS });
    };

    const startChallenge = () => {
      // A few idle drivers become ghosts: their last position is old and they no longer move.
      for (const d of drivers) {
        delete d.staleFor;
        delete d.vanishAt;
      }
      readOccluders();
      const idle = drivers.filter((d) => d.phase === 'idle' && driverVisible(d));
      for (let k = 0; k < Math.min(3, Math.floor(idle.length / 3)); k++) {
        const d = idle.splice(Math.floor(rand() * idle.length), 1)[0];
        d.staleFor = 35 + Math.floor(rand() * 60);
        d.trail = [];
      }
      challenge = { round: 1, pickup: -1, awaiting: false, nextAt: 0, results: [], reveal: null };
      startRound();
    };

    const finishChallenge = () => {
      if (!challenge) return;
      const results = challenge.results;
      challenge = null;
      for (const d of drivers) if (d.staleFor !== undefined && d.vanishAt === undefined) d.vanishAt = performance.now();
      emit({ type: 'done', results });
    };

    const pick = (d: Driver, now: number) => {
      if (!challenge) return;
      const pickup = challenge.pickup;
      const { dist, prev } = shortest(graph.nodes, pickup);
      const best = nearestByRoad(dist, true);
      if (!best) return;
      // Nearest in a straight line, to show when "looks closest" isn't closest by road.
      const at = graph.nodes[pickup];
      let crow: Driver | null = null;
      let crowD = Infinity;
      for (const c of drivers) {
        if (!available(c) || !driverVisible(c)) continue;
        const p = worldPos(c);
        const dd = Math.hypot(p.x - at.x, p.z - at.z);
        if (dd < crowD) {
          crowD = dd;
          crow = c;
        }
      }
      let drop = randomNode();
      for (let k = 0; k < 12 && (drop === pickup || edgeLen(graph.nodes, pickup, drop) < Math.min(w, h) * 0.5); k++) drop = randomNode();
      const job: Job = { pickup, drop, driver: null, mine: true };
      jobs.push(job);

      const ghost = d.staleFor !== undefined;
      const chosenM = ghost ? null : roadTo(d, dist).m;
      const decoy =
        crow && crow !== best.driver ? { driver: crow.id, km: km(roadTo(crow, dist).m) } : null;
      const result: RoundResult = {
        round: challenge.round,
        total: ROUNDS,
        chosen: d.id,
        best: best.driver.id,
        chosenKm: chosenM === null ? null : km(chosenM),
        bestKm: km(best.m),
        staleFor: ghost ? d.staleFor! : null,
        decoy,
        efficiency: chosenM === null ? 0 : Math.min(1, best.m / Math.max(chosenM, 1e-6)),
      };

      if (ghost) {
        d.vanishAt = now;
        assignTo(job, best.driver, dist, prev);
      } else {
        // Show the algorithm's pick for a moment when it differs from the visitor's.
        if (d !== best.driver) {
          const r = roadTo(best.driver, dist);
          const end = r.useTo ? best.driver.to : best.driver.from;
          challenge.reveal = { route: [end, ...pathToRoot(prev, end)], start: worldPos(best.driver), until: now + 2800 };
        }
        assignTo(job, d, dist, prev);
      }
      gameRef.current?.('dispatch');
      challenge.results.push(result);
      challenge.awaiting = false;
      challenge.nextAt = now + 3200;
      emit({ type: 'result', result });
    };

    const advanceChallenge = (now: number) => {
      if (!challenge || challenge.awaiting || now < challenge.nextAt) return;
      if (challenge.reveal && now > challenge.reveal.until) challenge.reveal = null;
      if (challenge.round >= ROUNDS) finishChallenge();
      else {
        challenge.round++;
        challenge.reveal = null;
        startRound();
      }
    };

    // Screen-space hit test for drivers the visitor can pick.
    const driverAt = (x: number, y: number, radius: number) => {
      let hit: Driver | null = null;
      let bd = radius;
      for (const d of drivers) {
        if (d.phase !== 'idle' || d.vanishAt !== undefined) continue;
        const p = worldPos(d);
        const q = project(cam, p.x, p.z);
        if (challenge && !onScreen(q.sx, q.sy)) continue;
        const dd = Math.hypot(q.sx - x, q.sy - y);
        if (dd < bd) {
          bd = dd;
          hit = d;
        }
      }
      return hit;
    };

    const step = (dt: number, now: number) => {
      drivers = drivers.filter((d) => d.vanishAt === undefined || now - d.vanishAt < 900);
      // Time stops while the visitor decides, so nobody has to chase a moving dot.
      const frozen = challenge?.awaiting === true;
      for (const d of drivers) {
        if (d.staleFor !== undefined || frozen) {
          while (d.trail.length && now - d.trail[0].at > TRAIL_TTL) d.trail.shift();
          continue; // ghosts don't move: that's what stale means
        }
        const L = edgeLen(graph.nodes, d.from, d.to) || 1;
        const boost = d.phase === 'idle' ? 1 : 2.1;
        d.t += (d.speed * boost * dt) / L;
        let guard = 0;
        while (d.t >= 1 && guard++ < 4) {
          const over = (d.t - 1) * L;
          arrive(d);
          d.t = over / (edgeLen(graph.nodes, d.from, d.to) || 1);
        }
        const p = worldPos(d);
        d.trail.push({ x: p.x, z: p.z, at: now });
        while (d.trail.length && now - d.trail[0].at > TRAIL_TTL) d.trail.shift();
      }
      if (drivers.some((d) => d.phase === 'idle')) for (const j of jobs) if (j.driver === null) assign(j);
      advanceChallenge(now);
      if (!challenge && now - lastAutoJob > 2600 && jobs.length < 4) {
        lastAutoJob = now;
        addJob(randomNode());
      }
    };

    const sprite = (img: HTMLCanvasElement, x: number, y: number, size: number) => {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    };

    const draw = (now: number) => {
      const intro = reduce ? 1 : Math.min(1, (now - startedAt) / INTRO_MS);
      const eased = 1 - Math.pow(1 - intro, 3);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);

      // Roads sweep in from the foreground towards the horizon on load.
      ctx.drawImage(roads, 0, 0, w, h);
      if (intro < 1) {
        const edge = h - (h - cam.horizon) * eased * 1.1;
        const mask = ctx.createLinearGradient(0, edge - 140, 0, edge + 30);
        mask.addColorStop(0, 'rgba(0,0,0,0)');
        mask.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = mask;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }

      // City light along the horizon: a flattened glow plus a thin bright band.
      const farY = cam.horizon + (cam.near - cam.horizon) * cam.sFar; // where the streets end
      ctx.save();
      ctx.translate(w / 2, farY);
      ctx.scale(1, 0.22);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.62);
      glow.addColorStop(0, `rgba(${colors.accent},${(dark ? 0.34 : 0.2) * eased})`);
      glow.addColorStop(0.35, `rgba(${colors.accent},${(dark ? 0.12 : 0.07) * eased})`);
      glow.addColorStop(1, `rgba(${colors.accent},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(-w, -w, w * 2, w * 2);
      ctx.restore();
      const band = ctx.createLinearGradient(0, 0, w, 0);
      band.addColorStop(0, `rgba(${colors.accent},0)`);
      band.addColorStop(0.5, `rgba(${colors.accent},${(dark ? 0.5 : 0.35) * eased})`);
      band.addColorStop(1, `rgba(${colors.accent},0)`);
      ctx.fillStyle = band;
      ctx.fillRect(0, farY - 2, w, 1);

      // Roads light up around the pointer.
      if (pointer && intro >= 1) {
        ctx.lineCap = 'round';
        graph.nodes.forEach((n, a) => {
          for (const b of n.adj) if (b > a) {
            const m = graph.nodes[b];
            const dd = Math.hypot((n.sx + m.sx) / 2 - pointer!.x, (n.sy + m.sy) / 2 - pointer!.y);
            if (dd < 200) {
              ctx.strokeStyle = `rgba(${colors.accent},${0.7 * (1 - dd / 200)})`;
              ctx.lineWidth = 0.6 + 1.6 * n.s;
              ctx.beginPath();
              ctx.moveTo(n.sx, n.sy);
              ctx.lineTo(m.sx, m.sy);
              ctx.stroke();
            }
          }
        });
      }

      const fade = eased;
      // Additive light in the dark theme reads as glow; plain blending in light.
      const light: GlobalCompositeOperation = dark ? 'lighter' : 'source-over';

      // Planned routes.
      ctx.setLineDash([5, 7]);
      for (const d of drivers) {
        if (d.phase === 'idle') continue;
        const p = worldPos(d);
        const a = project(cam, p.x, p.z);
        ctx.strokeStyle = `rgba(${colors.accent},${(d.phase === 'toPickup' ? 0.95 : 0.5) * fade})`;
        ctx.lineWidth = 0.8 + 1.4 * a.s;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        const first = graph.nodes[d.to];
        ctx.lineTo(first.sx, first.sy);
        for (const k of d.route) ctx.lineTo(graph.nodes[k].sx, graph.nodes[k].sy);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Trails: each point fades out as its TTL runs down.
      ctx.globalCompositeOperation = light;
      ctx.lineCap = 'round';
      for (const d of drivers) {
        const c = d.phase === 'idle' ? colors.ink : colors.accent;
        let prev: ReturnType<typeof project> | null = null;
        for (const pt of d.trail) {
          const q = project(cam, pt.x, pt.z);
          if (prev) {
            const life = 1 - (now - pt.at) / TRAIL_TTL;
            if (life > 0) {
              ctx.strokeStyle = `rgba(${c},${life * (d.phase === 'idle' ? 0.5 : 0.9) * fade * (0.35 + 0.65 * nearness(cam, q.s))})`;
              ctx.lineWidth = 0.8 + 2.4 * q.s;
              ctx.beginPath();
              ctx.moveTo(prev.sx, prev.sy);
              ctx.lineTo(q.sx, q.sy);
              ctx.stroke();
            }
          }
          prev = q;
        }
      }

      // Pickups (pulsing beacons) and drop-offs.
      const pulse = (now % 1400) / 1400;
      for (const j of jobs) {
        const carrier = drivers.find((d) => d.id === j.driver);
        if (!carrier || carrier.phase === 'toPickup') {
          const n = graph.nodes[j.pickup];
          ctx.globalCompositeOperation = light;
          sprite(glowAccent, n.sx, n.sy, (j.mine ? 110 : 70) * n.s * fade);
          ctx.globalCompositeOperation = 'source-over';
          const ring = (6 + pulse * 26) * n.s;
          ctx.strokeStyle = `rgba(${colors.accent},${(1 - pulse) * fade})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(n.sx, n.sy, ring * 1.6, ring * 0.75, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(${colors.accent},${fade})`;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, 2 + 3 * n.s, 0, Math.PI * 2);
          ctx.fill();
        }
        if (carrier) {
          const n = graph.nodes[j.drop];
          const r = 3 + 4 * n.s;
          ctx.strokeStyle = `rgba(${colors.accent},${0.85 * fade})`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(n.sx - r, n.sy - r * 0.6, r * 2, r * 1.2);
        }
      }

      // Drivers, with a soft glow. Ghosts (stale positions) are hollow and labelled.
      const hover = challenge?.awaiting && pointer ? driverAt(pointer.x, pointer.y, 44) : null;
      ctx.textAlign = 'center';
      for (const d of drivers) {
        const p = worldPos(d);
        const q = project(cam, p.x, p.z);
        if (q.sy < cam.horizon) continue;
        const busy = d.phase !== 'idle';
        const near = nearness(cam, q.s);
        const r = busy ? 1.8 + 3.6 * q.s : 1.2 + 2.6 * q.s;
        if (d.staleFor !== undefined) {
          const gone = d.vanishAt !== undefined ? Math.min(1, (now - d.vanishAt) / 900) : 0;
          const a = (0.75 - 0.75 * gone) * fade;
          ctx.strokeStyle = `rgba(${colors.ink},${a})`;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(q.sx, q.sy, (r + 1.5) * (1 + gone * 1.5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          if (challenge || gone) {
            ctx.fillStyle = `rgba(${colors.faint},${a})`;
            ctx.font = `500 ${Math.round(9 + 4 * q.s)}px "Geist Mono Variable", ui-monospace, monospace`;
            ctx.fillText(`${d.staleFor}s ago`, q.sx, q.sy - 10 - 6 * q.s);
          }
        } else {
          ctx.globalCompositeOperation = light;
          sprite(busy ? glowAccent : glowInk, q.sx, q.sy, (busy ? 54 : 26) * q.s * fade);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = busy ? `rgba(${colors.accent},${fade})` : `rgba(${colors.ink},${(0.4 + 0.5 * near) * fade})`;
          ctx.beginPath();
          ctx.arc(q.sx, q.sy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        // While a pickup waits, every pickable driver gets a ring; the hovered one glows.
        if (challenge?.awaiting && !busy && d.vanishAt === undefined && onScreen(q.sx, q.sy)) {
          const on = hover === d;
          ctx.strokeStyle = on ? `rgba(${colors.accent},0.95)` : `rgba(${colors.ink},0.28)`;
          ctx.lineWidth = on ? 2 : 1;
          ctx.beginPath();
          ctx.arc(q.sx, q.sy, r + (on ? 9 : 6), 0, Math.PI * 2);
          ctx.stroke();
          if (on) {
            ctx.fillStyle = `rgba(${colors.accent},1)`;
            ctx.font = `600 12px "Geist Mono Variable", ui-monospace, monospace`;
            ctx.fillText(`driver ${String(d.id).padStart(2, '0')}`, q.sx, q.sy + r + 22);
          }
        }
      }

      if (challenge) {
        // The pickup being decided, labelled.
        if (challenge.awaiting && challenge.pickup >= 0) {
          const n = graph.nodes[challenge.pickup];
          ctx.globalCompositeOperation = light;
          sprite(glowAccent, n.sx, n.sy, 140 * n.s * (0.8 + 0.2 * Math.sin(now / 220)));
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgba(${colors.accent},1)`;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, 3 + 4 * n.s, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = `600 ${Math.round(11 + 4 * n.s)}px "Geist Mono Variable", ui-monospace, monospace`;
          ctx.fillText(`pickup ${challenge.round}/${ROUNDS}`, n.sx, n.sy - 16 - 10 * n.s);
        }
        // The algorithm's pick, when it differed from the visitor's.
        if (challenge.reveal && now < challenge.reveal.until) {
          const rv = challenge.reveal;
          const t = 1 - (challenge.reveal.until - now) / 2800;
          ctx.strokeStyle = `rgba(${colors.ink},${0.9 * (1 - Math.max(0, t - 0.7) / 0.3)})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([2, 5]);
          ctx.beginPath();
          const s0 = project(cam, rv.start.x, rv.start.z);
          ctx.moveTo(s0.sx, s0.sy);
          for (const k of rv.route) ctx.lineTo(graph.nodes[k].sx, graph.nodes[k].sy);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = `rgba(${colors.ink},0.9)`;
          ctx.font = `500 11px "Geist Mono Variable", ui-monospace, monospace`;
          ctx.fillText('best by road', s0.sx, s0.sy - 14);
        }
      }

      // The visitor's deliveries: an expanding ring and a rising "+1".
      bursts = bursts.filter((b) => now - b.at < 1100);
      for (const b of bursts) {
        const q = project(cam, b.x, b.z);
        const t = (now - b.at) / 1100;
        const k = 1 - Math.pow(1 - t, 3);
        ctx.globalCompositeOperation = light;
        sprite(glowAccent, q.sx, q.sy, (40 + 120 * k) * q.s * (1 - t));
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = `rgba(${colors.accent},${1 - t})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(q.sx, q.sy, (10 + 60 * k) * q.s * 1.6, (10 + 60 * k) * q.s * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(${colors.accent},${1 - t})`;
        ctx.font = `600 ${Math.round(12 + 10 * q.s)}px "Geist Mono Variable", ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('+1 delivered', q.sx, q.sy - 18 - 36 * k);
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    let lastReport = '';
    const report = () => {
      const s: DispatchStats = {
        online: drivers.length,
        enRoute: drivers.filter((d) => d.phase !== 'idle').length,
        delivered,
        lastMatch,
      };
      const key = JSON.stringify(s);
      if (key !== lastReport) {
        lastReport = key;
        onStatsRef.current?.(s);
      }
    };

    layout();

    let raf = 0;
    let last = performance.now();
    let visible = true;
    let lastReportAt = 0;
    const frame = (now: number) => {
      applyTilt(tiltRef.current?.get() ?? 0);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt, now);
      draw(now);
      if (now - lastReportAt > 250) {
        lastReportAt = now;
        report();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Reduced motion: one still frame with a few jobs assigned and short trails.
    const staticFrame = () => {
      const now = performance.now();
      for (let k = 0; k < 40; k++) step(0.05, now - (40 - k) * 50);
      draw(now);
      report();
    };

    if (reduce) {
      for (let k = 0; k < 3; k++) addJob(randomNode());
      staticFrame();
    } else start();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    let resizeTimer = 0;
    let lastW = canvas.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        // Mobile browsers change the viewport height as the address bar hides; only
        // rebuild the city for real width changes or large height changes.
        const r = canvas.getBoundingClientRect();
        if (Math.abs(r.width - lastW) < 1 && Math.abs(r.height - h) < 120) return;
        lastW = r.width;
        layout();
        if (reduce) staticFrame();
      }, 150);
    });
    ro.observe(canvas);

    const mo = new MutationObserver(() => {
      readColors();
      drawRoads();
      if (reduce) draw(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') pointer = local(e);
    };
    const onLeave = () => {
      pointer = null;
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      if (challenge) {
        if (!challenge.awaiting) return;
        const d = driverAt(p.x, p.y, e.pointerType === 'mouse' ? 44 : 60);
        if (d) pick(d, performance.now());
        else emit({ type: 'miss' });
        if (reduce) {
          draw(performance.now());
          window.setTimeout(() => {
            advanceChallenge(performance.now() + 10000);
            draw(performance.now());
          }, 3200);
        }
        return;
      }
      const ground = unproject(cam, p.x, p.y);
      if (!ground) return;
      addJob(nearestNode(ground.x, ground.z), true);
      lastAutoJob = performance.now();
      if (reduce) draw(performance.now());
      report();
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    const onDispatchRequest = () => {
      if (challenge) return;
      addJob(randomNode(), true);
      lastAutoJob = performance.now();
      if (reduce) draw(performance.now());
      report();
    };
    window.addEventListener(DISPATCH_EVENT, onDispatchRequest);
    const onChallengeRequest = () => {
      startChallenge();
      if (reduce) draw(performance.now());
    };
    window.addEventListener(CHALLENGE_EVENT, onChallengeRequest);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener(DISPATCH_EVENT, onDispatchRequest);
      window.removeEventListener(CHALLENGE_EVENT, onChallengeRequest);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Simulated dispatch map of a city seen at an angle: drivers move along streets and the nearest one by road is sent to each pickup. Click the streets to request a pickup."
      className={`cursor-crosshair touch-manipulation ${className ?? ''}`}
    />
  );
};

export default LiveMap;
