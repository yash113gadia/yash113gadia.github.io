import { Assets, S, TILES, type SheetKey } from './assets';
import { Sound } from './audio';
import {
  BOSSES,
  ENEMIES,
  UPGRADES,
  hero as heroDef,
  upgrade,
  upgradeName,
  xpFor,
  type EnemyDef,
  type EnemyKind,
  type HeroDef,
  type HeroId,
  type UpgradeId,
} from './content';

// Pixel Swarm: survive a growing swarm of monsters in a meadow. You move and dash; your
// weapons fire on their own. Coins level you up, and each level you pick one of three
// upgrades. Each monster type moves differently (see Behavior in content.ts), and they
// arrive in packs, flocks, lines and pincers rather than one steady trickle, so the swarm
// surrounds and sweeps instead of piling into one blob.

const ARENA = 2400;
const GROUND_PX = ARENA / S;
const HC = 64;
const HN = Math.ceil(ARENA / HC) + 1;
const OC = 200;
const ON = Math.ceil(ARENA / OC) + 1;
const PIXEL_BUDGET = 3.2e6;
const MAX_ENEMIES = 300;
const MAX_BITS = 600;
const MAX_COINS = 350;
const MAX_NUMBERS = 50;
const FONT = '"Press Start 2P", ui-monospace, monospace';

export type Phase = 'title' | 'play' | 'levelup' | 'paused' | 'dying' | 'over';

/** Where damage came from, for the per-weapon breakdown. */
export type DamageSource = 'base' | 'orbit' | 'nova' | 'chain' | 'missiles' | 'aura' | 'scroll';

export interface DamageRow {
  key: DamageSource;
  name: string;
  total: number;
  /** Damage per second since the weapon was picked up. */
  dps: number;
}

export interface Hud {
  hp: number;
  maxHp: number;
  xp: number;
  next: number;
  level: number;
  time: number;
  kills: number;
  score: number;
  combo: number;
  boss: { name: string; hp: number; max: number } | null;
  /** 0..1, 1 = dash ready. */
  dash: number;
  damage: DamageRow[];
}

export interface Offer {
  id: UpgradeId;
  name: string;
  kind: 'weapon' | 'power';
  level: number;
  desc: string;
  isNew: boolean;
}

export interface RunResult {
  time: number;
  kills: number;
  level: number;
  score: number;
  hero: HeroId;
  damage: DamageRow[];
}

export interface SwarmHooks {
  onHud(h: Hud): void;
  onLevelUp(offers: Offer[], treasure: boolean): void;
  onGameOver(r: RunResult): void;
  onAnnounce(text: string, tone: 'good' | 'danger' | 'info'): void;
  onPause(paused: boolean): void;
  onReady(): void;
}

interface Enemy {
  kind: EnemyKind;
  def: EnemyDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  max: number;
  r: number;
  speed: number;
  dmg: number;
  scale: number;
  elite: boolean;
  flash: number;
  born: number;
  /** Behaviour timer and state; meaning depends on the behaviour. */
  t: number;
  state: number;
  ax: number;
  ay: number;
  /** Height above the ground (hops, flying), drawn as a lift over the shadow. */
  alt: number;
  frozen: number;
  slow: number;
  /** Personal approach angle, so a pack spreads round you. */
  slot: number;
  wob: number;
  spin: number;
  rad: number;
  flock: number;
  anim: number;
  dir: number;
  alpha: number;
  orbitCd: number;
  summon: number;
  /** Which attack a boss does next. */
  pattern: number;
  dead: boolean;
}

type ShotKind = 'shuriken' | 'fireball' | 'flame';

interface Bullet {
  kind: ShotKind;
  src: DamageSource;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  pierce: number;
  life: number;
  blast: number;
  hits: Enemy[];
  target: Enemy | null;
  rot: number;
}

interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Wave {
  x: number;
  y: number;
  r: number;
  speed: number;
  max: number;
  hit: boolean;
}

interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  pull: boolean;
  /** Homing speed once pulled; grows every frame. */
  speed: number;
  phase: number;
}

type DropKind = 'heart' | 'magnet' | 'thunder' | 'ice' | 'chest';

interface Drop {
  x: number;
  y: number;
  kind: DropKind;
  life: number;
}

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  rgb: string;
  size: number;
}

interface Fx {
  key: SheetKey;
  x: number;
  y: number;
  t: number;
  dur: number;
  scale: number;
  rot: number;
}

interface Num {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  crit: boolean;
  rgb: string;
}

interface Bolt {
  pts: number[];
  life: number;
}

interface Obstacle {
  x: number;
  y: number;
  r: number;
  kind: 'bush' | 'rock';
}

