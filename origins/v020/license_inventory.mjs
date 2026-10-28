#!/usr/bin/env node
/**
 * HIGHFLY ORIGIN 0.20 -- conservative media provenance gate.
 * It never deletes/modifies original media; this is a read-only audit.
 *
 * CI can compile the original game for internal inspection; it MUST NOT
 * distribute resulting dist until --assert-release-safe passes.
 * Do not confuse a filename heuristic with verified legal ownership.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, join, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STATES = Object.freeze({
  BLOCKED_CRAFTPIX: 'BLOCKED_CRAFTPIX',
  BLOCKED_PROJECT_RIGHTS: 'BLOCKED_PROJECT_RIGHTS',
  REPLACE_BRANDING: 'REPLACE_BRANDING',
  REVIEW_AUDIO: 'REVIEW_AUDIO',
  REVIEW_PROVENANCE: 'REVIEW_PROVENANCE',
  CC0_CANDIDATE_UNVERIFIED: 'CC0_CANDIDATE_UNVERIFIED',
});
const blockedStates = new Set([
  STATES.BLOCKED_CRAFTPIX,
  STATES.BLOCKED_PROJECT_RIGHTS,
  STATES.REPLACE_BRANDING,
]);
const meshProject = new Set([
  'edda_reedhand.glb', 'reedbound_acolyte.glb', 'tolling_bell.glb', 'spider_egg_sac.glb',
]);

export function classifyPublicPath(p) {
  if (/^public\/ui\/skills\/[^/]+\/[^/]+\.webp$/i.test(p) ||
      /^public\/ui\/items\/[^/]+\.webp$/i.test(p)) {
    return {state: STATES.BLOCKED_CRAFTPIX, reason: 'Original CraftPix purchaser is Levy Street; class/item mapping manifests explicitly say so.'};
  }
  if (p.startsWith('public/models/creatures/') && meshProject.has(p.split('/').at(-1))) {
    return {state: STATES.BLOCKED_PROJECT_RIGHTS, reason: 'Meshy output documented as owned by World of ClaudeCraft.'};
  }
  if (/^public\/env\/(vale|marsh|peaks)_backdrop(_4k)?\.webp$/i.test(p)) {
    return {state: STATES.BLOCKED_PROJECT_RIGHTS, reason: 'Project-generated biome panoramas; not CC0.'};
  }
  if (/(?:^public\/)(?:woc[_-]|worldofclaudecraft|home-bg|favicon|icon-192|icon-512|apple-touch-icon|loading-screen|manifest\.webmanifest)/i.test(p)) {
    return {state: STATES.REPLACE_BRANDING, reason: 'Project branding or artwork; ownership and redistribution not established.'};
  }
  if (p.startsWith('public/audio/')) {
    return {state: STATES.REVIEW_AUDIO, reason: 'No verifiable per-file commercial grant in v0.20 CREDITS.'};
  }
  if (p.startsWith('public/ui/weapons/')) {
    return {state: STATES.REVIEW_PROVENANCE, reason: 'Weapon image source/rights not established per-file.'};
  }
  if (p.startsWith('public/models/') || p.startsWith('public/textures/') || p.startsWith('public/vfx/')) {
    return {state: STATES.CC0_CANDIDATE_UNVERIFIED, reason: 'Likely catalogue kit, but match file/pack/hash to CC0 provenance before approval.'};
  }
  return {state: STATES.REVIEW_PROVENANCE, reason: 'No file-specific license evidence; never automatically green.'};
}

export function enumerateFiles(root) {
  const found=[];
  if(!existsSync(root)) return found;
  function walk(at){
    for (const ent of readdirSync(at, {withFileTypes:true})) {
      const full=join(at,ent.name);
      if(ent.isDirectory()) walk(full);
      else if(ent.isFile()) found.push(full);
    }
  }
  walk(root);
  return found.sort();
}
export function releaseGate(records) {
  // Not just known-red assets: no unknown, unverifiable or pending media.
  return records.filter(rec => rec.state !== 'VERIFIED_COMMERCIAL');
}
function sha256(file) { return createHash('sha256').update(readFileSync(file)).digest('hex'); }
function fmt(n) { return (n / 1024 / 1024).toFixed(1) + ' MiB'; }
function csv(s) { return '"' + String(s).replaceAll('"','""') + '"'; }

export function runAudit({root,outputDir,assertReleaseSafe=false}) {
  const pub = join(root,'public'), dist=join(root,'dist');
  if (!existsSync(pub)) throw Error('No public directory in upstream checkout.');
  const credit=readFileSync(join(root,'CREDITS.md'),'utf8');
  const skills=enumerateFiles(join(pub,'ui/skills')).filter(x => x.endsWith('/mapping.json') || x.endsWith('\\mapping.json'));
  const itemsMap=JSON.parse(readFileSync(join(pub,'ui/items/mapping.json'),'utf8'));
  if(!credit.includes('CraftPix') || !skills.length ||
     !/CraftPix/.test(String(itemsMap.license))) {
    throw Error('Expected CraftPix evidence absent; investigate rather than accepting.');
  }
  let scannedSkills=0;
  for (const path of skills) {
    const data=JSON.parse(readFileSync(path,'utf8'));
    if(!/CraftPix/.test(String(data.license))) {
      throw Error('Skill mapping not independently confirmed as CraftPix: '+path);
    }
    scannedSkills++;
  }
  const files = enumerateFiles(pub);
  const records=files.map(file=>{
    const rel=relative(root,file).split(sep).join('/');
    const info=classifyPublicPath(rel);
    const published=join(dist,rel.slice('public/'.length));
    return {
      path:rel,bytes:statSync(file).size,sha256:sha256(file),
      state:info.state,reason:info.reason,
      inCompiledDist:existsSync(published)
    };
  });
  const count={}, shipped={}, size={};
  for(const rec of records){
    count[rec.state]=(count[rec.state]??0)+1;
    size[rec.state]=(size[rec.state]??0)+rec.bytes;
    if(rec.inCompiledDist) shipped[rec.state]=(shipped[rec.state]??0)+1;
  }
  const blocking=records.filter(rec=>blockedStates.has(rec.state));
  const unknown=releaseGate(records);
  const lines=[
    '# HIGHFLY ORIGIN 0.20 -- Phase 1 asset trace',
    '',
    '- Upstream: levy-street/world-of-claudecraft v0.20.0 commit 4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25',
    '- Total public media/metadata files: **'+records.length+'** ('+fmt(records.reduce((n,r)=>n+r.bytes,0))+')',
    '- Skill mapping manifests checked: **'+scannedSkills+'**; item manifest: **CraftPix confirmed**',
    '- Known blocked/replacement-required files (conservative): **'+blocking.length+'**',
    '- Files missing per-file commercial approval: **'+unknown.length+'**',
    '- Commercial publication gate: **BLOCKED** (source compiles; no release permission implied)',
    '',
    '| State | Source files | Copied into dist | Size |',
    '|---|---:|---:|---:|',
    ...Object.keys(STATES).map(x=>'| '+x+' | '+(count[x]??0)+' | '+(shipped[x]??0)+' | '+fmt(size[x]??0)+' |'),
    '',
    'NOTE: CC0_CANDIDATE_UNVERIFIED is NOT a legal clearance. All other unlisted/ambiguous media remain unapproved.',
    'Static-only references and streaming assets can evade simple filename searches; package scan is required in later stages.',
    '',
    '## Examples of files that must be addressed before distribution',
    ...blocking.slice(0,25).map(x=>'- '+x.path),
    '',
    'No Pages, APK or game distribution is performed by this workflow.',
    ''
  ];
  const output=resolve(outputDir);
  writeFileSync(join(output,'highfly-v020-license-inventory.json'),JSON.stringify({version:1,upstream:'v0.20.0',records},null,2));
  writeFileSync(join(output,'highfly-v020-license-inventory.csv'),['path,state,bytes,sha256,inCompiledDist,reason',...records.map(x=>[x.path,x.state,x.bytes,x.sha256,x.inCompiledDist,x.reason].map(csv).join(','))].join('\n')+'\n');
  writeFileSync(join(output,'highfly-v020-license-summary.md'),lines.join('\n'));
  if(process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
  console.log(lines.join('\n'));
  if(assertReleaseSafe && unknown.length) throw Error('Release gate blocked: '+unknown.length+' assets not VERIFIED_COMMERCIAL');
  return {total:records.length,blocking:blocking.length,unknown:unknown.length,count,shipped};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=resolve(process.argv[2]||'upstream');
  const outputDir=resolve(process.argv[3]||process.env.RUNNER_TEMP||'.');
  try{runAudit({root,outputDir,assertReleaseSafe:process.argv.includes('--assert-release-safe')});}
  catch(e){console.error(e?.stack||e);process.exitCode=1;}
}
