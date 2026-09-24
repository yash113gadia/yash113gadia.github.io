import { PIXEL, pixelCanvas } from './icons';

// Art is the CC0 "Ninja Adventure" pack by Pixel-boy (see public/swarm/CREDITS.md).
// Every sheet is loaded once, with white, gold and ice-blue silhouettes pre-made for hit
// flashes, elite outlines and frozen enemies.

const BASE = '/swarm/';

/** World units per sprite pixel: a 16px sprite is 48 units across. */
export const S = 3;

const FILES = {
  hiro: 'heroes/hiro.png',
  knight: 'heroes/knight.png',
  mira: 'heroes/mira.png',
  grunt: 'monsters/grunt.png',
  slime: 'monsters/slime.png',
  bee: 'monsters/bee.png',
  bat: 'monsters/bat.png',
  bear: 'monsters/bear.png',
  ghost: 'monsters/ghost.png',
  eye: 'monsters/eye.png',
  bush: 'monsters/bush.png',
  sprout: 'monsters/sprout.png',
  wisp: 'monsters/wisp.png',
  dragon: 'monsters/dragon.png',
  skull: 'monsters/skull.png',
  poof: 'fx/poof.png',
  impact: 'fx/impact.png',
  boom: 'fx/boom.png',
  slash: 'fx/slash.png',
  ring: 'fx/ring.png',
  sparkle: 'fx/sparkle.png',
  zap: 'fx/zap.png',
  coinGold: 'items/coin-gold.png',
  coinSilver: 'items/coin-silver.png',
  heart: 'items/heart.png',
  fireball: 'items/fireball.png',
  shuriken: 'items/shuriken.png',
  kunai: 'items/kunai.png',
  chest: 'items/chest.png',
  scrollThunder: 'items/scroll-thunder.png',
  scrollIce: 'items/scroll-ice.png',
  tileset: 'tileset.png',
} as const;

export type SheetKey = keyof typeof FILES;

export interface Sheet {
  img: HTMLImageElement;
  white: HTMLCanvasElement;
  gold: HTMLCanvasElement;
  ice: HTMLCanvasElement;
}

const tint = (img: CanvasImageSource & { width: number; height: number }, colour: string) => {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = colour;
  g.fillRect(0, 0, c.width, c.height);
  return c;
};

export class Assets {
  sheets = {} as Record<SheetKey, Sheet>;
  magnet: HTMLCanvasElement | null = null;
  ready = false;
  private loading: Promise<void> | null = null;

  load() {
    if (!this.loading)
      this.loading = Promise.all(
        (Object.keys(FILES) as SheetKey[]).map(async (k) => {
          const img = new Image();
          img.src = BASE + FILES[k];
          await img.decode();
          this.sheets[k] = { img, white: tint(img, '#ffffff'), gold: tint(img, '#ffd23f'), ice: tint(img, '#8fe6ff') };
        }),
      ).then(() => {
        // The pack has no magnet, so it's one of our own pixel maps.
        this.magnet = pixelCanvas(PIXEL.magnet);
        this.ready = true;
      });
    return this.loading;
  }
}

/** Source rects in the tileset (pixels). */
export const TILES = {
  grass: [352, 176],
  grassPlain: [224, 256],
  grassFlecks: [208, 256],
  grassFlowers: [256, 256],
  bush: [0, 160, 32, 32],
  rock: [192, 160, 32, 32],
  leafy: [208, 144, 16, 16],
  clover: [0, 96, 16, 16],
  tuft: [0, 80, 16, 16],
  tallGrass: [160, 256, 16, 16],
} as const;
