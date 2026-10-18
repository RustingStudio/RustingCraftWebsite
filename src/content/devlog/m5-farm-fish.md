---
title: "M5 done: farm, fish, eat"
date: 2026-10-18
milestone: 5
description: "Crops that grow by moisture, a cast-bite-reel fishing loop, food with buffs, and golden harvests."
cover: /game/shots/farm.webp
---

M5 gives the Harvest, Fishing and Cooking trees something to do.

## What works now

- **Farming.** A hoe tills soil, seeds go on farmland, and crops grow on every
  server tick while water is within 4 blocks. Wheat, carrots, potatoes and
  berries are in. A ripe crop can roll golden.
- **Harvest perks.** Wide Hoe tills a row, Reaper adds yield, and Careful
  Hands replants for you.
- **Fishing.** With a rod in hand, cast at water. A bite gives a short hook
  window, then a reel bar: hold to lift the green zone onto the fish. Rivers
  and lakes have their own catch tables, from old boots to golden carp.
- **Food and buffs.** Eat from the hotbar for hunger and up to 2 buffs. A new
  buff replaces the oldest, and eating the same one refreshes it. Raw meat and
  raw fish can poison you.
- **Catch-up.** Crops in chunks nobody has loaded catch up on up to 3 hours of
  growth.

The server checks range, rate and ids on every cast, reel, eat, till and
plant. The suite stood at 200 tests when M5 closed.

## What still looks rough

Fishing has no rod, line or bobber in the world yet: only the reel bar shows
that something is hooked. From eye height, a wheat field reads as a wall of
giant stalks.
