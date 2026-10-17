---
title: "M0: a block you can break"
date: 2026-10-17
milestone: 0
description: "The first milestone proves the voxel path on RustingEngine: meshed sections, walking, breaking and placing."
cover: /game/shots/terrain.webp
video: /game/M0.mp4
---

RustingCraft starts the way every block game starts: a field of grass, and a
block under the crosshair that has to go away when you click it.

## What was built

- A 9 × 9 chunk field of gentle grass hills, meshed by game code into
  16 × 16 × 16 sections with face culling, a texture atlas and
  Minecraft-style ambient occlusion at every vertex.
- Walking with WASD, running with Shift, jumping with Space, and mouse look.
  Collision is a box against the voxel grid, written in the game, not in the
  physics engine.
- Left click breaks the block under the crosshair, right click places stone.
  The changed section is meshed again and uploaded in the same frame.

## What it measured

Release build, RTX 3060, headless 1280 × 720:

| Measure | Result |
|---|---|
| Mesh one 16³ section | 0.06 ms (budget 2 ms) |
| 81 chunks, frame p95 | 3.5 ms |
| 225 chunks, frame p95 | 5.5 ms |
| GPU p50 at 225 chunks | 0.45 ms, 185k triangles |

## What broke, or still looks wrong

1. The sky is flat dark blue with no fog, so the edge of the world ends in a
   hard line.
2. Distant grass shimmers into noise: the atlas has no mipmaps yet.
3. It is one endless grass plain. No stone, trees or water. That is M1.

M0 took four of its six planned iterations.
