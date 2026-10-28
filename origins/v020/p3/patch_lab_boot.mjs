#!/usr/bin/env node
// Private CI-only boot path. This is NOT included in public HIGHFLY release.
import { readFileSync, writeFileSync } from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(process.argv[2]||'upstream');
const path=join(root,'src/main.ts');
let contents=readFileSync(path,'utf8');
const anchor=[
  "} else {",
  "  startSitePresence('home');",
  "  wireStartScreens();",
  "  initHomepageMusic();",
  "}"
].join('\n');
const at=contents.lastIndexOf(anchor);
if(at<0||at!==contents.indexOf(anchor))throw Error('Cannot isolate final entrypoint branch');
const diagnostic=[
  "} else if (new URLSearchParams(location.search).get('highfly_p3') === '1') {",
  "  // HIGHFLY INTERNAL SMOKE: run actual offline Sim and renderer on a landscape viewport.",
  "  // This route exists only in CI temporary checkout; it must never reach Pages or APK.",
  "  startSitePresence('home');",
  "  void startOffline('warrior', 'Draken', 0);",
  ...anchor.split('\n')
].join('\n');
contents=contents.slice(0,at)+diagnostic+contents.slice(at+anchor.length);
writeFileSync(path,contents);
console.log('Installed CI-only highfly_p3 boot selector on real game entrypoint.');
