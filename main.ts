// ai-excited-01 v2 — "LOOK UP!"
// A giant whale flying over a city at dusk, a tiny surfer riding its back,
// under the words LOOK UP!  One image, drawn from scratch in code: own PNG
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
const rand = mulberry32(0xC0FFEE);

// ---------- pixel buffer ----------
const buf = Buffer.alloc(W * H * 3);
function setPx(x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
}
function blendPx(x, y, r, g, b, a) {
  if (a <= 0) return;
  if (a >= 1) { setPx(x, y, r, g, b); return; }
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = Math.round(buf[i] * (1 - a) + r * a);
  buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + g * a);
  buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + b * a);
}
function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }
function lerp(a, b, t) { return a + (b - a) * t; }

// Vertical gradient across the whole canvas.
function vgrad(stops) {
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1);
    let s = 0;
    while (s < stops.length - 2 && t > stops[s + 1][0]) s++;
    const [t0, c0] = stops[s];
    const [t1, c1] = stops[s + 1];
    const f = (t - t0) / (t1 - t0);
    const r = clamp255(lerp(c0[0], c1[0], f));
    const g = clamp255(lerp(c0[1], c1[1], f));
    const b = clamp255(lerp(c0[2], c1[2], f));
    for (let x = 0; x < W; x++) setPx(x, y, r, g, b);
  }
}

function circle(cx, cy, r, col, alpha = 1) {
  const [cr, cg, cb] = col;
  const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    const dx = Math.sqrt(Math.max(0, r * r - dy * dy));
    for (let x = Math.max(x0, Math.ceil(cx - dx)); x <= Math.min(x1, Math.floor(cx + dx)); x++) {
      blendPx(x, y, cr, cg, cb, alpha);
    }
  }
}

function ellipse(cx, cy, rx, ry, col, alpha = 1) {
  const [cr, cg, cb] = col;
  const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(W - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(H - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    const dy = (y - cy) / ry;
    const dx = rx * Math.sqrt(Math.max(0, 1 - dy * dy));
    for (let x = Math.max(x0, Math.ceil(cx - dx)); x <= Math.min(x1, Math.floor(cx + dx)); x++) {
      blendPx(x, y, cr, cg, cb, alpha);
    }
  }
}

// Soft radial glow: concentric circles fading out.
function glow(cx, cy, r, col, peak = 0.55) {
  const steps = 44;
  for (let i = steps; i >= 1; i--) {
    const f = i / steps;
    circle(cx, cy, r * f, col, peak * (1 - f) * 0.5);
  }
}

// Bresenham line with round caps via small circles at each step.
function line(x0, y0, x1, y1, col, thick = 1, alpha = 1) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const n = steps === 0 ? 1 : steps;
  const rad = Math.max(1, thick / 2);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + (dx * i) / n);
    const y = Math.round(y0 + (dy * i) / n);
    circle(x, y, rad, col, alpha);
  }
}

// Scanline polygon fill (even-odd), integer friendly.
function poly(points, col, alpha = 1) {
  const [cr, cg, cb] = col;
  let minY = H, maxY = 0;
  for (const [, y] of points) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
  minY = Math.max(0, Math.floor(minY)); maxY = Math.min(H - 1, Math.ceil(maxY));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.ceil(xs[k])), xb = Math.min(W - 1, Math.floor(xs[k + 1]));
      for (let x = xa; x <= xb; x++) blendPx(x, y, cr, cg, cb, alpha);
    }
  }
}

// ---------- 5x7 block font (own letterforms) ----------
const GLYPHS = {
  "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};
function drawText(str, x, y, scale, col, outlineCol = null) {
  const draw = (ox, oy, c) => {
    let cx = x + ox;
    for (const ch of str) {
      const g = GLYPHS[ch] || GLYPHS[" "];
      for (let r = 0; r < 7; r++) {
        for (let cc = 0; cc < 5; cc++) {
          if (g[r][cc] === "#") {
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                setPx(cx + cc * scale + dx + ox, y + r * scale + dy + oy, c[0], c[1], c[2]);
              }
            }
          }
        }
      }
      cx += 6 * scale;
    }
  };
  if (outlineCol) {
    const o = Math.max(2, Math.round(scale / 5));
    for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]]) draw(ox, oy, outlineCol);
  }
  draw(0, 0, col);
}
function textWidth(str, scale) { return str.length * 6 * scale - scale; }

