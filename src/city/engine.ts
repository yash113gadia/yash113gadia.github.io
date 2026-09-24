import {
  BUILDINGS,
  COLS,
  LANDMARKS,
  OBSTACLES,
  ROAD,
  ROAD_LINES,
  ROWS,
  SPAWN,
  WORLD_H,
  WORLD_W,
  blockRect,
  type Building,
  type Rect,
} from './map';
import type { Marker } from './missions';
import {
  BUILDING_ART,
  CAR_PAINT,
  LAMPS,
  LM_HUE,
  PAL,
  PARK_ART,
  PEDS,
  drawBeam,
  drawCar,
  drawCourier,
  drawGlow,
  drawPed,
  makePatterns,
  pedPos,
  rgba,
  shade,
  type BuildingArt,
  type Face,
} from './art';

// Top-down night city with a perspective camera hanging above the screen centre: a
// point at height z is drawn pushed away from the centre by CAM_H / (CAM_H - z), so
// buildings show the walls that face you, roofs lean outward, and windows sit on floors.

export interface EngineHooks {
  /** Called every simulated frame with the courier's position; returns what to draw. */
  tick(p: { x: number; y: number; speed: number }, dt: number): Marker[];
  /** The landmark whose door the courier is at (or null), when it changes. */
  onNear(id: string | null): void;
  /** First time the visitor actually moves. */
  onMoved(): void;
}

const R = 9; // courier collision radius
const MAX_SPEED = 300;
const TRAIL_TTL = 2.4;
const CAM_H = 620;
const lift = (z: number) => CAM_H / (CAM_H - z);
// Backing-store pixel budget: big Retina screens render a little under 2x to stay smooth.
const PIXEL_BUDGET = 3.2e6;

