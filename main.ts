// ai-excited-01 v3 — "DISCO MOON"
// The moon is a giant mirrored disco ball hanging low over a tiny city,
// sweeping coloured light beams down onto rooftop dancers, under the big
// block letters DISCO MOON!  One image, drawn from scratch in code: own PNG
// encoder, own rasterizer, own 5x7 block font. Node 22, standard library
// only, no network, fully deterministic (one fixed seed; no clock, no
// environment except the kit's output-dir variable, influences a pixel).
// Output: <MAKEFUN_OUTPUT_DIR or /output>/entry.png (1024x1024 PNG).
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// ---------- seeded RNG (deterministic) ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0xD15C0);

// ---------- pixel buffer ----------
const buf = Buffer.alloc(W * H * 3);
function setPx(x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
}
function blend(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  if (a > 1) a = 1;
  const i = (y * W + x) * 3;
  buf[i] = Math.round(buf[i] * (1 - a) + r * a);
  buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + g * a);
  buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + b * a);
}
function fillRect(x, y, w, h, r, g, b, a = 1) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++)
      a >= 1 ? setPx(xx, yy, r, g, b) : blend(xx, yy, r, g, b, a);
}
function fillCircle(cx, cy, rad, r, g, b, a = 1) {
  for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) {
    const dy = y - cy;
    const dx = Math.sqrt(Math.max(0, rad * rad - dy * dy));
    for (let x = Math.floor(cx - dx); x <= Math.ceil(cx + dx); x++)
      a >= 1 ? setPx(x, y, r, g, b) : blend(x, y, r, g, b, a);
  }
}
// Convex polygon fill (scanline).
function fillPoly(pts, r, g, b, a = 1) {
  let minY = H, maxY = 0;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  minY = Math.max(0, Math.floor(minY)); maxY = Math.min(H - 1, Math.ceil(maxY));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++)
        a >= 1 ? setPx(x, y, r, g, b) : blend(x, y, r, g, b, a);
    }
  }
}
function drawThickLine(x1, y1, x2, y2, w, r, g, b, a = 1) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(len));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    fillCircle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, w / 2, r, g, b, a);
  }
}

// ---------- sky ----------
for (let y = 0; y < H; y++) {
  const t = y / H;
  // deep indigo top -> violet mid -> warm magenta haze near the horizon
  let r, g, b;
  if (t < 0.62) {
    const u = t / 0.62;
    r = Math.round(10 + (52 - 10) * u);
    g = Math.round(14 + (26 - 14) * u);
    b = Math.round(46 + (92 - 46) * u);
  } else {
    const u = (t - 0.62) / 0.38;
    r = Math.round(52 + (96 - 52) * u);
    g = Math.round(26 + (32 - 26) * u);
    b = Math.round(92 + (88 - 92) * u);
  }
  for (let x = 0; x < W; x++) setPx(x, y, r, g, b);
}
// Stars (drawn before the ball, so none land inside its disc).
for (let i = 0; i < 220; i++) {
  const x = Math.floor(rand() * W);
  const y = Math.floor(rand() * 700);
  const v = 150 + Math.floor(rand() * 105);
  const s = rand();
  if (s < 0.12) { // cross sparkle
    fillRect(x - 2, y, 5, 1, v, v, 255);
    fillRect(x, y - 2, 1, 5, v, v, 255);
  } else {
    const d = rand() < 0.5 ? 1 : 2;
    fillRect(x, y, d, d, v, v, 240);
  }
}

