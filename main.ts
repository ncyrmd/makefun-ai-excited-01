// ai-excited-01 v1 — "Rocket towing Earth"
// One image, drawn procedurally in pure Node 22 (standard library only):
// a rocket blasting up-right across a starfield, towing planet Earth on a
// tether, under the words HOLD ON!  Everything is generated here — no
// copied image, no network, no bundled asset. Deterministic: one fixed
// seed drives every random choice; no clock, no environment (except the
// kit's output-dir variable) influences a pixel.
// Output: <MAKEFUN_OUTPUT_DIR or /output>/entry.png (1024x1024 PNG).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;
const SS = 2; // supersample: draw at 2048, average down for smooth edges
const SW = W * SS;
const SH = H * SS;
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

type RGB = [number, number, number];

// ---------- deterministic random (mulberry32, fixed seed) ----------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261116);

// ---------- framebuffer (opaque RGB; background fills every pixel first) ----------
const fb = Buffer.alloc(SW * SH * 4);

function blend(x: number, y: number, c: RGB, a: number): void {
  if (a <= 0) return;
  if (a > 1) a = 1;
  const i = (y * SW + x) * 4;
  fb[i] = Math.round(c[0] * a + fb[i] * (1 - a));
  fb[i + 1] = Math.round(c[1] * a + fb[i + 1] * (1 - a));
  fb[i + 2] = Math.round(c[2] * a + fb[i + 2] * (1 - a));
  fb[i + 3] = 255;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function lerpC(c1: RGB, c2: RGB, t: number): RGB {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// ---------- sky: diagonal gradient through a lookup table ----------
const STOPS: Array<[number, RGB]> = [
  [0.0, [6, 10, 32]],
  [0.38, [14, 26, 74]],
  [0.68, [18, 58, 110]],
  [1.0, [11, 74, 94]],
];
function skyColor(t: number): RGB {
  for (let s = 0; s < STOPS.length - 1; s++) {
    const [t0, c0] = STOPS[s];
    const [t1, c1] = STOPS[s + 1];
    if (t <= t1) return lerpC(c0, c1, (t - t0) / (t1 - t0));
  }
  return STOPS[STOPS.length - 1][1];
}
const SKY_LUT: RGB[] = [];
for (let i = 0; i <= 2048; i++) SKY_LUT.push(skyColor(i / 2048));
for (let y = 0; y < SH; y++) {
  for (let x = 0; x < SW; x++) {
    const t = (x / SW) * 0.35 + (y / SH) * 0.65;
    const c = SKY_LUT[Math.round(t * 2048)];
    const i = (y * SW + x) * 4;
    fb[i] = Math.round(c[0]);
    fb[i + 1] = Math.round(c[1]);
    fb[i + 2] = Math.round(c[2]);
    fb[i + 3] = 255;
  }
}

// ---------- shape primitives (coords in final 1024 space, scaled inside) ----------
function fillCircle(cx: number, cy: number, r: number, c: RGB, a = 1): void {
  const x0 = Math.max(0, Math.floor((cx - r) * SS));
  const x1 = Math.min(SW - 1, Math.ceil((cx + r) * SS));
  const y0 = Math.max(0, Math.floor((cy - r) * SS));
  const y1 = Math.min(SH - 1, Math.ceil((cy + r) * SS));
  const rr = r * r;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5) / SS - cx;
      const dy = (y + 0.5) / SS - cy;
      if (dx * dx + dy * dy <= rr) blend(x, y, c, a);
    }
  }
}

function fillEllipse(cx: number, cy: number, rx: number, ry: number, c: RGB, a = 1): void {
  const x0 = Math.max(0, Math.floor((cx - rx) * SS));
  const x1 = Math.min(SW - 1, Math.ceil((cx + rx) * SS));
  const y0 = Math.max(0, Math.floor((cy - ry) * SS));
  const y1 = Math.min(SH - 1, Math.ceil((cy + ry) * SS));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = ((x + 0.5) / SS - cx) / rx;
      const dy = ((y + 0.5) / SS - cy) / ry;
      if (dx * dx + dy * dy <= 1) blend(x, y, c, a);
    }
  }
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB, a = 1): void {
  const x0 = Math.max(0, Math.floor(x * SS));
  const x1 = Math.min(SW - 1, Math.ceil((x + w) * SS) - 1);
  const y0 = Math.max(0, Math.floor(y * SS));
  const y1 = Math.min(SH - 1, Math.ceil((y + h) * SS) - 1);
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) blend(xx, yy, c, a);
  }
}

