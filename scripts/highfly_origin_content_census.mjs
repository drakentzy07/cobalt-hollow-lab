/** HIGHFLY F7 — read-only, deterministic census of the actual UNIFIED donor registry.
 * Run: node scripts/highfly_origin_content_census.mjs --check --out=tmp/hf-f7-census.json
 * No game saves, player stats, source content or business logic are changed.
 * Historical branches are NOT included unless selectively integrated later.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const root = process.cwd();
const entry = [
  "export { ITEMS, MOBS, NPCS, QUESTS, ZONES } from './src/sim/data.ts';",
  "export { ALL_RECIPES } from './src/sim/content/recipes.ts';",
  "export { ABILITIES, CLASSES } from './src/sim/content/classes.ts';",
  "export { GATHERING_PROFESSIONS, CRAFT_RING, STATIONS } from './src/sim/content/professions.ts';",
  "export { DUNGEON_DEFS } from './src/sim/content/dungeons.ts';",
  "export { HIGHFLY_ORIGIN_MODE_CONTRACT } from './src/highfly/origin/unified_mode.ts';",
  "export { MAX_LEVEL } from './src/sim/types.ts';",
].join('\n');
const built = await esbuild.build({
  stdin: { contents: entry, resolveDir: root, sourcefile: 'f7-census-entry.ts', loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent',
});
const moduleText = built.outputFiles[0].text;
const c = await import('data:text/javascript;base64,' + Buffer.from(moduleText).toString('base64'));
const sorted = (list) => [...list].sort((a,b) => String(a).localeCompare(String(b)));
const tally = (rows, key) => {
  const out = Object.create(null);
  for (const row of rows) {
    const value = String(key(row) ?? 'unspecified');
    out[value] = (out[value] ?? 0) + 1;
  }
  return Object.fromEntries(sorted(Object.keys(out)).map((name) => [name, out[name]]));
};
const band = (level) => {
  const n = Number(level);
  if (!Number.isFinite(n) || n < 1) return 'unknown';
  if (n <= 10) return '01-10';
  if (n <= 20) return '11-20';
  if (n <= 30) return '21-30';
  if (n <= 40) return '31-40';
  if (n <= 50) return '41-50';
  if (n <= 60) return '51-60';
  if (n <= 99) return '61-99';
  return '100+';
};
const items = Object.values(c.ITEMS);
const mobs = Object.values(c.MOBS);
const recipes = c.ALL_RECIPES;
const skills = Object.values(c.ABILITIES);
const zones = c.ZONES;
const lootRows = mobs.flatMap(m => Array.isArray(m.loot) ? m.loot.map(entry => ({
  mobId: m.id, mobLevel: m.minLevel ?? 1, itemId: entry.itemId ?? null,
  chance: entry.chance ?? null, copper: entry.copper ?? null,
})) : []);
const missingRecipeOutputs = sorted([...new Set(recipes.filter(x => !c.ITEMS[x.resultItemId]).map(x => x.resultItemId))]);
const missingRecipeInputs = sorted([...new Set(recipes.flatMap(x => x.reagents ?? []).filter(x => !c.ITEMS[x.itemId]).map(x => x.itemId))]);
const missingLootItems = sorted([...new Set(lootRows.filter(x => x.itemId && !c.ITEMS[x.itemId]).map(x => x.itemId))]);
const world = c.HIGHFLY_ORIGIN_MODE_CONTRACT.world;
const lab = c.HIGHFLY_ORIGIN_MODE_CONTRACT.lab;
const report = {
  generatedFrom: process.env.GITHUB_SHA ?? 'working-tree',
  source: 'UNIFIED-01-native-registries-only',
  note: 'Counts are authored/merged definitions; NOT proof that a Hunter can acquire, equip or encounter each entry.',
  nativeRealLevelCap: c.MAX_LEVEL,
  modes: {
    world: { db: world.saveDb, slot: world.saveSlot, local: world.saveLocal },
    lab: { db: lab.saveDb, slot: lab.saveSlot, local: lab.saveLocal },
    independent: world.saveDb !== lab.saveDb && world.saveSlot !== lab.saveSlot && world.saveLocal !== lab.saveLocal,
  },
  counts: {
    items: items.length, mobs: mobs.length, abilities: skills.length,
    recipes: recipes.length, npcs: Object.keys(c.NPCS).length,
    quests: Object.keys(c.QUESTS).length, zones: zones.length,
    dungeons: Object.keys(c.DUNGEON_DEFS).length,
    gatheringProfessions: Object.keys(c.GATHERING_PROFESSIONS).length,
    craftingProfessions: c.CRAFT_RING.length, stations: c.STATIONS.length,
    mobLootRows: lootRows.length,
  },
  items: { byKind: tally(items, x => x.kind), byQuality: tally(items, x => x.quality), byRequiredLevelBand: tally(items, x => band(x.requiredLevel ?? 1)) },
  mobs: { byLevelBand: tally(mobs, x => band(x.minLevel ?? 1)), byFamily: tally(mobs, x => x.family) },
  abilities: { bySchool: tally(skills, x => x.class), byLearnLevelBand: tally(skills, x => band(x.learnLevel ?? 1)) },
  recipes: { byProfession: tally(recipes, x => x.professionId), byLevelBand: tally(recipes, x => band(x.level ?? 1)) },
  zones: zones.map(z => ({ id:z.id, name:z.name, levels:z.levelRange ?? null })),
  integrityDiagnostics: { missingRecipeOutputs, missingRecipeInputs, missingLootItems },
};
const out = process.argv.find(x => x.startsWith('--out='));
if (out) {
  const filename = path.resolve(root, out.slice(6));
  mkdirSync(path.dirname(filename), { recursive: true });
  writeFileSync(filename, JSON.stringify(report,null,2)+'\n');
}
if (process.argv.includes('--check')) {
  if (!(report.counts.items > 0 && report.counts.mobs > 0 &&
        report.counts.abilities > 0 && report.counts.recipes > 0 &&
        report.counts.zones > 0 && report.modes.independent))
    throw new Error('HIGHFLY_F7_CORE_CATALOG_OR_SAVE_NAMESPACE_INVALID');
}
console.log('HIGHFLY_F7_CONTENT_CENSUS_GREEN=1');
console.log(JSON.stringify({
  commit: report.generatedFrom, counts: report.counts,
  nativeRealLevelCap: report.nativeRealLevelCap,
  saveNamespaceIndependent: report.modes.independent,
  integrityDiagnosticCounts: Object.fromEntries(Object.entries(report.integrityDiagnostics).map(([k,v])=>[k,v.length])),
}));