// ---------- disco-ball glow + light beams (behind the ball) ----------
const BX = 640, BY = 375, BR = 225; // ball centre + radius
for (let y = Math.floor(BY - BR * 1.7); y <= Math.ceil(BY + BR * 1.7); y++) {
  for (let x = Math.floor(BX - BR * 1.7); x <= Math.ceil(BX + BR * 1.7); x++) {
    const d = Math.hypot(x - BX, y - BY) / BR;
    if (d > 1.7 || d < 0.9) continue;
    const a = 0.16 * (1 - (d - 0.9) / 0.8);
    blend(x, y, 190, 120, 255, Math.max(0, a));
  }
}
// Beams fan down-left from the ball toward the rooftops.
const BEAMS = [
  { tip: [150, 830], col: [255, 64, 170], a: 0.22 }, // hot pink
  { tip: [300, 850], col: [64, 220, 255], a: 0.20 }, // cyan
  { tip: [470, 840], col: [255, 214, 64], a: 0.20 }, // gold
  { tip: [620, 860], col: [170, 90, 255], a: 0.19 }, // violet
  { tip: [60, 760], col: [120, 255, 140], a: 0.17 }, // lime
];
for (const bm of BEAMS) {
  const [tx, ty] = bm.tip;
  // beam = quad from a short chord on the ball to a wide foot on the roofs;
  // drawn twice: a wide faint wash, then a narrower brighter core.
  const ox = BX - 90, oy = BY + 110;
  fillPoly(
    [[ox, oy], [ox + 70, oy + 35], [tx + 70, ty], [tx - 70, ty]],
    bm.col[0], bm.col[1], bm.col[2], bm.a * 0.55
  );
  fillPoly(
    [[ox, oy], [ox + 60, oy + 30], [tx + 34, ty], [tx - 34, ty]],
    bm.col[0], bm.col[1], bm.col[2], bm.a
  );
}

// ---------- the disco ball (moon) ----------
fillCircle(BX, BY, BR, 24, 22, 44); // dark rim base
// Mirrored tiles: grid clipped to the disc, brightness by seeded value +
// a diagonal light falloff (bright top-left, dim bottom-right).
const TILE = 27;
for (let gy = Math.floor(BY - BR); gy < BY + BR; gy += TILE) {
  for (let gx = Math.floor(BX - BR); gx < BX + BR; gx += TILE) {
    const cx = gx + TILE / 2, cy = gy + TILE / 2;
    const d = Math.hypot(cx - BX, cy - BY);
    if (d > BR - 6) continue;
    const diag = 1 - ((cx - (BX - BR)) + (cy - (BY - BR))) / (4 * BR); // 1 TL -> 0 BR
    const flick = rand();
    let r, g, b;
    if (flick < 0.07) { r = 255; g = 90; b = 190; }       // pink flash tile
    else if (flick < 0.13) { r = 90; g = 220; b = 255; }  // cyan flash tile
    else if (flick < 0.18) { r = 255; g = 215; b = 90; }  // gold flash tile
    else {
      const v = Math.round(120 + 110 * diag + rand() * 30);
      r = v; g = v; b = Math.min(255, v + 22);
    }
    // clip tile rect to the disc by drawing pixel-wise inside the circle
    for (let y = gy + 2; y < gy + TILE - 1; y++) {
      for (let x = gx + 2; x < gx + TILE - 1; x++) {
        if (Math.hypot(x - BX, y - BY) < BR - 4) setPx(x, y, r, g, b);
      }
    }
  }
}
// Specular highlight, top-left of the ball.
for (let y = Math.floor(BY - BR); y < BY - 60; y++) {
  for (let x = Math.floor(BX - BR); x < BX - 40; x++) {
    const d = Math.hypot((x - (BX - 120)) / 130, (y - (BY - 130)) / 100);
    if (d < 1) blend(x, y, 255, 255, 255, 0.35 * (1 - d));
  }
}
// Hanging chain + hook: the ball hangs from the top of the frame.
fillRect(BX - 3, 0, 6, BY - BR + 4, 200, 200, 210);
fillCircle(BX, BY - BR - 2, 10, 200, 200, 210);

