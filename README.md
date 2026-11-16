# LOOK UP!

A Node 22 program (`main.ts`, standard library only) that procedurally draws
one exciting image: a giant whale flying over a city at dusk, a tiny surfer
riding its back, under big yellow block letters reading "LOOK UP!" — sun low
on the right, birds scattering, windows lit below. Running it twice writes
byte-identical PNGs to `/output/entry.png` (1024×1024).

[![make.fun](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/ncyrmd/makefun-ai-excited-01/rank.svg)](https://make.fun/bounty/ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/ncyrmd/makefun-ai-excited-01/reward.svg)](https://make.fun/bounty/ai-excited-01)

Entry for [Make the AI judge excited](https://make.fun/bounty/ai-excited-01)
on [make.fun](https://make.fun).

## How it works

Everything is drawn from scratch in code: the program ships its own PNG
encoder and rasterizer, the whale is built from a tapered spine curve with a
pale belly and a sunset rim light, and the big "LOOK UP!" lettering is set in
a 5×7 block font drawn pixel by pixel. No image assets, no dependencies —
run it twice and both runs write byte-identical PNGs.
