import { landmark, roadPoint } from './map';

// Each mission is a project's real engineering problem turned into something you do
// with the scooter. Completing one opens that project's case file with the lesson.

export interface Marker {
  x: number;
  y: number;
  label: string;
  kind: 'target' | 'item' | 'gate';
  /** Visually quieter (e.g. a checkpoint already passed). */
  dim?: boolean;
}

export type MissionStatus = 'running' | 'done' | { failed: string };

export interface MissionRun {
  objective(): string;
  markers(): Marker[];
  timeLeft(): number | null;
  /** Items the courier is carrying, for the HUD. */
  cargo(): string[];
  update(p: { x: number; y: number }, dt: number): { status: MissionStatus; notes: string[] };
}

export interface MissionDef {
  id: string;
  /** Case file opened on completion (a featured or minor project id, see cards). */
  card: string;
  title: string;
  brief: string;
  lesson: string;
  create(): MissionRun;
}

const REACH = 46;
const near = (p: { x: number; y: number }, q: { x: number; y: number }, r = REACH) => Math.hypot(p.x - q.x, p.y - q.y) < r;

const firstDrop = (): MissionRun => {
  const pickup = landmark('hq').door;
  const customer = roadPoint(4, 2, 's', 0.35);
  let phase: 'pickup' | 'deliver' = 'pickup';
  return {
    objective: () => (phase === 'pickup' ? 'Pick up the parcel at HQ' : 'Deliver the parcel to the customer'),
    markers: () => [phase === 'pickup' ? { ...pickup, label: 'Parcel', kind: 'item' } : { ...customer, label: 'Customer', kind: 'target' }],
    timeLeft: () => null,
    cargo: () => (phase === 'deliver' ? ['Parcel #1'] : []),
    update(p) {
      const notes: string[] = [];
      if (phase === 'pickup' && near(p, pickup)) {
        phase = 'deliver';
        notes.push('Parcel picked up. The glow behind you is your live position: it fades after a few seconds.');
      } else if (phase === 'deliver' && near(p, customer)) return { status: 'done', notes };
      return { status: 'running', notes };
    },
  };
};

const lunchRush = (): MissionRun => {
  const canteen = landmark('bitesite').door;
  const gates = { A: landmark('college-a').door, B: landmark('college-b').door };
  const orders: { id: string; college: 'A' | 'B'; delivered: boolean }[] = [
    { id: '#101', college: 'A', delivered: false },
    { id: '#201', college: 'B', delivered: false },
    { id: '#102', college: 'A', delivered: false },
  ];
  let picked = false;
  let time = 95;
  const left = (c: 'A' | 'B') => orders.filter((o) => o.college === c && !o.delivered).length;
  return {
    objective: () =>
      !picked ? 'Collect the lunch orders at the BiteSite canteen' : 'Deliver each order to its own college before the break ends',
    markers: () =>
      !picked
        ? [{ ...canteen, label: 'Canteen', kind: 'item' }]
        : (['A', 'B'] as const)
            .filter((c) => left(c) > 0)
            .map((c) => ({ ...gates[c], label: `College ${c} · ${left(c)} order${left(c) > 1 ? 's' : ''}`, kind: 'target' as const })),
    timeLeft: () => (picked ? time : null),
    cargo: () => (picked ? orders.filter((o) => !o.delivered).map((o) => `${o.id} for College ${o.college}`) : []),
    update(p, dt) {
      const notes: string[] = [];
      if (!picked) {
        if (near(p, canteen)) {
          picked = true;
          notes.push('Three orders, two colleges. Each order only opens its own college’s gate.');
        }
        return { status: 'running', notes };
      }
      time -= dt;
      if (time <= 0) return { status: { failed: 'The break ended before every order arrived.' }, notes };
      for (const c of ['A', 'B'] as const) {
        if (left(c) && near(p, gates[c])) {
          const ids = orders.filter((o) => o.college === c && !o.delivered);
          ids.forEach((o) => (o.delivered = true));
          const other = c === 'A' ? 'B' : 'A';
          notes.push(`Delivered ${ids.map((o) => o.id).join(', ')} to College ${c}.${left(other) ? ` College ${other}’s order stays sealed.` : ''}`);
        }
      }
      return { status: orders.every((o) => o.delivered) ? 'done' : 'running', notes };
    },
  };
};

