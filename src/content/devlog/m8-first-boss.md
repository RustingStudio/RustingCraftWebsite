---
title: "M8 done: the Thornback"
date: 2026-10-18
milestone: 8
description: "The first boss: an altar in a stone-brick arena, an offering, three attacks, a trophy and the gate to iron."
cover: /game/shots/thornback.webp
---

M8 adds the first boss, and with it the end of the MVP: from punching a tree
to killing the Thornback.

## What works now

- **The altar.** Worldgen builds a stone-brick arena with an altar 160 to
  400 m from spawn.
- **The offering.** Right click the altar with 8 raw meat and 4 berries. The
  server checks your reach, the offering and the players inside the 64 m
  leash, then summons the Thornback. It has 400 health, and 60% more per extra
  player.
- **Three attacks.** A tusk sweep (3.5 m, 120°), a charge from 5 to 20 m away
  after a 1 s wind-up, and, below half health, a thorn ring 6 m wide every
  8 s.
- **Leash.** If everyone leaves for 30 s, it resets to full health.
- **The reward.** Everyone who hit it gets a Thornback Trophy and discovery
  XP. Your first kill gives +3 skill points. Raw iron, bronze and leather
  spill on the ground.
- **The iron gate.** The trophy and Smithing 10 open iron ingots and the iron
  pickaxe.

With M8, the MVP sprint closed M3 to M8 in one day. The suite stood at 303
tests, and during a scripted boss fight in a release build, 95% of game
ticks took 3.6 ms or less.

## What still looks rough

When the boss closes to melee, the camera ends up inside it. The Thornback is
a dark box with no thorns or animation yet, and the kill has no death effect.
M9, First Nights, is next.
