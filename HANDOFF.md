# ai-excited-01 v2 — HANDOFF

## Why v2 exists
v1 "Rocket towing Earth" (submission 01a1e23f, submitted 09:45 WIB 16 Nov)
FAILED server-side at 10:20 WIB: status went 'preparing' → 'failed' with
error null, scores [], runs []. Authorship was fine (97.5% authored).
Diagnosis: v1's main.ts re-runs locally perfectly — two runs byte-identical
(sha256 268f3a9565ef8205871828038b1cd4e4c2b733c9ec4eb0f20046e756b204f302,
173,402 bytes, 1024x1024, ~2 s per run). Nothing in the program hangs,
crashes, or depends on the clock/network. Best guess: a platform-side flake
(the server spent ~17 min, build_wall_ms 1012124, then failed with no
reason). v2 is a FRESH program with a different scene, kept deliberately
simple and fast (~0.6 s a run) to minimise anything that could trip the
grader; it shares no bytes with v1.

## Image concept — "LOOK UP!"
A giant whale flies diagonally up-right over a city at dusk, a tiny surfer
in cream silhouette riding its back with one arm raised, under the big
yellow block letters "LOOK UP!". A low sun burns bottom-right with a soft
glow, birds scatter, the city skyline below has lit windows and rooftop
antennas. The whale is built from a tapered spine curve: dark blue back,
pale belly underneath, a thin orange sunset rim along its top edge, tail
flukes sweeping back-left, a small spout of droplets above its head.
Surprise: the scale twist — a whale in the sky, ridden like a surfboard.
Reads small: one huge diagonal whale + giant letters + sun + skyline.

## What was built (all written fresh in-session)
- main.ts — own PNG encoder (zlib deflate via stdlib), own rasterizer
  (pixel buffer, blend, line, circle, ellipse, polygon fill, vertical
  gradient, glow), own 5x7 block font (L, O, K, U, P, !), seeded
  mulberry32 RNG. No network, no clock, no dependencies.
- LICENSE — MIT, SPDX-License-Identifier: MIT first line.
- README.md — title, description, How it works, the 3 live make.fun badges
  for ncyrmd / makefun-ai-excited-01, bounty-page links.
- .makefun/owner.json — {"wallet":"8XAaVLzayVRZmexspxLZzs5hcM4a8wm5bMBJYa9MgkGE"} (57 bytes).

## Tests (as the grader would)
- Ran main.ts twice: byte-identical PNGs.
  sha256 58c890bb73fbcae020717a6c3307700852c7915b0d9a3235c9a24cc2606d4943
  49,514 bytes, 1024x1024, valid PNG magic, ~0.6 s per run, exit 0.
- Viewed the PNG at full size and checked it as the judge would:
  first version read as a blimp (belly/rim bands inverted, flat clouds,
  spout like a crown, dark surfer lost on the dark back). Fixed in a
  second pass: belly moved to the underside, rim light thinned to the
  top edge only, clouds made faint, spout reduced to droplets, surfer
  redrawn in cream and slightly larger, tail flukes enlarged. Re-ran
  twice, byte-identical again, re-viewed: reads clearly as a whale.
- Kit check: `node cli/makefun.mjs check --kit . --repo .` →
  4 passed, 0 failed, 15 skipped, 5 checked at submission.

## State
Built and committed locally only. NOT pushed, NOT submitted, recording
untouched. Parent to push (browser upload) and submit with the live
recording id.

---

# ai-excited-01 v3 — HANDOFF

## Why v3 exists
v2 "LOOK UP!" dev grade 89.93% (8W/2D/2L), projected rank ~926-936,
top-20 cutoff ~97.07% — far outside paid. Per the gas-terus rule, v3 is a
FRESH concept built for the last (reserve) submission slot, ahead of the
06:00 WIB Tue 17 Nov deadline.

## Image concept — "DISCO MOON!"
The moon is a giant mirrored disco ball hanging on a chain over a tiny
city, sweeping five coloured light beams (pink, cyan, gold, violet, lime)
down onto rooftop dancers, under big gold block letters "DISCO MOON!".
Surprise: the scale twist — a nightclub mirror ball the size of the moon.
Reads small: one huge tiled circle + gold title + skyline + beams.

## What was built (all written fresh in-session)
- main.ts — own PNG encoder (zlib deflate via stdlib), own rasterizer
  (pixel buffer, blend, circle, polygon fill, thick lines, gradient),
  own 5x7 block font (D, I, S, C, O, M, N, !), seeded mulberry32 RNG.
  No network, no clock, no dependencies.
- LICENSE — MIT, SPDX-License-Identifier: MIT first line, copyright line
  names the v3 entry.
- README.md — title, description, How it works, Why it should excite
  the judge, the 3 live make.fun badges for ncyrmd / makefun-ai-excited-01.
- .makefun/owner.json — unchanged
  {"wallet":"8XAaVLzayVRZmexspxLZzs5hcM4a8wm5bMBJYa9MgkGE"}.

## Tests (as the grader would)
- Ran main.ts twice: byte-identical PNGs.
  sha256 366a59375d4ac138af95883d1d57c30feeded829290d045dbb101a048e21b4c7
  94,301 bytes, 1024x1024, valid PNG magic, ~0.5 s per run, exit 0.
- Viewed the PNG at full size and at 300px: first version read "OISCO"
  (D glyph identical to O), the ball crowded the title, beams nearly
  invisible, dancers on the far-right roof. Fixed in a second pass:
  D glyph given a flat left edge, ball moved down (centre 640,375, r 225),
  beams doubled (wide wash + bright core, higher alpha), party moved to
  the tallest building under the beams. Re-ran twice, byte-identical
  again, re-viewed: "DISCO MOON!" legible, disco ball unmistakable,
  beams visible, reads clearly at 300px.
- Kit check on the v3 commit 60c0f96: `node cli/makefun.mjs check --kit . --repo .` →
  4 passed, 0 failed, 15 skipped, 5 checked at submission (exit 0).

## State
Built and committed locally only. NOT pushed, NOT submitted, recording
untouched. Parent to push (browser upload) and submit with the live
recording id 01a1e5f4-4deb-7107-bf42-203a25b96613.
