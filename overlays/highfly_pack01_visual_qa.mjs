import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4173/cobalt-hollow-lab/';
const CASES = [
  { cls: 'warrior', id: 'hf_jump_smash_01', name: 'Salto Demoledor', wait: 720, kind: 'position' },
  { cls: 'hunter', id: 'hf_hunter_prison_01', name: 'Prisión del Cazador', wait: 1100, kind: 'enemy' },
  { cls: 'mage', id: 'hf_phoenix_lance_01', name: 'Lanza del Fénix', wait: 6350, kind: 'enemy' },
  { cls: 'priest', id: 'hf_living_covenant_01', name: 'Pacto Viviente', wait: 320, kind: 'self' },
  { cls: 'druid', id: 'moonlash', name: 'Oleada Lunar', wait: 650, kind: 'enemy', moonkin: true },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];

async function enterClass(testCase) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#btn-offline').waitFor({ state: 'attached', timeout: 15000 });

  let selector = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    await page.evaluate(() => document.querySelector('#btn-offline')?.click());
    selector = await page.locator('#offline-select').isVisible().catch(() => false);
    if (selector) break;
    await page.waitForTimeout(250);
  }
  if (!selector) throw new Error(testCase.cls + ': offline-select did not open');

  const name = page.locator('#char-name');
  if (await name.count()) await name.fill('HF-' + testCase.cls);
  const choice = page.locator('#offline-select .mini-class[data-class="' + testCase.cls + '"]');
  await choice.waitFor({ state: 'visible', timeout: 15000 });
  await choice.click({ force: true });
  await page.locator('#btn-start-offline').click({ force: true });

  const preflight = page.locator('#mobile-preflight-continue');
  if (await preflight.count()) await preflight.click({ force: true }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__game?.sim?.player), null, { timeout: 30000 });
  await page.waitForTimeout(2200);

  await page.evaluate(() => {
    const wanted = new Set(['Dismiss', 'Understood', 'Got it', 'Skip tutorial']);
    for (const button of document.querySelectorAll('button')) {
      if (wanted.has((button.textContent ?? '').trim())) button.click();
    }
    document.querySelector('.camera-prompt-confirm')?.click();
    document.querySelector('button.tut-skip')?.click();
  });
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(250);

  return { context, page, consoleErrors, pageErrors };
}

async function configureAndCast(page, testCase) {
  return await page.evaluate((cfg) => {
    const sim = window.__game.sim;
    const p = sim.player;
    sim.setPlayerLevel(20);
    p.resource = p.maxResource;
    p.gcdRemaining = 0;
    p.cooldowns.delete(cfg.id);

    const forward = {
      x: p.pos.x + Math.sin(p.facing) * 7,
      y: p.pos.y,
      z: p.pos.z + Math.cos(p.facing) * 7,
    };

    if (cfg.moonkin) {
      p.auras.push({
        id: 'hf_visualqa_form_moonkin',
        name: 'Moonkin Form',
        kind: 'form_moonkin',
        value: 0,
        remaining: 30,
        duration: 30,
        sourceId: p.id,
        school: 'nature',
      });
    }

    let target = null;
    if (cfg.kind === 'enemy') {
      target = [...sim.entities.values()].find(
        (e) => e.id !== p.id && e.kind === 'mob' && !e.dead && e.ownerId == null,
      ) ?? null;
      if (!target) throw new Error(cfg.cls + ': no world mob available for visual QA');
      target.dead = false;
      target.hostile = true;
      target.pos.x = forward.x;
      target.pos.y = forward.y;
      target.pos.z = forward.z;
      if (target.prevPos) {
        target.prevPos.x = forward.x;
        target.prevPos.y = forward.y;
        target.prevPos.z = forward.z;
      }
      target.hp = Math.max(target.hp, 50000);
      target.maxHp = Math.max(target.maxHp, 50000);
      p.targetId = target.id;
    }

    if (cfg.kind === 'position') {
      sim.castAbility(cfg.id, p.id, { x: forward.x, z: forward.z });
    } else if (cfg.kind === 'self') {
      sim.castAbility(cfg.id, p.id, p.id);
    } else {
      sim.castAbility(cfg.id, p.id, target?.id ?? null);
    }

    return {
      playerId: p.id,
      targetId: target?.id ?? null,
      start: { x: p.pos.x, y: p.pos.y, z: p.pos.z },
      forward,
      cooldown: p.cooldowns.get(cfg.id) ?? 0,
      resource: p.resource,
      castingAbility: p.castingAbility ?? null,
      leap: Boolean(p.leap),
    };
  }, testCase);
}

