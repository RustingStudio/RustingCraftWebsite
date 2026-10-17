// The site's 3D background: one floating voxel island per biome, built from the game's own block atlas.
// The page tells it which biome is in view through `rc:biome` events (see Base.astro); it never touches the DOM else.
import * as THREE from 'three';
import atlas from '../data/game/atlas.json';
import { BIOMES, type Biome, type Rgb } from './biomes';

const H = 56;
const ORDER = Object.keys(BIOMES);
const TILES = atlas.tiles as Record<string, [number, number, number, number]>;

interface Def { top: string; side: string; bottom: string; tint?: Rgb; cross?: boolean; wave?: number }
const all = (tile: string, tint?: Rgb, wave?: number): Def => ({ top: tile, side: tile, bottom: tile, tint, wave });
const log = (name: string): Def => ({ top: `${name}_top`, side: name, bottom: `${name}_top` });
const cross = (tile: string): Def => ({ ...all(tile), cross: true, wave: 1 });
// The atlas has no snow, mud or basalt yet: those are tinted stand-ins.
const DEFS: Record<string, Def> = {
  grass: { top: 'grass_top', side: 'grass_side', bottom: 'dirt' },
  pine_litter: { top: 'pine_litter', side: 'pine_litter_side', bottom: 'dirt' },
  dirt: all('dirt'), stone: all('stone'), sand: all('sand'), gravel: all('gravel'),
  snow: all('sand', [1.25, 1.32, 1.62]),
  mud: all('dirt', [0.58, 0.52, 0.46]),
  basalt: all('stone', [0.4, 0.36, 0.36]),
  oak_log: log('oak_log'), birch_log: log('birch_log'), pine_log: log('pine_log'),
  oak_leaves: all('oak_leaves', undefined, 0.3), birch_leaves: all('birch_leaves', undefined, 0.3), pine_leaves: all('pine_leaves', undefined, 0.18),
  coal_ore: all('coal_ore'), copper_ore: all('copper_ore'), tin_ore: all('tin_ore'), iron_ore: all('iron_ore'),
  glow_ore: all('copper_ore', [2.6, 1.3, 0.5]),
  crystal: all('water', [1.5, 2.3, 2.8]),
  tall_grass: cross('tall_grass'), marigold: cross('marigold'), bluebell: cross('bluebell'),
};
const NAMES = ['air', ...Object.keys(DEFS)];
const ID = Object.fromEntries(NAMES.map((n, i) => [n, i])) as Record<string, number>;
const OPAQUE = NAMES.map((n) => n !== 'air' && !DEFS[n].cross);
const ORES = ['coal_ore', 'copper_ore', 'tin_ore', 'iron_ore'];

// Faces as Minecraft draws them: normal, then corners bottom-left, bottom-right, top-right, top-left seen from outside.
const FACES: { n: Rgb; c: Rgb[]; tile: 'top' | 'side' | 'bottom' }[] = [
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], tile: 'side' },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], tile: 'side' },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], tile: 'side' },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], tile: 'side' },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], tile: 'top' },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], tile: 'bottom' },
];
const AO = [0.42, 0.62, 0.8, 1];

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const valueNoise = (seed: number) => {
  const hash = (x: number, z: number) => {
    let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(seed, 982451653);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x: number, z: number) => {
    const xi = Math.floor(x), zi = Math.floor(z), xf = s(x - xi), zf = s(z - zi);
    const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
    return a + (b - a) * xf + (c - a) * zf + (a - b - c + d) * xf * zf;
  };
};

class Vox {
  ids: Uint8Array;
  constructor(public n: number) { this.ids = new Uint8Array(n * n * H); }
  get(x: number, y: number, z: number) {
    const n = this.n;
    return x < 0 || z < 0 || y < 0 || x >= n || z >= n || y >= H ? 0 : this.ids[(y * n + z) * n + x];
  }
  set(x: number, y: number, z: number, name: string) {
    if (x >= 0 && z >= 0 && y >= 0 && x < this.n && z < this.n && y < H) this.ids[(y * this.n + z) * this.n + x] = ID[name];
  }
  solid(x: number, y: number, z: number) { return OPAQUE[this.get(x, y, z)]; }
}

