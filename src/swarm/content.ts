import type { SheetKey } from './assets';

// What's in the game: heroes, the monsters you fight (each moves in its own way), and the
// upgrades you pick between. Colours are "r,g,b" strings for particles.

export type HeroId = 'hiro' | 'knight' | 'mira';
export type BaseWeapon = 'shuriken' | 'slash' | 'fireball';

export interface HeroDef {
  id: HeroId;
  name: string;
  title: string;
  hp: number;
  speed: number;
  /** Flat damage taken off every hit. */
  armor: number;
  weapon: BaseWeapon;
  weaponName: string;
  blurb: string;
}

export const HEROES: HeroDef[] = [
  { id: 'hiro', name: 'Hiro', title: 'The quick one', hp: 100, speed: 265, armor: 0, weapon: 'shuriken', weaponName: 'Shuriken', blurb: 'Throws shuriken at the nearest monster. Fast on his feet.' },
  { id: 'knight', name: 'Sir Brick', title: 'The wall', hp: 150, speed: 225, armor: 2, weapon: 'slash', weaponName: 'Big sword', blurb: 'Swings a huge sword the way he faces. Tough, but slow.' },
  { id: 'mira', name: 'Mira', title: 'The spark', hp: 85, speed: 250, armor: 0, weapon: 'fireball', weaponName: 'Fireball', blurb: 'Hurls fireballs that explode on impact. Fragile, hits hard.' },
];

export const hero = (id: HeroId) => HEROES.find((h) => h.id === id) ?? HEROES[0];

/**
 * How a monster moves.
 * flank: fans out and closes in from its own angle, so a pack surrounds you instead of queueing.
 * hop: waits, then leaps at where you're going.  flock: boids that sweep past you in a swarm.
 * swoop: circles you, telegraphs, then dives through.  charge: winds up and bulldozes in a line.
 * phase: weaves in a wave and drifts through everything.  kite: keeps its distance and shoots.
 * rush: small and fast, straight at you.  spiral: orbits in a tightening spiral, then lunges.
 */
export type Behavior = 'flank' | 'hop' | 'flock' | 'swoop' | 'charge' | 'phase' | 'kite' | 'rush' | 'spiral' | 'boss';

export type EnemyKind = 'grunt' | 'slime' | 'bee' | 'bat' | 'bear' | 'ghost' | 'eye' | 'bush' | 'sprout' | 'wisp' | 'beast' | 'dragon' | 'skull';

export interface EnemyDef {
  name: string;
  sprite: SheetKey;
  hp: number;
  speed: number;
  /** Collision radius in world units. */
  r: number;
  /** Sprite size multiplier (1 = 48 units). */
  scale: number;
  dmg: number;
  xp: number;
  mass: number;
  score: number;
  flying: boolean;
  behavior: Behavior;
  rgb: string;
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  grunt: { name: 'Imp', sprite: 'grunt', hp: 14, speed: 96, r: 17, scale: 1, dmg: 10, xp: 1, mass: 1, score: 10, flying: false, behavior: 'flank', rgb: '232,84,70' },
  slime: { name: 'Slime', sprite: 'slime', hp: 18, speed: 300, r: 17, scale: 1, dmg: 10, xp: 1, mass: 1.2, score: 10, flying: false, behavior: 'hop', rgb: '86,206,214' },
  bee: { name: 'Hornet', sprite: 'bee', hp: 6, speed: 185, r: 13, scale: 0.8, dmg: 6, xp: 1, mass: 0.5, score: 5, flying: true, behavior: 'flock', rgb: '246,170,44' },
  bat: { name: 'Firebird', sprite: 'bat', hp: 16, speed: 170, r: 16, scale: 1, dmg: 11, xp: 2, mass: 0.8, score: 20, flying: true, behavior: 'swoop', rgb: '232,72,60' },
  bear: { name: 'Bruiser', sprite: 'bear', hp: 120, speed: 58, r: 24, scale: 1.35, dmg: 22, xp: 5, mass: 5, score: 60, flying: false, behavior: 'charge', rgb: '168,86,52' },
  ghost: { name: 'Wisp ghost', sprite: 'ghost', hp: 24, speed: 108, r: 17, scale: 1, dmg: 12, xp: 2, mass: 0.8, score: 20, flying: true, behavior: 'phase', rgb: '206,255,244' },
  eye: { name: 'Watcher', sprite: 'eye', hp: 28, speed: 95, r: 17, scale: 1, dmg: 10, xp: 3, mass: 1, score: 30, flying: false, behavior: 'kite', rgb: '96,214,196' },
  bush: { name: 'Shrubling', sprite: 'bush', hp: 64, speed: 46, r: 22, scale: 1.25, dmg: 14, xp: 3, mass: 3, score: 30, flying: false, behavior: 'flank', rgb: '130,196,64' },
  sprout: { name: 'Sprout', sprite: 'sprout', hp: 6, speed: 158, r: 12, scale: 0.75, dmg: 6, xp: 1, mass: 0.5, score: 5, flying: false, behavior: 'rush', rgb: '176,124,72' },
  wisp: { name: 'Fire imp', sprite: 'wisp', hp: 22, speed: 230, r: 16, scale: 1, dmg: 12, xp: 2, mass: 0.8, score: 25, flying: true, behavior: 'spiral', rgb: '255,112,40' },
  beast: { name: 'Stone Beast', sprite: 'bear', hp: 1600, speed: 64, r: 60, scale: 4, dmg: 30, xp: 60, mass: 80, score: 3000, flying: false, behavior: 'boss', rgb: '168,86,52' },
  dragon: { name: 'Frost Drake', sprite: 'dragon', hp: 2200, speed: 70, r: 60, scale: 4, dmg: 30, xp: 80, mass: 80, score: 4000, flying: false, behavior: 'boss', rgb: '96,176,230' },
  skull: { name: 'Skull King', sprite: 'skull', hp: 2800, speed: 60, r: 60, scale: 4, dmg: 34, xp: 100, mass: 80, score: 5000, flying: true, behavior: 'boss', rgb: '234,56,64' },
};