// ---------- city skyline ----------
const ROOF = 800;
const buildings = [];
let bx = -10;
while (bx < W + 10) {
  const w = 60 + Math.floor(rand() * 90);
  const h = 90 + Math.floor(rand() * 150);
  buildings.push({ x: bx, w, top: ROOF + 60 - h, h });
  bx += w + 4 + Math.floor(rand() * 14);
}
for (const b of buildings) {
  fillRect(b.x, b.top, b.w, ROOF + 224 - b.top, 16, 14, 34);
  // antenna on some roofs
  if (rand() < 0.4) {
    fillRect(b.x + b.w / 2 - 1, b.top - 26, 2, 26, 16, 14, 34);
    fillCircle(b.x + b.w / 2, b.top - 28, 3, 255, 80, 120);
  }
  // lit windows
  for (let wy = b.top + 12; wy < ROOF + 200; wy += 22) {
    for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 18) {
      if (rand() < 0.42) {
        const warm = rand() < 0.75;
        fillRect(wx, wy, 9, 12, warm ? 255 : 120, warm ? 205 : 220, warm ? 90 : 255);
      }
    }
  }
}
// Rooftop party on the tallest building near the beams' feet: dancers.
const central = buildings.filter(b => b.x + b.w / 2 > 280 && b.x + b.w / 2 < 700);
const party = (central.length ? central : buildings)
  .reduce((a, b) => (b.top < a.top ? b : a), buildings[0]);
const py = party.top;
fillRect(party.x, py - 2, party.w, 4, 16, 14, 34);
const dancers = [
  { dx: 0.18, lean: -6, arm: 1 }, { dx: 0.32, lean: 5, arm: -1 },
  { dx: 0.48, lean: 0, arm: 1 }, { dx: 0.62, lean: -5, arm: -1 },
  { dx: 0.78, lean: 7, arm: 1 },
];
for (const d of dancers) {
  const cx = party.x + party.w * d.dx;
  fillCircle(cx, py - 26, 5, 8, 7, 18); // head
  drawThickLine(cx, py - 21, cx + d.lean, py - 6, 5, 8, 7, 18); // body
  drawThickLine(cx, py - 18, cx - 9, d.arm > 0 ? py - 32 : py - 16, 3, 8, 7, 18);
  drawThickLine(cx, py - 18, cx + 9, d.arm > 0 ? py - 32 : py - 16, 3, 8, 7, 18);
  drawThickLine(cx + d.lean, py - 6, cx - 6, py, 4, 8, 7, 18); // legs
  drawThickLine(cx + d.lean, py - 6, cx + 7, py, 4, 8, 7, 18);
}
// Speaker stacks flanking the dancers.
for (const sx of [party.x + 4, party.x + party.w - 22]) {
  fillRect(sx, py - 30, 18, 30, 10, 9, 24);
  fillCircle(sx + 9, py - 22, 5, 40, 40, 60);
  fillCircle(sx + 9, py - 10, 3, 40, 40, 60);
}
// Confetti specks drifting in the beams.
for (let i = 0; i < 90; i++) {
  const x = 60 + rand() * 620;
  const y = 480 + rand() * 320;
  const cols = [[255, 90, 180], [90, 220, 255], [255, 220, 90], [170, 120, 255]];
  const c = cols[Math.floor(rand() * cols.length)];
  fillRect(Math.floor(x), Math.floor(y), 3, 3, c[0], c[1], c[2]);
}

// ---------- big block text: DISCO MOON! ----------
const FONT = {
  D: ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};
function drawText(str, x, y, scale, r, g, b) {
  let cx = x;
  for (const ch of str) {
    const glyph = FONT[ch] || FONT[" "];
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 5; col++)
        if (glyph[row][col] === "1")
          fillRect(cx + col * scale, y + row * scale, scale, scale, r, g, b);
    cx += 6 * scale;
  }
  return cx;
}
const TEXT = "DISCO MOON!";
const SCALE = 11;
const tw = TEXT.length * 6 * SCALE - SCALE;
const tx0 = Math.floor((W - tw) / 2);
drawText(TEXT, tx0 + 5, 62, SCALE, 255, 45, 150); // pink shadow
drawText(TEXT, tx0, 56, SCALE, 255, 232, 90);     // gold letters

// ---------- PNG encode (stdlib zlib) ----------
const CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "entry.png"), png);
console.log(`wrote ${png.length} bytes to ${path.join(outDir, "entry.png")}`);
