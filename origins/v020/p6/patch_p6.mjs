#!/usr/bin/env node
// P6 safe patch: only in the ephemeral checkout of pinned v0.20 + certified P5.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(process.argv[2]||'upstream');
function replaceOnce(relative,oldText,newText){
 const file=path.join(root,relative);const before=fs.readFileSync(file,'utf8');
 if(before.split(oldText).length!==2)throw Error('[P6] Unsafe or duplicate anchor: '+relative+' / '+oldText.slice(0,55));
 fs.writeFileSync(file,before.replace(oldText,newText));
}
const localeAnchor=[
'} else {',
'  currentLanguage = getStoredLanguage() ?? currentLanguage;',
'}',
'',
'export function getLanguage()'
].join('\n');
const localeReplacement=[
'} else {',
'  currentLanguage = getStoredLanguage() ?? currentLanguage;',
'}',
'// HIGHFLY P6: default to the EXISTING Spanish translation for the explicit',
'// offline playtest. A user locale and any explicit ?lang= remain authoritative.',
"if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('highfly_origin') === '1') {",
'  const params = new URLSearchParams(window.location.search);',
"  if (!params.has('lang') && !getStoredLanguage()) currentLanguage = 'es';",
'}',
'',
'export function getLanguage()'
].join('\n');
replaceOnce('src/ui/i18n.ts',localeAnchor,localeReplacement);
replaceOnce('play.html','<html lang="en">','<html lang="es">');
replaceOnce('play.html','<meta name="apple-mobile-web-app-title" content="ClaudeCraft" />',
 '<meta name="apple-mobile-web-app-title" content="HIGHFLY ORIGIN" />');
replaceOnce('play.html','<title data-i18n="seo.title">World of ClaudeCraft: Classic-Style Web MMO</title>',
 '<title>HIGHFLY ORIGIN P6 — Mundo RPG 3D</title>');
replaceOnce('play.html','<img class="ls-logo" src="/worldofclaudecraft-logo.png" data-i18n-alt="serverUnavailable.logoAlt" alt="World of ClaudeCraft" />',
 '<img class="ls-logo" src="/worldofclaudecraft-logo.png" alt="HIGHFLY ORIGIN" />');
replaceOnce('play.html','<span class="mobile-label">Dash</span></button>',
 '<span class="mobile-label">DASH</span></button>');
const cssPath=path.join(root,'src/styles/hud.mobile.css');
const css=fs.readFileSync(cssPath,'utf8');
if(!css.includes('HIGHFLY P4B touch control layering')||css.includes('HIGHFLY ORIGIN P6:'))throw Error('[P6] Requires unique P4B baseline; refusing overwrite');
const cssOverlay=fs.readFileSync(new URL('./hud_moba.css',import.meta.url),'utf8');
if(!cssOverlay.includes('HIGHFLY ORIGIN P6:'))throw Error('[P6] Missing authored HUD identity');
fs.appendFileSync(cssPath,'\n'+cssOverlay);
console.log('[HIGHFLY P6] Spanish defaults + original 4-button skill arc + HIGHFLY title installed without world rewrites');


// Original HIGHFLY replacement pointers: P5 intentionally deletes the entire
// upstream /ui/cursors/ folder because its art rights are unverified. The game
// still references arrow.png and gauntlet.png. Supply NEW authored vector
// silhouettes rendered as PNG, never restore or copy the removed bitmaps.
const cursorDir=path.join(root,'public','ui','cursors');
if(fs.existsSync(cursorDir))throw Error('[P6] Expected P5 scrubbed cursor dir; refusing to overwrite upstream media');
fs.mkdirSync(cursorDir,{recursive:true});
const sharp=createRequire(path.join(root,'package.json'))('sharp');
const cursorArt={
 'arrow.png':'<path d="M4 2 L4 27 L10 21 L15 30 L20 27 L15 18 L26 17 Z" fill="#8cecff" stroke="#05152e" stroke-width="2" stroke-linejoin="round"/>',
 'gauntlet.png':'<path d="M6 13 L10 7 L14 7 L16 10 L20 8 L24 11 L27 16 L25 23 L20 28 L11 27 L5 21 Z" fill="#8cecff" stroke="#05152e" stroke-width="2.1" stroke-linejoin="round"/><path d="M10 13 L13 17 L18 17 L21 13 M10 21 L15 23 L22 20" fill="none" stroke="#164978" stroke-width="2" stroke-linecap="round"/>',
};
for(const [name,shape] of Object.entries(cursorArt)){
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">'+shape+'</svg>';
 await sharp(Buffer.from(svg)).png().toFile(path.join(cursorDir,name));
}
console.log('[HIGHFLY P6] Authored 2 original HIGHFLY cursor PNGs after P5 removed unverified originals');


