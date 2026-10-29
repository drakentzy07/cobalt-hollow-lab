#!/usr/bin/env node
// P7 source overlay: all changes stay in the temporary pinned v0.20 checkout.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'upstream');
function fix(file,tag,oldText,newText){
  const p=path.join(root,file),s=fs.readFileSync(p,'utf8');
  if(s.split(oldText).length!==2)throw Error('[P7] unsafe anchor: '+tag+' '+file);
  fs.writeFileSync(p,s.replace(oldText,newText));
}
const P7="typeof window!=='undefined' && new URLSearchParams(window.location.search).get('highfly_origin')==='1'";
// A: isolate and clear hidden MMO movement modes on touch.
fix('src/game/input.ts','movement-failsafe','  readMoveInput(): MoveInput {\n',
  '  readMoveInput(): MoveInput {\n'+
  '    if('+P7+" && document.body.classList.contains('mobile-touch')) {\n"+
  '      this.autorun=false;\n      if(this.clickMoveTarget)this.clearClickMove();\n    }\n');
fix('src/game/mobile_controls.ts','touch-down-stop',
'    this.joyPointer = e.pointerId;\n    triggerHaptic(HAPTIC_JOYSTICK, this.hapticsOn);',
'    this.joyPointer = e.pointerId;\n'+
'    if('+P7+') {this.input.autorun=false;this.input.clearClickMove();}\n'+
'    triggerHaptic(HAPTIC_JOYSTICK, this.hapticsOn);');
fix('src/game/mobile_controls.ts','pagehide-stop',
"    window.addEventListener('blur', () => {\n      this.releaseMove();",
"    window.addEventListener('pagehide',()=>this.releaseMove());\n"+
"    window.addEventListener('blur', () => {\n      this.releaseMove();");
fix('src/main.ts','disable-click-move-mobile',
"    const clickToMove = settings.get('clickToMove') > 0 && !movementFrozen();",
"    const clickToMove = settings.get('clickToMove') > 0 && !movementFrozen() &&\n"+
"      !("+P7+" && document.body.classList.contains('mobile-touch'));");
// C: four real instant engine abilities, no old auto-attack toggle.
const combos=[];
for(let n=1;n<=4;n++){
 combos.push("  highfly_p7_basic_"+n+": {\n"+
 "    id:'highfly_p7_basic_"+n+"', name:'HIGHFLY Basic "+n+"',class:'warrior',\n"+
 "    learnLevel:1,cost:0,castTime:0,cooldown:0,range:0,\n"+
 "    school:'physical',requiresTarget:true,offGcd:true,\n"+
 "    effects:[{type:'weaponStrike',bonus:"+([2,3,4,8][n-1])+"}],\n"+
 "    description:'HIGHFLY "+n+"/4 basic combo strike',\n  },");
}
fix('src/sim/content/classes.ts','P7-combo-defs',
'export const ABILITIES: Record<string, AbilityDef> = {\n',
'export const ABILITIES: Record<string, AbilityDef> = {\n'+combos.join('\n')+'\n');
// B: live existing charge / bleed / AOE / slow abilities, cost zero for early
// testing. Not a universal resource system yet; no online or world data changed.
fix('src/sim/sim.ts','import-abilities',
'  abilitiesKnownAt,\n  arenaOrigin,',
'  abilitiesKnownAt,\n  ABILITIES,\n  arenaOrigin,');
const knownPatch=[
'    meta.known = abilitiesKnownAt(meta.cls, e.level, meta.talentMods);',
'    if('+P7+" && this.cfg.playerClass==='warrior' &&",
'       meta.entityId===this.primaryId && !this.cfg.world) {',
"      const ids=['charge','rend','thunder_clap','hamstring'];",
"      const kit=abilitiesKnownAt('warrior',16,meta.talentMods);",
'      for(const id of ids){',
'        const a=kit.find(k=>k.def.id===id);if(!a)continue;',
"        const adjusted={...a,cost:0,castTime:0,cooldown:id==='rend'?3:id==='hamstring'?4:a.cooldown};",
'        const index=meta.known.findIndex(k=>k.def.id===id);',
'        if(index<0)meta.known.push(adjusted);else meta.known[index]=adjusted;',
'      }',
'      for(let n=1;n<=4;n++){',
"        const def=ABILITIES['highfly_p7_basic_'+n];",
'        if(def&&!meta.known.some(k=>k.def.id===def.id))',
'          meta.known.push({def,rank:1,cost:0,castTime:0,cooldown:0,',
'            effects:def.effects,threatFlat:0,threatMult:1});',
'      }',
'    }'
].join('\n')+'\n';
fix('src/sim/sim.ts','grant-P7-skills',
'    meta.known = abilitiesKnownAt(meta.cls, e.level, meta.talentMods);\n',knownPatch);
// On first entry only, persist four actual ability IDs with the real hotbar.
// Preserve user changes afterward and exclude combo internals from auto-placement.
const seed=[
'    if(('+P7+') && (!stored || !Array.isArray(arr) || arr.slice(0,4).every(x=>!x))) {',
"      arr=['charge','rend','thunder_clap','hamstring'].map(id=>({type:'ability',id}));",
'      try{localStorage.setItem(this.slotMapKey(),JSON.stringify(arr));stored=true;}catch{}',
'    }',
'    const parsed = parseHotbarActions(',
'      arr,',
'      Hud.BAR_ABILITY_SLOTS,'
].join('\n');
fix('src/ui/hud.ts','P7-real-hotbar',
'    const parsed = parseHotbarActions(\n      arr,\n      Hud.BAR_ABILITY_SLOTS,',seed);
fix('src/ui/hud.ts','exclude-internal-combos-from-bar',
'    const consider = (id: string) => {\n      if (this.shouldAutoPlaceOnForm(id, this.activeHotbarForm)) autoPlaceAbilityIds.add(id);\n    };',
'    const consider = (id: string) => {\n'+
"      if("+P7+" && !['charge','rend','thunder_clap','hamstring'].includes(id))return;\n"+
'      if (this.shouldAutoPlaceOnForm(id, this.activeHotbarForm)) autoPlaceAbilityIds.add(id);\n    };');
fix('src/main.ts','P7-basic-state',
'  function attackNearest(): void {\n    const p = world.player;',
'  let highflyP7Combo=0;\n  let highflyP7LastAttack=0;\n'+
'  function attackNearest(): void {\n    const p = world.player;');
fix('src/main.ts','P7-manual-basic-dispatch',
'    world.targetEntity(best);\n    world.startAutoAttack();\n  }\n\n  function clickMovePathTo(',
'    world.targetEntity(best);\n'+
'    if('+P7+" && offlineSim && document.body.classList.contains('mobile-touch')) {\n"+
'      const now=performance.now();\n      if(now-highflyP7LastAttack<190)return;\n'+
'      highflyP7Combo=now-highflyP7LastAttack>1200?1:(highflyP7Combo%4)+1;\n'+
'      highflyP7LastAttack=now;\n'+
"      world.castAbility('highfly_p7_basic_'+highflyP7Combo);\n      return;\n"+
'    }\n    world.startAutoAttack();\n  }\n\n  function clickMovePathTo(');
// B: introduce a named Hunter in the original world, not a fake "all classes"
// claim. Underlying class warrior remains until independent resource work.
const intro=[
'function openHighflyP7Intro(): void {',
"  document.body.classList.add('highfly-p7');",
"  const cover=document.createElement('div');cover.id='highfly-p7-intro';",
"  const card=document.createElement('div');card.className='highfly-p7-intro-card';",
"  card.innerHTML='<div class=\"highfly-p7-kicker\">HIGHFLY ORIGIN · P7</div>'+",
"    '<h1>HUNTER</h1><p>Un personaje · Mundo abierto · Combate libre</p>'+",
"    '<label for=\"highfly-p7-name\">Nombre del cazador</label>'+",
"    '<input id=\"highfly-p7-name\" maxlength=\"16\" value=\"Draken\" />'+",
"    '<p class=\"highfly-p7-note\">Laboratorio: clase base Warrior, 4 skills físicas de prueba.</p>'+",
"    '<button type=\"button\" id=\"highfly-p7-enter\">ENTRAR AL MUNDO</button>';",
'  cover.append(card);document.body.append(cover);',
"  const field=card.querySelector('#highfly-p7-name') as HTMLInputElement;",
"  try{const saved=localStorage.getItem('highfly_p7_hunter_name');if(saved)field.value=saved;}catch{}",
'  const begin=()=>{',
"    const name=sanitizeOfflineName(field.value.trim()||'Draken');",
"    try{localStorage.setItem('highfly_p7_hunter_name',name);}catch{}",
"    cover.remove();void startOffline('warrior',name,0);",
'  };',
"  card.querySelector('#highfly-p7-enter')?.addEventListener('click',begin);",
"  field.addEventListener('keydown',e=>{if(e.key==='Enter')begin();});",
'}',
'const editorPlaytest = takeEditorPlaytestRequest();'
].join('\n');
fix('src/main.ts','p7-char-creation',
'const editorPlaytest = takeEditorPlaytestRequest();',intro);
fix('src/main.ts','P7-intro-boot',
"  void startOffline('warrior', 'Draken', 0);",
"  openHighflyP7Intro();");
// D: conditional visual mobile panel overhaul; no imported licensed imagery.
const cssPath=path.join(root,'src/styles/hud.mobile.css');
const css=fs.readFileSync(new URL('./p7_mobile.css',import.meta.url),'utf8');
if(!css.includes('HIGHFLY-P7-MOBILE'))throw Error('Missing P7 styles');
fs.appendFileSync(cssPath,'\n'+css);
console.log('HIGHFLY_P7_ABC_D_APPLIED=1');