// One geometry for a whole island: hidden faces culled, vertex AO, `wave` for swaying plants and leaves.
function mesh(v: Vox, tints: Record<string, Rgb>) {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [], wav: number[] = [], idx: number[] = [];
  const quad = (pts: Rgb[], normal: Rgb, tile: string, color: Rgb, ao: number[], wave: number[]) => {
    const i = pos.length / 3;
    const [u0, v0, u1, v1] = TILES[tile] ?? TILES.unknown;
    const uvs = [[u0, 1 - v1], [u1, 1 - v1], [u1, 1 - v0], [u0, 1 - v0]];
    for (let k = 0; k < 4; k++) {
      pos.push(...pts[k]); nor.push(...normal); uv.push(...uvs[k]); wav.push(wave[k]);
      const b = AO[ao[k]];
      col.push(color[0] * b, color[1] * b, color[2] * b);
    }
    // Split along the brighter diagonal so AO gradients do not crease.
    if (ao[0] + ao[2] < ao[1] + ao[3]) idx.push(i + 1, i + 2, i + 3, i + 1, i + 3, i);
    else idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  };
  const n = v.n;
  for (let y = 0; y < H; y++) for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const id = v.get(x, y, z);
    if (!id) continue;
    const name = NAMES[id], def = DEFS[name];
    const t = def.tint ?? [1, 1, 1], b = tints[name] ?? [1, 1, 1];
    const color: Rgb = [t[0] * b[0], t[1] * b[1], t[2] * b[2]];
    if (def.cross) {
      const w = [0, 0, 1, 1], lit = [3, 3, 3, 3], up: Rgb = [0, 1, 0];
      quad([[x + 0.15, y, z + 0.15], [x + 0.85, y, z + 0.85], [x + 0.85, y + 1, z + 0.85], [x + 0.15, y + 1, z + 0.15]], up, def.top, color, lit, w);
      quad([[x + 0.15, y, z + 0.85], [x + 0.85, y, z + 0.15], [x + 0.85, y + 1, z + 0.15], [x + 0.15, y + 1, z + 0.85]], up, def.top, color, lit, w);
      continue;
    }
    for (const f of FACES) {
      const [nx, ny, nz] = f.n;
      if (v.solid(x + nx, y + ny, z + nz)) continue;
      const a = nx ? 0 : ny ? 1 : 2, ua = (a + 1) % 3, va = (a + 2) % 3;
      const o: Rgb = [x + nx, y + ny, z + nz];
      const ao = f.c.map((c) => {
        const s1 = [...o] as Rgb, s2 = [...o] as Rgb, cc = [...o] as Rgb;
        const du = c[ua] ? 1 : -1, dv = c[va] ? 1 : -1;
        s1[ua] += du; s2[va] += dv; cc[ua] += du; cc[va] += dv;
        const p = +v.solid(...s1), q = +v.solid(...s2), r = +v.solid(...cc);
        return p && q ? 0 : 3 - (p + q + r);
      });
      const wave = def.wave ?? 0;
      quad(f.c.map((c) => [x + c[0], y + c[1], z + c[2]] as Rgb), f.n, def[f.tile], color, ao, [wave, wave, wave, wave]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('wave', new THREE.Float32BufferAttribute(wav, 1));
  g.setIndex(idx);
  return g;
}

// The studio logo's R (viewBox units), so the hero island can stand it up in blocks.
const R_OUTER = [[40, 28], [164, 28], [212, 76], [212, 120], [172, 160], [128, 160], [220, 228], [160, 228], [84, 158], [84, 228], [40, 228]];
const R_HOLE = [[84, 72], [84, 116], [150, 116], [168, 98], [168, 90], [150, 72]];
const inPoly = (p: number[][], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

interface Island {
  name: string; group: THREE.Group; anchors: THREE.Vector3[]; focus: number;
  uniforms: { uTime: { value: number } }[];
  liquid?: THREE.ShaderMaterial;
  anim?: { from: number; to: number; start: number };
}

function build(name: string, b: Biome, ctx: Shared): Island {
  const t = b.terrain, n = b.monument ? 30 : 24, c = n / 2;
  const v = new Vox(n), rand = rng(b.seed), hn = valueNoise(b.seed), en = valueNoise(b.seed + 7), pn = valueNoise(b.seed + 13);
  const tops: number[] = new Array(n * n).fill(-1);
  const level = t.liquid?.level ?? -1;
  const floor = t.liquid?.glow ? 'basalt' : t.sub === 'mud' ? 'mud' : 'sand';
  const reserved = new Set<number>();

  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const dx = x + 0.5 - c, dz = z + 0.5 - c;
    const d = (Math.hypot(dx, dz) / (c - 0.5)) * (0.88 + en(x * 0.22, z * 0.22) * 0.28);
    if (d > 1) continue;
    const fbm = hn(x * 0.11, z * 0.11) * 0.7 + hn(x * 0.27 + 40, z * 0.27) * 0.3;
    let h = t.base + Math.round(t.amp * (fbm - 0.5) * 2);
    if (t.peak) h += Math.round(t.peak * Math.max(0, 1 - d / 0.62) ** 1.5);
    if (t.basin && d < t.basin) h -= Math.round(6 * (1 - d / t.basin) ** 0.7);
    const pool = pn(x * 0.2 + 9, z * 0.2);
    if (t.pools && pool < t.pools && d < 0.78) h = Math.min(h, level - (pool < t.pools * 0.5 ? 2 : 1));
    if (d > 0.84) h -= Math.round((d - 0.84) * 10);
    if (t.liquid && d > 0.78) h = Math.max(h, level + 1);
    const bottom = t.base - 3 - Math.round((1 - d) ** 0.75 * 15 + en(x * 0.4, z * 0.4) * 3);
    for (let y = Math.max(bottom, 0); y <= h; y++) {
      let block = y === h ? t.top : y > h - 3 ? t.sub : (t.deep ?? 'stone');
      if (y === h && t.snowAbove && y >= t.snowAbove) block = 'snow';
      if (y >= h - 1 && h < level) block = floor;
      if (y < h - 3 && t.ores && rand() < t.ores) block = t.glowOres ? 'glow_ore' : ORES[Math.floor(rand() * ORES.length)];
      v.set(x, y, z, block);
    }
    tops[z * n + x] = h;
  }
  const top = (x: number, z: number) => tops[z * n + x];
  const ground = (x: number, z: number) => top(x, z) >= 0 && top(x, z) >= level && !reserved.has(z * n + x);

  // The hero's monument: the logo R, two blocks deep, grass where the sky reaches it.
  if (b.monument) {
    const S = 12, cols = 15, rows = 17, x0 = Math.round(c - cols / 2), z0 = Math.round(c - 1);
    let base = 0;
    for (let x = x0; x < x0 + cols; x++) for (let z = z0; z < z0 + 2; z++) base = Math.max(base, top(x, z) + 1);
    for (let x = x0 - 1; x <= x0 + cols; x++) for (let z = z0 - 1; z <= z0 + 2; z++) {
      for (let y = top(x, z) + 1; y < base; y++) v.set(x, y, z, 'dirt');
      if (top(x, z) >= 0) { v.set(x, base - 1, z, 'grass'); tops[z * n + x] = base - 1; }
      reserved.add(z * n + x);
    }
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      const px = 40 + (cx + 0.5) * S, py = 28 + (cy + 0.5) * S;
      if (!inPoly(R_OUTER, px, py) || inPoly(R_HOLE, px, py)) continue;
      const cap = px > 108 && px < 140 && py < 72;
      const above = cy > 0 && inPoly(R_OUTER, px, py - S) && !inPoly(R_HOLE, px, py - S);
      for (let z = z0; z < z0 + 2; z++) v.set(x0 + cx, base + rows - 1 - cy, z, cap ? 'basalt' : above ? 'dirt' : 'grass');
    }
  }

  // Free surface spots, in a seeded order, for trees, posts and props.
  const spots: [number, number][] = [];
  for (let z = 2; z < n - 2; z++) for (let x = 2; x < n - 2; x++) {
    const d = Math.hypot(x + 0.5 - c, z + 0.5 - c) / c;
    if (d < 0.8 && ground(x, z)) spots.push([x, z]);
  }
  for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  const taken: [number, number][] = [];
  const take = (gap: number) => {
    const i = spots.findIndex(([x, z]) => taken.every(([a, b2]) => Math.abs(a - x) + Math.abs(b2 - z) >= gap));
    if (i < 0) return undefined;
    const s = spots.splice(i, 1)[0];
    taken.push(s);
    return s;
  };
  const leaves = (x: number, y: number, z: number, r: number, block: string) => {
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (r > 0 && Math.abs(dx) === r && Math.abs(dz) === r && rand() < 0.6) continue;
      if (!v.get(x + dx, y, z + dz)) v.set(x + dx, y, z + dz, block);
    }
  };
  for (const tree of b.trees ?? []) for (let i = 0; i < tree.count; i++) {
    const s = take(4);
    if (!s) break;
    const [x, z] = s, y = top(x, z) + 1;
    if (tree.kind === 'pine') {
      const hgt = 6 + Math.floor(rand() * 3);
      for (let k = 0; k < hgt; k++) v.set(x, y + k, z, 'pine_log');
      for (let k = 0; k <= hgt - 2; k++) leaves(x, y + hgt - k, z, k === 0 ? 0 : k % 2 ? 1 : Math.min(2, 1 + (k >> 2)), 'pine_leaves');
    } else {
      const hgt = (tree.kind === 'birch' ? 5 : 4) + Math.floor(rand() * 2);
      const kind = tree.kind;
      for (let k = 0; k < hgt; k++) v.set(x, y + k, z, `${kind}_log`);
      leaves(x, y + hgt - 2, z, 2, `${kind}_leaves`);
      leaves(x, y + hgt - 1, z, 2, `${kind}_leaves`);
      leaves(x, y + hgt, z, 1, `${kind}_leaves`);
      leaves(x, y + hgt + 1, z, 0, `${kind}_leaves`);
      v.set(x + 1, y + hgt + 1, z, `${kind}_leaves`); v.set(x, y + hgt + 1, z - 1, `${kind}_leaves`);
    }
  }
  for (let i = 0; i < (b.boulders ?? 0); i++) {
    const s = take(3);
    if (!s) break;
    const [x, z] = s, y = top(x, z) + 1;
    for (let dy = 0; dy < 2; dy++) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++)
      if (!(dy && rand() < 0.45)) v.set(x + dx, y + dy - (dx && dz ? 1 : 0), z + dz, rand() < 0.3 ? 'gravel' : 'stone');
  }
  for (let i = 0; i < (b.crystals ?? 0); i++) {
    const s = take(3);
    if (!s) break;
    const [x, z] = s, hgt = 2 + Math.floor(rand() * 3);
    for (let k = 1; k <= hgt; k++) v.set(x, top(x, z) + k, z, 'crystal');
  }

  const group = new THREE.Group(), local = new THREE.Group();
  local.position.set(-c, -(t.base + 1), -c);
  group.add(local);
  const anchors: THREE.Vector3[] = [];
  const at = (x: number, y: number, z: number) => new THREE.Vector3(x - c, y - (t.base + 1), z - c);

  if (b.lights?.posts) for (let i = 0; i < 3; i++) {
    const s = take(5);
    if (!s) break;
    const [x, z] = s, y = top(x, z) + 1;
    v.set(x, y, z, 'oak_log'); v.set(x, y + 1, z, 'oak_log');
    const flame = new THREE.Mesh(ctx.flame, new THREE.MeshBasicMaterial({ color: new THREE.Color(b.lights.color).multiplyScalar(2.5), toneMapped: false }));
    flame.position.set(x + 0.5, y + 2.2, z + 0.5);
    local.add(flame);
    anchors.push(at(x + 0.5, y + 2.6, z + 0.5));
  }

  // Plants last, so nothing grows into them.
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const y = top(x, z) + 1, id = v.get(x, y - 1, z);
    if (!ground(x, z) || v.get(x, y, z) || (NAMES[id] !== 'grass' && NAMES[id] !== 'pine_litter')) continue;
    let roll = rand();
    for (const p of b.plants ?? []) {
      if (roll < p.chance) { v.set(x, y, z, p.block); break; }
      roll -= p.chance;
    }
  }

  const terrain = new THREE.Mesh(mesh(v, b.tints ?? {}), ctx.blocks);
  terrain.castShadow = terrain.receiveShadow = true;
  local.add(terrain);

  const uniforms: Island['uniforms'] = [];
  let liquid: THREE.ShaderMaterial | undefined;
  if (t.liquid) {
    const pos: number[] = [];
    const wet: [number, number][] = [];
    for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
      if (top(x, z) < 0 || top(x, z) >= level) continue;
      const y = level + 0.875;
      pos.push(x, y, z, x, y, z + 1, x + 1, y, z + 1, x, y, z, x + 1, y, z + 1, x + 1, y, z);
      wet.push([x, z]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    liquid = liquidMaterial(t.liquid, ctx);
    uniforms.push(liquid.uniforms as Island['uniforms'][number]);
    const water = new THREE.Mesh(g, liquid);
    water.receiveShadow = !t.liquid.glow;
    local.add(water);
    if (b.lights?.over === 'liquid') for (let i = 0; i < 3 && wet.length; i++) {
      const [x, z] = wet[Math.floor(rand() * wet.length)];
      anchors.push(at(x + 0.5, level + 2.5, z + 0.5));
    }
  }

  if (b.particles) {
    const p = b.particles, pts = new Float32Array(p.count * 3), seeds = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) { pts[i * 3] = rand(); pts[i * 3 + 1] = rand(); pts[i * 3 + 2] = rand(); seeds[i] = rand(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const mat = particleMaterial(p, n, ctx);
    uniforms.push(mat.uniforms as Island['uniforms'][number]);
    const points = new THREE.Points(g, mat);
    points.position.y = 9;
    points.frustumCulled = false;
    group.add(points);
  }

  let peak = 0;
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) peak = Math.max(peak, top(x, z));
  const focus = b.monument ? 7 : Math.max(1.5, (peak - t.base) * 0.4 + 1);
  return { name, group, anchors, focus, uniforms, liquid };
}

