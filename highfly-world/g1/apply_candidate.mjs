// HIGHFLY WORLD G1 overlay. Apply after G0 on an exact v0.44.7 checkout.
// Fail closed on upstream drift. Does NOT alter the donor's global defaults.
import {readFileSync,writeFileSync} from 'node:fs';
function one(path,before,after){
  const source=readFileSync(path,'utf8'), n=source.split(before).length-1;
  if(n!==1)throw Error('HIGHFLY_G1_UPSTREAM_DRIFT '+path+' match='+n+' '+before.slice(0,70));
  writeFileSync(path,source.replace(before,after),'utf8');
}
const main='src/main.ts';
one(main,'async function startOffline(\n',[
  "const HF_GENESIS_G1 = import.meta.env.VITE_HIGHFLY_WORLD_GENESIS === '1' &&",
  "  new URLSearchParams(location.search).get('hfWorld') === '1';",
  "const HF_GENESIS_PROFILE = 'highfly.world.genesis.g1.profile.v1';",
  "let highflyGenesisLab = false;",
  "// G1 first-pass armor-to-modular visual bridge; exact item/mesh maps come later.",
  "function highflyWornSlots(equipment: unknown): ArmorLoadout {",
  "  const eq = equipment as {helmet?:string;shoulder?:string;chest?:string;gloves?:string;legs?:string;feet?:string}|undefined;",
  "  const worn: ArmorLoadout = {};",
  "  const kit = classArmorSet('warrior');",
  "  if(eq?.helmet) worn.head=kit;",
  "  if(eq?.shoulder) worn.arms=kit;",
  "  if(eq?.chest) worn.chest=kit;",
  "  if(eq?.gloves) worn.hands=kit;",
  "  if(eq?.legs) worn.legs=kit;",
  "  if(eq?.feet) worn.feet=kit;",
  "  return worn;",
  "}",
  "",
  "async function startOffline(",
].join('\n'));
one(main,
 '  const offlinePlayer = sim.entities.get(sim.playerId);',
 [
 "  if (HF_GENESIS_G1) {",
 "    // Real inventory/gear unequip path prevents phantom starting equipment.",
 "    sim.unequipItem('mainhand', sim.playerId);",
 "    sim.unequipItem('offhand', sim.playerId);",
 "    sim.unequipItem('chest', sim.playerId);",
 "  }",
 "  const offlinePlayer = sim.entities.get(sim.playerId);",
 ].join('\n'));
const tick=String.fromCharCode(96),dol=String.fromCharCode(36);
const oldScope='  void startGame(sim, sim, null, '+tick+'offline:'+dol+'{playerClass}:'+dol+'{name}'+tick+', true);';
one(main,oldScope,
 "  void startGame(sim, sim, null, HF_GENESIS_G1 ? 'highfly:genesis:g1:' + (highflyGenesisLab ? 'lab:' : 'world:') + name : "+tick+"offline:"+dol+"{playerClass}:"+dol+"{name}"+tick+", true);");
one(main,
  "      e.kind === 'player'\n        ? inWorldLookFor(e, armorSetForEntity(e.id === world.playerId))\n        : npcLookFor(e.templateId, e.kind),",
  [
  "      e.kind === 'player'",
  "        ? (HF_GENESIS_G1 && offlineSim && e.id === world.playerId && e.modularAppearance",
  "            ? { app: normalizeAppearance(e.modularAppearance as Partial<ModularAppearance>),",
  "                worn: highflyWornSlots(offlineSim.players.get(e.id)?.equipment) }",
  "            : inWorldLookFor(e, armorSetForEntity(e.id === world.playerId)))",
  "        : npcLookFor(e.templateId, e.kind),"
  ].join('\n'));
one(main,
  '  return { app: modularAppearance, worn: creationLoadout(cls) };',
  '  return { app: modularAppearance, worn: HF_GENESIS_G1 ? {} : creationLoadout(cls) };');
