/**
 * HIGHFLY V13 — isolated native nine-class Skill Lab.
 * Uses the SAME ClaudeCraft Sim and its real renderer. Never changes main Pages,
 * permanent training, actor progression or any saved hunter.
 * SOURCE: SF27 63 native AbilityDefs + SF3 authored 9x7 catalog.
 */
import { HIGHFLY_FUSED_SKILLS, type HighflyClass } from './sf3_skill_catalog';
import { ABILITIES } from '../sim/content/classes';
import { MOBS } from '../sim/data';
import { createMob } from '../sim/entity';
import type { Sim } from '../sim/sim';

const CLASSES: readonly HighflyClass[] = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest',
  'shaman', 'mage', 'warlock', 'druid',
];
const NAMES: Readonly<Record<HighflyClass, string>> = {
  warrior: 'Warrior', paladin: 'Paladin', hunter: 'Hunter',
  rogue: 'Rogue', priest: 'Priest', shaman: 'Shaman',
  mage: 'Mage', warlock: 'Warlock', druid: 'Druid',
};
const LAB_QUERY_KEY = 'hfV13Class';
export function isHighflyV13LabPage(): boolean {
  return location.pathname.replace(/\/+$/, '').endsWith('/lab/v13');
}
export function highflyV13ClassFromQuery(): HighflyClass {
  const candidate = new URLSearchParams(location.search).get(LAB_QUERY_KEY);
  return CLASSES.find(c => c === candidate) ?? 'warrior';
}
export function highflyV13Catalog() {
  const all = CLASSES.flatMap(cls => HIGHFLY_FUSED_SKILLS[cls]);
  if (all.length !== 63 || new Set(all.map(s => s.id)).size !== 63
      || CLASSES.some(cls => HIGHFLY_FUSED_SKILLS[cls].length !== 7)) {
    throw Error('V13 source contract changed: expected exact 9x7 SF27');
  }
  return all;
}
type SkillSpec = ReturnType<typeof highflyV13Catalog>[number];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, className: string, text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function classUrl(cls: HighflyClass): string {
  const url = new URL(location.href);
  url.searchParams.set(LAB_QUERY_KEY, cls);
  return url.toString();
}
function skillsFx(id: string): string {
  const def = ABILITIES[id];
  if (!def) return 'Fuente ausente';
  const cues = [
    def.castFx ? 'Cast: ' + def.castFx : '',
    def.projectileFx ? 'Proyectil: ' + def.projectileFx : '',
    def.projectile ? 'Proyectil nativo' : '',
  ].filter(Boolean);
  return cues.join(' · ') || 'Efectos nativos (sin cue explícito; comprobar en escena)';
}
function effectKinds(id: string): string {
  const def = ABILITIES[id];
  if (!def) return 'Pendiente';
  const effects = def.ranks?.filter(r => r.level <= 99).at(-1)?.effects ?? def.effects;
  return [...new Set(effects.map(e => e.type))].join(', ') || 'Hook especial / pasiva de casteo';
}

