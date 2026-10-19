// Build the bounded offline app shell from actual Vite output, never from
// guessed filenames. This does NOT ship huge world media ahead of demand.
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import sharp from 'sharp';

const dist='dist';
const assets=join(dist,'assets');
if (!existsSync(join(dist,'index.html')) || !existsSync(assets)) {
  throw Error('F11_APP_SHELL_REQUIRES_COMPILED_VITE_OUTPUT');
}
// Installability requires real raster 192/512 icons on Android, not links to
// assets from the abandoned public build. The SVG stays editable source art.
for (const size of [192, 512]) {
  await sharp('public/highfly-origin-icon.svg').resize(size, size)
    .png().toFile(join(dist, `highfly-origin-icon-${size}.png`));
}
console.log('HIGHFLY_F11_APP_ICONS_GREEN=1');

const files=['index.html', 'basis/basis_transcoder.js', 'basis/basis_transcoder.wasm',
  'highfly-origin.webmanifest', 'highfly-origin-icon-192.png', 'highfly-origin-icon-512.png'];
function walk(dir) {
  for (const e of readdirSync(dir,{withFileTypes:true})) {
    const path=join(dir,e.name);
    if(e.isDirectory())walk(path);
    else if(e.isFile() && /\.(?:js|css)$/.test(e.name))files.push(relative(dist,path).split(sep).join('/'));
  }
}
walk(assets);
const unique=[...new Set(files)].filter(p=>existsSync(join(dist,p))).sort();
const total=unique.reduce((sum,p)=>sum+statSync(join(dist,p)).size,0);
if(total>80*1024*1024)throw Error('F11_APP_SHELL_TOO_LARGE_'+total);
writeFileSync(join(dist,'highfly-origin-appshell.json'),JSON.stringify(unique)+'\n');
console.log('HIGHFLY_F11_APP_SHELL',unique.length,'files',total,'bytes (world media on demand)');