for (const testCase of CASES) {
  const { context, page, consoleErrors, pageErrors } = await enterClass(testCase);
  const beforePath = '../pack01-' + testCase.cls + '-00-ready.png';
  const impactPath = '../pack01-' + testCase.cls + '-01-skill.png';
  await page.screenshot({ path: beforePath, fullPage: true });

  let cast;
  try {
    cast = await configureAndCast(page, testCase);
  } catch (err) {
    report.push({
      ...testCase,
      passed: false,
      stage: 'cast',
      error: String(err),
      consoleErrors,
      pageErrors,
    });
    await context.close();
    continue;
  }

  await page.waitForTimeout(testCase.wait);
  await page.screenshot({ path: impactPath, fullPage: true });

  const after = await page.evaluate((cfg) => {
    const sim = window.__game.sim;
    const p = sim.player;
    return {
      pos: { x: p.pos.x, y: p.pos.y, z: p.pos.z },
      cooldown: p.cooldowns.get(cfg.id) ?? 0,
      resource: p.resource,
      castingAbility: p.castingAbility ?? null,
      leap: Boolean(p.leap),
      eventCount: sim.drainEvents().length,
    };
  }, testCase);

  const criticalErrors = [...new Set([...pageErrors, ...consoleErrors])].filter((message) => {
    if (/character visual unavailable, skipping view/i.test(message)) return false;
    if (/THREE\.GLTFLoader: Couldn't load texture blob:/i.test(message)) return false;
    if (/Failed to load resource:.*(?:404|502)/i.test(message)) return false;
    return /TypeError|ReferenceError|SyntaxError|RangeError|WebGL.*Context Lost/i.test(message);
  });

  report.push({
    ...testCase,
    cast,
    after,
    screenshot: impactPath.replace('../', ''),
    criticalErrors,
    passed: criticalErrors.length === 0,
  });
  await context.close();
}

await browser.close();

fs.writeFileSync('../pack01-visualqa-report.json', JSON.stringify(report, null, 2));

const cards = report.map((r) => {
  const status = r.passed ? 'GREEN' : 'CHECK';
  const note = r.error ? '<pre>' + String(r.error).replace(/[&<>]/g, '') + '</pre>' : '';
  return '<article class="card">' +
    '<div class="head"><span>' + r.name + '</span><b>' + status + '</b></div>' +
    (r.screenshot ? '<img src="' + r.screenshot + '" alt="' + r.name + '">' : '') +
    '<div class="meta">' + r.cls.toUpperCase() + ' · ' + r.id + '</div>' + note +
    '</article>';
}).join('\n');

const html = '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1">' +
'<title>HIGHFLY Production Pack 01 Visual QA</title>' +
'<style>body{margin:0;background:#090a0f;color:#f5f6ff;font-family:Arial,sans-serif}header{padding:24px 28px;background:#121420;position:sticky;top:0;z-index:3}h1{margin:0;font-size:24px}.sub{opacity:.7;margin-top:6px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:18px;padding:20px}.card{background:#11131b;border:1px solid #272a38;border-radius:16px;overflow:hidden}.head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px}.head b{font-size:12px}.card img{width:100%;display:block;background:#000}.meta{padding:12px 16px 16px;opacity:.68;font-size:12px}pre{white-space:pre-wrap;padding:12px;color:#ffb3b3}</style></head><body>' +
'<header><h1>HIGHFLY · Production Pack 01 Visual QA</h1><div class="sub">5 EVO endpoints · screenshots from real WebGL/browser runtime</div></header>' +
'<main class="grid">' + cards + '</main></body></html>';

fs.writeFileSync('../pack01-visual-lab.html', html);
console.log('HIGHFLY_PACK01_VISUAL_QA');
console.log(JSON.stringify(report, null, 2));

if (report.some((r) => !r.passed)) process.exitCode = 2;
