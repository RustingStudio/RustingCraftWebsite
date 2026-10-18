# RustingCraft website: spec

The game site for RustingCraft (working title in the plan: HEARTHBLOCK), at
`https://mc.rustingstudio.com`. It follows the RustingStudio brand
(`../RustingStudioWebSite`): dark surface, cream ink, 45° chamfers, no
radius, Chakra Petch / IBM Plex Sans / JetBrains Mono, mono kickers with an
accent dash, measured numbers with the hardware named.

## 1. Structure

| Route | What |
|---|---|
| `/` | Home: nine full-height sections, each one biome of the game |
| `/download/` | Coming soon, platforms, what the first build will contain |
| `/devlog/`, `/devlog/<slug>/` | Milestone posts (English for every locale) |
| `/roadmap/` | Pass A milestones M0–M9 and Pass B, status from `PROGRESS.md` |
| `/wiki/`, `/wiki/guide/`, `/wiki/<section>/` | Getting started; blocks, items, crafting, survival, farming, mobs, bosses, skills from game data; world from the BIBLE |
| `/server/` | Solo, dedicated, join; run commands and `server.json` |
| `/media/` | Captures and showcase videos from the game |

Every route exists three times: English at `/`, German at `/de/`, Russian at
`/ru/`. One page file per route under `src/pages/[...locale]/`;
`getStaticPaths` returns `undefined` (English), `de` and `ru`. Interface and
page copy live in `src/i18n/{en,de,ru}.json`. Game data text stays English
until the game ships its own `de` and `ru` locales (BIBLE §21); the DE and
RU wiki pages say so.

Home sections and their biome (`data-biome` picks the 3D island,
`data-theme` the accent colour):

1. Hero, meadow
2. Skills, forest
3. World and rings, mountain
4. Farm, fish, cook, lake
5. Co-op, taiga at night
6. Mobs and combat, bog
7. Bosses and tier gates, frost
8. Graphics, the Deep
9. Roadmap and download, meadow at sunset

## 2. Look and 3D

- One fixed full-screen Three.js canvas behind the page (`src/scene/`).
  Three.js loads after first paint (dynamic import on idle).
- The section nearest the middle of the viewport is active. Its island
  rises, the old one sinks, and sky, fog and light crossfade over 0.9 s.
- Islands are seeded voxel islands (24 × 24 columns, floating, tapering
  underside) meshed into one `BufferGeometry` with face culling and
  Minecraft-style vertex AO, textured with the game's own `atlas.png`
  (32 px tiles, nearest filtering). Blocks the game does not have yet
  (snow, ice, mud, lava, basalt) are existing tiles with a vertex tint.
- Trees (oak, birch, pine), cross plants and leaves sway in the vertex
  shader. Water and lava are a shaded plane (ripple normals, fresnel, sun
  glint; lava glows). Night biomes get stars and flickering torches
  (three point lights, always allocated, so shaders never recompile).
- Particles per biome as pixel squares: pollen, leaves, fireflies, snow,
  embers, spores, sunset dust.
- The hero island carries a voxel "R" monument.
- Text sits on the left or right; the camera's view offset moves the
  island to the other side. Under 900 px the island sits behind the text
  with a stronger shade.
- Device pixel ratio capped at 1.5. Rendering stops while the tab is
  hidden, and on inner pages once the banner has scrolled away.
- `prefers-reduced-motion`: no orbit, no particles, no sway, instant swaps.
- No WebGL: each section shows a real game capture as its background.
- Budget: Three.js chunk plus scene code under 200 KB gzip.

Biome accents (CSS `data-theme`): meadow `#a7d465`, forest `#e6b450`,
lake `#4fd1c5`, mountain `#9db4d6`, taiga `#f2a65a`, bog `#b28cf0`,
frost `#bfe6ff`, deep `#ff7a3d`, sunset `#ffb86b`.

## 3. Data, build and checks

- `npm run sync-game` (`scripts/sync-game.mjs`) reads the game folder
  (`GAME_DIR`, default `../RustingGames/hearthblock`) and the plan folder
  (`PLAN_DIR`, default `../RustingGames/prompts/hearthblock`):
  - `assets/data/blocks.json` to `src/data/game/blocks.json` (in game), and
    items, recipes, loot, mobs, bosses, crops, fish, foods, buffs, smelting,
    tuning, home and skills as they are, minus `test_` entries;
  - the BIBLE tables (world tiers, ores, mobs, bosses) and the SKILLS
    trees to `src/data/game/design.json` (planned, marked so on the site);
  - the `PROGRESS.md` status line to `src/data/game/status.json`;
  - `atlas.png`, the block tiles and chosen captures (as WebP) and the
    showcase videos into `public/game/`.
  The output is committed, so CI builds without the game repository.
  Systems that have no data file yet come from the BIBLE and say
  "Planned"; they switch to game data when the file appears.
- `npm run build`: Astro static build, then Pagefind for search.
- Deploy: GitHub Pages through `.github/workflows/deploy.yml`;
  `public/CNAME` holds `mc.rustingstudio.com`.
- Checks before a release: `npm run build` passes; Playwright screenshots
  (`scripts/shots.mjs`) of the home page at 1440 px and 360 px in all three
  locales; no horizontal scroll at 360 px; every section readable with
  WebGL off.
