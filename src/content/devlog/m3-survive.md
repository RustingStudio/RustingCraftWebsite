---
title: "M3 done: punch a tree, earn a pickaxe"
date: 2026-10-18
milestone: 3
description: "Survival on top of the multiplayer world: tools and tiers, items on the ground, crafting, health and hunger, and a grave when you die."
cover: /game/shots/hotbar.webp
---

M3 turns the shared world into a survival game. Every request still goes
through the server: selecting a slot, moving an item, dropping, crafting,
using a block, respawning.

## What works now

- **Breaking by tool.** Crack time depends on the held tool's kind and tier.
  Logs come out by hand, gravel sometimes gives flint, and stone and coal need
  a pickaxe.
- **Items in the world.** Drops lie on the ground until someone picks them up.
  You carry 27 slots, a 9-slot hotbar and an offhand.
- **A recipe book.** It has search and a "can craft" filter. A greyed recipe
  says what it is missing: an item, a station or a locked skill.
- **Stations.** A crude workbench, torches and a campfire.
- **Vitals.** Health and hunger, fall damage and lava.
- **Death.** You leave a grave with every item. Only you can open it for
  10 minutes, and you respawn at your bed.

A scripted test plays the first ten minutes, from logs to a flint pickaxe,
torches and a campfire. The suite stood at 91 tests when M3 closed.

## What still looks rough

Item icons are a colour square and two letters, so flint and the flint
pickaxe both read "Fl". You do not see the tool in your hand, and the old
help line from M0 still runs across the top of the screen.