function fillPoly(pts: Array<[number, number]>, c: RGB, a = 1): void {
  const p = pts.map(([x, y]) => [x * SS, y * SS] as [number, number]);
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of p) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(SH - 1, Math.ceil(maxY));
  for (let y = y0; y <= y1; y++) {
    const xs: number[] = [];
    for (let i = 0; i < p.length; i++) {
      const [x1, y1p] = p[i];
      const [x2, y2p] = p[(i + 1) % p.length];
      if ((y1p <= y && y2p > y) || (y2p <= y && y1p > y)) {
        xs.push(x1 + ((y - y1p) / (y2p - y1p)) * (x2 - x1));
      }
    }
    xs.sort((u, v) => u - v);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.ceil(xs[k]));
      const xb = Math.min(SW - 1, Math.floor(xs[k + 1]));
      for (let x = xa; x <= xb; x++) blend(x, y, c, a);
    }
  }
}

// Soft radial glow: alpha falls off quadratically to zero at radius r.
function glow(cx: number, cy: number, r: number, c: RGB, peak: number): void {
  const x0 = Math.max(0, Math.floor((cx - r) * SS));
  const x1 = Math.min(SW - 1, Math.ceil((cx + r) * SS));
  const y0 = Math.max(0, Math.floor((cy - r) * SS));
  const y1 = Math.min(SH - 1, Math.ceil((cy + r) * SS));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5) / SS - cx;
      const dy = (y + 0.5) / SS - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < r) {
        const f = 1 - d / r;
        blend(x, y, c, peak * f * f);
      }
    }
  }
}

function thickLine(x1: number, y1: number, x2: number, y2: number, w: number, c: RGB, a = 1): void {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(2, Math.ceil((dist * SS) / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    fillCircle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, w / 2, c, a);
  }
}

// ---------- scene: nebula, stars, sun ----------
// Soft nebula washes (radial falloff, no hard edge).
glow(180, 220, 300, [88, 40, 140], 0.12);
glow(820, 700, 320, [16, 90, 110], 0.1);
glow(700, 120, 220, [140, 40, 90], 0.08);

const STAR_COLORS: RGB[] = [
  [255, 255, 255],
  [207, 228, 255],
  [255, 233, 168],
  [180, 220, 255],
];
for (let i = 0; i < 260; i++) {
  const x = rnd() * W;
  const y = rnd() * H;
  const r = 0.7 + rnd() * 1.6;
  const col = STAR_COLORS[Math.floor(rnd() * STAR_COLORS.length)];
  fillCircle(x, y, r, col, 0.35 + rnd() * 0.65);
}
// A few bright stars with a cross sparkle.
for (let i = 0; i < 10; i++) {
  const x = 40 + rnd() * (W - 80);
  const y = 40 + rnd() * (H - 80);
  const s = 5 + rnd() * 7;
  fillRect(x - s, y - 0.8, s * 2, 1.6, [255, 255, 255], 0.85);
  fillRect(x - 0.8, y - s, 1.6, s * 2, [255, 255, 255], 0.85);
  fillCircle(x, y, 1.8, [255, 255, 255], 1);
}
// Speed streaks along the launch direction (up-right).
const DIR: [number, number] = [0.5736, -0.8192];
for (let i = 0; i < 26; i++) {
  const x = rnd() * W;
  const y = rnd() * H;
  const len = 12 + rnd() * 26;
  thickLine(x, y, x + DIR[0] * len, y + DIR[1] * len, 1.6, [255, 255, 255], 0.1 + rnd() * 0.25);
}

// Comet in the lower right, diving up-left toward the rocket.
{
  const hx = 810;
  const hy = 785;
  const tx = 965;
  const ty = 910;
  const px = -0.63;
  const py = 0.78;
  fillPoly(
    [[hx + px * 9, hy + py * 9], [hx - px * 9, hy - py * 9], [tx, ty]],
    [180, 220, 255],
    0.3,
  );
  fillPoly(
    [[hx + px * 4.5, hy + py * 4.5], [hx - px * 4.5, hy - py * 4.5], [935, 885]],
    [220, 235, 255],
    0.45,
  );
  glow(hx, hy, 42, [190, 220, 255], 0.8);
  fillCircle(hx, hy, 7, [255, 255, 255], 1);
  fillCircle(hx, hy, 3.5, [255, 255, 255], 1);
}