export function installHighflyV13Lab(sim: Sim): void {
  if (!isHighflyV13LabPage() || document.getElementById('hf-v13-root')) return;
  const catalog = highflyV13Catalog();
  const player = sim.player;
  const cls = sim.cfg.playerClass as HighflyClass;
  // Only a disposable offline LV99 actor. No persistence and no quest save.
  const dummy = createMob(993063, MOBS.training_dummy, 20, {
    x: player.pos.x + 2, y: player.pos.y, z: player.pos.z + 4,
  });
  dummy.hostile = true;
  dummy.aiState = 'idle';
  dummy.hp = 100000000;
  dummy.maxHp = 100000000;
  sim.addEntity(dummy);

  const root = el('aside', 'hf-v13-root');
  root.id = 'hf-v13-root';
  root.innerHTML =
    '<div class="hf-v13-head"><div><b>HIGHFLY · SKILL LAB V13</b><small>SF27 63/63 · combate original ClaudeCraft</small></div>' +
    '<button type="button" class="hf-v13-collapse" title="Ocultar panel">−</button></div>' +
    '<div class="hf-v13-toolbar"><span>Clase actual: <b class="hf-v13-current"></b></span>' +
    '<span>LV99 · dummy nativo · modo aislado</span></div>' +
    '<nav class="hf-v13-classes" aria-label="Filtrar por clase"></nav>' +
    '<div class="hf-v13-search"><input type="search" placeholder="Buscar entre 63 skills…" aria-label="Buscar habilidad"/>' +
    '<span class="hf-v13-count"></span></div>' +
    '<div class="hf-v13-list" role="list" aria-label="Lista de habilidades HIGHFLY"></div>' +
    '<div class="hf-v13-detail"><strong>Elegí una skill del scroll</strong><div class="hf-v13-info"></div>' +
    '<div class="hf-v13-actions"></div></div>' +
    '<div class="hf-v13-status" role="status">V13 LAB: listo para elegir y probar. Android horizontal / PC.</div>';
  document.body.appendChild(root);
  const current = root.querySelector<HTMLElement>('.hf-v13-current')!;
  current.textContent = NAMES[cls] ?? cls;
  const tabs = root.querySelector<HTMLElement>('.hf-v13-classes')!;
  const list = root.querySelector<HTMLElement>('.hf-v13-list')!;
  const detail = root.querySelector<HTMLElement>('.hf-v13-detail')!;
  const info = root.querySelector<HTMLElement>('.hf-v13-info')!;
  const actions = root.querySelector<HTMLElement>('.hf-v13-actions')!;
  const search = root.querySelector<HTMLInputElement>('.hf-v13-search input')!;
  const counter = root.querySelector<HTMLElement>('.hf-v13-count')!;
  const status = root.querySelector<HTMLElement>('.hf-v13-status')!;
  let filter: HighflyClass | 'all' = 'all';
  let selected: SkillSpec | null = null;
  let running = false;

  function say(message: string): void { status.textContent = message; }
  const choices: Array<HighflyClass | 'all'> = ['all', ...CLASSES];
  for (const c of choices) {
    const btn = el('button', 'hf-v13-tab', c === 'all' ? 'TODAS · 63' : NAMES[c]);
    btn.type = 'button';
    btn.dataset.classId = c;
    btn.addEventListener('click', () => {
      filter = c;
      render();
      say(c === 'all' ? 'Mostrando las 63 habilidades' : 'Filtradas: ' + NAMES[c]);
    });
    tabs.appendChild(btn);
  }
  function render(): void {
    const term = search.value.trim().toLocaleLowerCase();
    const visible = catalog.filter(s => (filter === 'all' || s.classId === filter)
      && (!term || [s.id, s.name, NAMES[s.classId], ...s.donors]
        .some(v => v.toLocaleLowerCase().includes(term))));
    counter.textContent = visible.length + '/63';
    tabs.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
      button.classList.toggle('active', button.dataset.classId === filter);
    });
    list.replaceChildren();
    for (const s of visible) {
      const button = el('button', 'hf-v13-skill' + (s.id === selected?.id ? ' selected' : ''));
      button.type = 'button';
      button.setAttribute('role', 'listitem');
      button.dataset.skillId = s.id;
      button.appendChild(el('span', 'hf-v13-skill-number', String(s.slot).padStart(2, '0')));
      const block = el('span', 'hf-v13-skill-name');
      block.appendChild(el('strong', '', s.name));
      block.appendChild(el('small', '', NAMES[s.classId] + ' · LV' + s.unlockLevel
        + ' · ' + s.donors.join(' + ')));
      button.appendChild(block);
      button.appendChild(el('span', 'hf-v13-kind', s.ultimate ? 'U' : 'S'));
      button.addEventListener('click', () => { selected = s; render(); show(s); });
      list.appendChild(button);
    }
  }
  function cast(id: string, label: string): void {
    if (running || !selected) return;
    if (selected.classId !== cls) {
      say('Elegí «Entrar como ' + NAMES[selected.classId] + '» para probar con clase auténtica.');
      return;
    }
    const def = ABILITIES[id];
    if (!def) { say('ERROR: ability nativa ausente: ' + id); return; }
    if (def.class !== cls) { say('Bloqueado: habilidad de otra clase'); return; }
    // One shared original native Sim. Do not synthesize particles, sounds or damage.
    // Reset the SAME dummy and player resource before each A or B cast.
    player.cooldowns.clear();
    player.resource = player.maxResource;
    player.hp = player.maxHp;
    dummy.hp = dummy.maxHp;
    sim.targetEntity(dummy.id, sim.playerId);
    const beforeHp = dummy.hp;
    const beforeAuras = player.auras.length;
    const start = performance.now();
    running = true;
    say('Lanzando ' + label + ' → ' + def.name + ' · VFX/animación del motor nativo…');
    try {
      sim.castAbility(id, sim.playerId, { x: dummy.pos.x, z: dummy.pos.z });
    } catch (error) {
      running = false;
      say('CAST RECHAZADO: ' + String(error));
      return;
    }
    // Damage over 7s includes native projectiles and most short channels;
    // longer DoTs and resurrection mechanics require separate detailed QA.
    window.setTimeout(() => {
      const dmg = Math.max(0, beforeHp - dummy.hp);
      const cd = player.cooldowns.get(id) ?? 0;
      const active = cd > 0 || dmg > 0 || player.auras.length !== beforeAuras;
      const elapsed = ((performance.now() - start) / 1000).toFixed(1);
      say(label + ' · ' + def.name + ' | Daño observado: ' + Math.round(dmg)
        + ' | CD restante: ' + cd.toFixed(1) + 's | Auras Δ: '
        + (player.auras.length - beforeAuras)
        + ' | Ventana: ' + elapsed + 's | ' + (active ? 'CAST observado' : 'SIN EVIDENCIA: verificar restricciones')
        + ' | VFX visual: evaluación manual pendiente');
      running = false;
    }, 7000);
  }
  function show(s: SkillSpec): void {
    detail.querySelector('strong')!.textContent = NAMES[s.classId] + ' · ' + s.name;
    info.replaceChildren();
    info.appendChild(el('p', '', 'HIGHFLY: ' + s.id + ' · Nivel ' + s.unlockLevel));
    info.appendChild(el('p', '', 'Mecánicas: ' + effectKinds(s.id)));
    info.appendChild(el('p', '', 'VFX declarados: ' + skillsFx(s.id)));
    info.appendChild(el('p', '', 'Donantes originales: ' + s.donors.join(' + ')));
    actions.replaceChildren();
    if (s.classId !== cls) {
      const change = el('button', 'hf-v13-switch', 'Entrar como ' + NAMES[s.classId] + ' ↗');
      change.type = 'button';
      change.addEventListener('click', () => location.assign(classUrl(s.classId)));
      actions.appendChild(change);
      info.appendChild(el('p', 'hf-v13-note', 'Para conservar el motor real cada prueba usa un Hunter de la clase elegida. Cambiar de clase reinicia solamente esta sesión aislada.'));
      return;
    }
    const h = el('button', 'hf-v13-cast fused', '▶ Probar HIGHFLY');
    h.type = 'button';
    h.addEventListener('click', () => cast(s.id, 'HIGHFLY'));
    actions.appendChild(h);
    s.donors.forEach((id, index) => {
      const original = el('button', 'hf-v13-cast original', 'B' + (index + 1) + ' · ' + (ABILITIES[id]?.name ?? id));
      original.type = 'button';
      original.addEventListener('click', () => cast(id, 'ORIGINAL ' + (index + 1)));
      actions.appendChild(original);
    });
    info.appendChild(el('p', 'hf-v13-note',
      'A/B: mismo personaje LV99, equipo, recursos y dummy. Se reinicia CD para cada disparo.'
      + ' Algunos casts requieren aliados, formas, condiciones especiales o un escenario aparte.'
      + ' Los VFX son nativos; no se declaran perfectos sin prueba visual.'));
  }
  search.addEventListener('input', render);
  root.querySelector<HTMLButtonElement>('.hf-v13-collapse')!.addEventListener('click', () => {
    root.classList.toggle('collapsed');
    root.querySelector<HTMLButtonElement>('.hf-v13-collapse')!.textContent =
      root.classList.contains('collapsed') ? '+' : '−';
  });
  // Stop mobile gameplay gestures passing through the scroll panel.
  for (const type of ['pointerdown', 'pointermove', 'wheel'] as const) {
    root.addEventListener(type, event => event.stopPropagation(), { passive: true });
  }
  render();
  selected = HIGHFLY_FUSED_SKILLS[cls][0];
  render();
  show(selected);
  say('V13 ACTIVO · ' + NAMES[cls] + ' LV99 · 63 skills en scroll · Sim/renderer original.');
}
