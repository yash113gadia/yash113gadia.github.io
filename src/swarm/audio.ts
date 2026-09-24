// Sound effects are the pack's own samples where one fits (coin, kill, power-up...), and
// synthesised with Web Audio otherwise. The context is created on the first click or key
// press, because browsers block audio before one; if a sample fails to load, the synth covers it.

export type Sfx =
  | 'shoot'
  | 'hit'
  | 'pop'
  | 'bigpop'
  | 'xp'
  | 'level'
  | 'hurt'
  | 'dash'
  | 'nova'
  | 'zap'
  | 'boom'
  | 'pickup'
  | 'boss'
  | 'select'
  | 'over'
  | 'slash'
  | 'chest'
  | 'freeze';

// Minimum gap between repeats, so a swarm dying at once doesn't turn into noise.
const GAP: Partial<Record<Sfx, number>> = { shoot: 0.05, hit: 0.03, pop: 0.03, xp: 0.028, zap: 0.06, slash: 0.05 };
const SAMPLES = ['gold-1', 'kill', 'power-up', 'alert', 'game-over', 'succes', 'menu-2', 'sword', 'magic-1'] as const;
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36];

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private last = new Map<Sfx, number>();
  private xpChain = 0;
  private xpAt = 0;
  private muted = false;
  private step = 0;
  private nextNote = 0;
  private timer = 0;
  /** 0..1: how hard the music goes. */
  intensity = 0;

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 6;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(comp);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.75;
    this.sfx.connect(this.master);
    this.music = ctx.createGain();
    this.music.gain.value = 0.3;
    this.music.connect(this.master);
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.ctx = ctx;
    for (const n of SAMPLES)
      fetch(`/swarm/sfx/${n}.mp3`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText))))
        .then((b) => ctx.decodeAudioData(b))
        .then((b) => this.buffers.set(n, b))
        .catch(() => {
          /* no sample: the synth version plays instead */
        });
  }

  /** Plays a loaded sample; false if it isn't loaded, so the caller can synthesise instead. */
  private sample(name: (typeof SAMPLES)[number], rate = 1, vol = 1) {
    const ctx = this.ctx!;
    const b = this.buffers.get(name);
    if (!b) return false;
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = vol;
    s.connect(g);
    g.connect(this.sfx!);
    s.start();
    return true;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.02);
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, when = 0, dest?: AudioNode) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest ?? this.sfx!);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  private hiss(dur: number, vol: number, type: BiquadFilterType, f0: number, f1: number, when = 0, dest?: AudioNode) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + when;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest ?? this.sfx!);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.03);
  }

  play(v: Sfx) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    const gap = GAP[v];
    if (gap && now - (this.last.get(v) ?? -1) < gap) return;
    this.last.set(v, now);
    const r = 1 + (Math.random() - 0.5) * 0.14;
    switch (v) {
      case 'shoot':
        this.tone('square', 1300 * r, 520, 0.055, 0.025);
        break;
      case 'hit':
        this.hiss(0.035, 0.1, 'highpass', 3200, 1600);
        break;
      case 'pop':
        if (this.sample('kill', r, 0.5)) break;
        this.tone('triangle', 540 * r, 90, 0.12, 0.15);
        this.hiss(0.07, 0.08, 'bandpass', 1900, 500);
        break;
      case 'bigpop':
        this.tone('sawtooth', 210 * r, 40, 0.35, 0.2);
        this.hiss(0.3, 0.22, 'lowpass', 2400, 200);
        break;
      case 'xp': {
        // Each pickup in a quick run climbs the scale: vacuuming up a trail of gems plays a riff.
        if (now - this.xpAt > 0.4) this.xpChain = 0;
        this.xpAt = now;
        const step = PENTA[this.xpChain % 10];
        this.xpChain++;
        if (this.sample('gold-1', Math.pow(2, step / 12), 0.35)) break;
        const f = 660 * Math.pow(2, step / 12);
        this.tone('sine', f, f, 0.09, 0.07);
        break;
      }
      case 'level':
        if (this.sample('power-up', 1, 0.8)) break;
        [0, 4, 7, 12, 16].forEach((n, i) => this.tone('triangle', 523 * 2 ** (n / 12), 523 * 2 ** (n / 12), 0.3, 0.13, i * 0.06));
        break;
      case 'hurt':
        this.tone('sawtooth', 190, 50, 0.3, 0.24);
        this.hiss(0.2, 0.2, 'lowpass', 1200, 100);
        break;
      case 'dash':
        this.hiss(0.18, 0.16, 'bandpass', 600, 3200);
        break;
      case 'nova':
        if (this.sample('magic-1', 0.8, 0.7)) break;
        this.tone('sine', 150, 40, 0.4, 0.3);
        this.hiss(0.28, 0.12, 'lowpass', 900, 100);
        break;
      case 'zap':
        this.hiss(0.12, 0.16, 'highpass', 5200, 2000);
        this.tone('square', 1900 * r, 300, 0.07, 0.04);
        break;
      case 'boom':
        this.tone('sine', 95, 28, 0.8, 0.45);
        this.hiss(0.7, 0.35, 'lowpass', 1600, 60);
        break;
      case 'pickup':
      case 'chest':
        if (this.sample('succes', 1, 0.7)) break;
        [0, 7, 12].forEach((n, i) => this.tone('sine', 880 * 2 ** (n / 12), 880 * 2 ** (n / 12), 0.14, 0.12, i * 0.05));
        break;
      case 'boss':
        if (this.sample('alert', 1, 0.9)) break;
        for (let i = 0; i < 3; i++) {
          this.tone('sawtooth', 233, 233, 0.22, 0.1, i * 0.34);
          this.tone('sawtooth', 175, 175, 0.22, 0.1, i * 0.34 + 0.17);
        }
        break;
      case 'select':
        if (this.sample('menu-2', 1, 0.8)) break;
        this.tone('triangle', 880, 1320, 0.09, 0.1);
        break;
      case 'slash':
        if (this.sample('sword', r, 0.6)) break;
        this.hiss(0.12, 0.2, 'bandpass', 3000, 900);
        break;
      case 'freeze':
        if (this.sample('magic-1', 1.5, 0.7)) break;
        this.hiss(0.3, 0.15, 'highpass', 6000, 3000);
        break;
      case 'over':
        if (this.sample('game-over', 1, 0.8)) break;
        [12, 7, 3, 0].forEach((n, i) => this.tone('triangle', 220 * 2 ** (n / 12), 220 * 2 ** (n / 12), 0.4, 0.15, i * 0.15));
        break;
    }
  }

  // --- music: kick, hats, a minor-key bassline and an arpeggio that joins as things heat up ---

  startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextNote = this.ctx.currentTime + 0.08;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stopMusic() {
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    const sixteenth = 60 / 126 / 4;
    while (this.nextNote < ctx.currentTime + 0.12) {
      this.beat(this.step, Math.max(0, this.nextNote - ctx.currentTime));
      this.nextNote += sixteenth;
      this.step = (this.step + 1) % 64;
    }
  }

  private bass(f: number, when: number, dur: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const lp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = f;
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700 + this.intensity * 1600, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + dur);
    lp.Q.value = 1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.music!);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  private beat(s: number, when: number) {
    const m = this.music!;
    if (s % 4 === 0) this.tone('sine', 150, 42, 0.24, 0.9, when, m);
    if (s % 4 === 2 && this.intensity > 0.12) this.hiss(0.05, 0.1, 'highpass', 8000, 6000, when, m);
    if (s % 8 === 4 && this.intensity > 0.45) this.hiss(0.14, 0.18, 'bandpass', 2400, 900, when, m);
    if (s % 2 === 0) {
      const riff = [0, 0, 12, 0, 3, 3, 15, 3, -2, -2, 10, -2, -4, -4, 8, 5, 0, 0, 12, 0, 3, 3, 15, 3, 7, 7, 5, 3, -2, 0, 10, 12];
      this.bass(55 * 2 ** (riff[(s / 2) % riff.length] / 12), when, 0.2);
    }
    if (this.intensity > 0.3) {
      const arp = [0, 7, 12, 15, 19, 15, 12, 7];
      const f = 440 * 2 ** (arp[s % arp.length] / 12);
      this.tone('square', f, f, 0.08, 0.018 + this.intensity * 0.02, when, m);
    }
  }

  dispose() {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
  }
}
