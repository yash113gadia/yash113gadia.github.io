// The city: a fixed, hand-placed grid so places are memorable between visits.
// World units are CSS pixels at zoom 1. Blocks sit between roads; every block holds
// buildings (obstacles). Landmarks are the portfolio's places.

export const COLS = 5;
export const ROWS = 4;
export const BW = 380; // block width
export const BH = 300; // block height
export const ROAD = 104;
export const WORLD_W = COLS * BW + (COLS + 1) * ROAD;
export const WORLD_H = ROWS * BH + (ROWS + 1) * ROAD;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Building extends Rect {
  height: number; // visual only (pseudo-3D extrusion)
  landmark?: string; // Landmark id
  seed: number;
}

export type Side = 'n' | 's' | 'e' | 'w';

export type LandmarkKind = 'project' | 'hq' | 'experience' | 'about' | 'contact' | 'campus' | 'gate' | 'plain';

export interface Landmark {
  id: string;
  name: string;
  sub: string;
  kind: LandmarkKind;
  col: number;
  row: number;
  side: Side;
  /** Featured project id from site.ts, when the place is a project. */
  project?: string;
  /** Entrance on the road in front of the building, filled in below. */
  door: { x: number; y: number };
}

export const blockRect = (c: number, r: number): Rect => ({
  x: ROAD + c * (BW + ROAD),
  y: ROAD + r * (BH + ROAD),
  w: BW,
  h: BH,
});

const L = (id: string, name: string, sub: string, kind: LandmarkKind, col: number, row: number, side: Side, project?: string): Landmark => ({
  id,
  name,
  sub,
  kind,
  col,
  row,
  side,
  project,
  door: { x: 0, y: 0 },
});

export const LANDMARKS: Landmark[] = [
  L('hq', 'SpeedoExpress HQ', 'Dispatch office', 'hq', 2, 1, 's', 'speedoexpress'),
  L('bitesite', 'BiteSite Canteen', 'Multi-tenant canteen SaaS', 'project', 0, 0, 'e', 'bitesite'),
  L('college-a', 'College A', 'Gate', 'gate', 4, 0, 'w'),
  L('college-b', 'College B', 'Gate', 'gate', 0, 3, 'n'),
  L('wec', 'World Express Depot', 'Courier platform', 'project', 4, 3, 'w', 'world-express-courier'),
  L('attestr', 'Attestr Lab', 'Media provenance', 'project', 4, 1, 'w', 'attestr'),
  L('newsroom', 'Newsroom', 'Where the photo was taken', 'plain', 1, 3, 'e'),
  L('anvaya', 'Anvaya Coding Lab', 'Sandboxed Java grading', 'project', 1, 1, 'n', 'anvaya-coding-lab'),
  L('niet', 'NIET Campus', 'B.Tech + M.Tech CS, 2024-29', 'campus', 1, 0, 's'),
  L('codepilot', 'CodePilot Garage', 'AI coding agent', 'project', 3, 2, 'n', 'codepilot'),
  L('post', 'Post Office', 'Get in touch', 'contact', 2, 3, 'n'),
  L('hall', 'Hall of Work', 'Experience', 'experience', 3, 0, 's'),
  L('home', "Yash's Place", 'About me', 'about', 0, 2, 'e'),
];

// Door: centre of the facing side, pushed a third of the way into the road.
for (const l of LANDMARKS) {
  const b = blockRect(l.col, l.row);
  const off = ROAD * 0.36;
  if (l.side === 'n') l.door = { x: b.x + b.w / 2, y: b.y - off };
  if (l.side === 's') l.door = { x: b.x + b.w / 2, y: b.y + b.h + off };
  if (l.side === 'w') l.door = { x: b.x - off, y: b.y + b.h / 2 };
  if (l.side === 'e') l.door = { x: b.x + b.w + off, y: b.y + b.h / 2 };
}

export const landmark = (id: string) => LANDMARKS.find((l) => l.id === id)!;

// Deterministic pseudo-random for layout.
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const SIDEWALK = 16;

// Parks are blocks with trees instead of buildings (still not drivable).
const PARKS = new Set(['2,2']);

export const PARK_RECTS: Rect[] = [];
export const BUILDINGS: Building[] = [];

{
  const rand = rng(113);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const b = blockRect(c, r);
      const inner = { x: b.x + SIDEWALK, y: b.y + SIDEWALK, w: b.w - SIDEWALK * 2, h: b.h - SIDEWALK * 2 };
      if (PARKS.has(`${c},${r}`)) {
        PARK_RECTS.push(inner);
        continue;
      }
      const lm = LANDMARKS.find((l) => l.col === c && l.row === r);
      if (lm) {
        BUILDINGS.push({ ...inner, height: lm.kind === 'hq' ? 90 : 60 + rand() * 25, landmark: lm.id, seed: Math.floor(rand() * 1e6) });
        continue;
      }
      // Ordinary blocks: split into two or three buildings with a gap.
      const gap = 14;
      const split = rand() < 0.5 ? 2 : 3;
      if (rand() < 0.5) {
        const wEach = (inner.w - gap * (split - 1)) / split;
        for (let k = 0; k < split; k++)
          BUILDINGS.push({ x: inner.x + k * (wEach + gap), y: inner.y, w: wEach, h: inner.h, height: 25 + rand() * 70, seed: Math.floor(rand() * 1e6) });
      } else {
        const hEach = (inner.h - gap * (split - 1)) / split;
        for (let k = 0; k < split; k++)
          BUILDINGS.push({ x: inner.x, y: inner.y + k * (hEach + gap), w: inner.w, h: hEach, height: 25 + rand() * 70, seed: Math.floor(rand() * 1e6) });
      }
    }
  }
}

// Everything solid. The world edge is handled separately.
export const OBSTACLES: Rect[] = [
  ...BUILDINGS.map(({ x, y, w, h }) => ({ x, y, w, h })),
  ...PARK_RECTS,
];

export const SPAWN = { x: landmark('hq').door.x, y: landmark('hq').door.y + 18, heading: -Math.PI / 2 };

// Road centre lines (for traffic and the minimap).
export const ROAD_LINES = {
  vertical: Array.from({ length: COLS + 1 }, (_, i) => ROAD / 2 + i * (BW + ROAD)),
  horizontal: Array.from({ length: ROWS + 1 }, (_, i) => ROAD / 2 + i * (BH + ROAD)),
};

// A point on a road near a block side, for mission items.
export const roadPoint = (c: number, r: number, side: Side, t = 0.5) => {
  const b = blockRect(c, r);
  const off = ROAD * 0.36;
  if (side === 'n') return { x: b.x + b.w * t, y: b.y - off };
  if (side === 's') return { x: b.x + b.w * t, y: b.y + b.h + off };
  if (side === 'w') return { x: b.x - off, y: b.y + b.h * t };
  return { x: b.x + b.w + off, y: b.y + b.h * t };
};
