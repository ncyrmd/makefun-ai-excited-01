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
