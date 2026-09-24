import { BUILDINGS, COLS, LANDMARKS, PARK_RECTS, ROWS, blockRect, type Building, type Rect } from './map';

// Art direction: a cool blue night lit by warm street lamps, with each place in its own
// neon. Everything static is generated once from fixed seeds, so the city is the same on
// every visit. Colours are "r,g,b" strings so alpha can be applied per use.

export const PAL = {
  void: '#03050a',
  water: '#060b17',
  asphalt: '#121827',
  sidewalk: '#1c2334',
  grass: '#0c1a1a',
  ink: '242,241,234',
  accent: '255,200,61',
  lamp: '255,190,120',
  lampCool: '170,205,255',
  head: '255,242,210',
  tail: '255,48,64',
  window: '255,196,122',
  windowDim: '214,150,92',
  windowCool: '150,196,255',
  tv: '120,170,255',
};

export const rgba = (rgb: string, a: number) => `rgba(${rgb},${a})`;

/** Each place's neon. Projects get the strong hues; supporting places stay warm and quiet. */
export const LM_HUE: Record<string, string> = {
  hq: PAL.accent,
  bitesite: '255,122,89',
  attestr: '84,214,255',
  anvaya: '118,228,150',
  codepilot: '182,146,255',
  wec: '96,160,255',
  niet: '255,150,196',
  'college-a': '206,216,255',
  'college-b': '206,216,255',
  newsroom: '255,96,112',
  post: '255,164,72',
  hall: '255,214,140',
  home: '255,186,150',
};