// Sun, top right.
glow(925, 92, 250, [255, 210, 122], 0.85);
fillCircle(925, 92, 38, [255, 243, 196], 1);
fillCircle(925, 92, 26, [255, 255, 240], 1);

// ---------- scene: Earth, bottom left ----------
const EX = 168;
const EY = 858;
const ER = 88;
glow(EX, EY, 150, [63, 140, 255], 0.35);
fillCircle(EX, EY, ER, [28, 95, 184], 1); // ocean
fillEllipse(EX - 28, EY - 30, 30, 18, [63, 174, 90], 1); // continents
fillEllipse(EX - 8, EY - 42, 18, 12, [63, 174, 90], 1);
fillEllipse(EX + 26, EY + 6, 20, 26, [47, 143, 78], 1);
fillEllipse(EX - 18, EY + 38, 14, 20, [63, 174, 90], 1);
fillEllipse(EX + 42, EY + 40, 12, 8, [47, 143, 78], 1);
fillEllipse(EX - 10, EY - 18, 34, 7, [255, 255, 255], 0.7); // clouds
fillEllipse(EX + 22, EY + 22, 26, 6, [255, 255, 255], 0.6);
fillEllipse(EX - 34, EY + 14, 20, 5, [255, 255, 255], 0.55);
glow(EX + 30, EY - 32, 60, [160, 210, 255], 0.35); // sunlight on the ocean

// ---------- rocket: 35 degrees up-right, centre (520, 470) ----------
const COS = 0.8192;
const SIN = 0.5736;
const RX = 520;
const RY = 470;
function rot(px: number, py: number): [number, number] {
  return [RX + px * COS - py * SIN, RY + px * SIN + py * COS];
}
function rotPoly(pts: Array<[number, number]>): Array<[number, number]> {
  return pts.map(([x, y]) => rot(x, y));
}
function rotCircle(cx: number, cy: number, r: number, c: RGB, a = 1): void {
  const [wx, wy] = rot(cx, cy);
  fillCircle(wx, wy, r, c, a);
}
function rotGlow(cx: number, cy: number, r: number, c: RGB, peak: number): void {
  const [wx, wy] = rot(cx, cy);
  glow(wx, wy, r, c, peak);
}

// Tether: Earth to a lug on the rocket's left fin (local (-90, 180)),
// clear of the flame so the line reads as towing, not burning.
const [TX, TY] = rot(-90, 180);
{
  const x0 = EX + 18;
  const y0 = EY - ER + 6;
  const cx = 255;
  const cy = 795;
  const n = 48;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const qx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * TX;
    const qy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * TY;
    thickLine(px, py, qx, qy, 7, [232, 236, 245], 0.95);
    px = qx;
    py = qy;
  }
  // Bright core along the same curve.
  px = x0;
  py = y0;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const qx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * TX;
    const qy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * TY;
    thickLine(px, py, qx, qy, 2.5, [255, 255, 255], 0.9);
    px = qx;
    py = qy;
  }
  fillCircle(TX, TY, 8, [220, 225, 235], 1); // lug
  fillCircle(TX, TY, 3.5, [40, 50, 80], 1);
}

// Flame glow, then the rocket itself.
rotGlow(0, 250, 130, [255, 154, 42], 0.5);

// Body outline: same silhouette scaled 1.035 about the local origin, dark first.
const BODY: Array<[number, number]> = [
  [-52, 150],
  [52, 150],
  [52, -118],
  [30, -198],
  [0, -246],
  [-30, -198],
  [-52, -118],
];
fillPoly(rotPoly(BODY.map(([x, y]) => [x * 1.035, y * 1.035] as [number, number])), [20, 30, 70], 1);
fillPoly(rotPoly(BODY), [238, 242, 248], 1);

// Red nose tip and bands.
fillPoly(rotPoly([[18, -210], [0, -246], [-18, -210]]), [217, 43, 43], 1);
fillPoly(rotPoly([[-52, -118], [52, -118], [52, -92], [-52, -92]]), [217, 43, 43], 1);
fillPoly(rotPoly([[-52, 108], [52, 108], [52, 134], [-52, 134]]), [217, 43, 43], 1);

// Fins.
fillPoly(rotPoly([[-50, 40], [-50, 150], [-122, 212], [-96, 58]]), [217, 43, 43], 1);
fillPoly(rotPoly([[50, 40], [50, 150], [122, 212], [96, 58]]), [217, 43, 43], 1);

