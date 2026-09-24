import type { BaseWeapon, UpgradeId } from './content';
import type { DamageSource } from './engine';

// Pixel icons for upgrades and weapons. Most are the pack's own item sprites; the few it
// doesn't have (lightning bolt, hourglass, winged boot, feather, magnet) are drawn here as
// pixel maps in the same dark-outlined style. D is the outline colour in every map.

export interface PixelMap {
  rows: string[];
  palette: Record<string, string>;
}

const D = '#1b0f08';

export const PIXEL = {
  bolt: {
    rows: [
      '......DDDD..',
      '.....DWYYD..',
      '....DWYYD...',
      '...DWYYD....',
      '..DWYYDDDD..',
      '.DWYYYYYYD..',
      '.DDDDDYYOD..',
      '....DYYOD...',
      '...DYYOD....',
      '..DYYOD.....',
      '..DYOD......',
      '.DYOD.......',
      '.DOD........',
      '.DD.........',
    ],
    palette: { D, W: '#fffbe0', Y: '#ffd23f', O: '#f08a24' },
  },
  hourglass: {
    rows: [
      'DDDDDDDDDD',
      'DGGGGGGGGD',
      '.DWSSSSWD.',
      '.DWSSSSWD.',
      '..DWSSWD..',
      '...DWSD...',
      '....DD....',
      '...DWWD...',
      '..DWWSWD..',
      '.DWWSSSWD.',
      '.DSSSSSSD.',
      'DGGGGGGGGD',
      'DDDDDDDDDD',
    ],
    palette: { D, G: '#e8a33a', W: '#dff6ff', S: '#ffd23f' },
  },
  boot: {
    rows: [
      '.WW.........',
      'WWGW........',
      '.WWGW.DDDD..',
      '..WGWDBBBD..',
      '....DBLBBD..',
      '....DBLBBD..',
      '....DBLBBD..',
      '....DBLBBBD.',
      '...DBLBBBBBD',
      '...DBBBBBBBD',
      '...DDDDDDDDD',
    ],
    palette: { D, W: '#ffffff', G: '#b9c6d6', B: '#9a5a2e', L: '#c98a4b' },
  },
  feather: {
    rows: [
      '........DD',
      '.......DWD',
      '......DWBD',
      '.....DWBBD',
      '....DWBBD.',
      '...DWBBD..',
      '..DWBBD...',
      '..DWBD....',
      '.DWBD.....',
      '.DBD......',
      '.DGD......',
      'DGD.......',
      'DD........',
    ],
    palette: { D, W: '#ffffff', B: '#9fd8ff', G: '#7a8aa0' },
  },
  magnet: {
    rows: ['.DDDDDD.', 'DRRRRRRD', 'DRRDDRRD', 'DRD..DRD', 'DRD..DRD', 'DWD..DWD', 'DWD..DWD', '.D....D.'],
    palette: { D: '#2a0f10', R: '#e8413b', W: '#f4f4f4' },
  },
} satisfies Record<string, PixelMap>;

export type PixelName = keyof typeof PIXEL;

/** One canvas pixel per map character. */
export const pixelCanvas = (m: PixelMap) => {
  const c = document.createElement('canvas');
  c.width = Math.max(...m.rows.map((r) => r.length));
  c.height = m.rows.length;
  const g = c.getContext('2d')!;
  m.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const col = m.palette[ch];
      if (col) {
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }),
  );
  return c;
};

const urls = new Map<PixelName, string>();
const pixelUrl = (name: PixelName) => {
  let u = urls.get(name);
  if (!u) {
    u = pixelCanvas(PIXEL[name]).toDataURL('image/png');
    urls.set(name, u);
  }
  return u;
};

/** An image (or a frame of a sheet) and its size in source pixels. */
export interface Icon {
  src: string;
  w: number;
  h: number;
  /** For sprite sheets: the frame to show and the sheet's full size. */
  frame?: { x: number; sheetW: number; sheetH: number };
}

const file = (path: string, w: number, h: number): Icon => ({ src: `/swarm/${path}`, w, h });
const drawn = (name: PixelName): Icon => ({ src: pixelUrl(name), w: Math.max(...PIXEL[name].rows.map((r) => r.length)), h: PIXEL[name].rows.length });

const BASE: Record<BaseWeapon, () => Icon> = {
  shuriken: () => file('icons/shuriken.png', 16, 16),
  slash: () => file('icons/sword.png', 6, 11),
  fireball: () => file('items/fireball.png', 13, 9),
};

export const upgradeIcon = (id: UpgradeId, w: BaseWeapon): Icon => {
  switch (id) {
    case 'orbit':
      return file('icons/kunai.png', 16, 16);
    case 'nova':
      return file('icons/scroll-rock.png', 16, 16);
    case 'chain':
      return drawn('bolt');
    case 'missiles':
      return file('icons/scroll-fire.png', 16, 16);
    case 'aura':
      return file('icons/scroll-plant.png', 16, 16);
    case 'multishot':
      return BASE[w]();
    case 'pierce':
      if (w === 'shuriken') return file('icons/arrow.png', 13, 5);
      if (w === 'slash') return file('icons/lance.png', 6, 16);
      // "Big bang": the fire-burst frame of the pack's explosion.
      return { src: '/swarm/fx/boom.png', w: 32, h: 32, frame: { x: 32, sheetW: 160, sheetH: 32 } };
    case 'damage':
      return file('icons/beaf.png', 16, 16);
    case 'firerate':
      return drawn('hourglass');
    case 'crit':
      return file('icons/fortune-cookie.png', 16, 16);
    case 'speed':
      return drawn('boot');
    case 'magnet':
      return drawn('magnet');
    case 'vitality':
      return file('items/heart.png', 9, 8);
    case 'regen':
      return file('icons/tea-leaf.png', 16, 16);
    case 'dash':
      return drawn('feather');
  }
};

export const sourceIcon = (k: DamageSource, w: BaseWeapon): Icon => {
  switch (k) {
    case 'base':
      return BASE[w]();
    case 'scroll':
      return file('items/scroll-thunder.png', 16, 16);
    default:
      return upgradeIcon(k, w);
  }
};
