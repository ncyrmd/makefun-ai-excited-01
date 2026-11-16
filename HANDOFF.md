# ai-excited-01 v1 — HANDOFF

Code commit: `c98cdb005e77d0181a5f1fb7ed4f13ed1336cd8b` ("v1: rocket towing Earth")

## Image concept (3 lines)
A white-and-red rocket blasts diagonally up-right across a starfield, its
three-layer flame roaring, towing the whole planet Earth behind it on a
white tether tied to its fin — under the big yellow block letters HOLD ON!
A glowing sun burns top-right, a comet dives in bottom-right, and a tiny
astronaut watches from the rocket's porthole window.

## Output stats
- File: `entry.png`, 1024x1024, RGBA PNG, **173,689 bytes** (limit 1,048,576)
- sha256: `4f33169781c258f027cdfcaead0ca571c9508c402babae8137966217a6fff236`
- Two-run byte-identical check: PASS — two separate runs
  (`MAKEFUN_OUTPUT_DIR=out1` / `out2`, `node main.ts`) produced identical
  sha256 hashes. Deterministic: fixed mulberry32 seed, no clock, no env
  variation (only the kit's output-dir variable). Runtime ~2 s per run.

## What I saw when I viewed the image
- Full size: clean bold vector-style scene. "HOLD ON!" reads perfectly in
  large yellow block letters with a dark outline; the rocket is the dominant
  shape, white body with red nose tip, red bands and red fins; the layered
  orange/yellow/white flame is bright and clearly separated from the body;
  Earth (blue ocean, green continents, white clouds) sits bottom-left with
  the white tether curving visibly up to the rocket's left fin; sun top-right
  with a warm glow; comet bottom-right with a pale tail.
- At 300px (downscaled check): the idea still reads at a glance — text,
  rocket diagonal, flame, Earth circle and tether are all clear.

## Polish pass (in-session, after the recording started)
- Porthole fix: the old helmet + offset visor inside the window read as a
  giant cartoon eye at full size. Replaced with a clean round glass window
  — dark navy disc [14,28,66] inside the silver ring, with a small white
  crescent highlight tucked at its upper-left edge (white disc re-covered
  by a navy disc offset down-right). No astronaut, no pupil, no face.
  Concept line above ("astronaut watches from the porthole") no longer
  applies; the known-defect bullet about the eye/visor is fixed by this.
- Re-verified like the grader: two runs (`MAKEFUN_OUTPUT_DIR=/tmp/exc-polish1`
  / `/tmp/exc-polish2`, `node main.ts`) byte-identical, sha256
  `268f3a9565ef8205871828038b1cd4e4c2b733c9ec4eb0f20046e756b204f302`,
  173,402 bytes (≤1 MiB), 1024x1024. Viewed full size and a 3x zoom of the
  window: the disc reads as glass with a crescent glint, everything else
  (rocket, flame, tether, Earth, text, sun, comet, starfield) unchanged.

## Revision history
- v1 draft: tether attached near the tail and was hidden behind the flame,
  so it looked like the flame was towing Earth; nebula blobs were flat
  hard-edged ellipses that read as stickers.
- Fixed in a second edit pass: tether re-routed to a lug on the left fin
  (clear of the flame), nebula blobs replaced with soft radial glows, comet
  added to fill the empty lower-right, astronaut visor enlarged slightly.
  Re-ran twice, re-verified byte-identical, re-viewed at full size and 300px.

## Known defects
- The tether passes close to the flame's left edge mid-curve (clear of it,
  but only by ~20px at one point) — at a glance it could briefly read as
  touching the flame.
- The astronaut in the porthole is tiny; the offset visor makes a crescent
  shape that reads more like an eye/moon than a helmet at full size.
- Middle-right of the frame is relatively empty (stars and speed streaks
  only) — deliberate breathing room, but a denser field would be busier.
- The "!" sits close to the sun's glow (no overlap, ~7px gap).
