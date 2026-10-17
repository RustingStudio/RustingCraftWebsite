// One entry per biome the site shows: sky, light, island shape, plants and particles.
// Block names are the scene's own (see BLOCKS in world.ts); tints multiply the game's atlas tiles.
export type Rgb = [number, number, number];
export interface Particles { color: string; count: number; size: number; vel: Rgb; sway: number; blink: number; glow?: boolean }
export interface Biome {
  seed: number;
  sky: [string, string, string]; // top, horizon, bottom
  fog: [number, number];
  sun: { color: string; intensity: number; dir: Rgb };
  hemi: { sky: string; ground: string; intensity: number };
  exposure: number;
  stars: number;
  terrain: {
    base: number; amp: number; peak?: number; basin?: number; pools?: number;
    top: string; sub: string; deep?: string; snowAbove?: number; ores?: number; glowOres?: number;
    liquid?: { level: number; deep: string; shallow: string; opacity: number; glow?: number };
  };
  trees?: { kind: 'oak' | 'birch' | 'pine'; count: number }[];
  plants?: { block: string; chance: number }[];
  boulders?: number;
  crystals?: number;
  lights?: { color: string; intensity: number; posts: boolean; over?: 'liquid' };
  tints?: Record<string, Rgb>;
  particles?: Particles;
  monument?: boolean;
  distance?: number;
}