const bulkImport = (): MissionRun => {
  const depot = landmark('wec').door;
  const items = [
    { id: 'WEC-4101', ...roadPoint(0, 1, 's', 0.3) },
    { id: 'WEC-4102', ...roadPoint(2, 0, 'n', 0.7) },
    { id: 'WEC-4103', ...roadPoint(3, 1, 'e', 0.15) },
    { id: 'WEC-4104', ...roadPoint(1, 2, 's', 0.6) },
    { id: 'WEC-4105', ...roadPoint(3, 3, 'n', 0.3) },
  ].map((i) => ({ ...i, got: false }));
  let time = 150;
  return {
    objective: () => {
      const n = items.filter((i) => !i.got).length;
      return n ? `Collect the consignments (${5 - n}/5)` : 'Bring them to the World Express depot';
    },
    markers: () => {
      const rest = items.filter((i) => !i.got);
      return rest.length ? rest.map((i) => ({ x: i.x, y: i.y, label: i.id, kind: 'item' as const })) : [{ ...depot, label: 'Depot', kind: 'target' }];
    },
    timeLeft: () => time,
    cargo: () => items.filter((i) => i.got).map((i) => i.id),
    update(p, dt) {
      const notes: string[] = [];
      time -= dt;
      if (time <= 0) return { status: { failed: 'The day’s dispatch window closed.' }, notes };
      for (const i of items)
        if (!i.got && near(p, i)) {
          i.got = true;
          notes.push(`${i.id} scanned. Customers can track it by that number now.`);
        }
      if (items.every((i) => i.got) && near(p, depot)) return { status: 'done', notes };
      return { status: 'running', notes };
    },
  };
};

const verifyPhoto = (): MissionRun => {
  const lab = landmark('attestr').door;
  const original = 'a3f9';
  const copies = [
    { hash: '83f9', ...roadPoint(1, 3, 'n', 0.25) },
    { hash: 'a3f9', ...roadPoint(1, 2, 's', 0.8) },
    { hash: 'a3f1', ...roadPoint(0, 3, 'e', 0.35) },
  ].map((c) => ({ ...c, gone: false }));
  let carrying = false;
  return {
    objective: () => (carrying ? 'Bring the verified photo to the Attestr lab' : `Find the copy whose fingerprint is ${original}`),
    markers: () =>
      carrying
        ? [{ ...lab, label: 'Attestr lab', kind: 'target' }]
        : copies.filter((c) => !c.gone).map((c) => ({ x: c.x, y: c.y, label: `photo · ${c.hash}`, kind: 'item' as const })),
    timeLeft: () => null,
    cargo: () => (carrying ? [`photo · ${original}`] : [`original fingerprint: ${original}`]),
    update(p) {
      const notes: string[] = [];
      if (!carrying) {
        for (const c of copies)
          if (!c.gone && near(p, c)) {
            if (c.hash === original) {
              carrying = true;
              notes.push('Fingerprint matches. This is the original.');
            } else {
              c.gone = true;
              notes.push(`Tampered copy: ${c.hash} doesn’t match ${original}. Edited pixels change the fingerprint.`);
            }
          }
      } else if (near(p, lab)) return { status: 'done', notes };
      return { status: 'running', notes };
    },
  };
};