export const rng = (seed: number) => {
  let s = Math.abs(Math.floor(seed)) % 2147483646 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const parse = (rgb: string): RGB => rgb.split(',').map(Number) as RGB;
export const shade = ([r, g, b]: RGB, k: number) => `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// --- sprites ------------------------------------------------------------------

const glowCache = new Map<string, HTMLCanvasElement>();

/** A soft radial light, drawn with 'lighter' compositing for cheap bloom. */
export const glow = (rgb: string) => {
  let c = glowCache.get(rgb);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, rgba(rgb, 1));
    gr.addColorStop(0.16, rgba(rgb, 0.5));
    gr.addColorStop(0.42, rgba(rgb, 0.15));
    gr.addColorStop(1, rgba(rgb, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    glowCache.set(rgb, c);
  }
  return c;
};

export const drawGlow = (ctx: CanvasRenderingContext2D, rgb: string, x: number, y: number, r: number, a: number) => {
  if (a <= 0.003) return;
  ctx.globalAlpha = Math.min(1, a);
  ctx.drawImage(glow(rgb), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
};

const tile = (ctx: CanvasRenderingContext2D, size: number, paint: (g: CanvasRenderingContext2D, s: number) => void) => {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  paint(c.getContext('2d')!, size);
  return ctx.createPattern(c, 'repeat')!;
};

// Patterns are costly to fill, so they only cover small areas (sidewalk strips, the park).
export const makePatterns = (ctx: CanvasRenderingContext2D) => ({
  pavement: tile(ctx, 20, (g, s) => {
    g.fillStyle = PAL.sidewalk;
    g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(0, 0, s, 1);
    g.fillRect(0, 0, 1, s);
    g.fillStyle = 'rgba(190,205,255,0.03)';
    g.fillRect(1, 1, s - 2, 1);
  }),
  grass: tile(ctx, 64, (g, s) => {
    g.fillStyle = PAL.grass;
    g.fillRect(0, 0, s, s);
    const r = rng(9);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(80,160,120,0.06)' : 'rgba(0,0,0,0.2)';
      g.fillRect(r() * s, r() * s, 2, 2);
    }
  }),
});

// --- static dressing -----------------------------------------------------------

export type Face = 'n' | 's' | 'e' | 'w';

export interface Lamp {
  x: number;
  y: number;
  /** Centre of the light pool, pushed out over the road. */
  px: number;
  py: number;
  rgb: string;
}

export interface Ped {
  ring: Rect;
  p: number;
  speed: number;
  rgb: string;
}

export interface Tree {
  x: number;
  y: number;
  r: number;
  k: number;
}

export interface RoofItem {
  kind: 'ac' | 'tank' | 'sky' | 'solar' | 'garden' | 'dish' | 'helipad' | 'dome' | 'court' | 'pool';
  u: number;
  v: number;
  w: number;
  h: number;
}

/** Lit windows on one wall: column and floor indices, plus the brightness bucket. */
export interface WallWindows {
  cols: number;
  floors: number;
  lit: { c: number; f: number; b: 0 | 1 | 2 | 3 }[];
}

export interface BuildingArt {
  roof: RGB;
  hue: string | null;
  items: RoofItem[];
  walls: Record<Face, WallWindows>;
  beacon: boolean;
  tvPhase: number;
}

const ROOF_TONES = ['#232b3f', '#272d44', '#20293a', '#2a2840', '#22303c', '#2a3246', '#262a36'].map(hex);

const windowsFor = (len: number, height: number, lit: number, r: () => number): WallWindows => {
  const cols = Math.max(2, Math.floor(len / 15));
  const floors = Math.max(2, Math.round(height / 15));
  const out: WallWindows['lit'] = [];
  for (let c = 0; c < cols; c++)
    for (let f = 0; f < floors; f++) {
      if (r() > lit) continue;
      const k = r();
      out.push({ c, f, b: k < 0.52 ? 0 : k < 0.84 ? 1 : k < 0.96 ? 2 : 3 });
    }
  return { cols, floors, lit: out };
};

const artFor = (b: Building): BuildingArt => {
  const r = rng(b.seed * 7 + 3);
  const lm = b.landmark ? LANDMARKS.find((l) => l.id === b.landmark) : undefined;
  const hue = lm ? LM_HUE[lm.id] ?? PAL.accent : null;
  const base = ROOF_TONES[Math.floor(r() * ROOF_TONES.length)];
  const roof = hue ? mix(hex('#1c2130'), parse(hue), 0.14) : base;
  const lit = lm ? 0.55 : 0.3 + r() * 0.2;
  const walls = {
    n: windowsFor(b.w, b.height, lit, r),
    s: windowsFor(b.w, b.height, lit, r),
    e: windowsFor(b.h, b.height, lit, r),
    w: windowsFor(b.h, b.height, lit, r),
  };
  const items: RoofItem[] = [];
  const add = (kind: RoofItem['kind'], u: number, v: number, w: number, h: number) => items.push({ kind, u, v, w, h });

  if (lm) {
    // Landmarks get a roof that says what they are; the sign sits in the middle.
    if (lm.kind === 'hq') add('helipad', 0.8, 0.28, 0.2, 0.26);
    else if (lm.kind === 'campus' || lm.kind === 'gate') add('court', 0.5, 0.5, 0.62, 0.56);
    else if (lm.kind === 'experience') add('dome', 0.5, 0.5, 0.3, 0.38);
    else if (lm.kind === 'about') {
      add('garden', 0.22, 0.28, 0.3, 0.34);
      add('pool', 0.78, 0.72, 0.22, 0.2);
    } else if (lm.kind === 'contact') add('solar', 0.2, 0.25, 0.26, 0.3);
    else add('sky', 0.5, 0.2, 0.6, 0.08);
    add('ac', 0.14, 0.82, 0, 0);
    add('ac', 0.86, 0.18, 0, 0);
  } else {
    const n = 1 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) add('ac', 0.15 + r() * 0.7, 0.15 + r() * 0.7, 0, 0);
    const pick = r();
    if (pick < 0.3) add('tank', 0.2 + r() * 0.6, 0.2 + r() * 0.6, 0, 0);
    else if (pick < 0.45) add('solar', 0.5, 0.5, 0.5, 0.4);
    else if (pick < 0.58) add('garden', 0.5, 0.5, 0.46, 0.4);
    else if (pick < 0.7) add('sky', 0.5, 0.5, 0.56, 0.1);
    else if (pick < 0.8) add('dish', 0.25 + r() * 0.5, 0.25 + r() * 0.5, 0, 0);
  }
  return { roof, hue, items, walls, beacon: b.height > 92 || lm?.kind === 'hq', tvPhase: r() * 10 };
};

export const BUILDING_ART = new Map<Building, BuildingArt>(BUILDINGS.map((b) => [b, artFor(b)]));

/** Street lamps along every block edge, light pools overhanging the road. */
export const LAMPS: Lamp[] = (() => {
  const out: Lamp[] = [];
  const r = rng(77);
  const put = (x: number, y: number, nx: number, ny: number) =>
    out.push({ x, y, px: x + nx * 16, py: y + ny * 16, rgb: r() < 0.18 ? PAL.lampCool : PAL.lamp });
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
      const b = blockRect(col, row);
      for (const t of [30, b.w / 2, b.w - 30]) {
        put(b.x + t, b.y + 5, 0, -1);
        put(b.x + t, b.y + b.h - 5, 0, 1);
      }
      put(b.x + 5, b.y + b.h / 2, -1, 0);
      put(b.x + b.w - 5, b.y + b.h / 2, 1, 0);
    }
  return out;
})();

const PED_COLOURS = ['92,110,150', '150,100,90', '90,130,120', '170,160,140', '120,95,150', '200,180,120', '80,90,110'];

export const PEDS: Ped[] = (() => {
  const r = rng(303);
  const out: Ped[] = [];
  for (let i = 0; i < 90; i++) {
    const col = Math.floor(r() * COLS);
    const row = Math.floor(r() * ROWS);
    const b = blockRect(col, row);
    const ring = { x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - 16 };
    out.push({ ring, p: r() * 2 * (ring.w + ring.h), speed: (r() < 0.5 ? -1 : 1) * (10 + r() * 14), rgb: PED_COLOURS[Math.floor(r() * PED_COLOURS.length)] });
  }
  return out;
})();

export const pedPos = (d: Ped) => {
  const { x, y, w, h } = d.ring;
  const per = 2 * (w + h);
  let p = ((d.p % per) + per) % per;
  if (p < w) return { x: x + p, y };
  p -= w;
  if (p < h) return { x: x + w, y: y + p };
  p -= h;
  if (p < w) return { x: x + w - p, y: y + h };
  p -= w;
  return { x, y: y + h - p };
};

/** Parks: a cross of paths, a fountain plaza, trees everywhere else. */
export const PARK_ART = PARK_RECTS.map((p) => {
  const r = rng(p.x + p.y);
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const trees: Tree[] = [];
  for (let gx = p.x + 18; gx < p.x + p.w - 12; gx += 30)
    for (let gy = p.y + 18; gy < p.y + p.h - 12; gy += 30) {
      const x = gx + (r() - 0.5) * 16;
      const y = gy + (r() - 0.5) * 16;
      if (Math.abs(x - cx) < 24 || Math.abs(y - cy) < 24 || Math.hypot(x - cx, y - cy) < 62) continue;
      if (r() < 0.18) continue;
      trees.push({ x, y, r: 10 + r() * 8, k: 0.8 + r() * 0.4 });
    }
  const lamps: Lamp[] = [
    [cx - p.w * 0.3, cy - 20],
    [cx + p.w * 0.3, cy + 20],
    [cx - 20, cy - p.h * 0.3],
    [cx + 20, cy + p.h * 0.3],
  ].map(([x, y]) => ({ x, y, px: x, py: y, rgb: PAL.lamp }));
  return { rect: p, cx, cy, trees, lamps };
});

// --- vehicles and people -----------------------------------------------------------

// No yellow: that colour belongs to the courier, so you can always find yourself.
export const CAR_PAINT = ['#d9dee8', '#8f99ab', '#b5443c', '#2f5a9a', '#1e222b', '#7d8597', '#3d7a69', '#6b4f8f'];

export const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, paint: string) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect(-14, -5.5, 31, 16, 5);
  ctx.fill();
  ctx.fillStyle = paint;
  ctx.beginPath();
  ctx.roundRect(-15, -7.5, 30, 15, 4.5);
  ctx.fill();
  // Glass: windscreen, rear window, and the roof between them.
  ctx.fillStyle = 'rgba(8,12,22,0.88)';
  ctx.beginPath();
  ctx.roundRect(-9, -6, 17, 12, 3);
  ctx.fill();
  ctx.fillStyle = paint;
  ctx.beginPath();
  ctx.roundRect(-5, -5.4, 9, 10.8, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(-5, -5.4, 9, 2);
  ctx.fillStyle = rgba(PAL.head, 1);
  ctx.fillRect(13.6, -6, 1.6, 3.2);
  ctx.fillRect(13.6, 2.8, 1.6, 3.2);
  ctx.fillStyle = rgba(PAL.tail, 1);
  ctx.fillRect(-15.2, -6, 1.6, 3);
  ctx.fillRect(-15.2, 3, 1.6, 3);
  ctx.restore();
};

// One pre-drawn beam (half-angle 0.5 rad, 256px long), stretched to each lamp's size.
let beamSprite: HTMLCanvasElement | null = null;
const beam = () => {
  if (!beamSprite) {
    beamSprite = document.createElement('canvas');
    beamSprite.width = beamSprite.height = 256;
    const g = beamSprite.getContext('2d')!;
    const gr = g.createRadialGradient(0, 128, 0, 0, 128, 256);
    gr.addColorStop(0, rgba(PAL.head, 1));
    gr.addColorStop(0.5, rgba(PAL.head, 0.35));
    gr.addColorStop(1, rgba(PAL.head, 0));
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, 128);
    g.arc(0, 128, 256, -0.5, 0.5);
    g.closePath();
    g.fill();
  }
  return beamSprite;
};

/** A headlight beam on the road: warm, soft, widening forward. */
export const drawBeam = (ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, spread: number, a: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = a;
  ctx.scale(len / 256, ((len / 256) * Math.tan(spread)) / Math.tan(0.5));
  ctx.drawImage(beam(), 0, -128);
  ctx.restore();
};

export const drawCourier = (ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, s: number, braking: boolean) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(2.5, 3.5, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Deck and front wheel.
  ctx.fillStyle = '#232837';
  ctx.beginPath();
  ctx.roundRect(-15, -5, 32, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#0d1017';
  ctx.beginPath();
  ctx.roundRect(15, -2.6, 6, 5.2, 2.6);
  ctx.fill();
  // SpeedoExpress delivery box.
  ctx.fillStyle = '#ffc83d';
  ctx.beginPath();
  ctx.roundRect(-18, -8.5, 14, 17, 2.5);
  ctx.fill();
  ctx.fillStyle = 'rgba(80,50,0,0.45)';
  ctx.fillRect(-18, -1, 14, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-17, -7.5, 12, 1.5);
  // Rider: shoulders, arms to the bars, helmet with visor.
  ctx.fillStyle = '#2d3346';
  ctx.beginPath();
  ctx.ellipse(1, 0, 5.5, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2d3346';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(2, -6);
  ctx.lineTo(10.5, -7.5);
  ctx.moveTo(2, 6);
  ctx.lineTo(10.5, 7.5);
  ctx.stroke();
  ctx.strokeStyle = '#0b0d13';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(11, -8.5);
  ctx.lineTo(11, 8.5);
  ctx.stroke();
  ctx.fillStyle = '#ffc83d';
  ctx.beginPath();
  ctx.arc(2.5, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#141824';
  ctx.beginPath();
  ctx.arc(2.5, 0, 5, -0.9, 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(0.8, -2, 1.4, 0, Math.PI * 2);
  ctx.fill();
  // Lamps.
  ctx.fillStyle = rgba(PAL.head, 1);
  ctx.fillRect(20, -1.5, 2, 3);
  ctx.fillStyle = rgba(PAL.tail, braking ? 1 : 0.7);
  ctx.fillRect(-19.2, -3, 1.6, 6);
  ctx.restore();
};

export const drawPed = (ctx: CanvasRenderingContext2D, x: number, y: number, rgb: string) => {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.arc(x + 1.2, y + 1.5, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgb(${rgb})`;
  ctx.beginPath();
  ctx.arc(x, y, 3.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(40,30,25,1)';
  ctx.beginPath();
  ctx.arc(x, y, 1.7, 0, Math.PI * 2);
  ctx.fill();
};
