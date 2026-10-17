---
title: "M2 in progress: one server for everyone"
date: 2026-10-18
milestone: 2
description: "Solo and multiplayer now run on one code path: your own game is a client of a server in the same process."
cover: /game/shots/peers.webp
---

M2 is the milestone most block games put off and regret: networking. In
RustingCraft there is no separate single-player mode. When you play alone, a
server runs inside your game and you are its first client.

## What works now

- **A protocol.** Fifteen messages with a compact little-endian encoding.
  The decoder refuses anything it does not expect: truncated messages,
  trailing bytes, lengths over the cap, NaN numbers.
- **Shared movement.** Client and server run the same movement code, and a
  test pins its result to the bit.
- **The server checks everything.** It refuses a client whose game data does
  not match, runs at most one input per tick on average (a review caught a
  double-speed hack), and judges every break and place request on rate,
  reach, line of sight, the block and its face.
- **Chunk streaming per player.** Nearest chunk first, under a byte budget per
  player. A chunk is about 4.6 KB on the wire.
- **Prediction.** Your own player moves at once, and the server corrects it.
  Walking and jumping with no lag needs no corrections at all; a 10 cm
  correction smooths out in about six ticks.

## What is next

A test at a 150 ms round trip with 2% packet loss, then a dedicated server,
then two people building the same house.

M2 is at iteration 6 of 12.