// ---------- minimal PNG encoder (zlib from stdlib) ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePNG() {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---------- scene ----------
const SKY = [[0, [36, 26, 77]], [0.45, [91, 42, 99]], [0.72, [198, 90, 74]], [1, [255, 138, 61]]];
const WHALE = [49, 85, 126];
const BELLY = [185, 210, 234];
const RIM = [255, 179, 71];
const CITY = [23, 16, 46];
const INK = [16, 14, 38];
const SUN = [255, 215, 106];

function quadBezier(p0, p1, p2, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
          u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}
function spinePoint(t) {
  return quadBezier([250, 560], [480, 380], [720, 320], t);
}
function spineWidth(t) {
  // narrow tail, fat middle, rounded head
  return 14 + 100 * Math.pow(Math.sin(Math.PI * (0.12 + 0.76 * t)), 0.9);
}
function spineNormal(t) {
  const a = spinePoint(Math.max(0, t - 0.02));
  const b = spinePoint(Math.min(1, t + 0.02));
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [-dy / len, dx / len]; // "up" side is negative y here
}

// Body as a tapered polygon along the spine.
function whaleBody() {
  const top = [], bot = [];
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y] = spinePoint(t);
    const [nx, ny] = spineNormal(t);
    const w = spineWidth(t);
    top.push([x + nx * w, y + ny * w]);
    bot.push([x - nx * w, y - ny * w]);
  }
  poly([...top, ...bot.reverse()], WHALE);
  // belly: lower strip, lighter (the "down" side of the spine)
  const bTop = [], bBot = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y] = spinePoint(t);
    const [nx, ny] = spineNormal(t);
    const w = spineWidth(t);
    bTop.push([x + nx * w * 0.25, y + ny * w * 0.25]);
    bBot.push([x + nx * w * 0.95, y + ny * w * 0.95]);
  }
  poly([...bTop, ...bBot.reverse()], BELLY, 0.92);
  // sunset rim light: a thin strip along the upper edge only
  const rTop = [], rBot = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y] = spinePoint(t);
    const [nx, ny] = spineNormal(t);
    const w = spineWidth(t);
    rTop.push([x - nx * w * 1.0, y - ny * w * 1.0]);
    rBot.push([x - nx * w * 0.82, y - ny * w * 0.82]);
  }
  poly([...rTop, ...rBot.reverse()], RIM, 0.85);
}

function tailFlukes() {
  const [tx, ty] = spinePoint(0);
  // upper fluke: broad, sweeping up-left
  poly([[tx + 8, ty - 10], [118, 428], [168, 512], [196, 552], [tx + 4, ty + 2]], WHALE);
  // lower fluke: broad, sweeping down-left
  poly([[tx + 4, ty + 8], [136, 668], [186, 586], [210, 560], [tx + 10, ty + 12]], WHALE);
  // rim light on the flukes' upper edges
  line(tx + 6, ty - 8, 122, 430, RIM, 4, 0.8);
}

function pectoralFin() {
  poly([[418, 512], [398, 648], [452, 672], [486, 566]], WHALE);
  line(418, 514, 402, 644, RIM, 4, 0.7);
}

function whaleFace() {
  // eye + glint
  circle(662, 344, 9, INK);
  circle(665, 341, 3, [255, 255, 255]);
  // smile line
  line(704, 358, 662, 382, INK, 5);
  // spout: a fan of droplets rising from the blowhole, no stems
  circle(672, 286, 7, [255, 255, 255], 0.85);
  circle(690, 266, 6, [255, 255, 255], 0.7);
  circle(706, 246, 5, [255, 255, 255], 0.55);
  circle(658, 268, 4, [255, 255, 255], 0.6);
  circle(716, 268, 4, [255, 255, 255], 0.5);
}

