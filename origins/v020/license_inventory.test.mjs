import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPublicPath, STATES, releaseGate } from './license_inventory.mjs';

test('CraftPix skill/icon maps are refused for sale',()=>{
  assert.equal(classifyPublicPath('public/ui/skills/mage/fireball.webp').state,STATES.BLOCKED_CRAFTPIX);
  assert.equal(classifyPublicPath('public/ui/items/healing_potion.webp').state,STATES.BLOCKED_CRAFTPIX);
  assert.notEqual(classifyPublicPath('public/ui/items/mapping.json').state,STATES.BLOCKED_CRAFTPIX);
});
test('owners exclusive panorama and creature files stay blocked',()=>{
  assert.equal(classifyPublicPath('public/env/marsh_backdrop_4k.webp').state,STATES.BLOCKED_PROJECT_RIGHTS);
  assert.equal(classifyPublicPath('public/models/creatures/tolling_bell.glb').state,STATES.BLOCKED_PROJECT_RIGHTS);
});
test('CC0 candidate is NOT a license grant',()=>{
  const a=classifyPublicPath('public/models/creatures/wolf.glb');
  assert.equal(a.state,STATES.CC0_CANDIDATE_UNVERIFIED);
  assert.equal(releaseGate([{...a,path:'public/models/creatures/wolf.glb'}]).length,1);
});
test('audio and brand assets remain unreleased',()=>{
  assert.equal(classifyPublicPath('public/audio/main-theme.mp3').state,STATES.REVIEW_AUDIO);
  assert.equal(classifyPublicPath('public/favicon.ico').state,STATES.REPLACE_BRANDING);
});
test('release checker accepts only individually verified asset records',()=>{
  assert.equal(releaseGate([{state:'VERIFIED_COMMERCIAL'}, {state:STATES.REVIEW_AUDIO}]).length,1);
});