export const BOSSES: EnemyKind[] = ['beast', 'dragon', 'skull'];

export type UpgradeId =
  | 'orbit'
  | 'nova'
  | 'chain'
  | 'missiles'
  | 'aura'
  | 'multishot'
  | 'pierce'
  | 'damage'
  | 'firerate'
  | 'crit'
  | 'speed'
  | 'magnet'
  | 'vitality'
  | 'regen'
  | 'dash';

export interface UpgradeDef {
  id: UpgradeId;
  name: string | ((w: BaseWeapon) => string);
  kind: 'weapon' | 'power';
  max: number;
  /** What taking the given level does, for this hero's weapon. */
  desc: (level: number, w: BaseWeapon) => string;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'orbit', name: 'Kunai ring', kind: 'weapon', max: 5, desc: (l) => (l === 1 ? 'Two kunai spin around you and cut anything they touch.' : '+1 kunai, +20% damage.') },
  { id: 'nova', name: 'Shockwave', kind: 'weapon', max: 5, desc: (l) => (l === 1 ? 'Every few seconds, a blast hurls nearby monsters away.' : 'Bigger, harder, more often.') },
  { id: 'chain', name: 'Chain lightning', kind: 'weapon', max: 5, desc: (l) => (l === 1 ? 'Lightning hits a monster and jumps to 3 more.' : '+1 jump, +20% damage, strikes sooner.') },
  { id: 'missiles', name: 'Homing flames', kind: 'weapon', max: 5, desc: (l) => (l === 1 ? 'Flames that hunt down monsters and burst.' : 'More flames, bigger bursts.') },
  { id: 'aura', name: 'Thorn aura', kind: 'weapon', max: 5, desc: (l) => (l === 1 ? 'Everything close to you is hurt and slowed.' : 'Wider and stronger.') },
  {
    id: 'multishot',
    name: (w) => (w === 'slash' ? 'Wide swing' : w === 'fireball' ? 'Twin flame' : 'Split throw'),
    kind: 'power',
    max: 4,
    desc: (l, w) => (w === 'slash' ? (l === 1 ? 'Your sword also swings behind you.' : 'Your swing sweeps 20% wider.') : w === 'fireball' ? '+1 fireball per cast.' : '+1 shuriken per throw.'),
  },
  {
    id: 'pierce',
    name: (w) => (w === 'slash' ? 'Longsword' : w === 'fireball' ? 'Big bang' : 'Piercing star'),
    kind: 'power',
    max: 3,
    desc: (_l, w) => (w === 'slash' ? 'Your sword reaches 20% further.' : w === 'fireball' ? 'Fireball blasts are 30% bigger.' : 'Shuriken pass through +1 more monster.'),
  },
  { id: 'damage', name: 'Power up', kind: 'power', max: 5, desc: () => '+20% damage from everything.' },
  { id: 'firerate', name: 'Quick hands', kind: 'power', max: 5, desc: () => 'All weapons recharge 12% faster.' },
  { id: 'crit', name: 'Lucky strikes', kind: 'power', max: 4, desc: () => '+8% chance to crit for double damage.' },
  { id: 'speed', name: 'Swift boots', kind: 'power', max: 4, desc: () => 'Move 10% faster.' },
  { id: 'magnet', name: 'Coin magnet', kind: 'power', max: 4, desc: () => 'Pull in coins from 40% further away.' },
  { id: 'vitality', name: 'Big heart', kind: 'power', max: 5, desc: () => '+25 max health, and heal 25.' },
  { id: 'regen', name: 'Herbal tea', kind: 'power', max: 4, desc: () => 'Regenerate 1 health every second.' },
  { id: 'dash', name: 'Feather dash', kind: 'power', max: 3, desc: () => 'Dash recharges 25% faster.' },
];

export const upgrade = (id: UpgradeId) => UPGRADES.find((u) => u.id === id)!;
export const upgradeName = (id: UpgradeId, w: BaseWeapon) => {
  const n = upgrade(id).name;
  return typeof n === 'string' ? n : n(w);
};

/** XP needed to go from this level to the next. The first level-up comes within seconds. */
export const xpFor = (level: number) => Math.round(3 + level * 3 + Math.pow(level, 1.55));