interface Car {
  axis: 'h' | 'v';
  line: number;
  pos: number;
  dir: 1 | -1;
  speed: number;
  paint: string;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const angleDiff = (a: number, b: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

const FONT_SANS = '"Bricolage Grotesque Variable", "Geist Variable", sans-serif';
const FONT_MONO = '"Geist Mono Variable", ui-monospace, monospace';

export class CityEngine {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private running = false;
  paused = false;

  // Courier
  private px = SPAWN.x;
  private py = SPAWN.y;
  private heading = SPAWN.heading;
  private speed = 0;
  private braking = false;
  private trail: { x: number; y: number; t: number }[] = [];
  private moved = false;
  private time = 0;

  // Camera
  private cx = SPAWN.x;
  private cy = SPAWN.y;
  private zoom = 1;

  // Input
  private keys = new Set<string>();
  private stick: { id: number; ox: number; oy: number; x: number; y: number } | null = null;

  private markers: Marker[] = [];
  private near: string | null = null;
  private cars: Car[] = [];
  private pat: ReturnType<typeof makePatterns>;
  private ro: ResizeObserver;
  private cleanup: (() => void)[] = [];

  private canvas: HTMLCanvasElement;
  private hooks: EngineHooks;

  constructor(canvas: HTMLCanvasElement, hooks: EngineHooks) {
    this.canvas = canvas;
    this.hooks = hooks;
    this.ctx = canvas.getContext('2d')!;
    this.pat = makePatterns(this.ctx);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 22; i++) {
      const axis = i % 2 ? 'h' : 'v';
      const lines = axis === 'h' ? ROAD_LINES.horizontal : ROAD_LINES.vertical;
      const dir = rand() < 0.5 ? 1 : -1;
      this.cars.push({
        axis,
        // Keep to the right-hand lane for the direction of travel.
        line: lines[Math.floor(rand() * lines.length)] + (axis === 'h' ? dir * 16 : -dir * 16),
        pos: rand() * (axis === 'h' ? WORLD_W : WORLD_H),
        dir,
        speed: 70 + rand() * 60,
        paint: CAR_PAINT[Math.floor(rand() * CAR_PAINT.length)],
      });
    }
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    this.bindInput();
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (this.w * this.h))));
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    // Phones see more of the city; big screens get a closer, richer view.
    this.zoom = clamp(Math.min(this.w, this.h) / 820, 0.55, 1.15);
  }

  private bindInput() {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea,[contenteditable]')) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(k)) {
        this.keys.add(k);
        if (!this.paused) e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    const blur = () => this.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);

    // Any pointer on the canvas becomes a joystick: press, then drag in the direction to ride.
    const pdown = (e: PointerEvent) => {
      if (this.paused || this.stick) return;
      this.canvas.setPointerCapture(e.pointerId);
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      this.stick = { id: e.pointerId, ox: x, oy: y, x, y };
    };
    const pmove = (e: PointerEvent) => {
      if (!this.stick || e.pointerId !== this.stick.id) return;
      const r = this.canvas.getBoundingClientRect();
      this.stick.x = e.clientX - r.left;
      this.stick.y = e.clientY - r.top;
    };
    const pup = (e: PointerEvent) => {
      if (this.stick && e.pointerId === this.stick.id) this.stick = null;
    };
    this.canvas.addEventListener('pointerdown', pdown);
    this.canvas.addEventListener('pointermove', pmove);
    this.canvas.addEventListener('pointerup', pup);
    this.canvas.addEventListener('pointercancel', pup);
    const vis = () => (document.hidden ? this.stopLoop() : this.startLoop());
    document.addEventListener('visibilitychange', vis);

    this.cleanup.push(() => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      this.canvas.removeEventListener('pointerdown', pdown);
      this.canvas.removeEventListener('pointermove', pmove);
      this.canvas.removeEventListener('pointerup', pup);
      this.canvas.removeEventListener('pointercancel', pup);
      document.removeEventListener('visibilitychange', vis);
    });
  }

  /** Input as a direction in screen space, magnitude 0..1. */
  private input() {
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k.has('arrowleft') || k.has('a')) x -= 1;
    if (k.has('arrowright') || k.has('d')) x += 1;
    if (k.has('arrowup') || k.has('w')) y -= 1;
    if (k.has('arrowdown') || k.has('s')) y += 1;
    if (x || y) {
      const m = Math.hypot(x, y);
      return { x: x / m, y: y / m, mag: 1, brake: k.has(' ') };
    }
    if (this.stick) {
      const dx = this.stick.x - this.stick.ox;
      const dy = this.stick.y - this.stick.oy;
      const m = Math.hypot(dx, dy);
      if (m > 6) return { x: dx / m, y: dy / m, mag: clamp((m - 6) / 54, 0, 1), brake: false };
    }
    return { x: 0, y: 0, mag: 0, brake: k.has(' ') };
  }

  private collide() {
    let hit = false;
    for (const o of OBSTACLES) {
      const nx = clamp(this.px, o.x, o.x + o.w);
      const ny = clamp(this.py, o.y, o.y + o.h);
      const dx = this.px - nx;
      const dy = this.py - ny;
      const d2 = dx * dx + dy * dy;
      if (d2 < R * R) {
        hit = true;
        if (d2 > 0.0001) {
          const d = Math.sqrt(d2);
          this.px = nx + (dx / d) * R;
          this.py = ny + (dy / d) * R;
        } else {
          // Centre inside the rect: push out along the shallowest side.
          const left = this.px - o.x;
          const right = o.x + o.w - this.px;
          const top = this.py - o.y;
          const bottom = o.y + o.h - this.py;
          const m = Math.min(left, right, top, bottom);
          if (m === left) this.px = o.x - R;
          else if (m === right) this.px = o.x + o.w + R;
          else if (m === top) this.py = o.y - R;
          else this.py = o.y + o.h + R;
        }
      }
    }
    this.px = clamp(this.px, R, WORLD_W - R);
    this.py = clamp(this.py, R, WORLD_H - R);
    return hit;
  }

  private step(dt: number) {
    this.time += dt;
    const inp = this.paused ? { x: 0, y: 0, mag: 0, brake: true } : this.input();
    if (inp.mag > 0) {
      if (!this.moved) {
        this.moved = true;
        this.hooks.onMoved();
      }
      const target = Math.atan2(inp.y, inp.x);
      const diff = angleDiff(this.heading, target);
      const turn = 7.5 * dt;
      this.heading += clamp(diff, -turn, turn);
      // Sharp turns scrub speed, like a real scooter.
      const align = Math.cos(diff);
      this.speed += (620 * inp.mag * Math.max(0.15, align)) * dt;
      if (align < 0) this.speed *= 1 - 3 * dt;
    }
    this.speed *= 1 - (inp.mag > 0 ? 1.4 : 3.2) * dt;
    if (inp.brake) this.speed *= 1 - 7 * dt;
    this.speed = clamp(this.speed, 0, MAX_SPEED);
    this.braking = inp.brake || (inp.mag === 0 && this.speed > 15);
    this.px += Math.cos(this.heading) * this.speed * dt;
    this.py += Math.sin(this.heading) * this.speed * dt;
    if (this.collide()) this.speed *= 1 - 8 * dt;

    // Live position trail, expiring like a TTL.
    const lastT = this.trail[this.trail.length - 1];
    if (!lastT || Math.hypot(lastT.x - this.px, lastT.y - this.py) > 6) this.trail.push({ x: this.px, y: this.py, t: this.time });
    while (this.trail.length && this.time - this.trail[0].t > TRAIL_TTL) this.trail.shift();

    // Traffic loops around the grid; people walk round their block.
    for (const c of this.cars) {
      c.pos += c.dir * c.speed * dt;
      const max = c.axis === 'h' ? WORLD_W : WORLD_H;
      if (c.pos > max + 40) c.pos = -40;
      if (c.pos < -40) c.pos = max + 40;
    }
    for (const d of PEDS) d.p += d.speed * dt;

    // Camera: follow with a little look-ahead.
    const lookX = this.px + Math.cos(this.heading) * this.speed * 0.35;
    const lookY = this.py + Math.sin(this.heading) * this.speed * 0.35;
    const k = 1 - Math.pow(0.001, dt);
    this.cx += (lookX - this.cx) * k;
    this.cy += (lookY - this.cy) * k;

    this.markers = this.hooks.tick({ x: this.px, y: this.py, speed: this.speed }, this.paused ? 0 : dt);

    let nearId: string | null = null;
    for (const l of LANDMARKS) if (Math.hypot(l.door.x - this.px, l.door.y - this.py) < 58) nearId = l.id;
    if (nearId !== this.near) {
      this.near = nearId;
      this.hooks.onNear(nearId);
    }
  }

  // --- drawing -------------------------------------------------------------

  private toScreen(x: number, y: number) {
    return { x: (x - this.cx) * this.zoom + this.w / 2, y: (y - this.cy) * this.zoom + this.h / 2 };
  }

  private visibleRect(): Rect {
    const hw = this.w / 2 / this.zoom + 120;
    const hh = this.h / 2 / this.zoom + 120;
    return { x: this.cx - hw, y: this.cy - hh, w: hw * 2, h: hh * 2 };
  }

  /** Where a point at height z appears, seen from the camera. */
  private up(x: number, y: number, z: number): [number, number] {
    const f = lift(z);
    return [this.cx + (x - this.cx) * f, this.cy + (y - this.cy) * f];
  }

  private draw() {
    const { ctx, w, h, zoom } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAL.void;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-this.cx, -this.cy);
    const view = this.visibleRect();
    const inView = (r: Rect, m = 0) =>
      r.x - m < view.x + view.w && r.x + r.w + m > view.x && r.y - m < view.y + view.h && r.y + r.h + m > view.y;
    const seen = (x: number, y: number, m = 0) => x > view.x - m && x < view.x + view.w + m && y > view.y - m && y < view.y + view.h + m;

    this.drawWater(view);
    this.drawGround(inView, seen);
    this.drawGroundLights(inView, seen);
    this.drawStreetLife(seen);
    this.drawMarkerRings();
    this.drawCourier();
    this.drawTrees(inView);
    this.drawLampHeads(seen);
    const list = BUILDINGS.filter((b) => inView(b, 160)).sort(
      (a, b) =>
        Math.hypot(b.x + b.w / 2 - this.cx, b.y + b.h / 2 - this.cy) - Math.hypot(a.x + a.w / 2 - this.cx, a.y + a.h / 2 - this.cy),
    );
    for (const b of list) this.drawBuilding(b);
    this.drawMarkerPins();
    ctx.restore();

    this.drawOffscreenArrows();
    this.drawStick();
    this.drawMinimap();
  }

  /** Harbour water past the city edge, with slow drifting ripples. */
  private drawWater(view: Rect) {
    if (view.x > 0 && view.y > 0 && view.x + view.w < WORLD_W && view.y + view.h < WORLD_H) return;
    const { ctx } = this;
    ctx.fillStyle = PAL.water;
    ctx.fillRect(view.x, view.y, view.w, view.h);
    ctx.strokeStyle = 'rgba(120,160,255,0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([24, 70]);
    const y0 = Math.floor(view.y / 22) * 22;
    for (let y = y0; y < view.y + view.h; y += 22) {
      const row = Math.round(y / 22);
      ctx.lineDashOffset = row * 37 + this.time * (row % 2 ? 9 : -7);
      ctx.beginPath();
      ctx.moveTo(view.x, y);
      ctx.lineTo(view.x + view.w, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }

  private drawGround(inView: (r: Rect, m?: number) => boolean, seen: (x: number, y: number, m?: number) => boolean) {
    const { ctx } = this;
    ctx.fillStyle = PAL.asphalt;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.strokeStyle = 'rgba(150,175,235,0.28)';
    ctx.lineWidth = 3;
    ctx.strokeRect(-1.5, -1.5, WORLD_W + 3, WORLD_H + 3);

    // Centre dashes between junctions.
    ctx.strokeStyle = 'rgba(255,222,160,0.36)';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 18]);
    ctx.beginPath();
    for (const x of ROAD_LINES.vertical)
      for (let r = 0; r < ROWS; r++) {
        const b = blockRect(0, r);
        ctx.moveTo(x, b.y + 24);
        ctx.lineTo(x, b.y + b.h - 24);
      }
    for (const y of ROAD_LINES.horizontal)
      for (let c = 0; c < COLS; c++) {
        const b = blockRect(c, 0);
        ctx.moveTo(b.x + 24, y);
        ctx.lineTo(b.x + b.w - 24, y);
      }
    ctx.stroke();
    ctx.setLineDash([]);

    // Zebra crossings on every arm of every junction.
    ctx.fillStyle = 'rgba(222,230,255,0.15)';
    ctx.beginPath();
    const half = ROAD / 2;
    for (const vx of ROAD_LINES.vertical)
      for (const hy of ROAD_LINES.horizontal) {
        if (!seen(vx, hy, 80)) continue;
        for (let s = -half + 8; s < half - 8; s += 10) {
          if (hy - half - 18 > 0) ctx.rect(vx + s, hy - half - 18, 5.5, 13);
          if (hy + half + 18 < WORLD_H) ctx.rect(vx + s, hy + half + 5, 5.5, 13);
          if (vx - half - 18 > 0) ctx.rect(vx - half - 18, hy + s, 13, 5.5);
          if (vx + half + 18 < WORLD_W) ctx.rect(vx + half + 5, hy + s, 13, 5.5);
        }
      }
    ctx.fill();

    // Blocks: kerb, an edge line on the road just outside it, paving on the sidewalk strip
    // (the middle is under buildings, so it gets a plain fill).
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const b = blockRect(c, r);
        if (!inView(b, 20)) continue;
        ctx.strokeStyle = 'rgba(200,215,255,0.08)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x - 8, b.y - 8, b.w + 16, b.h + 16);
        ctx.fillStyle = PAL.sidewalk;
        ctx.fillRect(b.x + 16, b.y + 16, b.w - 32, b.h - 32);
        ctx.fillStyle = this.pat.pavement;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 10);
        ctx.rect(b.x + 16, b.y + 16, b.w - 32, b.h - 32);
        ctx.fill('evenodd');
        ctx.strokeStyle = 'rgba(170,190,240,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 10);
        ctx.stroke();
      }

    // Contact shadow round every footprint.
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    for (const b of BUILDINGS) if (inView(b, 20)) ctx.rect(b.x - 5, b.y - 5, b.w + 10, b.h + 10);
    ctx.fill();

    // Parks: lawn, a cross of paths, a fountain plaza.
    for (const p of PARK_ART) {
      if (!inView(p.rect, 20)) continue;
      const { x, y, w, h } = p.rect;
      ctx.fillStyle = this.pat.grass;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#222b30';
      ctx.fillRect(x, p.cy - 10, w, 20);
      ctx.fillRect(p.cx - 10, y, 20, h);
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b2238';
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,200,255,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(150,200,255,0.18)';
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, 12 + ((this.time * 8) % 12), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Landmark entrances: a coloured pad and ring on the road.
    for (const l of LANDMARKS) {
      if (!seen(l.door.x, l.door.y, 40)) continue;
      const hue = LM_HUE[l.id] ?? PAL.accent;
      const on = this.near === l.id;
      ctx.fillStyle = rgba(hue, on ? 0.2 : 0.1);
      ctx.beginPath();
      ctx.arc(l.door.x, l.door.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba(hue, on ? 0.95 : 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /** Everything that lights the street, added on top of it. */
  private drawGroundLights(inView: (r: Rect, m?: number) => boolean, seen: (x: number, y: number, m?: number) => boolean) {
    const { ctx } = this;
    ctx.globalCompositeOperation = 'lighter';
    for (const l of LAMPS) if (seen(l.px, l.py, 90)) drawGlow(ctx, l.rgb, l.px, l.py, 90, 0.3);
    for (const p of PARK_ART) {
      if (!inView(p.rect, 80)) continue;
      for (const l of p.lamps) drawGlow(ctx, l.rgb, l.x, l.y, 60, 0.2);
      drawGlow(ctx, '90,170,255', p.cx, p.cy, 70, 0.22);
    }
    for (const l of LANDMARKS) {
      if (!seen(l.door.x, l.door.y, 90)) continue;
      drawGlow(ctx, LM_HUE[l.id] ?? PAL.accent, l.door.x, l.door.y, 90, this.near === l.id ? 0.55 : 0.3);
    }
    // Courier trail: the live position fading like a TTL.
    ctx.lineCap = 'round';
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1];
      const b = this.trail[i];
      const life = 1 - (this.time - b.t) / TRAIL_TTL;
      if (life <= 0) continue;
      ctx.strokeStyle = rgba(PAL.accent, life * 0.55);
      ctx.lineWidth = 2 + 6 * life;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawStreetLife(seen: (x: number, y: number, m?: number) => boolean) {
    const { ctx } = this;
    for (const d of PEDS) {
      const p = pedPos(d);
      if (seen(p.x, p.y, 10)) drawPed(ctx, p.x, p.y, d.rgb);
    }
    const shown: { x: number; y: number; a: number }[] = [];
    for (const c of this.cars) {
      const x = c.axis === 'h' ? c.pos : c.line;
      const y = c.axis === 'h' ? c.line : c.pos;
      if (!seen(x, y, 40)) continue;
      const a = c.axis === 'h' ? (c.dir === 1 ? 0 : Math.PI) : c.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      drawCar(ctx, x, y, a, c.paint);
      shown.push({ x, y, a });
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const { x, y, a } of shown) {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      drawBeam(ctx, x + ca * 15, y + sa * 15, a, 100, 0.34, 0.2);
      drawGlow(ctx, PAL.tail, x - ca * 16, y - sa * 16, 16, 0.45);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawCourier() {
    const { ctx } = this;
    const x = this.px;
    const y = this.py;
    const s = clamp(0.8 / this.zoom, 1, 1.45);
    const ca = Math.cos(this.heading);
    const sa = Math.sin(this.heading);
    ctx.globalCompositeOperation = 'lighter';
    drawBeam(ctx, x + ca * 20 * s, y + sa * 20 * s, this.heading, 230, 0.44, 0.3);
    drawBeam(ctx, x + ca * 20 * s, y + sa * 20 * s, this.heading, 150, 0.18, 0.28);
    drawGlow(ctx, PAL.accent, x, y, 48 * s, 0.32);
    drawGlow(ctx, PAL.tail, x - ca * 19 * s, y - sa * 19 * s, 20 * s, this.braking ? 0.8 : 0.35);
    ctx.globalCompositeOperation = 'source-over';
    drawCourier(ctx, x, y, this.heading, s, this.braking);
  }

  private drawTrees(inView: (r: Rect, m?: number) => boolean) {
    const { ctx } = this;
    for (const p of PARK_ART) {
      if (!inView(p.rect, 40)) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.beginPath();
      for (const t of p.trees) {
        ctx.moveTo(t.x + 4 + t.r, t.y + 5);
        ctx.arc(t.x + 4, t.y + 5, t.r, 0, Math.PI * 2);
      }
      ctx.fill();
      const tops = p.trees.map((t) => ({ t, at: this.up(t.x, t.y, 22 * t.k) }));
      ctx.fillStyle = '#10302a';
      ctx.beginPath();
      for (const { t, at } of tops) {
        ctx.moveTo(at[0] + t.r, at[1]);
        ctx.arc(at[0], at[1], t.r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = '#1b4a3a';
      ctx.beginPath();
      for (const { t, at } of tops) {
        const hx = at[0] - t.r * 0.28;
        const hy = at[1] - t.r * 0.28;
        ctx.moveTo(hx + t.r * 0.6, hy);
        ctx.arc(hx, hy, t.r * 0.6, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  private drawLampHeads(seen: (x: number, y: number, m?: number) => boolean) {
    const { ctx } = this;
    ctx.globalCompositeOperation = 'lighter';
    for (const l of LAMPS) {
      if (!seen(l.x, l.y, 20)) continue;
      const [x, y] = this.up(l.x, l.y, 28);
      drawGlow(ctx, l.rgb, x, y, 12, 0.9);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawBuilding(b: Building) {
    const { ctx } = this;
    const art = BUILDING_ART.get(b)!;
    const x0 = b.x;
    const y0 = b.y;
    const x1 = b.x + b.w;
    const y1 = b.y + b.h;
    const [rx0, ry0] = this.up(x0, y0, b.height);
    const [rx1, ry1] = this.up(x1, y1, b.height);

    // Walls that face the camera, shaded by which way they face.
    const walls: [Face, number, number, number, number, number][] = [];
    if (y0 > this.cy) walls.push(['n', x0, y0, x1, y0, 0.5]);
    if (y1 < this.cy) walls.push(['s', x0, y1, x1, y1, 0.8]);
    if (x0 > this.cx) walls.push(['w', x0, y0, x0, y1, 0.6]);
    if (x1 < this.cx) walls.push(['e', x1, y0, x1, y1, 0.68]);
    for (const [face, ax, ay, bx, by, k] of walls) {
      const [tax, tay] = this.up(ax, ay, b.height);
      const [tbx, tby] = this.up(bx, by, b.height);
      ctx.fillStyle = shade(art.roof, k);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(tbx, tby);
      ctx.lineTo(tax, tay);
      ctx.closePath();
      ctx.fill();
      if (Math.hypot(tax - ax, tay - ay) > 6) this.drawWindows(art, face, ax, ay, bx, by, b.height);
    }

    // Roof: parapet rim, darker deck, moonlit edge.
    const rw = rx1 - rx0;
    const rh = ry1 - ry0;
    const f = lift(b.height);
    ctx.fillStyle = shade(art.roof, 1.08);
    ctx.fillRect(rx0, ry0, rw, rh);
    const inset = 4 * f;
    ctx.fillStyle = shade(art.roof, 0.86);
    ctx.fillRect(rx0 + inset, ry0 + inset, rw - inset * 2, rh - inset * 2);
    ctx.strokeStyle = 'rgba(190,210,255,0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rx0 + 0.6, ry1);
    ctx.lineTo(rx0 + 0.6, ry0 + 0.6);
    ctx.lineTo(rx1, ry0 + 0.6);
    ctx.stroke();
    this.drawRoofItems(art, rx0 + inset, ry0 + inset, rw - inset * 2, rh - inset * 2, f);

    if (art.beacon && Math.sin(this.time * 2.6 + b.seed) > 0.4) {
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, PAL.tail, rx1 - 7 * f, ry0 + 7 * f, 16, 0.9);
      ctx.globalCompositeOperation = 'source-over';
    }

    if (art.hue && b.landmark) this.drawSign(b.landmark, art.hue, rx0, ry0, rw, rh);
  }

  private drawWindows(art: BuildingArt, face: Face, ax: number, ay: number, bx: number, by: number, height: number) {
    const { ctx, cx, cy } = this;
    const ww = art.walls[face];
    const tv = 0.4 + 0.3 * Math.sin(this.time * 9 + art.tvPhase) * Math.sin(this.time * 3.3 + art.tvPhase * 2);
    const colours = [rgba(PAL.window, 0.92), rgba(PAL.windowDim, 0.6), rgba(PAL.windowCool, 0.55), rgba(PAL.tv, tv)];
    for (let bucket = 0; bucket < 4; bucket++) {
      ctx.beginPath();
      for (const wv of ww.lit) {
        if (wv.b !== bucket) continue;
        const u0 = (wv.c + 0.22) / ww.cols;
        const u1 = (wv.c + 0.78) / ww.cols;
        const f0 = lift(((wv.f + 0.26) / ww.floors) * height);
        const f1 = lift(((wv.f + 0.72) / ww.floors) * height);
        const p0x = ax + (bx - ax) * u0 - cx;
        const p0y = ay + (by - ay) * u0 - cy;
        const p1x = ax + (bx - ax) * u1 - cx;
        const p1y = ay + (by - ay) * u1 - cy;
        ctx.moveTo(cx + p0x * f0, cy + p0y * f0);
        ctx.lineTo(cx + p1x * f0, cy + p1y * f0);
        ctx.lineTo(cx + p1x * f1, cy + p1y * f1);
        ctx.lineTo(cx + p0x * f1, cy + p0y * f1);
        ctx.closePath();
      }
      ctx.fillStyle = colours[bucket];
      ctx.fill();
    }
  }

  private drawRoofItems(art: BuildingArt, X: number, Y: number, W: number, H: number, f: number) {
    const { ctx } = this;
    const box = (x: number, y: number, w: number, h: number, fill: string) => {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 2.5 * f, y + 3 * f, w, h);
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    };
    for (const it of art.items) {
      const x = X + it.u * W;
      const y = Y + it.v * H;
      const w = it.w * W;
      const h = it.h * H;
      switch (it.kind) {
        case 'ac': {
          const aw = 17 * f;
          const ah = 12 * f;
          box(x - aw / 2, y - ah / 2, aw, ah, '#3a4459');
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(x - aw / 2, y - ah / 2, aw, 2 * f);
          ctx.fillStyle = '#171b27';
          ctx.beginPath();
          ctx.arc(x + aw * 0.18, y + f, 3.6 * f, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'tank':
        case 'dish': {
          const r = (it.kind === 'tank' ? 11 : 8) * f;
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath();
          ctx.arc(x + 3 * f, y + 3.5 * f, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = it.kind === 'tank' ? '#394561' : '#5a6480';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'sky': {
          const sh = Math.max(9 * f, h);
          ctx.fillStyle = 'rgba(130,175,255,0.2)';
          ctx.fillRect(x - w / 2, y - sh / 2, w, sh);
          ctx.strokeStyle = 'rgba(160,195,255,0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - w / 2, y - sh / 2, w, sh);
          ctx.beginPath();
          for (let m = x - w / 2 + 14 * f; m < x + w / 2; m += 14 * f) {
            ctx.moveTo(m, y - sh / 2);
            ctx.lineTo(m, y + sh / 2);
          }
          ctx.stroke();
          break;
        }
        case 'solar': {
          ctx.fillStyle = '#15213d';
          ctx.fillRect(x - w / 2, y - h / 2, w, h);
          ctx.strokeStyle = 'rgba(120,160,235,0.28)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let m = x - w / 2; m <= x + w / 2; m += 10 * f) {
            ctx.moveTo(m, y - h / 2);
            ctx.lineTo(m, y + h / 2);
          }
          for (let m = y - h / 2; m <= y + h / 2; m += 7 * f) {
            ctx.moveTo(x - w / 2, m);
            ctx.lineTo(x + w / 2, m);
          }
          ctx.stroke();
          break;
        }
        case 'garden':
        case 'court': {
          ctx.fillStyle = it.kind === 'court' ? '#12302a' : '#15352a';
          ctx.fillRect(x - w / 2, y - h / 2, w, h);
          if (it.kind === 'court') {
            ctx.fillStyle = '#263036';
            ctx.fillRect(x - w / 2, y - 5 * f, w, 10 * f);
            ctx.fillRect(x - 5 * f, y - h / 2, 10 * f, h);
          }
          ctx.fillStyle = '#1e4d3a';
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const tx = x - w / 2 + ((i * 0.37 + 0.12) % 1) * w;
            const ty = y - h / 2 + ((i * 0.61 + 0.2) % 1) * h;
            const r = Math.min(w, h) * 0.09;
            ctx.moveTo(tx + r, ty);
            ctx.arc(tx, ty, r, 0, Math.PI * 2);
          }
          ctx.fill();
          break;
        }
        case 'pool': {
          ctx.fillStyle = '#0f5577';
          ctx.fillRect(x - w / 2, y - h / 2, w, h);
          ctx.strokeStyle = 'rgba(130,225,255,0.6)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - w / 2, y - h / 2, w, h);
          break;
        }
        case 'dome': {
          const r = Math.min(w, h) / 2;
          const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
          g.addColorStop(0, rgba(art.hue ?? PAL.accent, 0.45));
          g.addColorStop(1, 'rgba(18,26,44,0.95)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = rgba(art.hue ?? PAL.accent, 0.4);
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - r, y);
          ctx.lineTo(x + r, y);
          ctx.moveTo(x, y - r);
          ctx.lineTo(x, y + r);
          ctx.stroke();
          break;
        }
        case 'helipad': {
          const r = Math.min(w, h) / 2;
          ctx.fillStyle = '#171c28';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = rgba(PAL.accent, 0.75);
          ctx.lineWidth = 2 * f;
          ctx.stroke();
          ctx.fillStyle = rgba(PAL.accent, 0.85);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `700 ${Math.round(r * 0.9)}px ${FONT_SANS}`;
          ctx.fillText('H', x, y + r * 0.05);
          ctx.textBaseline = 'alphabetic';
          break;
        }
      }
    }
  }

  /** A landmark's neon: trim round the roof and a lit sign with its name. */
  private drawSign(id: string, hue: string, rx: number, ry: number, rw: number, rh: number) {
    const { ctx } = this;
    const lm = LANDMARKS.find((l) => l.id === id);
    if (!lm) return;
    const flicker = 0.9 + 0.1 * Math.sin(this.time * 17 + rx) * Math.sin(this.time * 5.3);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(hue, 0.14 * flicker);
    ctx.lineWidth = 10;
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.strokeStyle = rgba(hue, 0.85 * flicker);
    ctx.lineWidth = 2;
    ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);
    ctx.globalCompositeOperation = 'source-over';

    const s = 1 / this.zoom;
    const mx = rx + rw / 2;
    const my = ry + rh / 2;
    ctx.font = `700 ${16 * s}px ${FONT_SANS}`;
    const tw = ctx.measureText(lm.name).width;
    ctx.font = `500 ${10.5 * s}px ${FONT_MONO}`;
    const sw = ctx.measureText(lm.sub).width;
    const pw = Math.min(rw - 12, Math.max(tw, sw) + 28 * s);
    const ph = 46 * s;
    ctx.fillStyle = 'rgba(5,7,14,0.86)';
    ctx.beginPath();
    ctx.roundRect(mx - pw / 2, my - ph / 2, pw, ph, 9 * s);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(hue, 0.22 * flicker);
    ctx.lineWidth = 7 * s;
    ctx.stroke();
    ctx.strokeStyle = rgba(hue, 0.95 * flicker);
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbfaf5';
    ctx.font = `700 ${16 * s}px ${FONT_SANS}`;
    ctx.fillText(lm.name, mx, my + 1 * s, pw - 16 * s);
    ctx.fillStyle = rgba(hue, 1);
    ctx.font = `500 ${10.5 * s}px ${FONT_MONO}`;
    ctx.fillText(lm.sub, mx, my + 15 * s, pw - 16 * s);
  }

  /** Mission markers on the road: a pulsing ring and a turning dashed halo. */
  private drawMarkerRings() {
    const { ctx } = this;
    const pulse = (Math.sin(this.time * 4) + 1) / 2;
    for (const m of this.markers) {
      const col = m.dim ? PAL.ink : PAL.accent;
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, col, m.x, m.y, 95, m.dim ? 0.08 : 0.34 + 0.2 * pulse);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = rgba(col, m.dim ? 0.3 : 0.95);
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (m.kind === 'gate') ctx.roundRect(m.x - 22, m.y - 22, 44, 44, 6);
      else ctx.arc(m.x, m.y, 20 + (m.kind === 'target' ? pulse * 6 : 0), 0, Math.PI * 2);
      ctx.stroke();
      if (m.dim) continue;
      ctx.strokeStyle = rgba(col, 0.5);
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 9]);
      ctx.lineDashOffset = -this.time * 30;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 33, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }
  }

  /** Floating pins and labels, drawn above the buildings so they're never hidden. */
  private drawMarkerPins() {
    const { ctx } = this;
    const s = 1 / this.zoom;
    ctx.textAlign = 'center';
    for (const m of this.markers) {
      const col = m.dim ? PAL.ink : PAL.accent;
      const bob = m.dim ? 0 : Math.sin(this.time * 3 + m.x * 0.01) * 3 * s;
      const pinY = m.y - 46 * s + bob;
      if (!m.dim) {
        ctx.strokeStyle = rgba(col, 0.55);
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x, pinY + 12 * s);
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, col, m.x, pinY, 30 * s, 0.5);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = rgba(col, 1);
        ctx.beginPath();
        ctx.arc(m.x, pinY, 12 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a1405';
        ctx.fillStyle = '#1a1405';
        ctx.lineWidth = 1.8 * s;
        ctx.beginPath();
        if (m.kind === 'item') {
          ctx.strokeRect(m.x - 5 * s, pinY - 4 * s, 10 * s, 8 * s);
          ctx.moveTo(m.x - 5 * s, pinY - 1 * s);
          ctx.lineTo(m.x + 5 * s, pinY - 1 * s);
          ctx.stroke();
        } else if (m.kind === 'gate') {
          ctx.moveTo(m.x - 5 * s, pinY);
          ctx.lineTo(m.x - 1.5 * s, pinY + 3.5 * s);
          ctx.lineTo(m.x + 5 * s, pinY - 3.5 * s);
          ctx.stroke();
        } else {
          ctx.arc(m.x, pinY, 4 * s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.font = `600 ${11.5 * s}px ${FONT_MONO}`;
      const tw = ctx.measureText(m.label).width;
      const ly = m.dim ? m.y - 30 * s : pinY - 20 * s;
      ctx.fillStyle = m.dim ? 'rgba(5,7,14,0.6)' : 'rgba(5,7,14,0.88)';
      ctx.beginPath();
      ctx.roundRect(m.x - tw / 2 - 8 * s, ly - 13 * s, tw + 16 * s, 19 * s, 9.5 * s);
      ctx.fill();
      ctx.strokeStyle = rgba(col, m.dim ? 0.15 : 0.45);
      ctx.lineWidth = 1 * s;
      ctx.stroke();
      ctx.fillStyle = rgba(col, m.dim ? 0.5 : 1);
      ctx.fillText(m.label, m.x, ly + 1 * s);
    }
  }

  private drawOffscreenArrows() {
    const { ctx, w, h } = this;
    const pad = 36;
    for (const m of this.markers) {
      if (m.dim) continue;
      const s = this.toScreen(m.x, m.y);
      if (s.x > pad && s.x < w - pad && s.y > pad + 60 && s.y < h - pad) continue;
      const ang = Math.atan2(s.y - h / 2, s.x - w / 2);
      const ex = clamp(w / 2 + Math.cos(ang) * w, pad, w - pad);
      const ey = clamp(h / 2 + Math.sin(ang) * h, pad + 60, h - pad);
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, PAL.accent, ex, ey, 26, 0.45);
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ang);
      ctx.fillStyle = rgba(PAL.accent, 1);
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(-8, -10);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-8, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawStick() {
    if (!this.stick) return;
    const { ctx } = this;
    const { ox, oy, x, y } = this.stick;
    const dx = x - ox;
    const dy = y - oy;
    const m = Math.hypot(dx, dy);
    const k = m > 60 ? 60 / m : 1;
    ctx.fillStyle = 'rgba(5,7,14,0.35)';
    ctx.strokeStyle = rgba(PAL.ink, 0.28);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ox, oy, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(PAL.accent, 0.8);
    ctx.beginPath();
    ctx.arc(ox + dx * k, oy + dy * k, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMinimap() {
    const { ctx, w, h } = this;
    const portrait = h > w;
    const mw = portrait ? 118 : 170;
    const s = mw / WORLD_W;
    const mh = WORLD_H * s;
    const mx = w - mw - 16;
    const my = portrait ? 72 : h - mh - 16;
    ctx.save();
    ctx.fillStyle = 'rgba(6,9,18,0.86)';
    ctx.strokeStyle = 'rgba(190,205,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mx - 6, my - 6, mw + 12, mh + 12, 10);
    ctx.fill();
    ctx.stroke();
    // Roads read as the light grid between dark blocks.
    ctx.fillStyle = 'rgba(92,110,160,0.38)';
    ctx.fillRect(mx, my, mw, mh);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const b = blockRect(c, r);
        ctx.fillStyle = PARK_ART.some((p) => p.rect.x > b.x && p.rect.x < b.x + b.w && p.rect.y > b.y && p.rect.y < b.y + b.h)
          ? 'rgba(40,110,80,0.7)'
          : 'rgba(10,13,24,0.95)';
        ctx.fillRect(mx + b.x * s, my + b.y * s, b.w * s, b.h * s);
      }
    for (const l of LANDMARKS) {
      ctx.fillStyle = rgba(LM_HUE[l.id] ?? PAL.accent, 0.9);
      ctx.beginPath();
      ctx.arc(mx + l.door.x * s, my + l.door.y * s, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // What's on screen right now.
    const vw = this.w / this.zoom;
    const vh = this.h / this.zoom;
    ctx.strokeStyle = 'rgba(242,241,234,0.35)';
    ctx.strokeRect(mx + (this.cx - vw / 2) * s, my + (this.cy - vh / 2) * s, vw * s, vh * s);
    const pulse = (Math.sin(this.time * 4) + 1) / 2;
    for (const m of this.markers) {
      if (m.dim) continue;
      ctx.fillStyle = rgba(PAL.accent, 1);
      ctx.beginPath();
      ctx.arc(mx + m.x * s, my + m.y * s, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba(PAL.accent, 0.6 * (1 - pulse));
      ctx.beginPath();
      ctx.arc(mx + m.x * s, my + m.y * s, 3.2 + pulse * 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.translate(mx + this.px * s, my + this.py * s);
    ctx.rotate(this.heading);
    ctx.fillStyle = '#fff6d6';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-3.5, -3.5);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-3.5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- loop ----------------------------------------------------------------

  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.step(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  private startLoop() {
    if (this.raf || !this.running) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private stopLoop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  start() {
    this.running = true;
    this.startLoop();
  }

  /** Put the courier back at HQ (used by "respawn" if someone gets lost). */
  respawn() {
    this.px = SPAWN.x;
    this.py = SPAWN.y;
    this.heading = SPAWN.heading;
    this.speed = 0;
    this.trail = [];
  }

  /** Current courier state, for tests and the HUD. */
  state() {
    return { x: this.px, y: this.py, speed: this.speed, near: this.near, markers: this.markers };
  }

  /** Test/automation helper: place the courier somewhere on the map. */
  teleport(x: number, y: number) {
    this.px = x;
    this.py = y;
    this.cx = x;
    this.cy = y;
  }

  dispose() {
    this.running = false;
    this.stopLoop();
    this.ro.disconnect();
    this.cleanup.forEach((f) => f());
  }
}