// Window: clean round glass porthole — no astronaut inside (the old
// helmet + offset visor read as a giant eye). Dark navy glass with a
// small white crescent highlight tucked at its upper-left edge.
rotCircle(0, -38, 34, [200, 210, 225], 1); // metal ring
rotCircle(0, -38, 28, [14, 28, 66], 1); // dark navy glass
rotCircle(-13, -53, 7.5, [255, 255, 255], 0.95); // highlight disc
rotCircle(-10, -50, 7.5, [14, 28, 66], 0.95); // re-cover it, leaving a crescent

// Flame: three layered teardrops along local +Y (down-left in the world).
fillPoly(rotPoly([[-40, 148], [40, 148], [30, 300], [0, 410], [-30, 300]]), [255, 122, 26], 1);
fillPoly(rotPoly([[-24, 148], [24, 148], [16, 260], [0, 320], [-16, 260]]), [255, 194, 51], 1);
fillPoly(rotPoly([[-13, 148], [13, 148], [8, 220], [0, 260], [-8, 220]]), [255, 246, 201], 1);

// Exhaust sparks spraying out of the flame.
const FLAME_DIR: [number, number] = [-0.5736, 0.8192];
const FLAME_PERP: [number, number] = [0.8192, 0.5736];
const [FX, FY] = rot(0, 150);
for (let i = 0; i < 42; i++) {
  const t = rnd();
  const spread = (0.25 + t * 0.75) * 46;
  const lat = (rnd() - 0.5) * 2 * spread;
  const px = FX + FLAME_DIR[0] * t * 260 + FLAME_PERP[0] * lat;
  const py = FY + FLAME_DIR[1] * t * 260 + FLAME_PERP[1] * lat;
  const col: RGB = rnd() < 0.5 ? [255, 170, 60] : [255, 220, 110];
  fillCircle(px, py, 1.5 + rnd() * 3.5, col, 0.55 + rnd() * 0.4);
}

// ---------- headline text: HOLD ON! (5x7 block font, my own glyphs) ----------
const FONT: Record<string, string[]> = {
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};
function drawTextPass(text: string, x: number, y: number, s: number, c: RGB): void {
  let cx = x;
  for (const ch of text) {
    const g = FONT[ch] ?? FONT[' '];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '#') fillRect(cx + col * s, y + r * s, s, s, c, 1);
      }
    }
    cx += (ch === ' ' ? 4 : 6) * s;
  }
}
function drawText(text: string, x: number, y: number, s: number): void {
  // Dark outline: eight offset passes, then the bright face.
  const o = 4;
  for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]]) {
    drawTextPass(text, x + dx, y + dy, s, [10, 16, 48]);
  }
  drawTextPass(text, x, y, s, [255, 225, 77]);
}
drawText('HOLD ON!', 144, 48, 16);

// ---------- downsample 2x2 -> final RGBA ----------
const out = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let dy = 0; dy < SS; dy++) {
      for (let dx = 0; dx < SS; dx++) {
        const i = ((y * SS + dy) * SW + (x * SS + dx)) * 4;
        r += fb[i];
        g += fb[i + 1];
        b += fb[i + 2];
      }
    }
    const o = (y * W + x) * 4;
    out[o] = Math.round(r / 4);
    out[o + 1] = Math.round(g / 4);
    out[o + 2] = Math.round(b / 4);
    out[o + 3] = 255;
  }
}

// ---------- PNG encoder: CRC32, per-row filter choice (None vs Up), zlib level 9 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  const rowStart = y * W * 4;
  const row = out.subarray(rowStart, rowStart + W * 4);
  const up = y > 0 ? out.subarray((y - 1) * W * 4, y * W * 4) : null;
  let score0 = 0;
  let score2 = 0;
  for (let i = 0; i < row.length; i++) {
    const v0 = row[i];
    score0 += v0 < 128 ? v0 : 256 - v0;
    const v2 = up ? (row[i] - up[i]) & 0xff : v0;
    score2 += v2 < 128 ? v2 : 256 - v2;
  }
  const off = y * (1 + W * 4);
  if (score2 < score0 && up) {
    raw[off] = 2;
    for (let i = 0; i < row.length; i++) raw[off + 1 + i] = (row[i] - up[i]) & 0xff;
  } else {
    raw[off] = 0;
    row.copy(raw, off + 1);
  }
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // colour type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', deflateSync(raw, { level: 9 })),
  pngChunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'entry.png'), png);
console.log(`wrote ${join(OUT, 'entry.png')} ${png.length} bytes ${W}x${H}`);
