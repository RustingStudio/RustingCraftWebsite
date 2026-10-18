// Copies game data, the atlas and captures from the game and plan folders into this site.
// Output is committed, so CI builds without the game repository. Run: npm run sync-game
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const game = resolve(root, process.env.GAME_DIR || '../RustingGames/hearthblock');
const plan = resolve(root, process.env.PLAN_DIR || '../RustingGames/prompts/hearthblock');
const data = join(root, 'src/data/game');
const pub = join(root, 'public/game');
for (const d of [data, pub, join(pub, 'blocks'), join(pub, 'shots')]) mkdirSync(d, { recursive: true });

const read = (p) => readFileSync(p, 'utf8');
const clean = (s) => s.replace(/\*\*|`/g, '').trim();

// The first markdown table after the line that starts with `heading`.
function table(md, heading) {
  const lines = md.split('\n');
  const at = lines.findIndex((l) => l.startsWith(heading));
  if (at < 0) throw new Error(`heading not found: ${heading}`);
  let i = at + 1;
  while (i < lines.length && !lines[i].startsWith('|')) i++;
  const rows = [];
  while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
  const cells = (l) => l.slice(1, l.trimEnd().length - 1).split('|').map(clean);
  const [head, , ...body] = rows;
  const keys = cells(head).map((k) => k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
  return body.map((r) => Object.fromEntries(cells(r).map((c, j) => [keys[j], c])));
}

// Blocks: real game data.
// Crop growth stages, golden crops and the open door are states of another block; they get no row.
const blocks = JSON.parse(read(join(game, 'assets/data/blocks.json'))).blocks
  .filter((b) => !/^(air|unknown|door_open)$|^test_|_\d+$|_golden$/.test(b.id))
  .map(({ id, name, shape, textures, hardness, tool, tier, drops, skill, light }) => ({
    id, name, shape: shape ?? 'cube', icon: textures.side ?? textures.all ?? textures.top ?? id,
    hardness, tool, tier, drops, skill: skill ? `${skill.tree} +${skill.base_xp}` : null, light,
  }));
writeFileSync(join(data, 'blocks.json'), JSON.stringify(blocks, null, 1) + '\n');

// The other data files, as the game has them, without the entries scenarios use (`test: true`, `test_*` keys).
const noTest = (v) => Array.isArray(v) ? v.filter((x) => !x?.test).map(noTest)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k, x]) => !k.startsWith('test_') && !x?.test).map(([k, x]) => [k, noTest(x)]))
  : v;
const files = ['items', 'recipes', 'loot', 'mobs', 'bosses', 'crops', 'fish', 'foods', 'buffs', 'smelting', 'tuning', 'home', 'skills'];
for (const f of files) writeFileSync(join(data, `${f}.json`), JSON.stringify(noTest(JSON.parse(read(join(game, `assets/data/${f}.json`))))) + '\n');

// Design tables: planned, from the BIBLE and SKILLS.
const bible = read(join(plan, 'BIBLE.md'));
const skillsMd = read(join(plan, 'SKILLS.md'));
const trees = [...skillsMd.matchAll(/^### (\d+)\. (.+)\n([\s\S]*?)\n\|/gm)].map(([, n, name, text]) => ({
  n: +n, name: name.trim(),
  text: clean(text.split('\n').filter((l) => l.trim()).join(' ')),
}));
const design = {
  tiers: table(bible, '### World tiers'),
  ores: table(bible, '### Ore table'),
  mobs: table(bible, '### Hostile mobs'),
  bosses: table(bible, '## §11 Bosses'),
  trees,
};
writeFileSync(join(data, 'design.json'), JSON.stringify(design, null, 1) + '\n');

// Status: the first line of PROGRESS.md, e.g. "## Status: A-M2_SERVER: IN PROGRESS (iteration 5/12)".
const line = read(join(game, 'PROGRESS.md')).split('\n')[0];
const m = line.match(/Status: ([AB])-M(\d+)_(\w+): ([A-Z ]+?)(?: \(iteration (\d+)\/(\d+)\))?$/);
if (!m) throw new Error(`unexpected PROGRESS.md status line: ${line}`);
const status = { pass: m[1], milestone: +m[2], name: m[3], state: m[4], iteration: m[5] ? +m[5] : null, budget: m[6] ? +m[6] : null, synced: new Date().toISOString().slice(0, 10) };
writeFileSync(join(data, 'status.json'), JSON.stringify(status, null, 1) + '\n');

// Atlas and block tiles, for the 3D scene and the wiki icons.
copyFileSync(join(game, 'assets/textures/atlas.png'), join(pub, 'atlas.png'));
copyFileSync(join(game, 'assets/textures/atlas.json'), join(data, 'atlas.json'));
for (const f of readdirSync(join(game, 'assets/textures/blocks'))) copyFileSync(join(game, 'assets/textures/blocks', f), join(pub, 'blocks', f));

// Captures as WebP, without the top line of help text the game draws.
const shots = {
  meadow: 'M1/biomes_spawn.png', forest: 'M1/cave_mouth.png', lake: 'M1/biomes_mountains.png',
  mountain: 'M1/biomes_taiga.png', taiga: 'M1/daynight_night.png', bog: 'M1/light_cave.png',
  frost: 'M1/biomes_taiga_2.png', deep: 'M1/daynight_dusk.png', sunset: 'showcase/M0_horizon.png',
  peers: 'M2/peers_01.png', dawn: 'M1/daynight_dawn.png', terrain: 'M1/terrain_01.png',
  hotbar: 'showcase/M3_hotbar_world.png', recipes: 'showcase/M3_recipe_book.png', grave: 'showcase/M3_death_grave.png',
  skilltree: 'showcase/M4_skill_tree.png', farm: 'showcase/M5_farm_noon.png', reel: 'showcase/M5_reel.png',
  nightfight: 'showcase/M6_night_hollow_archer.png', arrow: 'showcase/M6_arrow_hit.png',
  furnace: 'showcase/M7_furnace_smelt.png', chest: 'showcase/M7_chest_door.png', home: 'showcase/M7_home_rested.png',
  thornback: 'showcase/M8_thornback_summon.png', bosskill: 'showcase/M8_thornback_kill.png',
};
writeFileSync(join(data, 'shots.json'), JSON.stringify(shots, null, 1) + '\n');
for (const [key, src] of Object.entries(shots)) {
  const from = join(game, 'captures', src);
  if (!existsSync(from)) { console.warn(`missing capture ${src}`); continue; }
  execFileSync('magick', [from, '-resize', '1280x720', '-gravity', 'south', '-crop', '1280x680+0+0', '+repage', '-quality', '78', join(pub, 'shots', `${key}.webp`)]);
}
for (const v of ['M0', 'M1']) {
  const from = join(game, 'captures/showcase', `${v}.mp4`);
  if (existsSync(from)) copyFileSync(from, join(pub, `${v}.mp4`));
}
console.log(`synced ${blocks.length} blocks, ${trees.length} trees, status M${status.milestone} ${status.state}`);
