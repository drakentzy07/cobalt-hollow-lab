import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4173/cobalt-hollow-lab/';
const ID = 'hf_jump_smash_01';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.locator('#btn-offline').waitFor({ state: 'attached', timeout: 15000 });

let selector = false;
for (let attempt = 0; attempt < 60; attempt++) {
  await page.evaluate(() => document.querySelector('#btn-offline')?.click());
  selector = await page.locator('#offline-select').isVisible().catch(() => false);
  if (selector) break;
  await page.waitForTimeout(250);
}
if (!selector) throw new Error('offline-select did not open');

const name = page.locator('#char-name');
if (await name.count()) await name.fill('HighflyJumpSmash');
const warrior = page.locator('#offline-select .mini-class[data-class="warrior"]');
await warrior.waitFor({ state: 'visible', timeout: 15000 });
await warrior.click({ force: true });
await page.locator('#btn-start-offline').click({ force: true });

const preflight = page.locator('#mobile-preflight-continue');
if (await preflight.count()) await preflight.click({ force: true }).catch(() => {});
await page.waitForFunction(() => Boolean(window.__game?.sim?.player), null, { timeout: 30000 });
await page.waitForTimeout(3000);

await page.evaluate(() => {
  const wanted = new Set(['Dismiss', 'Understood', 'Got it', 'Skip tutorial']);
  for (const button of document.querySelectorAll('button')) {
    if (wanted.has((button.textContent ?? '').trim())) button.click();
  }
  document.querySelector('.camera-prompt-confirm')?.click();
  document.querySelector('button.tut-skip')?.click();
});
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(300);

const before = await page.evaluate((id) => {
  const g = window.__game;
  const sim = g.sim;
  const p = sim.player;
  sim.setPlayerLevel(20);
  p.resource = p.maxResource;
  p.gcdRemaining = 0;
  p.cooldowns.delete(id);
  const aim = {
    x: p.pos.x + Math.sin(p.facing) * 8,
    z: p.pos.z + Math.cos(p.facing) * 8,
  };
  return {
    start: { x: p.pos.x, y: p.pos.y, z: p.pos.z },
    aim,
    equipment: { ...p.equippedItems },
    resource: p.resource,
  };
}, ID);

await page.screenshot({ path: '../jump-smash-00-ready.png', fullPage: true });

const cast = await page.evaluate(({ id, aim }) => {
  const sim = window.__game.sim;
  const p = sim.player;
  sim.castAbility(id, p.id, aim);
  return {
    leapArmed: Boolean(p.leap),
    cooldown: p.cooldowns.get(id) ?? 0,
    resource: p.resource,
  };
}, { id: ID, aim: before.aim });

if (!cast.leapArmed) {
  throw new Error('Jump Smash did not arm; equipment=' + JSON.stringify(before.equipment));
}

await page.waitForTimeout(260);
const airborne = await page.evaluate(() => {
  const p = window.__game.sim.player;
  return { x: p.pos.x, y: p.pos.y, z: p.pos.z, leap: Boolean(p.leap), onGround: p.onGround };
});
await page.screenshot({ path: '../jump-smash-01-airborne.png', fullPage: true });

await page.waitForTimeout(520);
const after = await page.evaluate((id) => {
  const p = window.__game.sim.player;
  return {
    end: { x: p.pos.x, y: p.pos.y, z: p.pos.z },
    leap: Boolean(p.leap),
    onGround: p.onGround,
    cooldown: p.cooldowns.get(id) ?? 0,
    resource: p.resource,
  };
}, ID);
await page.screenshot({ path: '../jump-smash-02-impact.png', fullPage: true });

const traveled = Math.hypot(after.end.x - before.start.x, after.end.z - before.start.z);
const report = {
  id: ID,
  before,
  cast,
  airborne,
  after,
  traveled,
  consoleErrors: [...new Set(errors)],
  passed:
    cast.leapArmed &&
    airborne.leap &&
    !airborne.onGround &&
    !after.leap &&
    after.onGround &&
    traveled > 2 &&
    after.cooldown > 0 &&
    errors.length === 0,
};

fs.writeFileSync('../jump-smash-browser-report.json', JSON.stringify(report, null, 2));
console.log('HIGHFLY_JUMP_SMASH_BROWSER_REPORT');
console.log(JSON.stringify(report, null, 2));

await browser.close();
if (!report.passed) process.exitCode = 2;
