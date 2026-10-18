---
title: "M6 done: something walks at night"
date: 2026-10-18
milestone: 6
description: "Hollows, bone archers and cave spiders, melee with crits and blocks, bows with arrow drop, and animals to hunt and breed."
cover: /game/shots/nightfight.webp
---

M6 makes the night dangerous. Hostile mobs spawn where the light is 7 or
lower and path to you. Walkers walk and spiders climb.

## What works now

- **Hostiles.** The Hollow is a melee walker that burns in sunlight. The Bone
  Archer keeps 8 to 15 m away and shoots. The Cave Spider climbs walls and
  poisons.
- **Animals.** Chickens, sheep, pigs and cows wander, eat breed food, and
  chickens lay eggs.
- **Melee.** Left click swings when a mob is in reach, with crits, knockback
  and Attack XP. Raise a shield with right click to block. A perfect block
  staggers the mob and gives Defense XP.
- **Bows.** Hold right click to draw and release to loose. The server flies
  the arrow with drop. Hits give Archery XP, and you can pick arrows up again.
- **Loot.** Killed mobs spill their drops, and the killer gets Hunting XP.

The server checks every swing, guard, draw and loose. A client's swing is
judged against where the mobs were 4 ticks earlier, to allow for lag. The
suite stood at 251 tests when M6 closed.

## What still looks rough

Nothing of the fight is in your hands yet: no club, shield or bow in view and
no swing animation. At night a Hollow is a black box in a black wood, and only
its green eyes read.
