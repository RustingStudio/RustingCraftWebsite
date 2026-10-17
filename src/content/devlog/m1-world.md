---
title: "M1: a world that goes on"
date: 2026-10-17
milestone: 1
description: "Terrain, biomes, caves, ores, trees, streaming, light, day and night, water and saves."
cover: /game/shots/forest.webp
video: /game/M1.mp4
---

M1 turns the grass field into a world: endless, seeded, and saved.

## What was built

- **Terrain.** A continentalness curve, erosion and ridged hills. The land
  rises past 700 m from spawn into the second ring, where the mountains are.
  Sea level is 64; shores get sand and gravel.
- **Biomes.** Meadow, forest and birch forest in the first ring; hills,
  mountains and pine taiga in the second; ocean and beach by height. Biomes
  blend over 10 blocks, and a test walks 2 km to check that no two
  neighbouring columns differ by more than 4 blocks.
- **Trees and plants.** Oak, birch and pine. Each chunk also grows its
  neighbours' trees, so a crown is never cut at a chunk border. Tall grass,
  bluebells and marigolds as cross-shaped plants.
- **Caves and ores.** Cheese caves that open up with depth, spaghetti
  tunnels, and coal, copper, tin and iron veins at the heights in the design.
- **Light.** Sky light and block light, flood-filled and smoothed per vertex.
  Editing a block relights a box around it, and a unit test checks that this
  gives the same result as relighting everything.
- **Streaming.** Worker threads generate, light and mesh chunks nearest
  first, out to a view distance of 8 chunks.
- **Day and night.** A 20-minute day, a sun that warms near the horizon, a
  moon, height fog and exposure that follows the light.
- **Water and saves.** Still water, and region files of 32 × 32 chunks
  written atomically every two minutes and on quit.

## What it measured

Release build, RTX 3060, view distance 8:

| Measure | Result |
|---|---|
| First load at spawn | 441 chunks generated, 289 meshed, 4.5 s |
| Streaming at a sprint, frame p95 | 5.9 ms |
| GPU p50 while streaming | 1.16 ms |
| Triangles after dark-quad culling | 1.7 M down to 0.61 M |

Dark-quad culling was the big win of the milestone. Faces that no light
reaches (cave walls deep in the ground) are sorted to the end of each mesh,
and sections more than two chunks away draw only the lit part. GPU time in
the worst scene fell from 26 ms to 3.7 ms.

## What broke, or still looks wrong

1. Water and sky wash out to pale white at the shore, and the water shows its
   block grid.
2. Leaves are opaque boxes, and early night is nearly black before the moon
   rises.
3. There is no block highlight, crack, particles or sound yet. Everything
   in the game is silent.

M1 took 13 of its 12 planned iterations, inside the allowed two over.
