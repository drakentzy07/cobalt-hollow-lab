/**
 * C2-04 Pages PREVIEW only, not the public landing page.
 * Reuse G6 rights-sanitized media at the existing site's ROOT:
 * /cobalt-hollow-lab/media/*, never /cobalt-hollow-lab/c204/media/*
 * The preview's own app JS/CSS remain under /cobalt-hollow-lab/c204/assets.
 * This changes URL resolution, NOT files, models or animations.
 */
import {readFileSync,writeFileSync} from 'node:fs';
const file='src/render/assets/media.ts';
const s=readFileSync(file,'utf8');
const old="  const base = import.meta.env.BASE_URL ?? '/';";
const replacement="  const base = '/cobalt-hollow-lab/'; // C204 shares the site root media, no duplicated artwork";
if(s.split(old).length!==2)throw Error('C204_MEDIA_ROOT_URL_SEAM_NOT_FOUND');
writeFileSync(file,s.replace(old,replacement),'utf8');
console.log('HIGHFLY_C204_PAGES_PREVIEW_MEDIA_ROOT_SHARING=PASS');