function surfer() {
  // tiny rider standing on the whale's back, one arm raised.
  // Cream silhouette so it pops against the dark blue back.
  const C = [255, 240, 200];
  line(424, 324, 486, 314, C, 7); // board
  line(452, 320, 447, 297, C, 6); // back leg
  line(452, 320, 463, 299, C, 6); // front leg
  line(454, 299, 457, 279, C, 7); // torso
  circle(458, 270, 7, C); // head
  line(456, 284, 438, 268, C, 5); // raised arm
  line(456, 286, 472, 291, C, 5); // other arm
}

function city() {
  let x = -10;
  while (x < W + 10) {
    const bw = 44 + Math.floor(rand() * 52);
    const bh = 70 + Math.floor(rand() * 190);
    const top = 1024 - bh;
    for (let yy = top; yy < H; yy++) for (let xx = x; xx < x + bw && xx < W; xx++) setPx(xx, yy, CITY[0], CITY[1], CITY[2]);
    // lit windows
    for (let wy = top + 14; wy < H - 14; wy += 22) {
      for (let wx = x + 10; wx < x + bw - 10; wx += 18) {
        if (rand() < 0.38) {
          const warm = rand() < 0.7 ? [255, 205, 110] : [255, 150, 70];
          for (let dy = 0; dy < 9; dy++) for (let dx = 0; dx < 7; dx++) setPx(wx + dx, wy + dy, warm[0], warm[1], warm[2]);
        }
      }
    }
    // rooftop antenna on some towers
    if (rand() < 0.4) {
      line(x + bw / 2, top, x + bw / 2, top - 22, CITY, 3);
      circle(x + bw / 2, top - 26, 3, [255, 90, 70]);
    }
    x += bw + 4 + Math.floor(rand() * 10);
  }
}

function birds() {
  const spots = [[180, 210], [230, 178], [830, 220], [880, 190], [120, 300], [940, 300]];
  for (const [bx, by] of spots) {
    line(bx - 12, by, bx, by - 7, INK, 3);
    line(bx, by - 7, bx + 12, by, INK, 3);
  }
}

function streaks() {
  const s = [
    [238, 566, 96, 648, 5], [258, 596, 118, 682, 4], [224, 540, 104, 600, 4],
    [286, 620, 168, 700, 3], [200, 512, 92, 566, 3],
  ];
  for (const [x0, y0, x1, y1, t] of s) line(x0, y0, x1, y1, [255, 255, 255], t, 0.28);
}

function draw() {
  vgrad(SKY);
  // stars in the upper sky
  for (let i = 0; i < 110; i++) {
    const sx = Math.floor(rand() * W), sy = Math.floor(rand() * 400);
    const a = 0.35 + rand() * 0.55;
    circle(sx, sy, rand() < 0.12 ? 2 : 1, [255, 255, 255], a);
  }
  // clouds: thin, warm, barely there
  ellipse(200, 200, 190, 20, [255, 170, 140], 0.08);
  ellipse(820, 160, 220, 22, [255, 170, 140], 0.07);
  ellipse(560, 250, 150, 16, [255, 180, 150], 0.06);
  // sun + glow, low on the right
  glow(800, 640, 200, [255, 150, 70], 0.5);
  circle(800, 640, 62, SUN);
  circle(800, 640, 46, [255, 232, 160]);
  // motion streaks behind the whale
  streaks();
  // the whale
  tailFlukes();
  whaleBody();
  pectoralFin();
  whaleFace();
  surfer();
  // city at the bottom
  city();
  // birds scattering
  birds();
  // the words, top centre
  const scale = 15;
  const tw = textWidth("LOOK UP!", scale);
  drawText("LOOK UP!", Math.round((W - tw) / 2), 46, scale, [255, 224, 102], [36, 26, 77]);
}

function main() {
  draw();
  const png = encodePNG();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "entry.png");
  fs.writeFileSync(out, png);
  console.log(`wrote ${out} ${png.length} bytes ${W}x${H}`);
}

main();
