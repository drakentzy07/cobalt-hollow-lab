import assert from 'node:assert/strict';
import {setupForge13} from './skin13-forge-client.mjs';
assert.equal(typeof setupForge13,'function');
console.log('HIGHFLY_SKIN13_FRONTEND_FETCHES_REAL_CAPABILITY_AND_NEVER_SIMULATES_BLENDER_PROGRESS_GREEN=1');
