#!/usr/bin/env node
// HIGHFLY ORIGIN v0.20 -- read-only legal inventory + source-preservation gate.
// This is an early heuristic inventory, not a legal clearance or per-file license certificate.
import { existsSync, readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] || 'upstream');
const required = [
  'LICENSE', 'CREDITS.md', 'package.json', 'package-lock.json',
  'play.html', 'src/sim/sim.ts', 'src/sim/data.ts',
  'src/game/mobile_controls.ts', 'src/editor/main.ts',
  'src/editor/app.ts', 'src/editor/3d/viewport.ts',
];
let missing = required.filter(p => !existsSync(join(root, p)));
if (missing.length) {
  console.error('FALLO: archivos críticos ausentes:', missing.join(', '));
  process.exitCode = 1;
}
const creditPath = join(root, 'CREDITS.md');
const credits = existsSync(creditPath) ? readFileSync(creditPath, 'utf8') : '';
for (const term of ['CraftPix', 'KayKit', 'Quaternius', 'Project asset']) {
  if (!credits.includes(term)) { console.error('FALLO: CREDITS sin referencia', term); process.exitCode = 1; }
}
const files = [];
function walk(path) {
  if (!existsSync(path)) return;
  for (const e of readdirSync(path, {withFileTypes:true})) {
    const p = join(path,e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile()) files.push(relative(root,p).split(sep).join('/'));
  }
}
walk(join(root,'public'));
const buckets = {
  'BLOQUEADO: CraftPix de terceros':[],
  'PERMISO PENDIENTE: modelos del proyecto':[],
  'PERMISO PENDIENTE: panoramas del proyecto':[],
  'REVISAR: iconos/imagenes de inventario y armas':[],
  'REVISAR: audio':[],
  'REVISAR: resto de medios, incluida marca':[],
};
const projectMeshes = new Set(['edda_reedhand','reedbound_acolyte','tolling_bell','spider_egg_sac']);
for (const f of files) {
  if (f.startsWith('public/ui/skills/')) buckets['BLOQUEADO: CraftPix de terceros'].push(f);
  else if (f.startsWith('public/models/creatures/') && projectMeshes.has(f.split('/').at(-1).replace(/\.[^.]*$/, '')))
    buckets['PERMISO PENDIENTE: modelos del proyecto'].push(f);
  else if (/^public\/env\/(vale|marsh|peaks)_backdrop(_4k)?\.webp$/.test(f))
    buckets['PERMISO PENDIENTE: panoramas del proyecto'].push(f);
  else if (f.startsWith('public/ui/items/') || f.startsWith('public/ui/weapons/'))
    buckets['REVISAR: iconos/imagenes de inventario y armas'].push(f);
  else if (f.startsWith('public/audio/')) buckets['REVISAR: audio'].push(f);
  else buckets['REVISAR: resto de medios, incluida marca'].push(f);
}
const total = Object.values(buckets).reduce((s,a)=>s+a.length,0);
const counts = Object.fromEntries(Object.entries(buckets).map(([k,v])=>[k,v.length]));
const summary = [
  '# HIGHFLY ORIGIN v0.20 — auditoría preliminar',
  '',
  '- Fuente: v0.20.0, commit 4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25',
  '- Archivos de medios detectados en public/: ' + total,
  '- Aprobación comercial: **NO — BLOQUEADA HASTA CERTIFICAR CADA RECURSO**',
  '- La compilación, si termina bien, no equivale a un juego jugable ni certificado.',
  '',
  ...Object.entries(counts).map(([k,v]) => '- ' + k + ': **' + v + '**'),
  '',
  'Las familias public/models y public/vfx no se consideran liberadas automáticamente: clasificación individual pendiente.',
  'No se ha ejecutado ninguna prueba de Android, portal, combate, dungeons ni guardado.',
  '',
];
console.log(summary.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
if (!files.length) { console.error('FALLO: sin assets públicos; el checkout podría estar incompleto'); process.exitCode=1; }
if (!buckets['BLOQUEADO: CraftPix de terceros'].length) { console.error('FALLO: se esperaba detectar los iconos CraftPix (verificar estructura)'); process.exitCode=1; }
