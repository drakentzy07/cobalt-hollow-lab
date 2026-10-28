#!/usr/bin/env node
// P6 safe patch: only in the ephemeral checkout of pinned v0.20 + certified P5.
import fs from 'node:fs';
import path from 'node:path';
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
