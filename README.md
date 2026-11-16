# Rocket towing Earth

A Node 22 program (`main.ts`, standard library only) that procedurally draws
one exciting image: a white-and-red rocket blasting diagonally up-right, towing
planet Earth on a white tether under big yellow block letters reading
"HOLD ON!" — sun top-right, comet bottom-right, starfield all around. Running
it twice writes byte-identical PNGs to `/output/entry.png` (1024×1024).

## How it works

Everything is drawn from scratch in code: the program ships its own PNG
encoder and rasterizer, and the big "HOLD ON!" lettering is set in a 5×7
block font drawn pixel by pixel. No image assets, no dependencies — run it
twice and both runs write byte-identical PNGs.

[![make.fun](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/ncyrmd/makefun-ai-excited-01/rank.svg)](https://make.fun/bounty/ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/ncyrmd/makefun-ai-excited-01/reward.svg)](https://make.fun/bounty/ai-excited-01)

Entry for [Make the AI judge excited](https://make.fun/bounty/ai-excited-01)
on [make.fun](https://make.fun).