const hostileCode = (): MissionRun => {
  const campus = landmark('niet').door;
  const lab = landmark('anvaya').door;
  const checks = [
    { name: 'Network off', ...roadPoint(2, 0, 'e', 0.5) },
    { name: 'Read-only filesystem', ...roadPoint(2, 1, 'e', 0.5) },
    { name: 'Non-root user', ...roadPoint(0, 1, 'e', 0.8) },
  ];
  let carrying = false;
  let passed = 0;
  let lastWrong = -1;
  return {
    objective: () =>
      !carrying
        ? 'Collect a student’s submission at NIET'
        : passed < checks.length
          ? `Pass checkpoint ${passed + 1}: ${checks[passed].name}`
          : 'Deliver it to the Anvaya Coding Lab sandbox',
    markers: () => {
      if (!carrying) return [{ ...campus, label: 'Submission', kind: 'item' }];
      const cps = checks.map((c, i) => ({ x: c.x, y: c.y, label: `${i + 1}. ${c.name}`, kind: 'gate' as const, dim: i < passed }));
      return passed < checks.length ? cps : [...cps, { ...lab, label: 'Sandbox', kind: 'target' as const }];
    },
    timeLeft: () => null,
    cargo: () => (carrying ? [`untrusted code · ${passed}/3 locks`] : []),
    update(p) {
      const notes: string[] = [];
      if (!carrying) {
        if (near(p, campus)) {
          carrying = true;
          notes.push('Student code is hostile by assumption. Lock it down before it runs.');
        }
        return { status: 'running', notes };
      }
      checks.forEach((c, i) => {
        if (!near(p, c)) {
          if (lastWrong === i) lastWrong = -1;
          return;
        }
        if (i === passed) {
          passed++;
          notes.push(`${c.name}: locked.`);
        } else if (i > passed && lastWrong !== i) {
          lastWrong = i;
          notes.push(`Not yet: ${checks[passed].name} comes first.`);
        }
      });
      if (near(p, lab)) {
        if (passed === checks.length) return { status: 'done', notes };
        if (lastWrong !== 99) {
          lastWrong = 99;
          notes.push(`Rejected at the sandbox: ${checks[passed].name.toLowerCase()} is missing.`);
        }
      } else if (lastWrong === 99) lastWrong = -1;
      return { status: 'running', notes };
    },
  };
};

export const MISSIONS: MissionDef[] = [
  {
    id: 'first-drop',
    card: 'speedoexpress',
    title: 'First drop',
    brief: 'Your first SpeedoExpress delivery. Pick up at HQ, drop at the customer.',
    lesson:
      'Your position was live the whole ride and faded behind you. In production, driver positions go into Redis with a short TTL, so a phone that stops reporting drops off the map instead of lingering as a phantom driver.',
    create: firstDrop,
  },
  {
    id: 'lunch-rush',
    card: 'bitesite',
    title: 'Lunch rush',
    brief: 'The BiteSite canteen has orders for two colleges. Get them there before the break ends.',
    lesson:
      'Each order could only open its own college’s gate. BiteSite works the same way: which college you see comes from who you are logged in as, never from the URL, and an isolation test suite proves one college can’t read another’s orders.',
    create: lunchRush,
  },
  {
    id: 'bulk-import',
    card: 'world-express-courier',
    title: 'Bulk import',
    brief: 'Five consignments are waiting around the city. Collect them all and bring them to the depot.',
    lesson:
      'Every consignment got a WEC number the moment it was scanned. World Express staff bulk-import shipments from Excel, and customers track any of 9 partner couriers from one page, on a homepage that ships zero JavaScript.',
    create: bulkImport,
  },
  {
    id: 'verify-photo',
    card: 'attestr',
    title: 'Verify the photo',
    brief: 'Copies of a news photo are circulating. Only one is the original. Bring it to the Attestr lab.',
    lesson:
      'You compared fingerprints, not pictures. Attestr stores a perceptual hash of the original on Ethereum; an edited copy produces a different fingerprint, and Error Level Analysis shows where it was changed.',
    create: verifyPhoto,
  },
  {
    id: 'hostile-code',
    card: 'anvaya-coding-lab',
    title: 'Hostile code',
    brief: 'A student submitted Java code. Run it through the sandbox checkpoints before it reaches the grader.',
    lesson:
      'Network off, read-only filesystem, non-root user: every submission in Anvaya Coding Lab runs in a throwaway container with all three, plus memory and CPU caps, so hostile code can’t leak tests or touch the host.',
    create: hostileCode,
  },
];