export const BIOMES: Record<string, Biome> = {
  meadow: {
    seed: 11, sky: ['#2f5f93', '#9cc3cf', '#16191d'], fog: [60, 140],
    sun: { color: '#fff1d6', intensity: 2.6, dir: [0.5, 0.8, 0.45] }, hemi: { sky: '#b9d8ff', ground: '#4a5a2a', intensity: 1.2 }, exposure: 1, stars: 0,
    terrain: { base: 22, amp: 2, top: 'grass', sub: 'dirt', ores: 0.05 },
    trees: [{ kind: 'oak', count: 3 }, { kind: 'birch', count: 2 }],
    plants: [{ block: 'tall_grass', chance: 0.16 }, { block: 'marigold', chance: 0.04 }, { block: 'bluebell', chance: 0.04 }],
    particles: { color: '#f3e7a0', count: 140, size: 2.2, vel: [0.25, 0.05, 0.1], sway: 0.8, blink: 0.3 },
    monument: true, distance: 50,
  },
  forest: {
    seed: 23, sky: ['#44606e', '#e3c48a', '#16191d'], fog: [55, 130],
    sun: { color: '#ffd9a0', intensity: 2.4, dir: [-0.55, 0.55, 0.45] }, hemi: { sky: '#ffe2b0', ground: '#3a3a1c', intensity: 1.0 }, exposure: 1, stars: 0,
    terrain: { base: 22, amp: 4, top: 'grass', sub: 'dirt', ores: 0.05 },
    trees: [{ kind: 'oak', count: 9 }, { kind: 'birch', count: 4 }],
    plants: [{ block: 'tall_grass', chance: 0.22 }, { block: 'marigold', chance: 0.03 }],
    tints: { oak_leaves: [1.25, 1.05, 0.55] },
    particles: { color: '#d89a3a', count: 90, size: 3.2, vel: [0.3, -0.6, 0.1], sway: 1.2, blink: 0 },
  },
  lake: {
    seed: 37, sky: ['#2c6a86', '#bfe3e0', '#16191d'], fog: [60, 140],
    sun: { color: '#fff6e0', intensity: 2.6, dir: [0.35, 0.7, 0.6] }, hemi: { sky: '#c4ecff', ground: '#3c4a2a', intensity: 1.1 }, exposure: 1, stars: 0,
    terrain: { base: 22, amp: 2, basin: 0.62, top: 'grass', sub: 'dirt', ores: 0.05, liquid: { level: 22, deep: '#0c4f6b', shallow: '#3fb7c4', opacity: 0.78 } },
    trees: [{ kind: 'birch', count: 4 }],
    plants: [{ block: 'tall_grass', chance: 0.14 }, { block: 'bluebell', chance: 0.05 }],
    particles: { color: '#e8fbff', count: 70, size: 2, vel: [0.1, 0.25, 0.05], sway: 0.6, blink: 0.5 },
  },
  mountain: {
    seed: 41, sky: ['#4b5c78', '#c9d3e0', '#16191d'], fog: [60, 150],
    sun: { color: '#fff4e4', intensity: 2.7, dir: [0.6, 0.65, 0.3] }, hemi: { sky: '#d0dcff', ground: '#4a4a44', intensity: 1.0 }, exposure: 1, stars: 0,
    terrain: { base: 20, amp: 4, peak: 16, top: 'grass', sub: 'dirt', snowAbove: 31, ores: 0.08 },
    trees: [{ kind: 'pine', count: 5 }],
    boulders: 5,
    particles: { color: '#ffffff', count: 60, size: 2, vel: [0.9, 0, 0.2], sway: 0.4, blink: 0 },
    distance: 52,
  },
  taiga: {
    seed: 53, sky: ['#070b18', '#1c2a48', '#0b0e14'], fog: [50, 120],
    sun: { color: '#9fb6ff', intensity: 0.55, dir: [0.3, 0.7, -0.4] }, hemi: { sky: '#3a4a7a', ground: '#0a0c10', intensity: 0.45 }, exposure: 1.1, stars: 1,
    terrain: { base: 22, amp: 3, top: 'pine_litter', sub: 'dirt', ores: 0.05 },
    trees: [{ kind: 'pine', count: 10 }],
    plants: [{ block: 'tall_grass', chance: 0.08 }],
    lights: { color: '#ffab5a', intensity: 14, posts: true },
    particles: { color: '#ffe08a', count: 60, size: 3, vel: [0.1, 0.1, 0.05], sway: 1.4, blink: 1, glow: true },
  },
  bog: {
    seed: 67, sky: ['#2a2438', '#6e7f6a', '#121414'], fog: [35, 95],
    sun: { color: '#d8e0b0', intensity: 1.3, dir: [-0.7, 0.35, 0.4] }, hemi: { sky: '#9a8fc0', ground: '#1e2418', intensity: 0.8 }, exposure: 1, stars: 0.2,
    terrain: { base: 22, amp: 2, pools: 0.42, top: 'grass', sub: 'mud', ores: 0.03, liquid: { level: 21, deep: '#16302a', shallow: '#4f6e4a', opacity: 0.88 } },
    trees: [{ kind: 'oak', count: 4 }],
    plants: [{ block: 'tall_grass', chance: 0.3 }],
    tints: { grass: [0.72, 0.82, 0.55], oak_leaves: [0.7, 0.75, 0.55], tall_grass: [0.75, 0.8, 0.55] },
    particles: { color: '#b28cf0', count: 80, size: 2.6, vel: [0.05, 0.3, 0.05], sway: 0.9, blink: 0.7, glow: true },
  },
  frost: {
    seed: 79, sky: ['#6d8fb8', '#e4f1fb', '#16191d'], fog: [55, 140],
    sun: { color: '#ffffff', intensity: 2.6, dir: [-0.4, 0.5, 0.6] }, hemi: { sky: '#e4f0ff', ground: '#6a7a8a', intensity: 1.2 }, exposure: 0.95, stars: 0,
    terrain: { base: 21, amp: 5, peak: 12, top: 'snow', sub: 'snow', ores: 0.06 },
    trees: [{ kind: 'pine', count: 5 }],
    crystals: 4,
    tints: { pine_leaves: [1.3, 1.45, 1.6] },
    particles: { color: '#ffffff', count: 240, size: 2.6, vel: [0.2, -1.0, 0.1], sway: 0.6, blink: 0 },
    distance: 50,
  },
  deep: {
    seed: 97, sky: ['#0a0706', '#3a140a', '#050404'], fog: [45, 110],
    sun: { color: '#ff9a5a', intensity: 1.3, dir: [0.2, 0.6, 0.5] }, hemi: { sky: '#8a4028', ground: '#1a0a06', intensity: 0.9 }, exposure: 1.1, stars: 0,
    terrain: { base: 22, amp: 4, basin: 0.5, top: 'basalt', sub: 'basalt', deep: 'basalt', ores: 0.1, glowOres: 1, liquid: { level: 21, deep: '#7a1a04', shallow: '#ff7a1a', opacity: 1, glow: 1.6 } },
    lights: { color: '#ff7a2a', intensity: 22, posts: false, over: 'liquid' },
    particles: { color: '#ff8a3d', count: 120, size: 2.4, vel: [0.1, 1.2, 0.05], sway: 0.5, blink: 0.6, glow: true },
  },
  sunset: {
    seed: 113, sky: ['#2b2d55', '#ff9e6b', '#16191d'], fog: [60, 140],
    sun: { color: '#ffb070', intensity: 2.6, dir: [0.8, 0.45, 0.4] }, hemi: { sky: '#ffb59a', ground: '#4a3438', intensity: 1.3 }, exposure: 1, stars: 0.35,
    terrain: { base: 22, amp: 3, top: 'grass', sub: 'dirt', ores: 0.05 },
    trees: [{ kind: 'oak', count: 5 }, { kind: 'birch', count: 2 }],
    plants: [{ block: 'tall_grass', chance: 0.18 }, { block: 'marigold', chance: 0.05 }],
    particles: { color: '#ffd2a0', count: 90, size: 2.2, vel: [0.2, 0.1, 0.05], sway: 0.7, blink: 0.4 },
  },
};