interface Decal {
  x: number;
  y: number;
  rgb: string;
  life: number;
  seed: number;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const ri = (a: number, b: number) => Math.floor(rand(a, b + 1));
const rgba = (rgb: string, a: number) => `rgba(${rgb},${a})`;
const seeded = (seed: number) => {
  let s = seed % 2147483646 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
const easeOutBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

const COST: Partial<Record<EnemyKind, number>> = { grunt: 1, slime: 1, bee: 0.35, bat: 1.4, ghost: 1.4, eye: 2, bush: 2.5, bear: 5, wisp: 1.4, sprout: 0.3 };
const GOLD = '255,214,64';
const WHITE = '255,255,255';
const SOURCES: DamageSource[] = ['base', 'orbit', 'nova', 'chain', 'missiles', 'aura', 'scroll'];

const noLevels = (): Record<UpgradeId, number> => Object.fromEntries(UPGRADES.map((u) => [u.id, 0])) as Record<UpgradeId, number>;
const noDamage = (): Record<DamageSource, number> => Object.fromEntries(SOURCES.map((s) => [s, 0])) as Record<DamageSource, number>;

export class SwarmEngine {
  readonly sound = new Sound();
  private assets = new Assets();
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private hooks: SwarmHooks;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private zoom = 1;
  private raf = 0;
  private last = 0;
  private clock = 0;
  private ro: ResizeObserver;
  private cleanup: (() => void)[] = [];
  private reduce = false;
  private ground: HTMLCanvasElement | null = null;

  phase: Phase = 'title';
  private heroId: HeroId = 'hiro';
  private H: HeroDef = heroDef('hiro');
  private stop = 0;
  private dyingT = 0;
  private trauma = 0;
  private flashRed = 0;
  private flashWhite = 0;
  private flashIce = 0;
  private cx = ARENA / 2;
  private cy = ARENA / 2;
  private hudAcc = 0;
  private god = false;

  // Run state
  private p = this.freshPlayer();
  private ghosts: { x: number; y: number; dir: number; life: number }[] = [];
  private lv = noLevels();
  private dealt = noDamage();
  private since: Partial<Record<DamageSource, number>> = {};
  private time = 0;
  private kills = 0;
  private score = 0;
  private combo = 0;
  private comboT = 0;
  private level = 1;
  private xp = 0;
  private next = xpFor(1);
  private offers: Offer[] = [];
  private budget = 0;
  private pending: { cost: number; run: () => void } | null = null;
  private nextSurge = 50;
  private nextElite = 55;
  private nextBoss = 120;
  private bossCount = 0;
  private boss: Enemy | null = null;
  private flockId = 0;
  private flocks = new Map<number, { tx: number; ty: number; t: number; cx: number; cy: number; vx: number; vy: number; n: number }>();
  private weaponT = 0.4;
  private orbitA = 0;
  private novaT = 2;
  private chainT = 1;
  private missileT = 1;
  private auraT = 0;
  private dashQueued = false;

  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private shots: Shot[] = [];
  private waves: Wave[] = [];
  private coins: Coin[] = [];
  private drops: Drop[] = [];
  private bits: Bit[] = [];
  private fx: Fx[] = [];
  private nums: Num[] = [];
  private bolts: Bolt[] = [];
  private decals: Decal[] = [];
  private obstacles: Obstacle[] = [];
  private ocells: Obstacle[][] = Array.from({ length: ON * ON }, () => []);

  private cells: Enemy[][] = Array.from({ length: HN * HN }, () => []);
  private used: number[] = [];

  private keys = new Set<string>();
  private stick: { id: number; ox: number; oy: number; x: number; y: number } | null = null;

  constructor(canvas: HTMLCanvasElement, hooks: SwarmHooks) {
    this.canvas = canvas;
    this.hooks = hooks;
    this.ctx = canvas.getContext('2d')!;
    this.reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.makeObstacles();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    this.bindInput();
    void this.assets.load().then(() => {
      this.bakeGround();
      for (let i = 0; i < 22; i++) this.ambient();
      this.hooks.onReady();
    });
    void document.fonts?.load(`12px ${FONT}`);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private freshPlayer() {
    const H = this.H ?? heroDef('hiro');
    return { x: ARENA / 2, y: ARENA / 2, vx: 0, vy: 0, r: 15, hp: H.hp, max: H.hp, inv: 1, blink: 0, dashT: 0, dashCd: 0, dx: 0, dy: 1, anim: 0 };
  }

  // --- setup ------------------------------------------------------------------

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (this.w * this.h))));
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    // Snap the zoom so each sprite pixel covers a whole number of device pixels: crisp art.
    const units = Math.min(this.w, this.h) < 520 ? 600 : 720;
    const base = clamp(Math.min(this.w, this.h) / units, 0.4, 1.8);
    const px = Math.max(1, Math.round(S * base * this.dpr));
    this.zoom = px / (S * this.dpr);
  }

  private makeObstacles() {
    const r = seeded(4242);
    for (let tries = 0; tries < 900 && this.obstacles.length < 40; tries++) {
      const x = 140 + r() * (ARENA - 280);
      const y = 140 + r() * (ARENA - 280);
      if (Math.hypot(x - ARENA / 2, y - ARENA / 2) < 330) continue;
      if (this.obstacles.some((o) => Math.hypot(o.x - x, o.y - y) < 190)) continue;
      const kind = r() < 0.6 ? 'bush' : 'rock';
      this.obstacles.push({ x, y, r: kind === 'bush' ? 30 : 28, kind });
    }
    for (const o of this.obstacles) {
      const x0 = Math.floor((o.x - o.r) / OC);
      const x1 = Math.floor((o.x + o.r) / OC);
      const y0 = Math.floor((o.y - o.r) / OC);
      const y1 = Math.floor((o.y + o.r) / OC);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) this.ocells[cy * ON + cx].push(o);
    }
  }

  private obstaclesNear(x: number, y: number, rad: number, fn: (o: Obstacle) => void) {
    const x0 = clamp(Math.floor((x - rad) / OC), 0, ON - 1);
    const x1 = clamp(Math.floor((x + rad) / OC), 0, ON - 1);
    const y0 = clamp(Math.floor((y - rad) / OC), 0, ON - 1);
    const y1 = clamp(Math.floor((y + rad) / OC), 0, ON - 1);
    let prev: Obstacle | null = null;
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++)
        for (const o of this.ocells[cy * ON + cx]) {
          // An obstacle can sit in two cells; skip an immediate repeat (good enough for 40 of them).
          if (o === prev) continue;
          prev = o;
          fn(o);
        }
  }

  /** The meadow floor, baked once at one texel per sprite pixel and drawn as a single image. */
  private bakeGround() {
    const c = document.createElement('canvas');
    c.width = c.height = GROUND_PX;
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    const ts = this.assets.sheets.tileset.img;
    const r = seeded(99);
    const n = GROUND_PX / 16;
    // Coarse value noise decides where the flecked and flowery patches go.
    const G = 9;
    const grid = Array.from({ length: (G + 1) * (G + 1) }, () => r());
    const noise = (u: number, v: number) => {
      const x = (u / n) * G;
      const y = (v / n) * G;
      const i = Math.floor(x);
      const j = Math.floor(y);
      const fx = x - i;
      const fy = y - j;
      const at = (a: number, b: number) => grid[Math.min(G, b) * (G + 1) + Math.min(G, a)];
      return (at(i, j) * (1 - fx) + at(i + 1, j) * fx) * (1 - fy) + (at(i, j + 1) * (1 - fx) + at(i + 1, j + 1) * fx) * fy;
    };
    for (let ty = 0; ty < n; ty++)
      for (let tx = 0; tx < n; tx++) {
        const v = noise(tx, ty) + (r() - 0.5) * 0.08;
        const t = v < 0.3 ? TILES.grassFlecks : v > 0.8 ? TILES.grassFlowers : r() < 0.5 ? TILES.grass : TILES.grassPlain;
        g.drawImage(ts, t[0], t[1], 16, 16, tx * 16, ty * 16, 16, 16);
      }
    // Only plants that can't be mistaken for pickups (no red flowers: they read as hearts).
    const decor = [TILES.leafy, TILES.clover, TILES.tuft, TILES.tallGrass];
    for (let i = 0; i < 220; i++) {
      const x = r() * GROUND_PX;
      const y = r() * GROUND_PX;
      if (this.obstacles.some((o) => Math.hypot(o.x / S - x, o.y / S - y) < o.r / S + 14)) continue;
      const d = decor[Math.floor(r() * decor.length)];
      g.drawImage(ts, d[0], d[1], d[2], d[3], Math.round(x - 8), Math.round(y - 8), d[2], d[3]);
    }
    this.ground = c;
  }

  private bindInput() {
    const MOVE = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea,[contenteditable]')) return;
      const k = e.key.toLowerCase();
      if (MOVE.includes(k)) {
        this.keys.add(k);
        if (this.phase === 'play') e.preventDefault();
      }
      if ((k === ' ' || k === 'shift' || k === 'k') && this.phase === 'play') {
        e.preventDefault();
        if (!e.repeat) this.dashQueued = true;
      }
      if ((k === 'escape' || k === 'p') && !e.repeat) {
        if (this.phase === 'play') this.setPaused(true);
        else if (this.phase === 'paused') this.setPaused(false);
      }
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    const blur = () => {
      this.keys.clear();
      this.stick = null;
      if (this.phase === 'play') this.setPaused(true);
    };
    const vis = () => {
      if (document.hidden) blur();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', vis);

    // Touch or mouse: press anywhere and drag to steer, like a floating thumbstick.
    const pdown = (e: PointerEvent) => {
      if (this.phase !== 'play' || this.stick) return;
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
      const dx = this.stick.x - this.stick.ox;
      const dy = this.stick.y - this.stick.oy;
      const m = Math.hypot(dx, dy);
      if (m > 70) {
        this.stick.ox = this.stick.x - (dx / m) * 70;
        this.stick.oy = this.stick.y - (dy / m) * 70;
      }
    };
    const pup = (e: PointerEvent) => {
      if (this.stick && e.pointerId === this.stick.id) this.stick = null;
    };
    this.canvas.addEventListener('pointerdown', pdown);
    this.canvas.addEventListener('pointermove', pmove);
    this.canvas.addEventListener('pointerup', pup);
    this.canvas.addEventListener('pointercancel', pup);

    this.cleanup.push(() => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', vis);
      this.canvas.removeEventListener('pointerdown', pdown);
      this.canvas.removeEventListener('pointermove', pmove);
      this.canvas.removeEventListener('pointerup', pup);
      this.canvas.removeEventListener('pointercancel', pup);
    });
  }

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
      return { x: x / m, y: y / m, mag: 1 };
    }
    if (this.stick) {
      const dx = this.stick.x - this.stick.ox;
      const dy = this.stick.y - this.stick.oy;
      const m = Math.hypot(dx, dy);
      if (m > 5) return { x: dx / m, y: dy / m, mag: clamp((m - 5) / 45, 0, 1) };
    }
    return { x: 0, y: 0, mag: 0 };
  }

  // --- public controls ----------------------------------------------------------

  get isReady() {
    return this.assets.ready;
  }

  start(id: HeroId) {
    if (!this.assets.ready) return;
    this.sound.unlock();
    this.sound.startMusic();
    this.heroId = id;
    this.H = heroDef(id);
    this.p = this.freshPlayer();
    this.ghosts = [];
    this.lv = noLevels();
    this.dealt = noDamage();
    this.since = { base: 0 };
    this.time = 0;
    this.kills = 0;
    this.score = 0;
    this.combo = 0;
    this.comboT = 0;
    this.level = 1;
    this.xp = 0;
    this.next = xpFor(1);
    this.budget = 4;
    this.pending = null;
    this.nextSurge = 50;
    this.nextElite = 55;
    this.nextBoss = 120;
    this.bossCount = 0;
    this.boss = null;
    this.flocks.clear();
    this.weaponT = 0.4;
    this.novaT = 2;
    this.chainT = 1;
    this.missileT = 1;
    this.auraT = 0;
    this.enemies = [];
    this.bullets = [];
    this.shots = [];
    this.waves = [];
    this.coins = [];
    this.drops = [];
    this.bits = [];
    this.fx = [];
    this.nums = [];
    this.bolts = [];
    this.decals = [];
    this.stop = 0;
    this.flashRed = this.flashWhite = this.flashIce = 0;
    this.cx = this.p.x;
    this.cy = this.p.y;
    this.phase = 'play';
    this.addFx('sparkle', this.p.x, this.p.y, 3, 0.5);
    // Something to fight straight away, from two sides.
    this.pack('grunt', 5);
    this.pack('slime', 4);
  }

  setPaused(paused: boolean) {
    if (paused && this.phase === 'play') {
      this.phase = 'paused';
      this.sound.stopMusic();
      this.hooks.onPause(true);
    } else if (!paused && this.phase === 'paused') {
      this.phase = 'play';
      this.last = performance.now();
      this.sound.startMusic();
      this.hooks.onPause(false);
    }
  }

  setMuted(m: boolean) {
    this.sound.setMuted(m);
  }

  dash() {
    if (this.phase === 'play') this.dashQueued = true;
  }

  pick(i: number) {
    if (this.phase !== 'levelup') return;
    const o = this.offers[i];
    if (!o) return;
    this.lv[o.id]++;
    if (o.kind === 'weapon' && this.lv[o.id] === 1) this.since[o.id as DamageSource] = this.time;
    if (o.id === 'vitality') {
      this.p.max += 25;
      this.p.hp = Math.min(this.p.max, this.p.hp + 25);
    }
    this.sound.play('select');
    // A little breathing room after choosing.
    for (const e of this.enemies) {
      const dx = e.x - this.p.x;
      const dy = e.y - this.p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 240 && e.def.behavior !== 'boss') {
        e.vx += (dx / d) * 520;
        e.vy += (dy / d) * 520;
      }
    }
    this.addFx('ring', this.p.x, this.p.y, 5, 0.35);
    this.p.inv = Math.max(this.p.inv, 0.6);
    this.phase = 'play';
    this.last = performance.now();
    if (this.xp >= this.next) this.levelUp();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.cleanup.forEach((f) => f());
    this.sound.dispose();
  }

  /** Test hooks, only exposed with ?debug in the URL. */
  debugApi() {
    return {
      state: () => ({
        phase: this.phase,
        time: this.time,
        hp: this.p.hp,
        level: this.level,
        kills: this.kills,
        score: this.score,
        enemies: this.enemies.length,
        x: this.p.x,
        y: this.p.y,
        lv: { ...this.lv },
        boss: this.boss?.kind ?? null,
        kinds: this.enemies.reduce<Record<string, number>>((m, e) => ((m[e.kind] = (m[e.kind] ?? 0) + 1), m), {}),
        coins: this.coins.length,
        damage: this.damageRows(),
      }),
      god: (on: boolean) => (this.god = on),
      spawn: (kind: EnemyKind, n: number) => this.pack(kind, n).length,
      skip: (sec: number) => {
        this.time += sec;
      },
      xp: (n: number) => {
        this.xp += n;
      },
      hurt: (n: number) => {
        this.p.inv = this.p.dashT = 0;
        this.hurt(n, this.p.x + 1, this.p.y);
      },
      drop: (kind: DropKind) => this.drop(this.p.x + 60, this.p.y, kind),
      elite: () => this.spawnElite(),
      /** Coins in a ring just inside the magnet, flung sideways: the worst case for orbiting. */
      rain: (n: number) => {
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          this.coins.push({ x: this.p.x + Math.cos(a) * 110, y: this.p.y + Math.sin(a) * 110, vx: -Math.sin(a) * 700, vy: Math.cos(a) * 700, value: 0.001, pull: true, speed: 0, phase: 0 });
        }
      },
      boss: () => this.spawnBoss(),
      threats: (r: number) => [
        ...this.enemies.filter((e) => Math.hypot(e.x - this.p.x, e.y - this.p.y) < r).map((e) => [e.x, e.y]),
        ...this.shots.filter((q) => Math.hypot(q.x - this.p.x, q.y - this.p.y) < r).map((q) => [q.x, q.y]),
      ],
      /** Mean distance from each nearby enemy to its nearest neighbour: low means clumped. */
      spread: () => {
        const es = this.enemies.filter((e) => Math.hypot(e.x - this.p.x, e.y - this.p.y) < 500);
        if (es.length < 2) return null;
        let sum = 0;
        let sectors = 0;
        const seenSector = new Set<number>();
        for (const e of es) {
          let best = Infinity;
          for (const o of es) if (o !== e) best = Math.min(best, Math.hypot(o.x - e.x, o.y - e.y));
          sum += best;
          const s = Math.floor(((Math.atan2(e.y - this.p.y, e.x - this.p.x) + Math.PI) / (Math.PI * 2)) * 8) % 8;
          if (!seenSector.has(s)) {
            seenSector.add(s);
            sectors++;
          }
        }
        return { n: es.length, meanNearest: sum / es.length, sectors };
      },
    };
  }

  // --- the loop -------------------------------------------------------------------

  private frame = (now: number) => {
    const real = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.clock += real;
    this.trauma = Math.max(0, this.trauma - real * 1.8);
    this.flashRed = Math.max(0, this.flashRed - real * 2.5);
    this.flashWhite = Math.max(0, this.flashWhite - real * 2.2);
    this.flashIce = Math.max(0, this.flashIce - real * 1.5);

    let fxDt = 0;
    if (this.phase === 'play' || this.phase === 'dying') {
      if (this.stop > 0) this.stop -= real;
      else {
        const dt = this.phase === 'dying' ? real * 0.3 : real;
        this.sim(dt);
        fxDt = dt;
      }
      if (this.phase === 'dying') {
        this.dyingT -= real;
        if (this.dyingT <= 0) this.finish();
      }
    } else if (this.phase === 'title' || this.phase === 'over') {
      this.attract(real);
      fxDt = real;
    }
    this.stepFx(fxDt);
    if (this.assets.ready) this.draw();
    if (this.phase !== 'title' && this.phase !== 'over') {
      this.hudAcc += real;
      if (this.hudAcc > 0.08) {
        this.hudAcc = 0;
        this.pushHud();
      }
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private damageRows(): DamageRow[] {
    const name = (s: DamageSource) => (s === 'base' ? this.H.weaponName : s === 'scroll' ? 'Thunder scroll' : upgradeName(s, this.H.weapon));
    return SOURCES.filter((s) => this.dealt[s] > 0 || (s !== 'scroll' && (s === 'base' || this.lv[s] > 0)))
      .map((s) => ({ key: s, name: name(s), total: Math.round(this.dealt[s]), dps: this.dealt[s] / Math.max(1, this.time - (this.since[s] ?? 0)) }))
      .sort((a, b) => b.total - a.total);
  }

  private pushHud() {
    const p = this.p;
    this.hooks.onHud({
      hp: Math.max(0, Math.ceil(p.hp)),
      maxHp: p.max,
      xp: this.xp,
      next: this.next,
      level: this.level,
      time: this.time,
      kills: this.kills,
      score: this.score,
      combo: this.combo,
      boss: this.boss ? { name: this.boss.def.name, hp: Math.max(0, this.boss.hp), max: this.boss.max } : null,
      dash: 1 - clamp(p.dashCd / this.dashCdMax(), 0, 1),
      damage: this.damageRows(),
    });
  }

  private sim(dt: number) {
    if (this.phase === 'play') {
      this.time += dt;
      this.director(dt);
    }
    this.movePlayer(dt);
    this.rebuildHash();
    this.updateFlocks(dt);
    this.updateEnemies(dt);
    if (this.phase === 'play') this.weapons(dt);
    this.updateBullets(dt);
    this.updateShots(dt);
    this.updateWaves(dt);
    this.updateCoins(dt);
    this.updateDrops(dt);
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.comboT -= dt;
    if (this.comboT <= 0) this.combo = 0;
    this.sound.intensity = clamp(this.time / 200 + (this.boss ? 0.35 : 0), 0, 1);
    this.follow(this.p.x + this.p.vx * 0.16, this.p.y + this.p.vy * 0.16, 1 - Math.pow(0.0005, dt));
  }

  private follow(tx: number, ty: number, k: number) {
    // Keep the camera over the arena so the edge doesn't show a void.
    const hw = this.w / this.zoom / 2;
    const hh = this.h / this.zoom / 2;
    const cx = hw * 2 < ARENA ? clamp(tx, hw - 60, ARENA - hw + 60) : ARENA / 2;
    const cy = hh * 2 < ARENA ? clamp(ty, hh - 60, ARENA - hh + 60) : ARENA / 2;
    this.cx += (cx - this.cx) * k;
    this.cy += (cy - this.cy) * k;
  }

  /** Title and game-over backdrop: monsters wandering the meadow. */
  private attract(dt: number) {
    const t = this.clock * 0.1;
    this.follow(ARENA / 2 + Math.cos(t) * 300, ARENA / 2 + Math.sin(t * 1.3) * 200, Math.min(1, dt * 1.2));
    for (const e of this.enemies) {
      e.born += dt;
      e.t -= dt;
      if (e.t <= 0) {
        e.t = rand(1.5, 4);
        const a = rand(0, Math.PI * 2);
        const s = e.speed * rand(0.2, 0.5);
        e.vx = Math.cos(a) * s;
        e.vy = Math.sin(a) * s;
        if (Math.random() < 0.3) e.vx = e.vy = 0;
      }
      e.x = clamp(e.x + e.vx * dt, 60, ARENA - 60);
      e.y = clamp(e.y + e.vy * dt, 60, ARENA - 60);
      e.alt = e.def.flying ? 14 + Math.sin(this.clock * 5 + e.wob) * 4 : 0;
      this.face(e, dt);
    }
  }

  private ambient() {
    const kinds: EnemyKind[] = ['grunt', 'slime', 'bat', 'ghost', 'eye', 'bush', 'wisp', 'bear', 'bee'];
    const e = this.makeEnemy(kinds[Math.floor(Math.random() * kinds.length)], ARENA / 2 + rand(-700, 700), ARENA / 2 + rand(-500, 500));
    e.born = 1;
    e.t = 0;
    this.enemies.push(e);
  }

  private finish() {
    this.phase = 'over';
    this.sound.play('over');
    const damage = this.damageRows();
    this.enemies = [];
    this.bullets = [];
    this.shots = [];
    this.waves = [];
    this.coins = [];
    this.drops = [];
    for (let i = 0; i < 22; i++) this.ambient();
    this.pushHud();
    this.hooks.onGameOver({ time: this.time, kills: this.kills, level: this.level, score: this.score, hero: this.heroId, damage });
  }

  // --- player -------------------------------------------------------------------

  private speed() {
    return this.H.speed * (1 + 0.1 * this.lv.speed);
  }

  private dashCdMax() {
    return 1.15 * Math.pow(0.75, this.lv.dash);
  }

  private movePlayer(dt: number) {
    const p = this.p;
    const inp = this.phase === 'play' ? this.input() : { x: 0, y: 0, mag: 0 };
    if (inp.mag > 0.1) {
      p.dx = inp.x;
      p.dy = inp.y;
    }
    if (this.dashQueued) {
      this.dashQueued = false;
      if (p.dashCd <= 0) {
        p.dashT = 0.17;
        p.vx = p.dx * 980;
        p.vy = p.dy * 980;
        p.inv = Math.max(p.inv, 0.32);
        p.dashCd = this.dashCdMax();
        this.sound.play('dash');
        this.trauma = Math.min(1, this.trauma + 0.06);
        this.dust(p.x, p.y + 14, 6);
      }
    }
    if (p.dashT > 0) {
      p.dashT -= dt;
      if (this.ghosts.length < 12) this.ghosts.push({ x: p.x, y: p.y, dir: this.dirOf(p.dx, p.dy), life: 0.25 });
    } else {
      const sp = this.speed() * inp.mag;
      const k = Math.min(1, dt * 14);
      p.vx += (inp.x * sp - p.vx) * k;
      p.vy += (inp.y * sp - p.vy) * k;
    }
    p.x = clamp(p.x + p.vx * dt, p.r + 10, ARENA - p.r - 10);
    p.y = clamp(p.y + p.vy * dt, p.r + 10, ARENA - p.r - 10);
    this.obstaclesNear(p.x, p.y, 60, (o) => {
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < o.r + p.r) {
        p.x = o.x + (dx / d) * (o.r + p.r);
        p.y = o.y + (dy / d) * (o.r + p.r);
      }
    });
    const s = Math.hypot(p.vx, p.vy);
    p.anim += dt * (s > 30 ? s / 55 : 0);
    if (s > 60 && Math.random() < dt * 8) this.dust(p.x, p.y + 16, 1);
    p.dashCd -= dt;
    p.inv -= dt;
    p.blink -= dt;
    if (this.lv.regen && p.hp > 0) p.hp = Math.min(p.max, p.hp + this.lv.regen * dt);
  }

  private hurt(dmg: number, fx: number, fy: number) {
    const p = this.p;
    if (this.phase !== 'play' || p.inv > 0 || p.dashT > 0 || this.god) return;
    p.hp -= Math.max(1, dmg - this.H.armor);
    p.inv = 0.85;
    p.blink = 0.85;
    const dx = p.x - fx;
    const dy = p.y - fy;
    const d = Math.hypot(dx, dy) || 1;
    p.vx += (dx / d) * 460;
    p.vy += (dy / d) * 460;
    this.stop = 0.07;
    this.trauma = Math.min(1, this.trauma + 0.45);
    this.flashRed = 0.45;
    this.combo = 0;
    this.sound.play('hurt');
    this.burst(p.x, p.y, '232,60,60', 12, 260);
    if (p.hp <= 0) {
      p.hp = 0;
      this.phase = 'dying';
      this.dyingT = 1.4;
      this.stop = 0.2;
      this.trauma = 1;
      this.sound.stopMusic();
      this.sound.play('boom');
      this.addFx('poof', p.x, p.y, 3.5, 0.6);
      this.burst(p.x, p.y, WHITE, 30, 380);
    }
  }

  // --- spawning -------------------------------------------------------------------

  private hpMul() {
    const t = this.time;
    return 1 + t / 100 + Math.pow(t / 260, 2);
  }

  private makeEnemy(kind: EnemyKind, x: number, y: number, elite = false): Enemy {
    const def = ENEMIES[kind];
    const boss = def.behavior === 'boss';
    const hp = (boss ? def.hp : def.hp * this.hpMul()) * (elite ? 7 : 1);
    return {
      kind,
      def,
      x,
      y,
      vx: 0,
      vy: 0,
      hp,
      max: hp,
      r: def.r * (elite ? 1.4 : 1),
      speed: def.speed * rand(0.9, 1.1) * (elite ? 0.9 : 1),
      dmg: def.dmg * (elite ? 1.5 : 1),
      scale: def.scale * (elite ? 1.6 : 1),
      elite,
      flash: 0,
      born: 0,
      t: rand(0.3, 1.5),
      state: 0,
      ax: 0,
      ay: 0,
      alt: 0,
      frozen: 0,
      slow: 0,
      slot: rand(0, Math.PI * 2),
      wob: rand(0, Math.PI * 2),
      spin: Math.random() < 0.5 ? -1 : 1,
      rad: 0,
      flock: 0,
      anim: rand(0, 4),
      dir: 0,
      alpha: 1,
      orbitCd: 0,
      summon: rand(4, 7),
      pattern: 0,
      dead: false,
    };
  }

  /** Off-screen, in a random (or given) direction, clamped inside the walls. */
  private spawnPoint(angle = rand(0, Math.PI * 2), extra = 70) {
    const dist = Math.hypot(this.w, this.h) / this.zoom / 2 + extra;
    return { x: clamp(this.p.x + Math.cos(angle) * dist, 50, ARENA - 50), y: clamp(this.p.y + Math.sin(angle) * dist, 50, ARENA - 50) };
  }

  private add(kind: EnemyKind, x: number, y: number, elite = false) {
    const e = this.makeEnemy(kind, x, y, elite);
    this.enemies.push(e);
    return e;
  }

  /** A group from one direction. */
  private pack(kind: EnemyKind, n: number, angle?: number) {
    const at = this.spawnPoint(angle);
    const out: Enemy[] = [];
    for (let i = 0; i < n && this.enemies.length < MAX_ENEMIES; i++)
      out.push(this.add(kind, clamp(at.x + rand(-70, 70), 50, ARENA - 50), clamp(at.y + rand(-70, 70), 50, ARENA - 50)));
    return out;
  }

  private director(dt: number) {
    const t = this.time;
    this.budget += dt * (1.9 + t * 0.05 + Math.max(0, t - 120) * 0.035);
    if (!this.pending) this.pending = this.chooseEvent();
    if (this.budget >= this.pending.cost && this.enemies.length < MAX_ENEMIES) {
      this.budget -= this.pending.cost;
      this.pending.run();
      this.pending = null;
    }
    if (t >= this.nextSurge) {
      this.nextSurge += 50;
      this.surge();
    }
    if (t >= this.nextElite) {
      this.nextElite += 45;
      this.spawnElite();
    }
    if (t >= this.nextBoss) {
      this.nextBoss += 120;
      this.spawnBoss();
    }
  }

  private chooseEvent(): { cost: number; run: () => void } {
    const t = this.time;
    const extra = Math.floor(t / 60);
    const packOf = (kind: EnemyKind, a: number, b: number) => {
      const n = ri(a, b) + (kind === 'bear' ? 0 : extra);
      return { cost: n * (COST[kind] ?? 1), run: () => void this.pack(kind, n) };
    };
    const table: [number, () => { cost: number; run: () => void }][] = [
      [10, () => packOf('grunt', 3, 5)],
      [8, () => packOf('slime', 3, 5)],
      [
        // Hornets are cheap and fast; too many flocks at once just becomes noise.
        t > 20 && this.enemies.filter((e) => e.kind === 'bee').length < 36 ? 5 : 0,
        () => {
          const n = ri(7, 12) + extra * 2;
          return { cost: n * 0.5, run: () => this.flockOf(n) };
        },
      ],
      [t > 40 ? 4 : 0, () => packOf('bat', 2, 4)],
      [t > 60 ? 3.5 : 0, () => packOf('ghost', 2, 4)],
      [t > 75 ? 3 : 0, () => packOf('eye', 2, 3)],
      [t > 90 ? 2.5 : 0, () => packOf('bush', 1, 2)],
      [t > 105 ? 2 : 0, () => packOf('bear', 1, 1)],
      [t > 135 ? 2.5 : 0, () => packOf('wisp', 3, 5)],
      [
        t > 50 ? 1.2 : 0,
        () => {
          const n = ri(8, 12) + extra * 2;
          return { cost: n * 0.8, run: () => this.line(n) };
        },
      ],
      [
        t > 80 ? 1 : 0,
        () => {
          const n = ri(3, 5) + extra;
          return {
            cost: n * 2,
            run: () => {
              const a = rand(0, Math.PI * 2);
              this.pack('grunt', n, a);
              this.pack(Math.random() < 0.5 ? 'slime' : 'grunt', n, a + Math.PI);
              this.hooks.onAnnounce('Pincer!', 'danger');
            },
          };
        },
      ],
    ];
    let sum = 0;
    for (const [w] of table) sum += w;
    let r = Math.random() * sum;
    for (const [w, make] of table) {
      r -= w;
      if (r <= 0 && w > 0) return make();
    }
    return packOf('grunt', 3, 5);
  }

  /** Hornets arrive as one flock that sweeps through you. */
  private flockOf(n: number) {
    const id = ++this.flockId;
    for (const e of this.pack('bee', n)) e.flock = id;
  }

  /** A wall of imps marching straight across, then breaking to hunt you. */
  private line(n: number) {
    const a = rand(0, Math.PI * 2);
    const at = this.spawnPoint(a, 40);
    const ux = -Math.cos(a);
    const uy = -Math.sin(a);
    for (let i = 0; i < n && this.enemies.length < MAX_ENEMIES; i++) {
      const off = (i - (n - 1) / 2) * 46;
      const e = this.add('grunt', clamp(at.x - uy * off, 50, ARENA - 50), clamp(at.y + ux * off, 50, ARENA - 50));
      e.state = 9;
      e.t = 5;
      e.ax = ux;
      e.ay = uy;
    }
    this.hooks.onAnnounce('Here they come', 'danger');
  }

  /** A ring of slimes closing in from all sides. */
  private surge() {
    const n = Math.min(36, 14 + Math.floor(this.time / 10));
    const rad = (Math.min(this.w, this.h) / this.zoom) * 0.62;
    for (let i = 0; i < n && this.enemies.length < MAX_ENEMIES; i++) {
      const a = (i / n) * Math.PI * 2;
      this.add('slime', clamp(this.p.x + Math.cos(a) * rad, 50, ARENA - 50), clamp(this.p.y + Math.sin(a) * rad, 50, ARENA - 50));
    }
    this.hooks.onAnnounce('Surrounded!', 'danger');
    this.trauma = Math.min(1, this.trauma + 0.2);
  }

  private spawnElite() {
    const t = this.time;
    const pool: EnemyKind[] = ['grunt', 'slime'];
    if (t > 40) pool.push('bat');
    if (t > 60) pool.push('ghost');
    if (t > 75) pool.push('eye');
    if (t > 90) pool.push('bush');
    if (t > 105) pool.push('bear');
    const kind = pool[Math.floor(Math.random() * pool.length)];
    const at = this.spawnPoint();
    this.add(kind, at.x, at.y, true);
    this.hooks.onAnnounce(`Golden ${ENEMIES[kind].name}!`, 'good');
  }

  private spawnBoss() {
    const kind = BOSSES[this.bossCount % BOSSES.length];
    const at = this.spawnPoint(undefined, 30);
    const e = this.makeEnemy(kind, at.x, at.y);
    e.hp = e.max = ENEMIES[kind].hp * (1 + this.bossCount * 0.7) * (1 + this.time / 400);
    e.t = 1.5;
    this.enemies.push(e);
    this.boss = e;
    this.bossCount++;
    this.hooks.onAnnounce(ENEMIES[kind].name, 'danger');
    this.sound.play('boss');
    this.trauma = Math.min(1, this.trauma + 0.35);
  }

  // --- enemy movement -------------------------------------------------------------

  private rebuildHash() {
    for (const i of this.used) this.cells[i].length = 0;
    this.used.length = 0;
    for (const e of this.enemies) {
      const i = clamp(Math.floor(e.y / HC), 0, HN - 1) * HN + clamp(Math.floor(e.x / HC), 0, HN - 1);
      if (!this.cells[i].length) this.used.push(i);
      this.cells[i].push(e);
    }
  }

  private near(x: number, y: number, rad: number, fn: (e: Enemy) => void) {
    const x0 = clamp(Math.floor((x - rad) / HC), 0, HN - 1);
    const x1 = clamp(Math.floor((x + rad) / HC), 0, HN - 1);
    const y0 = clamp(Math.floor((y - rad) / HC), 0, HN - 1);
    const y1 = clamp(Math.floor((y + rad) / HC), 0, HN - 1);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) for (const e of this.cells[cy * HN + cx]) if (!e.dead) fn(e);
  }

  private nearest(x: number, y: number, range: number, skip?: Set<Enemy>) {
    let best: Enemy | null = null;
    let bd = range * range;
    for (const e of this.enemies) {
      if (e.dead || e.born < 0.25 || skip?.has(e)) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  private updateFlocks(dt: number) {
    for (const f of this.flocks.values()) {
      f.cx = f.cy = f.vx = f.vy = 0;
      f.n = 0;
    }
    for (const e of this.enemies) {
      if (!e.flock) continue;
      let f = this.flocks.get(e.flock);
      if (!f) {
        f = { tx: this.p.x, ty: this.p.y, t: 0, cx: 0, cy: 0, vx: 0, vy: 0, n: 0 };
        this.flocks.set(e.flock, f);
      }
      f.cx += e.x;
      f.cy += e.y;
      f.vx += e.vx;
      f.vy += e.vy;
      f.n++;
    }
    for (const [id, f] of this.flocks) {
      if (!f.n) {
        this.flocks.delete(id);
        continue;
      }
      f.cx /= f.n;
      f.cy /= f.n;
      f.vx /= f.n;
      f.vy /= f.n;
      f.t -= dt;
      // Aim for a point beyond you, so the flock sweeps through instead of settling on you.
      if (f.t <= 0 || Math.hypot(f.tx - f.cx, f.ty - f.cy) < 60) {
        const dx = this.p.x - f.cx;
        const dy = this.p.y - f.cy;
        const d = Math.hypot(dx, dy) || 1;
        f.tx = clamp(this.p.x + (dx / d) * 300 + rand(-80, 80), 60, ARENA - 60);
        f.ty = clamp(this.p.y + (dy / d) * 300 + rand(-80, 80), 60, ARENA - 60);
        f.t = rand(2.5, 3.5);
      }
    }
  }

  private dirOf(vx: number, vy: number) {
    return Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 2 : 3) : vy < 0 ? 1 : 0;
  }

  private face(e: Enemy, dt: number) {
    const s = Math.hypot(e.vx, e.vy);
    if (s > 8) e.dir = this.dirOf(e.vx, e.vy);
    e.anim += dt * (s > 8 ? 4 + s / 60 : 1.5);
  }

  private updateEnemies(dt: number) {
    const p = this.p;
    for (const e of this.enemies) {
      e.born += dt;
      e.flash -= dt;
      e.orbitCd -= dt;
      e.slow -= dt;
      if (e.frozen > 0) {
        e.frozen -= dt;
        e.vx *= 0.8;
        e.vy *= 0.8;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        continue;
      }
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d;
      const uy = dy / d;
      const sp = e.speed * (e.slow > 0 ? 0.6 : 1);
      // Desired velocity, and how quickly it's adopted.
      let tx = ux * sp;
      let ty = uy * sp;
      let steer = 4;
      let solid = !e.def.flying;
      e.t -= dt;

      if (e.state === 9) {
        // Marching in a line.
        tx = e.ax * 120;
        ty = e.ay * 120;
        if (e.t <= 0 || d < 160) e.state = 0;
      } else
        switch (e.def.behavior) {
          case 'flank': {
            // Each one heads for its own point on a ring round you that shrinks as it closes,
            // so a pack fans out and arrives from several sides.
            if (d > 90) {
              const R = Math.min(190, d * 0.6);
              const fx = p.x + Math.cos(e.slot) * R - e.x;
              const fy = p.y + Math.sin(e.slot) * R - e.y;
              const fd = Math.hypot(fx, fy) || 1;
              const w = Math.sin(this.clock * 2.4 + e.wob) * 0.35;
              tx = (fx / fd - (fy / fd) * w) * sp;
              ty = (fy / fd + (fx / fd) * w) * sp;
            }
            break;
          }
          case 'rush': {
            const w = Math.sin(this.clock * 9 + e.wob) * 0.5;
            tx = (ux - uy * w) * sp;
            ty = (uy + ux * w) * sp;
            break;
          }
          case 'hop': {
            if (e.state === 0) {
              tx = ty = 0;
              steer = 10;
              e.alt = 0;
              if (e.t <= 0) {
                e.state = 1;
                e.t = 0.42;
                // Leap at where you're heading, not where you are.
                const lx = p.x + p.vx * 0.35 - e.x;
                const ly = p.y + p.vy * 0.35 - e.y;
                const ld = Math.hypot(lx, ly) || 1;
                e.ax = lx / ld;
                e.ay = ly / ld;
              }
            } else {
              tx = e.ax * sp;
              ty = e.ay * sp;
              steer = 20;
              e.alt = Math.sin(Math.PI * clamp(1 - e.t / 0.42, 0, 1)) * 26;
              if (e.t <= 0) {
                e.state = 0;
                e.t = rand(0.45, 0.9);
                e.alt = 0;
                this.dust(e.x, e.y + e.r * 0.6, 2);
              }
            }
            break;
          }
          case 'flock': {
            const f = this.flocks.get(e.flock);
            if (f) {
              const gx = f.tx - e.x;
              const gy = f.ty - e.y;
              const gd = Math.hypot(gx, gy) || 1;
              const cx = f.cx - e.x;
              const cy = f.cy - e.y;
              const cd = Math.hypot(cx, cy) || 1;
              const vm = Math.hypot(f.vx, f.vy) || 1;
              const jx = Math.sin(this.clock * 7 + e.wob) * 0.4;
              const jy = Math.cos(this.clock * 6 + e.wob) * 0.4;
              const mx = gx / gd + (f.vx / vm) * 0.6 + (cx / cd) * 0.35 * Math.min(1, cd / 90) + jx;
              const my = gy / gd + (f.vy / vm) * 0.6 + (cy / cd) * 0.35 * Math.min(1, cd / 90) + jy;
              const mm = Math.hypot(mx, my) || 1;
              tx = (mx / mm) * sp;
              ty = (my / mm) * sp;
              steer = 3;
            }
            break;
          }
          case 'swoop': {
            if (e.state === 0) {
              // Circle at a distance.
              e.rad = e.rad || Math.atan2(e.y - p.y, e.x - p.x);
              e.rad += e.spin * dt * 1.3;
              const ox = p.x + Math.cos(e.rad) * 250 - e.x;
              const oy = p.y + Math.sin(e.rad) * 250 - e.y;
              const od = Math.hypot(ox, oy) || 1;
              tx = (ox / od) * sp * 1.3;
              ty = (oy / od) * sp * 1.3;
              steer = 3;
              if (e.t <= 0 && d < 430) {
                e.state = 1;
                e.t = 0.4;
              }
            } else if (e.state === 1) {
              // Hover and flash: the tell.
              tx = ty = 0;
              steer = 8;
              e.ax = ux;
              e.ay = uy;
              if (e.t <= 0) {
                e.state = 2;
                e.t = 0.85;
                e.vx = e.ax * 460;
                e.vy = e.ay * 460;
              }
            } else {
              tx = e.ax * 460;
              ty = e.ay * 460;
              steer = 0;
              if (Math.random() < 0.5) this.bit(e.x, e.y - e.alt, 0, 0, e.def.rgb, 0.3, 2);
              if (e.t <= 0) {
                e.state = 0;
                e.t = rand(1.6, 3);
                e.rad = Math.atan2(e.y - p.y, e.x - p.x);
              }
            }
            break;
          }
          case 'charge': {
            if (e.state === 0) {
              if (e.t <= 0 && d < 470) {
                e.state = 1;
                e.t = 0.7;
              }
            } else if (e.state === 1) {
              tx = ty = 0;
              steer = 10;
              e.ax = ux;
              e.ay = uy;
              if (e.t <= 0) {
                e.state = 2;
                e.t = 1.1;
                e.vx = e.ax * 480;
                e.vy = e.ay * 480;
                this.dust(e.x, e.y + e.r * 0.6, 5);
              }
            } else if (e.state === 2) {
              tx = e.ax * 480;
              ty = e.ay * 480;
              steer = 0;
              if (Math.random() < 0.6) this.dust(e.x, e.y + e.r * 0.6, 1);
              if (e.t <= 0) {
                e.state = 0;
                e.t = rand(2, 3.5);
              }
            } else {
              // Stunned after hitting something.
              tx = ty = 0;
              steer = 6;
              if (e.t <= 0) {
                e.state = 0;
                e.t = rand(1.5, 2.5);
              }
            }
            break;
          }
          case 'phase': {
            // Weaves in a wave and drifts through everything, fading in and out.
            const w = Math.sin(this.clock * 3 + e.wob) * 0.9;
            const m = Math.hypot(1, w);
            tx = ((ux - uy * w) / m) * sp;
            ty = ((uy + ux * w) / m) * sp;
            e.alpha = 0.55 + 0.35 * Math.sin(this.clock * 2 + e.wob);
            solid = false;
            break;
          }
          case 'kite': {
            if (d < 220) {
              tx = -ux * sp;
              ty = -uy * sp;
            } else if (d < 380) {
              tx = -uy * sp * 0.8 * e.spin;
              ty = ux * sp * 0.8 * e.spin;
            }
            if (e.t <= 0 && d < 620) {
              e.t = 2.6;
              const lx = p.x + p.vx * 0.3 - e.x;
              const ly = p.y + p.vy * 0.3 - e.y;
              const ld = Math.hypot(lx, ly) || 1;
              this.shots.push({ x: e.x, y: e.y - 10, vx: (lx / ld) * 235, vy: (ly / ld) * 235, life: 5 });
            }
            break;
          }
          case 'spiral': {
            if (e.state === 0) {
              if (d < 280) {
                e.state = 1;
                e.rad = d;
                e.ax = Math.atan2(e.y - p.y, e.x - p.x);
              }
            } else if (e.state === 1) {
              e.ax += e.spin * dt * 2.4;
              e.rad -= dt * 50;
              const ox = p.x + Math.cos(e.ax) * e.rad - e.x;
              const oy = p.y + Math.sin(e.ax) * e.rad - e.y;
              const od = Math.hypot(ox, oy) || 1;
              tx = (ox / od) * sp * 1.1;
              ty = (oy / od) * sp * 1.1;
              steer = 7;
              if (Math.random() < 0.4) this.bit(e.x, e.y - e.alt, 0, 0, '255,150,60', 0.35, 2);
              if (e.rad < 80) {
                e.state = 2;
                e.t = 0.5;
              }
            } else {
              tx = ux * 380;
              ty = uy * 380;
              steer = 8;
              if (e.t <= 0) {
                e.state = 0;
                e.vx = -ux * 300;
                e.vy = -uy * 300;
              }
            }
            break;
          }
          case 'boss':
            ({ tx, ty, steer } = this.bossBrain(e, dt, d, ux, uy, sp));
            solid = e.kind !== 'skull';
            break;
        }

      if (e.def.flying || e.def.behavior === 'phase') e.alt = e.kind === 'skull' ? 18 : 14 + Math.sin(this.clock * 5 + e.wob) * 4;
      if (e.born < 0.35) steer *= 0.5;
      const k = Math.min(1, dt * steer);
      e.vx += (tx - e.vx) * k;
      e.vy += (ty - e.vy) * k;

      // Steer round trees and rocks rather than grinding into them.
      if (solid) {
        const vm = Math.hypot(e.vx, e.vy) || 1;
        this.obstaclesNear(e.x, e.y, 110, (o) => {
          const ox = o.x - e.x;
          const oy = o.y - e.y;
          const ahead = (ox * e.vx + oy * e.vy) / vm;
          if (ahead <= 0 || ahead > 110) return;
          const lateral = (ox * e.vy - oy * e.vx) / vm;
          if (Math.abs(lateral) > o.r + e.r + 6) return;
          const side = lateral > 0 ? -1 : 1;
          const px = (-e.vy / vm) * side;
          const py = (e.vx / vm) * side;
          e.vx += px * vm * 12 * dt;
          e.vy += py * vm * 12 * dt;
        });
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = clamp(e.x, e.r, ARENA - e.r);
      e.y = clamp(e.y, e.r, ARENA - e.r);

      if (solid) {
        this.obstaclesNear(e.x, e.y, 60, (o) => {
          const ox = e.x - o.x;
          const oy = e.y - o.y;
          const od = Math.hypot(ox, oy) || 1;
          if (od < o.r + e.r) {
            e.x = o.x + (ox / od) * (o.r + e.r);
            e.y = o.y + (oy / od) * (o.r + e.r);
            if (e.def.behavior === 'charge' && e.state === 2) {
              // Ran into a tree: stunned.
              e.state = 3;
              e.t = 1.2;
              e.vx = (ox / od) * 200;
              e.vy = (oy / od) * 200;
              this.addFx('impact', e.x - (ox / od) * e.r, e.y - (oy / od) * e.r, 2.2, 0.3);
              this.trauma = Math.min(1, this.trauma + 0.15);
              this.sound.play('bigpop');
            }
          }
        });
      }

      // Personal space: push apart from neighbours so the swarm is a crowd, not a blob.
      if (e.def.behavior !== 'phase') {
        let pushes = 0;
        this.near(e.x, e.y, e.r + 30, (o) => {
          if (o === e || pushes > 8 || o.def.behavior === 'phase' || o.def.flying !== e.def.flying) return;
          const ox = e.x - o.x;
          const oy = e.y - o.y;
          const min = (e.r + o.r) * 1.05;
          const d2 = ox * ox + oy * oy;
          if (d2 < min * min && d2 > 0.01) {
            pushes++;
            const dd = Math.sqrt(d2);
            const share = o.def.mass / (e.def.mass + o.def.mass);
            const push = ((min - dd) / dd) * 0.55 * share;
            e.x += ox * push;
            e.y += oy * push;
            e.vx += (ox / dd) * 30 * share;
            e.vy += (oy / dd) * 30 * share;
          }
        });
      }

      this.face(e, dt);

      if (d < e.r + p.r * 0.85 && e.born > 0.35 && e.alt < 20) {
        this.hurt(e.dmg, e.x, e.y);
        if (e.def.behavior !== 'boss') {
          e.vx -= ux * 260;
          e.vy -= uy * 260;
        }
      }
    }
  }

  private bossBrain(e: Enemy, dt: number, d: number, ux: number, uy: number, sp: number) {
    const p = this.p;
    let tx = ux * sp;
    let ty = uy * sp;
    let steer = 3;
    e.summon -= dt;
    if (e.kind === 'beast') {
      // Walks at you, charges, and every third attack slams the ground: dash through the wave.
      if (e.state === 0) {
        if (e.t <= 0) {
          e.pattern = (e.pattern + 1) % 3;
          e.state = 1;
          e.t = e.pattern === 2 ? 0.9 : 0.75;
        }
      } else if (e.state === 1) {
        tx = ty = 0;
        steer = 10;
        e.ax = ux;
        e.ay = uy;
        if (e.t <= 0) {
          if (e.pattern === 2) {
            this.waves.push({ x: e.x, y: e.y + e.r * 0.5, r: 30, speed: 330, max: 700, hit: false });
            this.trauma = Math.min(1, this.trauma + 0.5);
            this.sound.play('boom');
            this.dust(e.x, e.y + e.r * 0.6, 14);
            e.state = 0;
            e.t = 2.2;
          } else {
            e.state = 2;
            e.t = 1.2;
            this.dust(e.x, e.y + e.r * 0.6, 8);
          }
        }
      } else if (e.state === 2) {
        tx = e.ax * 520;
        ty = e.ay * 520;
        steer = 6;
        if (Math.random() < 0.7) this.dust(e.x, e.y + e.r * 0.7, 1);
        if (e.t <= 0) {
          e.state = 0;
          e.t = 2.4;
        }
      }
      if (e.summon <= 0) {
        e.summon = 8;
        this.pack('grunt', 4);
      }
    } else if (e.kind === 'dragon') {
      // Keeps its distance and fills the air with fire.
      if (d < 260) {
        tx = -ux * sp;
        ty = -uy * sp;
      } else if (d < 420) {
        tx = -uy * sp * e.spin;
        ty = ux * sp * e.spin;
      }
      if (e.t <= 0) {
        e.pattern = (e.pattern + 1) % 3;
        if (e.pattern < 2) {
          const n = 16 + this.bossCount * 3;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + this.clock;
            this.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, life: 7 });
          }
          e.t = 2.6;
        } else {
          e.state = 5;
          e.rad = 1.8;
          e.t = 3.4;
        }
        this.sound.play('zap');
      }
      if (e.state === 5) {
        e.rad -= dt;
        e.ax += dt;
        while (e.ax > 0.07) {
          e.ax -= 0.07;
          const a = this.clock * 5;
          for (const off of [0, Math.PI]) this.shots.push({ x: e.x, y: e.y, vx: Math.cos(a + off) * 215, vy: Math.sin(a + off) * 215, life: 7 });
        }
        if (e.rad <= 0) e.state = 0;
      }
      if (e.summon <= 0) {
        e.summon = 9;
        this.flockOf(10);
      }
    } else {
      // Skull King: vanishes and reappears beside you, then fires a ring.
      if (e.state === 0) {
        e.alpha = 1;
        if (e.t <= 0) {
          e.state = 1;
          e.t = 0.5;
        }
      } else if (e.state === 1) {
        tx = ty = 0;
        e.alpha = clamp(e.t / 0.5, 0, 1);
        if (e.t <= 0) {
          const a = rand(0, Math.PI * 2);
          e.x = clamp(p.x + Math.cos(a) * 240, 80, ARENA - 80);
          e.y = clamp(p.y + Math.sin(a) * 240, 80, ARENA - 80);
          e.vx = e.vy = 0;
          e.state = 2;
          e.t = 0.6;
          this.addFx('ring', e.x, e.y, 5, 0.5);
        }
      } else if (e.state === 2) {
        tx = ty = 0;
        e.alpha = clamp(1 - e.t / 0.6, 0.15, 1);
        if (e.t <= 0) {
          const n = 20 + this.bossCount * 2;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            this.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, life: 7 });
          }
          this.sound.play('zap');
          e.state = 0;
          e.t = 2.8;
        }
      }
      if (e.summon <= 0) {
        e.summon = 7;
        this.pack('ghost', 3);
      }
    }
    return { tx, ty, steer };
  }

  // --- damage and death ---------------------------------------------------------

  private damage(e: Enemy, amount: number, src: DamageSource, kx = 0, ky = 0) {
    if (e.dead) return;
    const crit = Math.random() < 0.05 + 0.08 * this.lv.crit;
    const dmg = Math.max(1, Math.round(amount * (crit ? 2 : 1) * (e.frozen > 0 ? 1.5 : 1)));
    // Count what actually landed, so overkill on a 1-hp goblin doesn't inflate a weapon.
    this.dealt[src] += Math.min(dmg, Math.max(0, e.hp));
    e.hp -= dmg;
    e.flash = 0.06;
    const m = e.def.mass * (e.elite ? 3 : 1);
    e.vx += kx / m;
    e.vy += ky / m;
    this.number(e.x + rand(-6, 6), e.y - e.r - e.alt - 8, String(dmg), crit);
    if (crit) this.addFx('impact', e.x, e.y - e.alt, 1.4, 0.2);
    if (e.hp <= 0) this.kill(e);
  }

  private kill(e: Enemy) {
    e.dead = true;
    const d = e.def;
    this.kills++;
    this.combo++;
    this.comboT = 2.4;
    this.score += Math.round(d.score * (e.elite ? 5 : 1) * (1 + Math.floor(this.combo / 10) * 0.5));
    if (this.combo % 25 === 0) this.hooks.onAnnounce(`${this.combo} combo!`, 'good');
    const big = e.elite || d.mass >= 3 || d.behavior === 'boss';
    this.addFx('poof', e.x, e.y - e.alt, e.scale * 1.6, 0.4);
    this.burst(e.x, e.y - e.alt, d.rgb, big ? 22 : 9, big ? 300 : 200);
    if (this.decals.length > 150) this.decals.shift();
    this.decals.push({ x: e.x, y: e.y, rgb: d.rgb, life: 12, seed: Math.random() * 1000 });
    this.sound.play(big ? 'bigpop' : 'pop');
    if (big) {
      this.stop = Math.max(this.stop, 0.04);
      this.trauma = Math.min(1, this.trauma + 0.15);
    }
    if (e.kind === 'bush')
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + rand(0, 1);
        const s = this.add('sprout', e.x, e.y);
        s.vx = Math.cos(a) * 260;
        s.vy = Math.sin(a) * 260;
        s.born = 0.2;
      }
    if (d.behavior === 'boss') {
      this.boss = null;
      this.stop = 0.22;
      this.trauma = 1;
      this.flashWhite = 0.6;
      this.sound.play('boom');
      this.hooks.onAnnounce(`${d.name} defeated!`, 'good');
      for (let i = 0; i < 18; i++) this.coin(e.x + rand(-50, 50), e.y + rand(-50, 50), 5);
      this.drop(e.x - 40, e.y, 'chest');
      this.drop(e.x + 40, e.y, 'heart');
      return;
    }
    if (e.elite) {
      this.drop(e.x, e.y, 'chest');
      for (let i = 0; i < 6; i++) this.coin(e.x, e.y, 5);
      return;
    }
    this.coin(e.x, e.y, d.xp);
    if (e.kind !== 'sprout' && e.kind !== 'bee') {
      const r = Math.random();
      if (r < 0.01) this.drop(e.x, e.y, 'heart');
      else if (r < 0.015) this.drop(e.x, e.y, 'magnet');
      else if (r < 0.0185) this.drop(e.x, e.y, 'thunder');
      else if (r < 0.022) this.drop(e.x, e.y, 'ice');
    }
  }

  // --- weapons ---------------------------------------------------------------------

  private dmgMul() {
    return 1 + 0.2 * this.lv.damage;
  }

  private rateMul() {
    return Math.pow(0.88, this.lv.firerate);
  }

  private weapons(dt: number) {
    const p = this.p;
    const dm = this.dmgMul();
    const rm = this.rateMul();

    this.weaponT -= dt;
    if (this.weaponT <= 0) {
      if (this.H.weapon === 'slash') {
        // Swing at the nearest monster in reach (you'll often be walking away from them),
        // or the way you face if nothing is close.
        const reach = 108 * (1 + 0.2 * this.lv.pierce);
        const t = this.nearest(p.x, p.y, reach * 1.5);
        let fx = p.dx;
        let fy = p.dy;
        if (t) {
          const d = Math.hypot(t.x - p.x, t.y - p.y) || 1;
          fx = (t.x - p.x) / d;
          fy = (t.y - p.y) / d;
        }
        this.swing(fx, fy, dm);
        if (this.lv.multishot) this.swing(-fx, -fy, dm);
        this.weaponT = 0.95 * rm;
      } else {
        const t = this.nearest(p.x, p.y, 540);
        if (t) {
          const fire = this.H.weapon === 'fireball';
          const n = 1 + this.lv.multishot;
          const base = Math.atan2(t.y - p.y, t.x - p.x);
          for (let i = 0; i < n; i++) {
            const a = base + (i - (n - 1) / 2) * 0.16;
            const sp = fire ? 440 : 640;
            this.bullets.push({
              kind: fire ? 'fireball' : 'shuriken',
              src: 'base',
              x: p.x + Math.cos(a) * 14,
              y: p.y + Math.sin(a) * 14 - 6,
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp,
              dmg: (fire ? 17 : 11) * dm,
              pierce: fire ? 0 : this.lv.pierce,
              life: fire ? 1.2 : 0.9,
              blast: fire ? 56 * (1 + 0.3 * this.lv.pierce) : 0,
              hits: [],
              target: null,
              rot: a,
            });
          }
          this.weaponT = (fire ? 0.8 : 0.42) * rm;
          this.sound.play('shoot');
        } else this.weaponT = 0.05;
      }
    }

    if (this.lv.orbit) {
      const L = this.lv.orbit;
      const n = 1 + L;
      const R = 78 + L * 5;
      const dmg = 8 * dm * (1 + 0.2 * (L - 1));
      this.orbitA += dt * 3.4;
      for (let i = 0; i < n; i++) {
        const a = this.orbitA + (i / n) * Math.PI * 2;
        const bx = p.x + Math.cos(a) * R;
        const by = p.y + Math.sin(a) * R;
        this.near(bx, by, 50, (e) => {
          if (e.orbitCd > 0 || Math.hypot(e.x - bx, e.y - by) > e.r + 14) return;
          e.orbitCd = 0.35;
          this.damage(e, dmg, 'orbit', Math.cos(a) * 240, Math.sin(a) * 240);
          this.sound.play('hit');
        });
      }
    }

    if (this.lv.aura) {
      this.auraT -= dt;
      if (this.auraT <= 0) {
        this.auraT = 0.5;
        const L = this.lv.aura;
        const R = this.auraR();
        this.near(p.x, p.y, R + 30, (e) => {
          if (Math.hypot(e.x - p.x, e.y - p.y) < R + e.r) {
            e.slow = 0.6;
            this.damage(e, 4 * L * dm, 'aura');
          }
        });
      }
    }

    if (this.lv.nova) {
      this.novaT -= dt;
      if (this.novaT <= 0) {
        const L = this.lv.nova;
        const radius = 150 + 22 * L;
        const dmg = 16 * dm * (1 + 0.25 * (L - 1));
        this.near(p.x, p.y, radius, (e) => {
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < radius + e.r) this.damage(e, dmg, 'nova', (dx / d) * 500, (dy / d) * 500);
        });
        this.addFx('ring', p.x, p.y, (radius * 2) / (32 * S), 0.35);
        this.sound.play('nova');
        this.trauma = Math.min(1, this.trauma + 0.12);
        this.novaT = (3.8 - 0.35 * (L - 1)) * rm;
      }
    }

    if (this.lv.chain) {
      this.chainT -= dt;
      if (this.chainT <= 0) {
        const first = this.nearest(p.x, p.y, 440);
        if (first) {
          const L = this.lv.chain;
          const dmg = 22 * dm * (1 + 0.2 * (L - 1));
          const hit = new Set<Enemy>();
          const pts = [p.x, p.y - 10];
          let cur: Enemy | null = first;
          for (let j = 0; j < 3 + L && cur; j++) {
            const at: Enemy = cur;
            this.jag(pts, at.x, at.y - at.alt);
            hit.add(at);
            this.damage(at, dmg, 'chain');
            this.addFx('zap', at.x, at.y - at.alt, 1.2, 0.25);
            cur = this.nearest(at.x, at.y, 210, hit);
          }
          this.bolts.push({ pts, life: 0.22 });
          this.sound.play('zap');
          this.chainT = (2.4 - 0.2 * (L - 1)) * rm;
        } else this.chainT = 0.2;
      }
    }

    if (this.lv.missiles) {
      this.missileT -= dt;
      if (this.missileT <= 0) {
        const L = this.lv.missiles;
        const count = [1, 2, 2, 3, 4][L - 1];
        for (let i = 0; i < count; i++) {
          const a = rand(0, Math.PI * 2);
          this.bullets.push({
            kind: 'flame',
            src: 'missiles',
            x: p.x,
            y: p.y - 8,
            vx: Math.cos(a) * 240,
            vy: Math.sin(a) * 240,
            dmg: 24 * dm * (1 + 0.15 * (L - 1)),
            pierce: 0,
            life: 2.6,
            blast: 62 + (L >= 3 ? 14 : 0) + (L >= 5 ? 14 : 0),
            hits: [],
            target: null,
            rot: a,
          });
        }
        this.missileT = (2.1 - 0.15 * (L - 1)) * rm;
      }
    }
  }

  private auraR() {
    return 70 + 16 * this.lv.aura;
  }

  /** The knight's sword: an arc in front of him that hits everything inside it. */
  private swing(fx: number, fy: number, dm: number) {
    const p = this.p;
    const reach = 108 * (1 + 0.2 * this.lv.pierce);
    const half = (55 + Math.max(0, this.lv.multishot - 1) * 11) * (Math.PI / 180);
    const facing = Math.atan2(fy, fx);
    this.near(p.x, p.y, reach + 30, (e) => {
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > reach + e.r) return;
      let diff = Math.atan2(dy, dx) - facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > half + (d < 40 ? 1 : 0)) return;
      this.damage(e, 24 * dm, 'base', (dx / (d || 1)) * 380, (dy / (d || 1)) * 380);
    });
    this.addFx('slash', p.x + fx * reach * 0.45, p.y + fy * reach * 0.45 - 6, (reach * 1.3) / (32 * S), 0.22, facing);
    this.sound.play('slash');
  }

  private jag(pts: number[], x: number, y: number) {
    const px = pts[pts.length - 2];
    const py = pts[pts.length - 1];
    const dx = x - px;
    const dy = y - py;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const steps = Math.max(2, Math.round(len / 26));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const o = rand(-12, 12);
      pts.push(px + dx * t + nx * o, py + dy * t + ny * o);
    }
    pts.push(x, y);
  }

  private explode(x: number, y: number, radius: number, dmg: number, src: DamageSource) {
    this.near(x, y, radius, (e) => {
      const dx = e.x - x;
      const dy = e.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < radius + e.r) this.damage(e, dmg, src, (dx / d) * 320, (dy / d) * 320);
    });
    this.addFx('boom', x, y, (radius * 2.2) / (32 * S), 0.35);
    this.sound.play('pop');
    this.trauma = Math.min(1, this.trauma + 0.05);
  }

  private updateBullets(dt: number) {
    for (const b of this.bullets) {
      b.life -= dt;
      if (b.kind === 'flame') {
        if (!b.target || b.target.dead) b.target = this.nearest(b.x, b.y, 700);
        let a = Math.atan2(b.vy, b.vx);
        if (b.target) {
          let d = Math.atan2(b.target.y - b.y, b.target.x - b.x) - a;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          a += clamp(d, -7 * dt, 7 * dt);
        }
        const s = Math.min(620, Math.hypot(b.vx, b.vy) + 900 * dt);
        b.vx = Math.cos(a) * s;
        b.vy = Math.sin(a) * s;
        if (Math.random() < 0.6) this.bit(b.x, b.y, rand(-20, 20), rand(-20, 20), '255,160,60', 0.3, 2);
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot = b.kind === 'shuriken' ? b.rot + dt * 18 : Math.atan2(b.vy, b.vx);
      if (b.x < 0 || b.y < 0 || b.x > ARENA || b.y > ARENA) b.life = 0;
      if (b.life <= 0) {
        if (b.blast && b.hits.length === 0) this.explode(b.x, b.y, b.blast, b.dmg * 0.8, b.src);
        continue;
      }
      this.near(b.x, b.y, 40, (e) => {
        if (b.life <= 0 || b.hits.includes(e)) return;
        if (Math.hypot(e.x - b.x, e.y - e.alt * 0.5 - b.y) > e.r + 7) return;
        b.hits.push(e);
        if (b.blast) {
          b.life = 0;
          this.explode(b.x, b.y, b.blast, b.dmg, b.src);
          return;
        }
        this.damage(e, b.dmg, b.src, b.vx * 0.14, b.vy * 0.14);
        this.bit(b.x, b.y, -b.vx * 0.2 + rand(-60, 60), -b.vy * 0.2 + rand(-60, 60), WHITE, 0.15, 2);
        this.sound.play('hit');
        if (b.pierce-- <= 0) b.life = 0;
      });
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
  }

  private updateShots(dt: number) {
    const p = this.p;
    for (const s of this.shots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.x < 0 || s.y < 0 || s.x > ARENA || s.y > ARENA) s.life = 0;
      else if (Math.hypot(s.x - p.x, s.y - p.y) < p.r + 6 && p.inv <= 0 && p.dashT <= 0) {
        s.life = 0;
        this.hurt(9, s.x, s.y);
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0);
  }

  private updateWaves(dt: number) {
    const p = this.p;
    for (const w of this.waves) {
      w.r += w.speed * dt;
      if (!w.hit && Math.abs(Math.hypot(p.x - w.x, p.y - w.y) - w.r) < 16) {
        w.hit = true;
        this.hurt(18, w.x, w.y);
      }
    }
    this.waves = this.waves.filter((w) => w.r < w.max);
  }

  // --- pickups ---------------------------------------------------------------------

  private coin(x: number, y: number, value: number) {
    if (this.coins.length >= MAX_COINS) {
      this.coins[Math.floor(Math.random() * this.coins.length)].value += value;
      return;
    }
    const a = rand(0, Math.PI * 2);
    const s = rand(50, 150);
    this.coins.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, value, pull: false, speed: 0, phase: rand(0, 6) });
  }

  private drop(x: number, y: number, kind: DropKind) {
    this.drops.push({ x, y, kind, life: kind === 'chest' ? 60 : 22 });
  }

  private updateCoins(dt: number) {
    const p = this.p;
    const magnet = 140 * (1 + 0.4 * this.lv.magnet);
    const live = this.phase === 'play';
    for (const c of this.coins) {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      if (!c.pull && d < magnet && live) c.pull = true;
      // Coins within a screen or so creep toward you, so kills far away still pay out.
      if (!c.pull && d < 520 && live) {
        c.x += (dx / d) * 170 * dt;
        c.y += (dy / d) * 170 * dt;
      }
      let got = d < p.r + 12;
      if (c.pull) {
        // No momentum: head straight for where you are now, faster every frame (it outruns
        // a dash), and land if this step would reach you. It can't overshoot, so it can't orbit.
        c.speed = Math.min(1400, Math.max(c.speed, 260) + 2600 * dt);
        const step = c.speed * dt;
        if (d <= step + p.r + 12) got = true;
        else {
          c.x += (dx / d) * step;
          c.y += (dy / d) * step;
        }
      } else {
        c.vx *= 1 - Math.min(1, 4 * dt);
        c.vy *= 1 - Math.min(1, 4 * dt);
        c.x += c.vx * dt;
        c.y += c.vy * dt;
      }
      if (got && live) {
        this.xp += c.value;
        c.value = 0;
        this.sound.play('xp');
        this.bit(p.x, p.y - 10, rand(-80, 80), rand(-120, -20), GOLD, 0.3, 2);
      }
    }
    this.coins = this.coins.filter((c) => c.value > 0);
    if (this.xp >= this.next && live) this.levelUp();
  }

  private updateDrops(dt: number) {
    const p = this.p;
    for (const d of this.drops) {
      d.life -= dt;
      if (Math.hypot(d.x - p.x, d.y - p.y) > p.r + 18 || this.phase !== 'play') continue;
      d.life = 0;
      const vw = this.w / this.zoom / 2 + 60;
      const vh = this.h / this.zoom / 2 + 60;
      const onScreen = (e: Enemy) => Math.abs(e.x - p.x) < vw && Math.abs(e.y - p.y) < vh;
      if (d.kind === 'heart') {
        p.hp = Math.min(p.max, p.hp + 30);
        this.number(p.x, p.y - 40, '+30', false, '255,90,130');
        this.sound.play('pickup');
      } else if (d.kind === 'magnet') {
        for (const c of this.coins) c.pull = true;
        this.hooks.onAnnounce('Magnet!', 'info');
        this.sound.play('pickup');
      } else if (d.kind === 'thunder') {
        this.flashWhite = 0.55;
        this.trauma = Math.min(1, this.trauma + 0.6);
        this.sound.play('boom');
        this.sound.play('zap');
        this.since.scroll ??= this.time;
        let shown = 0;
        for (const e of this.enemies) {
          if (!onScreen(e)) continue;
          if (shown++ < 30) {
            const pts = [e.x + rand(-40, 40), e.y - vh];
            this.jag(pts, e.x, e.y - e.alt);
            this.bolts.push({ pts, life: 0.3 });
          }
          this.damage(e, e.def.behavior === 'boss' ? 150 : 300, 'scroll');
        }
        this.hooks.onAnnounce('Thunder!', 'info');
      } else if (d.kind === 'ice') {
        this.flashIce = 0.8;
        this.sound.play('freeze');
        for (const e of this.enemies) if (onScreen(e)) e.frozen = e.def.behavior === 'boss' ? 1.5 : 4;
        this.hooks.onAnnounce('Freeze!', 'info');
      } else {
        // Treasure: a free upgrade, and a shower of coins.
        this.sound.play('chest');
        this.addFx('sparkle', d.x, d.y, 3, 0.5);
        for (let i = 0; i < 16; i++) this.bit(d.x, d.y, rand(-260, 260), rand(-360, -60), GOLD, 0.7, 3);
        p.hp = Math.min(p.max, p.hp + 15);
        const offers = this.roll();
        if (offers.length) {
          this.offers = offers;
          this.phase = 'levelup';
          this.keys.clear();
          this.stick = null;
          this.pushHud();
          this.hooks.onLevelUp(offers, true);
        }
      }
    }
    this.drops = this.drops.filter((d) => d.life > 0);
  }

  private levelUp() {
    this.xp -= this.next;
    this.level++;
    this.next = xpFor(this.level);
    const offers = this.roll();
    this.sound.play('level');
    this.addFx('sparkle', this.p.x, this.p.y - 10, 3, 0.5);
    this.burst(this.p.x, this.p.y, GOLD, 24, 320);
    if (!offers.length) {
      this.p.hp = Math.min(this.p.max, this.p.hp + 30);
      return;
    }
    this.offers = offers;
    this.phase = 'levelup';
    this.keys.clear();
    this.stick = null;
    this.pushHud();
    this.hooks.onLevelUp(offers, false);
  }

  /** Three different upgrades, weighted toward weapons you don't have yet. */
  private roll(): Offer[] {
    const pool = UPGRADES.filter((u) => this.lv[u.id] < u.max);
    const weight = (id: UpgradeId) => (upgrade(id).kind === 'weapon' ? (this.lv[id] ? 1.2 : 1.5) : 1);
    const out: Offer[] = [];
    const take = (id: UpgradeId) => {
      const u = upgrade(id);
      const next = this.lv[id] + 1;
      out.push({ id, name: upgradeName(id, this.H.weapon), kind: u.kind, level: next, desc: u.desc(next, this.H.weapon), isNew: next === 1 });
    };
    const owned = UPGRADES.some((u) => u.kind === 'weapon' && this.lv[u.id] > 0);
    if (!owned) {
      const ws = pool.filter((u) => u.kind === 'weapon');
      if (ws.length) take(ws[Math.floor(Math.random() * ws.length)].id);
    }
    while (out.length < 3) {
      const rest = pool.filter((u) => !out.some((o) => o.id === u.id));
      if (!rest.length) break;
      let sum = 0;
      for (const u of rest) sum += weight(u.id);
      let r = Math.random() * sum;
      let chosen = rest[0];
      for (const u of rest) {
        r -= weight(u.id);
        if (r <= 0) {
          chosen = u;
          break;
        }
      }
      take(chosen.id);
    }
    return out;
  }

  // --- effects -----------------------------------------------------------------------

  private bit(x: number, y: number, vx: number, vy: number, rgb: string, life: number, size: number) {
    if (this.bits.length >= MAX_BITS) this.bits.shift();
    this.bits.push({ x, y, vx, vy, life, max: life, rgb, size });
  }

  private burst(x: number, y: number, rgb: string, n: number, speed: number) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(0.3, 1) * speed;
      this.bit(x, y, Math.cos(a) * s, Math.sin(a) * s, rgb, rand(0.3, 0.6), Math.random() < 0.3 ? 3 : 2);
    }
  }

  private dust(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) this.bit(x + rand(-10, 10), y, rand(-60, 60), rand(-50, -10), '214,196,160', rand(0.25, 0.45), 2);
  }

  private addFx(key: SheetKey, x: number, y: number, scale: number, dur: number, rot = 0) {
    if (this.fx.length > 120) this.fx.shift();
    this.fx.push({ key, x, y, t: 0, dur, scale, rot });
  }

  private number(x: number, y: number, text: string, crit: boolean, rgb = crit ? '255,214,64' : '255,255,255') {
    if (this.nums.length >= MAX_NUMBERS) this.nums.shift();
    this.nums.push({ x, y, vy: crit ? -110 : -80, text, life: crit ? 0.8 : 0.55, crit, rgb });
  }

  private stepFx(dt: number) {
    if (dt <= 0) return;
    for (const b of this.bits) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const k = 1 - Math.min(1, 4 * dt);
      b.vx *= k;
      b.vy *= k;
      b.life -= dt;
    }
    this.bits = this.bits.filter((b) => b.life > 0);
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < f.dur);
    for (const n of this.nums) {
      n.y += n.vy * dt;
      n.vy *= 1 - Math.min(1, 5 * dt);
      n.life -= dt;
    }
    this.nums = this.nums.filter((n) => n.life > 0);
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter((b) => b.life > 0);
    for (const g of this.ghosts) g.life -= dt;
    this.ghosts = this.ghosts.filter((g) => g.life > 0);
    for (const d of this.decals) d.life -= dt;
    this.decals = this.decals.filter((d) => d.life > 0);
  }

  // --- drawing -----------------------------------------------------------------------

  private sheet(key: SheetKey, variant: 'img' | 'white' | 'gold' | 'ice' = 'img'): CanvasImageSource {
    const s = this.assets.sheets[key];
    return variant === 'img' ? s.img : s[variant];
  }

  /** Draw one frame centred on (x, y). sx/sy squash and stretch; rot rotates. */
  private frameAt(key: SheetKey, col: number, row: number, x: number, y: number, scale: number, variant: 'img' | 'white' | 'gold' | 'ice' = 'img', sx = 1, sy = 1, rot = 0, fw = 16, fh = 16) {
    const { ctx } = this;
    const w = fw * S * scale * sx;
    const h = fh * S * scale * sy;
    if (rot) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.drawImage(this.sheet(key, variant), col * fw, row * fh, fw, fh, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else ctx.drawImage(this.sheet(key, variant), col * fw, row * fh, fw, fh, x - w / 2, y - h / 2, w, h);
  }

  private draw() {
    const { ctx, w, h, dpr } = this;
    const z = this.zoom;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1f4a2a';
    ctx.fillRect(0, 0, w, h);

    const shake = this.reduce ? 0 : this.trauma * this.trauma * 16;
    const sx = shake ? (Math.random() * 2 - 1) * shake : 0;
    const sy = shake ? (Math.random() * 2 - 1) * shake : 0;
    // Snap the camera to whole device pixels so the pixel art doesn't shimmer.
    const ox = Math.round((w / 2 + sx - this.cx * z) * dpr);
    const oy = Math.round((h / 2 + sy - this.cy * z) * dpr);
    ctx.setTransform(z * dpr, 0, 0, z * dpr, ox, oy);
    const vx0 = this.cx - w / 2 / z - 100;
    const vy0 = this.cy - h / 2 / z - 100;
    const vx1 = this.cx + w / 2 / z + 100;
    const vy1 = this.cy + h / 2 / z + 100;
    const seen = (x: number, y: number) => x > vx0 && x < vx1 && y > vy0 && y < vy1;

    if (this.ground) ctx.drawImage(this.ground, 0, 0, ARENA, ARENA);
    // Hedge round the edge.
    ctx.strokeStyle = '#173d22';
    ctx.lineWidth = 36;
    ctx.strokeRect(-18, -18, ARENA + 36, ARENA + 36);
    ctx.strokeStyle = '#2f6b33';
    ctx.lineWidth = 6;
    ctx.strokeRect(-3, -3, ARENA + 6, ARENA + 6);

    const inRun = this.phase !== 'title' && this.phase !== 'over';

    // Ground layer: scorch marks, the aura, shockwaves, coins and pickups.
    for (const d of this.decals) {
      if (!seen(d.x, d.y)) continue;
      ctx.globalAlpha = Math.min(1, d.life / 3) * 0.28;
      ctx.fillStyle = `rgb(${d.rgb})`;
      for (let i = 0; i < 5; i++) {
        const a = d.seed + i * 2.1;
        ctx.fillRect(Math.round(d.x + Math.cos(a) * (6 + i * 3)), Math.round(d.y + Math.sin(a) * (4 + i * 2)), S * 2, S * 2);
      }
    }
    ctx.globalAlpha = 1;
    if (inRun && this.lv.aura && this.phase !== 'dying') {
      const R = this.auraR();
      ctx.fillStyle = rgba('150,255,120', 0.1 + 0.04 * Math.sin(this.clock * 4));
      ctx.beginPath();
      ctx.arc(this.p.x, this.p.y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba('200,255,170', 0.8);
      for (let i = 0; i < 10; i++) {
        const a = this.clock * 1.4 + (i / 10) * Math.PI * 2;
        ctx.fillRect(Math.round(this.p.x + Math.cos(a) * R), Math.round(this.p.y + Math.sin(a) * R), S * 2, S * 2);
      }
    }
    for (const wv of this.waves) {
      ctx.strokeStyle = rgba('255,236,200', 0.85);
      ctx.lineWidth = S * 3;
      ctx.setLineDash([S * 4, S * 3]);
      ctx.beginPath();
      ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const c of this.coins) {
      if (!seen(c.x, c.y)) continue;
      const spin = Math.max(0.2, Math.abs(Math.cos(this.clock * 6 + c.phase)));
      const gold = c.value >= 5;
      this.frameAt(gold ? 'coinGold' : 'coinSilver', 0, 0, c.x, c.y - 4 + Math.sin(this.clock * 5 + c.phase) * 2, gold ? 1.5 : 1.45, 'img', spin, 1, 0, gold ? 7 : 6, gold ? 7 : 6);
    }
    for (const d of this.drops) {
      if (!seen(d.x, d.y) || (d.life < 3 && Math.floor(this.clock * 8) % 2)) continue;
      const bob = Math.sin(this.clock * 4 + d.x) * 4;
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + 16, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      const pulse = 1 + 0.08 * Math.sin(this.clock * 8);
      if (d.kind === 'chest') {
        // Golden glint so it reads as treasure from across the screen.
        this.frameAt('chest', 0, 0, d.x, d.y + bob - 4, 1.4, 'gold', pulse * 1.12, pulse * 1.12);
        this.frameAt('chest', 0, 0, d.x, d.y + bob - 4, 1.4);
      } else if (d.kind === 'heart') this.frameAt('heart', 0, 0, d.x, d.y + bob, 1.8 * pulse, 'img', 1, 1, 0, 9, 8);
      else if (d.kind === 'thunder') this.frameAt('scrollThunder', 0, 0, d.x, d.y + bob, pulse);
      else if (d.kind === 'ice') this.frameAt('scrollIce', 0, 0, d.x, d.y + bob, pulse);
      else if (this.assets.magnet) ctx.drawImage(this.assets.magnet, d.x - 12 * pulse, d.y + bob - 12 * pulse, 24 * pulse, 24 * pulse);
    }

    // Shadows, then everything with height sorted by where it stands.
    ctx.fillStyle = 'rgba(20,40,10,0.28)';
    ctx.beginPath();
    for (const e of this.enemies) {
      if (!seen(e.x, e.y)) continue;
      const sw = 16 * S * e.scale * 0.34 * (e.alt > 4 ? 0.75 : 1);
      ctx.moveTo(e.x + sw, e.y + e.r * 0.75);
      ctx.ellipse(e.x, e.y + e.r * 0.75, sw, sw * 0.35, 0, 0, Math.PI * 2);
    }
    if (inRun && this.phase !== 'dying') {
      ctx.moveTo(this.p.x + 15, this.p.y + 18);
      ctx.ellipse(this.p.x, this.p.y + 18, 15, 5, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    type Item = { y: number; e?: Enemy; o?: Obstacle };
    const items: Item[] = [];
    for (const o of this.obstacles) if (seen(o.x, o.y)) items.push({ y: o.y, o });
    for (const e of this.enemies) if (seen(e.x, e.y)) items.push({ y: e.y, e });
    if (inRun && this.phase !== 'dying') items.push({ y: this.p.y });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) {
      if (it.o) this.drawObstacle(it.o);
      else if (it.e) this.drawEnemy(it.e);
      else this.drawPlayer();
    }

    // Projectiles and weapon sprites.
    if (inRun && this.lv.orbit && this.phase !== 'dying') {
      const n = 1 + this.lv.orbit;
      const R = 78 + this.lv.orbit * 5;
      for (let i = 0; i < n; i++) {
        const a = this.orbitA + (i / n) * Math.PI * 2;
        this.frameAt('kunai', 0, 0, this.p.x + Math.cos(a) * R, this.p.y + Math.sin(a) * R - 8, 1.1, 'img', 1, 1, a + Math.PI / 2, 14, 5);
      }
    }
    for (const b of this.bullets) {
      if (b.kind === 'shuriken') this.frameAt('shuriken', 0, 0, b.x, b.y, 0.95, 'img', 1, 1, b.rot, 13, 13);
      // The fireball sprite faces right (flame ahead, tail behind), so it rotates by its heading as is.
      else this.frameAt('fireball', 0, 0, b.x, b.y, b.kind === 'flame' ? 1.1 : 1.4, 'img', 1, 1, b.rot, 13, 9);
    }
    for (const s of this.shots) {
      if (!seen(s.x, s.y)) continue;
      this.frameAt('fireball', 0, 0, s.x, s.y, 1.2, 'img', 1, 1, Math.atan2(s.vy, s.vx), 13, 9);
    }

    // Effects: 5-frame animations from the pack.
    for (const f of this.fx) {
      if (!seen(f.x, f.y)) continue;
      const frame = Math.min(4, Math.floor((f.t / f.dur) * 5));
      this.frameAt(f.key, frame, 0, f.x, f.y, f.scale, 'img', 1, 1, f.rot, 32, 32);
    }
    for (const b of this.bits) {
      if (!seen(b.x, b.y)) continue;
      ctx.globalAlpha = Math.min(1, (b.life / b.max) * 1.6);
      ctx.fillStyle = `rgb(${b.rgb})`;
      const s = b.size * S * 0.8;
      ctx.fillRect(Math.round(b.x - s / 2), Math.round(b.y - s / 2), s, s);
    }
    ctx.globalAlpha = 1;
    for (const b of this.bolts) {
      const a = Math.min(1, b.life / 0.15);
      for (const [lw, col] of [
        [9, `rgba(255,236,120,${a * 0.6})`],
        [3, `rgba(255,255,255,${a})`],
      ] as const) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(b.pts[0], b.pts[1]);
        for (let i = 2; i < b.pts.length; i += 2) ctx.lineTo(b.pts[i], b.pts[i + 1]);
        ctx.stroke();
      }
    }

    // Damage numbers, in the pixel font with a dark outline.
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    for (const n of this.nums) {
      const size = (n.crit ? 16 : 11) / z;
      ctx.font = `${size}px ${FONT}`;
      ctx.globalAlpha = Math.min(1, n.life * 4);
      ctx.lineWidth = 4 / z;
      ctx.strokeStyle = '#1b0f08';
      ctx.strokeText(n.text, n.x, n.y);
      ctx.fillStyle = `rgb(${n.rgb})`;
      ctx.fillText(n.text, n.x, n.y);
    }
    ctx.globalAlpha = 1;

    // Screen space.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.flashRed > 0) {
      ctx.fillStyle = rgba('255,40,40', this.flashRed * (this.reduce ? 0.15 : 0.3));
      ctx.fillRect(0, 0, w, h);
    }
    if (this.flashWhite > 0) {
      ctx.fillStyle = rgba(WHITE, this.flashWhite * (this.reduce ? 0.3 : 0.7));
      ctx.fillRect(0, 0, w, h);
    }
    if (this.flashIce > 0) {
      ctx.fillStyle = rgba('140,220,255', this.flashIce * 0.35);
      ctx.fillRect(0, 0, w, h);
    }
    if (this.boss && inRun) this.drawPointer(this.boss.x, this.boss.y);
    if (this.stick && this.phase === 'play') this.drawStick();
  }

  private drawObstacle(o: Obstacle) {
    const r = o.kind === 'bush' ? TILES.bush : TILES.rock;
    const size = 32 * S;
    // The collision circle sits at the base; the sprite rises above it.
    this.ctx.drawImage(this.sheet('tileset'), r[0], r[1], r[2], r[3], o.x - size / 2, o.y - size + o.r * 0.9, size, size);
  }

  private drawEnemy(e: Enemy) {
    const { ctx } = this;
    const d = e.def;
    const grow = e.born < 0.3 ? easeOutBack(clamp(e.born / 0.3, 0, 1)) : 1;
    if (grow <= 0.05) return;
    let scale = e.scale * grow;
    let sx = 1;
    let sy = 1;
    let x = e.x;
    const y = e.y - e.alt - e.r * 0.25;
    // Squash and stretch: slimes crouch before a hop and stretch in the air.
    if (d.behavior === 'hop') {
      if (e.state === 0 && e.t < 0.25) {
        sx = 1.18;
        sy = 0.82;
      } else if (e.state === 1) {
        sx = 0.88;
        sy = 1.14;
      }
    }
    const tell = ((d.behavior === 'charge' || d.behavior === 'swoop') && e.state === 1) || (e.kind === 'beast' && e.state === 1);
    if (tell) x += Math.sin(this.clock * 60) * 2;
    const frame = Math.floor(e.anim) % 4;
    const col = e.dir;
    const blink = Math.floor(this.clock * 16) % 2 === 1;
    const aiming = d.behavior === 'kite' && e.t < 0.45 && e.frozen <= 0;
    if (aiming) scale *= 1 + (0.45 - e.t) * 0.3;
    // Tells blink fully white; ordinary hits blend a flash over the sprite so it stays readable
    // (a boss under constant fire would otherwise be a white block).
    const variant = (tell || aiming) && blink ? 'white' : 'img';
    ctx.globalAlpha = e.alpha;
    if (e.elite) {
      // Gold outline: the silhouette nudged one pixel each way behind the sprite.
      const o = S * scale;
      for (const [ox, oy] of [
        [o, 0],
        [-o, 0],
        [0, o],
        [0, -o],
      ])
        this.frameAt(d.sprite, col, frame, x + ox, y + oy, scale, 'gold', sx, sy);
    }
    this.frameAt(d.sprite, col, frame, x, y, scale, variant, sx, sy);
    if (e.flash > 0 && variant === 'img') {
      ctx.globalAlpha = e.alpha * 0.6;
      this.frameAt(d.sprite, col, frame, x, y, scale, 'white', sx, sy);
      ctx.globalAlpha = e.alpha;
    }
    if (e.frozen > 0) {
      ctx.globalAlpha = 0.55;
      this.frameAt(d.sprite, col, frame, x, y, scale, 'ice', sx, sy);
    }
    ctx.globalAlpha = 1;
    // Tells over the head: "!" before a charge, stars when stunned.
    const top = y - 8 * S * scale - 6;
    if (tell) this.shout('!', x, top, '255,64,48');
    if (d.behavior === 'charge' && e.state === 3)
      for (let i = 0; i < 3; i++) {
        const a = this.clock * 6 + (i / 3) * Math.PI * 2;
        ctx.fillStyle = '#ffe14a';
        ctx.fillRect(Math.round(x + Math.cos(a) * 16 - 3), Math.round(top + 8 + Math.sin(a) * 5 - 3), 6, 6);
      }
    if (e.elite || d.behavior === 'boss') {
      const bw = 16 * S * scale * 0.7;
      ctx.fillStyle = '#1b0f08';
      ctx.fillRect(x - bw / 2 - 2, top - 4, bw + 4, 8);
      ctx.fillStyle = d.behavior === 'boss' ? '#e83a3a' : '#ffd23f';
      ctx.fillRect(x - bw / 2, top - 2, bw * clamp(e.hp / e.max, 0, 1), 4);
    }
  }

  private shout(text: string, x: number, y: number, rgb: string) {
    const { ctx } = this;
    const z = this.zoom;
    ctx.font = `${14 / z}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4 / z;
    ctx.strokeStyle = '#1b0f08';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = `rgb(${rgb})`;
    ctx.fillText(text, x, y);
  }

  private drawPlayer() {
    const p = this.p;
    const key = this.heroId as SheetKey;
    const dir = this.dirOf(p.dx, p.dy);
    const moving = Math.hypot(p.vx, p.vy) > 30;
    const frame = moving ? Math.floor(p.anim) % 4 : 0;
    for (const g of this.ghosts) {
      this.ctx.globalAlpha = (g.life / 0.25) * 0.5;
      this.frameAt(key, g.dir, 0, g.x, g.y - 6, 1, 'ice');
    }
    this.ctx.globalAlpha = 1;
    if (p.blink > 0 && Math.floor(this.clock * 22) % 2) return;
    this.frameAt(key, dir, frame, p.x, p.y - 6, 1, p.blink > 0.6 ? 'white' : 'img');
  }

  private drawPointer(x: number, y: number) {
    const { ctx, w, h } = this;
    const sx = (x - this.cx) * this.zoom + w / 2;
    const sy = (y - this.cy) * this.zoom + h / 2;
    const pad = 40;
    if (sx > pad && sx < w - pad && sy > pad && sy < h - pad) return;
    const a = Math.atan2(sy - h / 2, sx - w / 2);
    const ex = clamp(w / 2 + Math.cos(a) * w, pad, w - pad);
    const ey = clamp(h / 2 + Math.sin(a) * h, pad + 60, h - pad);
    ctx.save();
    ctx.translate(Math.round(ex), Math.round(ey));
    ctx.rotate(a);
    ctx.fillStyle = '#1b0f08';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -14);
    ctx.lineTo(-10, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = Math.floor(this.clock * 6) % 2 ? '#ff4a3a' : '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -9);
    ctx.lineTo(-6, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawStick() {
    const { ctx } = this;
    const s = this.stick!;
    const dx = s.x - s.ox;
    const dy = s.y - s.oy;
    const m = Math.hypot(dx, dy);
    const k = m > 45 ? 45 / m : 1;
    ctx.fillStyle = 'rgba(27,15,8,0.25)';
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.ox, s.oy, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(s.ox + dx * k, s.oy + dy * k, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}
