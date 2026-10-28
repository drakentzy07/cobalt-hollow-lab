#!/usr/bin/env node
// HIGHFLY P3 touch-display bridge: original v0.20 mobile game is correctly
// marked mobile-touch + game-active in Chromium but its HUD root stays none.
// This is a narrow conditional override in a temporary checkout, never a
// blanket "show buttons" rule on desktop/start screens.
import {appendFileSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(process.argv[2]||'upstream');
const css=join(root,'src/styles/hud.mobile.css');
const source=readFileSync(css,'utf8');
if(!source.includes('body.mobile-touch.game-active #mobile-controls') ||
   !source.includes('#mobile-controls {'))throw Error('Expected original mobile CSS is missing');
const fix=[
'',
'/* HIGHFLY P3 FIX: runtime source confirmed original mobile HUD root could',
'   compute display:none even with body.mobile-touch.game-active. Force',
'   display only for the GAME and TOUCH context. Desktop and entry remain hidden. */',
'body.mobile-touch.game-active #mobile-controls {',
'  display: block !important;',
'  width: var(--app-vw, 100vw);',
'  height: var(--app-vh, 100vh);',
'}',
''].join('\n');
if(source.includes('HIGHFLY P3 FIX'))throw Error('Patch applied twice');
appendFileSync(css,fix);
console.log('Applied conditional HIGHFLY touch HUD display fix to temp checkout');
