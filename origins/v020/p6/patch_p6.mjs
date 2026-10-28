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
