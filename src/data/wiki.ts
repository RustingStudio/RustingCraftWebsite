// Wiki sections and the biome each one opens onto. All but `world` come from the game's own data files;
// `world` is still the design bible.
export const SECTIONS = [
  { id: 'guide', biome: 'meadow' },
  { id: 'blocks', biome: 'mountain' },
  { id: 'items', biome: 'taiga' },
  { id: 'crafting', biome: 'deep' },
  { id: 'survival', biome: 'sunset' },
  { id: 'farming', biome: 'lake' },
  { id: 'mobs', biome: 'bog' },
  { id: 'bosses', biome: 'frost' },
  { id: 'skills', biome: 'forest' },
  { id: 'world', biome: 'meadow', planned: true },
] as const;
export type SectionId = (typeof SECTIONS)[number]['id'];

// '{a} and {b}' with {a: 1, b: 2} -> '1 and 2'.
export const fill = (tpl: string, vars: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