one(main,
  "  const enter = document.getElementById('hf-world-enter') as HTMLButtonElement | null;\n"+
  "  enter?.addEventListener('click', () => {\n"+
  "    enter.disabled = true;\n"+
  "    void startOffline('warrior', 'WorldTester', 0).catch((error) => {\n"+
  "      console.error('HIGHFLY_G0_WORLD_BOOT_FAILED', error);\n"+
  "      enter.disabled = false;\n"+
  "    });\n  });",
  [
  "  const enter = document.getElementById('hf-world-enter') as HTMLButtonElement | null;",
  "  const lab = document.getElementById('hf-world-lab') as HTMLButtonElement | null;",
  "  const nameInput = document.getElementById('hf-hunter-name') as HTMLInputElement | null;",
  "  const genderInput = document.getElementById('hf-hunter-gender') as HTMLSelectElement | null;",
  "  try {",
  "    const profile = JSON.parse(localStorage.getItem(HF_GENESIS_PROFILE) || '{}') as {name?:string;gender?:string};",
  "    if(nameInput && profile.name) nameInput.value = profile.name;",
  "    if(genderInput && profile.gender === 'female') genderInput.value = 'female';",
  "  } catch {}",
  "  const launch = (mode: 'world' | 'lab', button: HTMLButtonElement | null) => {",
  "    if(!button) return;",
  "    highflyGenesisLab = mode === 'lab';",
  "    const name = sanitizeOfflineName(nameInput?.value.trim() || 'Hunter');",
  "    modularAppearance = normalizeAppearance({ ...modularAppearance,",
  "      gender: genderInput?.value === 'female' ? 'female' : 'male' });",
  "    try {localStorage.setItem(HF_GENESIS_PROFILE, JSON.stringify({name,gender:modularAppearance.gender}));} catch {}",
  "    button.disabled = true;",
  "    void startOffline('warrior', name, 0).catch(error => {",
  "      console.error('HIGHFLY_G1_BOOT_FAILED', error); button.disabled = false;",
  "    });",
  "  };",
  "  enter?.addEventListener('click', () => launch('world', enter));",
  "  lab?.addEventListener('click', () => {",
  "    try { void document.documentElement.requestFullscreen?.().catch(() => {}); } catch {}",
  "    try { void screen.orientation.lock?.('landscape')?.catch(() => {}); } catch {}",
  "    const gate=document.getElementById('hf-world-gate'); if(gate)gate.hidden=true;",
  "    launch('lab', lab);",
  "  });"
  ].join('\n'));
one('src/render/characters/assets.ts',
  '): AttachDef {\n  // A DISPLAYED ranged skin',
  [
    "): AttachDef | null {",
    "  // Null item must render bare hands, not the manifest's fallback sword.",
    "  if (import.meta.env.VITE_HIGHFLY_WORLD_GENESIS === '1' &&",
    "      new URLSearchParams(location.search).get('hfWorld') === '1' &&",
    "      !weaponItemId && !weaponSkinId) return null;",
    "  // A DISPLAYED ranged skin",
  ].join('\n'));
one('src/render/characters/assets.ts',
  "    const bone = attachTargetBone(root, att, stowed);\n    if (!bone) continue;\n    payloads.push(attachProp(root, bone, att, 'mainhand', stowed));",
  "    if (!att) continue;\n    const bone = attachTargetBone(root, att, stowed);\n    if (!bone) continue;\n    payloads.push(attachProp(root, bone, att, 'mainhand', stowed));");
one('index.html',
  '<button type="button" id="hf-world-enter">ENTRAR AL MUNDO</button>',
  [
  '<label style="display:block;margin:12px 0 6px">Nombre del Hunter</label>',
  '<input id="hf-hunter-name" maxlength="16" value="Hunter" autocomplete="off" aria-label="Nombre del Hunter" style="width:min(85%,290px);min-height:38px;padding:0 12px;background:#f0e8da;color:#101b26;border-radius:8px">',
  '<label style="display:block;margin:12px 0 6px">Cuerpo modular</label>',
  '<select id="hf-hunter-gender" aria-label="Cuerpo modular" style="min-height:38px;background:#f0e8da;color:#101b26;border-radius:8px;padding:0 12px">',
  '<option value="male">Hunter hombre</option><option value="female">Hunter mujer</option>',
  '</select>',
  '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px">',
  '<button type="button" id="hf-world-enter">ENTRAR AL MUNDO</button>',
  '<button type="button" id="hf-world-lab" style="min-width:205px;min-height:48px;border:1px solid #efd493;border-radius:10px;background:#23485d;color:#fff4d6;font-weight:800;font-size:16px;cursor:pointer">LABORATORIO</button>',
  '</div>',
  '<p>G1 · cuerpo sin equipo · habilidades HIGHFLY pendientes de integración</p>',
  ].join('\n'));
console.log('HIGHFLY_WORLD_G1_BARE_HUNTER_LAB_SCAFFOLD_APPLIED=PASS');