interface Shared { blocks: THREE.Material; flame: THREE.BoxGeometry; pixel: number; sky: THREE.Color; sunDir: THREE.Vector3; sunColor: THREE.Color }

function liquidMaterial(l: NonNullable<Biome['terrain']['liquid']>, ctx: Shared) {
  return new THREE.ShaderMaterial({
    transparent: (l.opacity ?? 1) < 1, fog: true, depthWrite: !!l.glow,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 }, uOpacity: { value: l.opacity }, uGlow: { value: l.glow ?? 0 },
      uDeep: { value: new THREE.Color(l.deep) }, uShallow: { value: new THREE.Color(l.shallow) },
      uSky: { value: ctx.sky }, uSunDir: { value: ctx.sunDir }, uSunColor: { value: ctx.sunColor },
    }]),
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        w.y += sin(uTime * 1.2 + w.x * 0.6 + w.z * 0.4) * 0.04;
        vWorld = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uOpacity, uGlow;
      uniform vec3 uDeep, uShallow, uSky, uSunDir, uSunColor;
      varying vec3 vWorld;
      #include <fog_pars_fragment>
      void main() {
        vec2 p = vWorld.xz;
        float a = p.x * 1.7 + uTime * 1.3, b = p.y * 2.1 - uTime * 1.1, d = (p.x + p.y) * 1.3 + uTime * 0.7;
        vec3 n = normalize(vec3(cos(a) * 0.09 + cos(d) * 0.05, 1.0, cos(b) * 0.09 + cos(d) * 0.05));
        vec3 view = normalize(cameraPosition - vWorld);
        float f = pow(1.0 - max(dot(n, view), 0.0), 4.0);
        vec3 c;
        float alpha = 1.0;
        if (uGlow > 0.0) {
          float m = 0.5 + 0.5 * sin(p.x * 0.8 + uTime * 0.6) * sin(p.y * 0.9 - uTime * 0.5) + 0.15 * (sin(a) + sin(b));
          c = mix(uDeep, uShallow, clamp(m, 0.0, 1.0)) * uGlow;
        } else {
          c = mix(uDeep, uShallow, 0.55 + 0.1 * (sin(a) + sin(b) + sin(d)) / 3.0);
          c = mix(c, uSky, f * 0.75);
          c += uSunColor * pow(max(dot(reflect(-normalize(uSunDir), n), view), 0.0), 140.0) * 2.5;
          alpha = mix(uOpacity, 1.0, f);
        }
        gl_FragColor = vec4(c, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

function particleMaterial(p: NonNullable<Biome['particles']>, n: number, ctx: Shared) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: p.glow ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 }, uSize: { value: p.size }, uSway: { value: p.sway }, uBlink: { value: p.blink }, uPixel: { value: ctx.pixel },
      uVel: { value: new THREE.Vector3(...p.vel) }, uBox: { value: new THREE.Vector3(n * 1.4, 24, n * 1.4) },
      uColor: { value: new THREE.Color(p.color) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uSize, uSway, uBlink, uPixel;
      uniform vec3 uVel, uBox;
      attribute float aSeed;
      varying float vA;
      void main() {
        vec3 p = mod(position * uBox + uVel * uTime, uBox);
        vec3 e = min(p, uBox - p);
        float edge = clamp(min(min(e.x, e.y), e.z) / 2.5, 0.0, 1.0);
        p -= uBox * 0.5;
        p.x += sin(uTime * uSway + aSeed * 6.283) * 0.6;
        p.z += cos(uTime * uSway * 0.8 + aSeed * 4.0) * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPixel * 70.0 / -mv.z;
        vA = edge * (1.0 - uBlink * (0.5 + 0.5 * sin(uTime * 2.3 + aSeed * 40.0)));
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vA;
      void main() {
        gl_FragColor = vec4(uColor, vA);
        #include <colorspace_fragment>
      }`,
  });
}

export interface View { biome: string; side: 'left' | 'right' | 'center'; visible: boolean }

export async function start(canvas: HTMLCanvasElement, atlasUrl: string, initial: View) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  // A lost context (GPU reset, driver update) falls back to the captures rather than a frozen or white canvas.
  canvas.addEventListener('webglcontextlost', () => document.documentElement.classList.add('no-webgl'));
  const pixel = Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(pixel);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const tex = await new THREE.TextureLoader().loadAsync(atlasUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;

  const time = { value: 0 };
  const blocks = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
  blocks.onBeforeCompile = (s) => {
    s.uniforms.uTime = time;
    s.vertexShader = 'attribute float wave;\nuniform float uTime;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed.x += wave * sin(uTime * 1.7 + position.x * 0.8 + position.z * 0.6) * 0.07;
      transformed.z += wave * cos(uTime * 1.3 + position.x * 0.5 - position.z * 0.7) * 0.06;`);
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9cc3cf, 60, 140);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 900);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 140 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);
  const torches = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffaa55, 0, 16, 2); scene.add(l); return l; });

  const ctx: Shared = { blocks, flame: new THREE.BoxGeometry(0.22, 0.4, 0.22), pixel, sky: new THREE.Color(), sunDir: new THREE.Vector3(0, 1, 0), sunColor: new THREE.Color() };

  const skyU = { uTop: { value: new THREE.Color() }, uHor: { value: ctx.sky }, uBot: { value: new THREE.Color() }, uSunDir: { value: ctx.sunDir }, uSunColor: { value: ctx.sunColor } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, toneMapped: false, uniforms: skyU,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uHor, uBot, uSunDir, uSunColor;
      varying vec3 vDir;
      void main() {
        float y = vDir.y;
        vec3 c = y > 0.0 ? mix(uHor, uTop, pow(y, 0.55)) : mix(uHor, uBot, pow(-y, 0.45));
        float s = max(dot(vDir, normalize(uSunDir)), 0.0);
        c += uSunColor * (pow(s, 700.0) * 1.2 + pow(s, 10.0) * 0.12);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  sky.renderOrder = -1;
  sky.frustumCulled = false;

  const starPts = new Float32Array(900 * 3), starSeed = new Float32Array(900), sr = rng(5);
  for (let i = 0; i < 900; i++) {
    const a = sr() * Math.PI * 2, y = 0.05 + sr() * 0.95, r = Math.sqrt(1 - y * y);
    starPts.set([Math.cos(a) * r * 450, y * 450, Math.sin(a) * r * 450], i * 3);
    starSeed[i] = sr();
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPts, 3));
  starGeo.setAttribute('aSeed', new THREE.BufferAttribute(starSeed, 1));
  const starU = { uOpacity: { value: 0 }, uTime: time, uPixel: { value: pixel } };
  const stars = new THREE.Points(starGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, uniforms: starU,
    vertexShader: /* glsl */ `
      uniform float uTime, uPixel, uOpacity;
      attribute float aSeed;
      varying float vA;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w * 0.9999;
        gl_PointSize = (1.0 + aSeed * 1.6) * uPixel;
        vA = uOpacity * (0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 50.0));
      }`,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() { gl_FragColor = vec4(1.0, 0.97, 0.9, vA); }`,
  }));
  stars.frustumCulled = false;
  stars.renderOrder = -1;
  scene.add(sky, stars);

  const cache = new Map<string, Island>();
  const island = (name: string) => {
    let i = cache.get(name);
    if (!i) cache.set(name, (i = build(name, BIOMES[name], ctx)));
    return i;
  };
  const live = new Set<Island>();
  let current: Island | undefined;
  let view: View = { ...initial, biome: BIOMES[initial.biome] ? initial.biome : 'meadow' };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = (name: string, now: number) => {
    if (current?.name === name) return;
    const next = island(name);
    const dir = current && ORDER.indexOf(name) < ORDER.indexOf(current.name) ? -1 : 1;
    if (current) current.anim = { from: current.group.position.y, to: dir * 70, start: now };
    next.anim = { from: live.has(next) ? next.group.position.y : current ? -dir * 70 : 0, to: 0, start: now };
    scene.add(next.group);
    live.add(next);
    current = next;
  };

  // Everything below eases toward the active biome, so a swap is also a sky and light crossfade.
  const tmp = new THREE.Color(), tmpV = new THREE.Vector3();
  const look = { angle: 0, dist: 48, focus: 2, offset: 0, px: 0, py: 0, tx: 0, ty: 0 };
  let first = true, last = performance.now();
  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduced) time.value += dt;
    const k = reduced || first ? 1 : 1 - Math.exp(-dt * 2.4);
    first = false;
    const b = BIOMES[view.biome];
    show(view.biome, now);

    skyU.uTop.value.lerp(tmp.set(b.sky[0]), k);
    ctx.sky.lerp(tmp.set(b.sky[1]), k);
    skyU.uBot.value.lerp(tmp.set(b.sky[2]), k);
    const fog = scene.fog as THREE.Fog;
    fog.color.copy(ctx.sky);
    fog.near += (b.fog[0] - fog.near) * k;
    fog.far += (b.fog[1] - fog.far) * k;
    renderer.setClearColor(ctx.sky);
    sun.color.lerp(tmp.set(b.sun.color), k);
    ctx.sunColor.copy(sun.color);
    sun.intensity += (b.sun.intensity - sun.intensity) * k;
    ctx.sunDir.lerp(tmpV.set(...b.sun.dir).normalize(), k);
    hemi.color.lerp(tmp.set(b.hemi.sky), k);
    hemi.groundColor.lerp(tmp.set(b.hemi.ground), k);
    hemi.intensity += (b.hemi.intensity - hemi.intensity) * k;
    renderer.toneMappingExposure += (b.exposure - renderer.toneMappingExposure) * k;
    starU.uOpacity.value += (b.stars - starU.uOpacity.value) * k;

    for (const isl of live) {
      const a = isl.anim;
      if (a) {
        const p = reduced ? 1 : Math.min((now - a.start) / 950, 1);
        const e = a.to === 0 ? 1 - (1 - p) ** 3 : p ** 3;
        isl.group.position.y = a.from + (a.to - a.from) * e;
        if (p >= 1) {
          isl.anim = undefined;
          if (a.to !== 0) { scene.remove(isl.group); live.delete(isl); }
        }
      }
      for (const u of isl.uniforms) u.uTime.value = time.value;
    }

    torches.forEach((l, i) => {
      const anchor = current?.anchors[i];
      const want = anchor && b.lights ? b.lights.intensity * (1 + 0.18 * Math.sin(time.value * 13 + i * 3) * Math.sin(time.value * 7.3 + i)) : 0;
      if (anchor && current) l.position.copy(anchor).add(current.group.position);
      if (b.lights) l.color.set(b.lights.color);
      l.intensity += (want - l.intensity) * (reduced ? 1 : Math.min(1, dt * 8));
    });

    const w = canvas.clientWidth, h = canvas.clientHeight, aspect = w / h;
    look.px += (look.tx - look.px) * (reduced ? 0 : Math.min(1, dt * 2));
    look.py += (look.ty - look.py) * (reduced ? 0 : Math.min(1, dt * 2));
    look.dist += ((b.distance ?? 46) * Math.max(1, Math.sqrt(1.5 / aspect)) - look.dist) * k;
    look.focus += ((current?.focus ?? 2) - look.focus) * k;
    const side = w < 900 ? 0 : view.side === 'left' ? -0.17 : view.side === 'right' ? 0.17 : 0;
    look.offset += (side - look.offset) * k;
    const angle = Math.sin(time.value * 0.05) * 0.5 + look.px * 0.12, elev = 0.4 - look.py * 0.05;
    camera.position.set(Math.sin(angle) * Math.cos(elev) * look.dist, look.focus + Math.sin(elev) * look.dist, Math.cos(angle) * Math.cos(elev) * look.dist);
    camera.lookAt(0, look.focus, 0);
    camera.aspect = aspect;
    camera.setViewOffset(w, h, look.offset * w, 0, w, h);
    sky.position.copy(camera.position);
    stars.position.copy(camera.position);
    sun.position.copy(ctx.sunDir).multiplyScalar(70);
    renderer.render(scene, camera);
  };

  let raf = 0;
  const running = () => !reduced && view.visible && !document.hidden;
  const loop = (now: number) => {
    raf = 0;
    step(now);
    if (running()) raf = requestAnimationFrame(loop);
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const resize = () => { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); wake(); };
  addEventListener('resize', resize);
  addEventListener('rc:biome', (e) => { view = { ...view, ...(e as CustomEvent<Partial<View>>).detail }; last = performance.now(); wake(); });
  document.addEventListener('visibilitychange', () => { last = performance.now(); wake(); });
  addEventListener('pointermove', (e) => { look.tx = (e.clientX / innerWidth) * 2 - 1; look.ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  resize();
  loop(performance.now());
  document.documentElement.classList.add('world-ready');

  // Build the other islands while the page is idle, so a swap never stalls on meshing.
  const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
  const rest = ORDER.filter((n) => !cache.has(n));
  const next = () => { const n = rest.shift(); if (n) { island(n); idle(next); } };
  idle(next);
}