// Finish the removed original pointer set with distinct HIGHFLY silhouettes.
// Six authored cursors instead of restoring the six excluded third-party PNGs.
const extraCursorArt={
 'attack-sword.png':'<path d="M24 3 L29 8 L16 21 L12 17 Z" fill="#e8faff" stroke="#05152e" stroke-width="1.6"/><path d="M11 15 L17 21 M14 20 L8 26 M6 24 L10 28" fill="none" stroke="#36c7f3" stroke-width="3" stroke-linecap="round"/>',
 'friendly-shield.png':'<path d="M16 3 L27 8 L25 20 Q22 27 16 30 Q10 27 7 20 L5 8 Z" fill="#184c7c" stroke="#8deaff" stroke-width="2"/><path d="M16 7 L16 25 M9 15 L23 15" stroke="#d8ffff" stroke-width="2.2"/>',
 'hand-default.png':'<path d="M10 16 L10 5 Q10 2 13 2 Q16 2 16 5 L16 13 L18 8 Q19 5 22 7 Q24 9 22 13 L28 16 Q30 19 27 24 L22 30 L12 30 L5 22 Q3 19 5 17 Q7 15 10 16 Z" fill="#b2edff" stroke="#0a1d3c" stroke-width="1.8"/>',
 'hand-grab.png':'<path d="M6 18 L7 12 Q8 9 11 11 L12 15 L13 7 Q14 4 17 6 L18 14 L20 9 Q22 7 24 10 L24 18 Q27 14 29 17 L29 23 L23 30 L12 30 Z" fill="#b2edff" stroke="#0a1d3c" stroke-width="1.8"/><path d="M10 19 L16 23 L22 20" fill="none" stroke="#2870a8" stroke-width="2"/>',
};
for(const [name,shape] of Object.entries(extraCursorArt)){
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">'+shape+'</svg>';
 await sharp(Buffer.from(svg)).png().toFile(path.join(cursorDir,name));
}
// The P5 rights scrub also intentionally removed the only old daily-reward
// chest texture. Keep the existing gameplay, but ship a newly illustrated
// HIGHFLY chest in its expected location. No original copyrighted art reused.
const chestPath=path.join(root,'public','ui','daily-rewards','treasure_chest.webp');
fs.mkdirSync(path.dirname(chestPath),{recursive:true});
const chestSvg='<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'+
'<defs><linearGradient id="a" x2=".2" y2="1"><stop stop-color="#286d9e"/><stop offset="1" stop-color="#101d40"/></linearGradient></defs>'+
'<ellipse cx="65" cy="113" rx="46" ry="9" fill="#051327" opacity=".5"/>'+
'<path d="M22 61 L25 34 Q64 10 104 34 L107 61 Z" fill="url(#a)" stroke="#8eeaff" stroke-width="5" stroke-linejoin="round"/>'+
'<path d="M28 48 Q66 29 100 48 L101 65 L27 65 Z" fill="#142b50" stroke="#47bde9" stroke-width="3"/>'+
'<path d="M20 61 L108 61 L103 105 Q64 116 25 105 Z" fill="#112746" stroke="#83eaff" stroke-width="4" stroke-linejoin="round"/>'+
'<path d="M36 63 L36 108 M92 63 L92 108 M21 78 L107 78" stroke="#28add8" stroke-width="5"/>'+
'<path d="M58 55 L71 55 L74 81 L64 89 L54 81 Z" fill="#e7d58b" stroke="#ffe8a3" stroke-width="2"/>'+
'<circle cx="64" cy="72" r="4" fill="#124775"/>'+
'<path d="M49 28 L49 40 M80 28 L80 40" stroke="#6af2ff" stroke-width="4" opacity=".8"/></svg>';
await sharp(Buffer.from(chestSvg)).webp({quality:90}).toFile(chestPath);
console.log('[HIGHFLY P6] Restored no unlicensed pixels: 6 own cyan cursors and 1 authored daily reward chest');
