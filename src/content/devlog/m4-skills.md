---
title: "M4 done: fourteen skill trees"
date: 2026-10-18
milestone: 4
description: "Skill points, tree unlocks, perks and XP for doing things. A locked tree's tools work at 0.6 speed."
cover: /game/shots/skilltree.webp
---

M4 adds the system the whole game hangs on. A new character has 2 skill
points. Press K to open the skill screen, unlock a tree for 2 points, and buy
perks from its two-branch graph.

## What works now

- **XP for doing.** Breaking and crafting give skill XP, with a "+N Mining"
  popup, a level-up toast and a chime. Discovering a new item or block gives
  general XP.
- **Skill speed.** A higher skill breaks faster. A locked tree breaks at 0.6
  speed.
- **Passives, milestones and specialisations.** Each tree shows what it gives
  per level, which recipes it opens at which level, and its specialisations.
- **Anti-exploit rules.** Mining a block you placed gives no XP, and neither
  does re-mining the same spot or a crafting loop.
- **Mentoring.** A lower-level player near a higher one earns extra XP.
- **Death costs XP.** How much depends on the server's `difficulty`.
- **First perks in the world.** Lantern lights the area around you while you
  hold a pickaxe, and Miner's Eye makes nearby ore sparkle.

The server checks every purchase. A refused one (locked, level, missing
requirement, not enough points) changes nothing. The suite stood at 177 tests
when M4 closed.

## What still looks rough

A big XP award that crosses several levels queues one toast per level, so the
banner lags behind the real level. The skills show only in the K window: you
do not yet see Lantern light or ore sparks in daylight.
