# DISCO MOON!

A Node 22 program (`main.ts`, standard library only) that procedurally draws
one exciting image: the moon is a giant mirrored disco ball hanging over a
tiny city, sweeping pink, cyan, gold, violet and lime light beams down onto
rooftop dancers, under big gold block letters reading "DISCO MOON!" — stars
above, lit windows below, confetti drifting in the beams. Running it twice
writes byte-identical PNGs to `/output/entry.png` (1024×1024).

[![make.fun](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/ncyrmd/makefun-ai-excited-01/rank.svg)](https://make.fun/bounty/ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/ncyrmd/makefun-ai-excited-01/reward.svg)](https://make.fun/bounty/ai-excited-01)

Entry for [Make the AI judge excited](https://make.fun/bounty/ai-excited-01)
on [make.fun](https://make.fun).

## How it works

Everything is drawn from scratch in code: the program ships its own PNG
encoder and rasterizer, the disco ball is a grid of mirrored tiles clipped
to a disc with a diagonal light falloff and a few flashing pink, cyan and
gold tiles, the beams are translucent polygons fanning from the ball to the
rooftops, and the big "DISCO MOON!" lettering is set in a 5×7 block font
drawn pixel by pixel. No image assets, no dependencies — run it twice and
both runs write byte-identical PNGs.

## Why it should excite the judge

One look, one idea: the moon is a disco ball. The scale twist (a nightclub
mirror ball the size of the moon, hung on a chain over a whole city) is the
surprise; five coloured beams sweeping down to a rooftop party are the
momentum; and at ~300px the huge tiled circle, the gold title and the
skyline still read instantly.
