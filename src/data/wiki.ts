// Wiki sections and the biome each one opens onto. Only blocks come from the game itself; the rest is the design bible.
export const SECTIONS = [
  { id: 'blocks', biome: 'mountain' },
  { id: 'world', biome: 'meadow' },
  { id: 'mobs', biome: 'bog' },
  { id: 'bosses', biome: 'frost' },
  { id: 'skills', biome: 'forest' },
] as const;
export type SectionId = (typeof SECTIONS)[number]['id'];
