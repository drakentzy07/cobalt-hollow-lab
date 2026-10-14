/** HIGHFLY V14: independent original ClaudeCraft 9 x 10 selections.
 * Never registers, mutates or remixes an ability definition. All casts are native.
 * This is a disposable LV99 playtest character: production saves are untouched.
 */
import {ABILITIES,CLASSES} from '../sim/content/classes';
import type {AbilityDef} from '../sim/types';

export const V14_CLASSES=['warrior','rogue','paladin','mage','hunter','priest','shaman','warlock','druid'] as const;
export type V14Class=typeof V14_CLASSES[number];
/** A coherent original talent specialization for each ten-skill shortlist.
 * We do NOT assign talents, respec a saved character or override ClaudeCraft gates.
 * An uncommitted test character can inspect all ten, but native known-ability
 * checks always decide what can actually be equipped and cast.
 */
export const V14_RECOMMENDED_SPEC:Record<V14Class,string>={
 warrior:'arms',rogue:'subtlety',paladin:'retribution',mage:'fire',
 hunter:'marksmanship',priest:'shadow',shaman:'elemental',
 warlock:'destruction',druid:'feral',
};
export const V14_ORIGINALS:Record<V14Class,readonly string[]>={
 warrior:['charge','slam','overpower','hamstring','pummel','execute','heroic_leap','cleave','breachmaker','intimidating_shout'],
 rogue:['sinister_strike','eviscerate','backstab','ambush','garrote','rupture','kidney_shot','kick','venom_dart','blind'],
 paladin:['final_edict','hammer_of_justice','consecration','hammer_of_grace','dawnfall','solar_step','hushbrand','hammer_of_wrath','sun_gods_verdict','valkyrs_calling'],
 mage:['fireball','fire_blast','scorch','flamestrike','pyroblast','meteor','dragons_breath','blink','frost_nova','polymorph'],
 hunter:['measured_shot','arcane_shot','serpent_sting','concussive_shot','frostjaw_trap','trailbreak','volley','aimed_shot','rapid_fire','counter_shot'],
 priest:['smite','shadow_word_pain','mind_blast','mind_flay','flash_heal','lesser_heal','heal','psychic_scream','summon_tithefiend','veilstep'],
 shaman:['lightning_bolt','chain_lightning','flame_shock','lava_burst','frost_shock','earth_shock','earthquake','thunderstorm','healing_wave','unleash_weapon'],
 warlock:['shadow_bolt','corruption','immolate','chaos_bolt','drain_life','fear','rain_of_fire','summon_imp','summon_infernal','shadowburn'],
 druid:['wrath','moonfire','entangling_roots','bear_charge','maul','rake','ferocious_bite','starfire','hurricane','pounce'],
};
const SHOW_BUFF_TYPES=new Set(['selfBuff','buffTarget','imbue','partyMeleeBuff','aoeAllyHaste','partyBuff','groupBuff','raidBuff','aura','applyAura','buff','shapeshift','transform','form','healOverTime','applyBuff']);
const BUFF_ID_PARTS=/^(?:aspect_of_|seal_of_|blessing_of_|.*_stance$|.*_form$|mark_of_the_wild$|power_word_fortitude$|arcane_intellect$|frost_armor$|demon_skin$|lightning_shield$|.*_weapon$|bloodlust$|battle_shout$|rallying_cry$|retribution_aura$|barkskin$|thorns$|stealth$|slice_and_dice$|sprint$|evasion$|renew$|rejuvenation$|regrowth$|power_word_shield$|bone_armor$|avenging_wrath$|berserker_rage$|bloodrage$|tigers_fury$|adrenaline_rush$|ghost_wolf$|travel_form$)/;
function originalBuff(def:AbilityDef):boolean {
 if(def.passive)return true;
 if(BUFF_ID_PARTS.test(def.id))return true;
 if(/^(?:prowl|vanish|divine_ascension|avenging_wrath|divine_protection|aura_mastery|retribution_aura|devotion_aura|devotion_ward|radiant_devotion|dawn_devotion|grace_devotion|power_infusion|inner_focus|seraphic_vigil|thunder_reservoir|trueshot_aura|cold_focus|berserker_rage|rallying_cry|battle_shout|primal_exaltation|elemental_mastery|recklessness|avatar|innervate|bloodlust|bone_armor)$/.test(def.id))return true;
 const effects=def.effects??[];
 return effects.length>0 && effects.every(e=>SHOW_BUFF_TYPES.has(e.type));
}
export function v14Buffs(cls:V14Class):AbilityDef[] {
 // Include original talent-granted buffs in the catalogue, but the Sim decides
 // if the chosen spec/talent/level actually KNOWS each one.
 return Object.values(ABILITIES).filter(d=>d.class===cls&&!d.hiddenFromPlayer&&
     originalBuff(d)&&!V14_ORIGINALS[cls].includes(d.id))
  .sort((a,b)=>a.learnLevel-b.learnLevel||a.name.localeCompare(b.name));
}
export function v14OriginalCatalogueErrors():string[]{
 const errors:string[]=[];
 for(const cls of V14_CLASSES){
  const ids=V14_ORIGINALS[cls];
  if(ids.length!==10||new Set(ids).size!==10)errors.push(cls+': requires ten distinct originals');
  for(const id of ids){
   const d=ABILITIES[id];
   if(!d||d.class!==cls||d.passive||d.hiddenFromPlayer)errors.push(cls+': invalid native original '+id);
   if(id.startsWith('hf_'))errors.push(cls+': fusion forbidden '+id);
   if(d?.specs && !d.specs.includes(V14_RECOMMENDED_SPEC[cls]))
     errors.push(cls+': '+id+' requires different specialization than '+V14_RECOMMENDED_SPEC[cls]);
  }
 }
 return errors;
}
export function v14Requested():boolean {return new URLSearchParams(location.search).get('hf-v14')==='1';}
export function v14Class():V14Class {
 const c=new URLSearchParams(location.search).get('hf-v14-class');
 return V14_CLASSES.includes(c as V14Class)?c as V14Class:'warrior';
}
export interface V14Hooks {
 equip:(id:string,slot:number)=>boolean;
 cast:(slot:number)=>void;
 castBuff:(id:string)=>void;
 aim:(slot:number,sx:number,sy:number,x:number,y:number,drag:boolean)=>boolean;
 known:()=>ReadonlySet<string>;
 resource:()=>{type:string;current:number;max:number};
 level:()=>number;
}
export function installV14(h:V14Hooks):void{
 if(!v14Requested()||document.getElementById('highfly-v14-lab'))return;
 const problems=v14OriginalCatalogueErrors();
 if(problems.length)throw Error('V14_INVALID_ORIGINALS: '+problems.join('; '));
 const cls=v14Class();
 const specs=V14_ORIGINALS[cls].map((id,i)=>({id,slot:i+1,def:ABILITIES[id]}));
 const make=(tag:string,label:string,style=''):HTMLElement=>{
  const el=document.createElement(tag);el.textContent=label;if(style)el.setAttribute('style',style);
  return el;
 };
 const panel=make('aside','','position:fixed;z-index:9990;top:8px;right:8px;'+
  'width:min(330px,43vw);max-height:65vh;display:flex;flex-direction:column;'+
  'background:#0c1c2bea;color:#f0f8ff;border:1px solid #69bbd9;border-radius:12px;'+
  'font:12px system-ui;overflow:hidden;box-shadow:0 8px 24px #000a;');
 panel.id='highfly-v14-lab';
 const title=make('div','HIGHFLY V14 · 10 ORIGINALES / CLASE',
  'font-weight:900;font-size:13px;background:#20445a;padding:9px;');
 const nav=make('div','','display:flex;gap:6px;padding:7px;');
 const select=document.createElement('select');
 select.setAttribute('aria-label','Clase original');
 select.setAttribute('style','min-width:0;flex:1;background:#233f55;color:#fff;padding:7px;');
 for(const id of V14_CLASSES){const opt=document.createElement('option');opt.value=id;opt.textContent=CLASSES[id].name;select.append(opt);}
 select.value=cls;
 select.addEventListener('change',()=>{
  const url=new URL(location.href);url.searchParams.set('hf-v14','1');
  url.searchParams.set('hf-v14-class',select.value);location.assign(url.href);
 });
 const hide=make('button','OCULTAR','background:#34576c;color:#fff;border:0;border-radius:6px;');
 nav.append(select,hide);
 const status=make('div','Preset técnico '+V14_RECOMMENDED_SPEC[cls]+' · equipando solamente habilidades originales conocidas…',
  'padding:7px;color:#a6e3ff;line-height:1.3;');
 const detail=make('div','','overflow:auto;padding:7px 9px;flex:1;');
 const equipped:string[]=[];
 function isKnown(id:string){return h.known().has(id);}
 function equipAll(){
  equipped.length=0;
  for(const p of specs)if(isKnown(p.id)&&h.equip(p.id,p.slot))equipped.push(p.id);
  panel.dataset.v14Equipped=String(equipped.length);
  status.textContent=equipped.length+'/10 equipadas · '+h.resource().type+
    ' NATIVO · ATK NORMAL ON · Inaccesibles: requisito de nivel, spec o talento.';
 }
 function skillCard(id:string,slot:number){
  const d=ABILITIES[id],known=isKnown(id);
  const btn=make('button','S'+slot+' · '+d.name+' ('+id+')',
    'width:100%;text-align:left;background:'+(known?'#173c4b':'#303b49')+
    ';border:1px solid '+(known?'#4a8e9b':'#586574')+
    ';color:white;border-radius:7px;padding:7px;margin-bottom:5px;');
  const info=make('div','LV '+d.learnLevel+' · '+(d.specs?.join('/')||'sin spec obligatoria')+
    ' · '+d.school+' · CD '+d.cooldown+'s · '+(d.targetMode||d.targetType||'nativo')+
    (known?'':' · BLOQUEADA'), 'font-size:10px;color:#a9ccdf;');
  btn.append(info);(btn as HTMLButtonElement).disabled=!known;
  btn.addEventListener('click',()=>{if(!h.equip(id,slot)){status.textContent='No autorizada: '+id;return;}
    h.cast(slot);status.textContent='Cast nativo: '+id;});
  return btn;
 }
 for(const p of specs)detail.append(skillCard(p.id,p.slot));
 const restore=make('button','↺ RESTAURAR LAS 10 SEGÚN SPEC / TALENTOS',
  'margin:7px;background:#19455d;border:1px solid #58b7cf;border-radius:7px;'+
  'color:#fff;padding:9px;font-weight:800;');
 restore.addEventListener('click',equipAll);
 const foot=make('div','Ninguna fusión SF4–SF27 · VFX y costes originales · LV99 únicamente como fixture de QA',
  'padding:7px;font-size:10px;color:#b7d2df;background:#102a3c;');
 panel.append(title,nav,status,restore,detail,foot);
 const floating=make('button','⚔ V14','position:fixed;top:8px;right:8px;z-index:9991;'+
  'background:#19455d;border:1px solid #58b7cf;border-radius:8px;color:#fff;'+
  'padding:9px;display:none;');
 hide.addEventListener('click',()=>{panel.style.display='none';floating.style.display='block';});
 floating.addEventListener('click',()=>{panel.style.display='flex';floating.style.display='none';});
 const deck=make('div','','position:fixed;z-index:9961;right:max(120px,11vw);'+
  'bottom:clamp(76px,15vh,112px);width:min(424px,53vw);display:grid;'+
  'grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;');
 deck.id='highfly-v14-ten-skill-deck';
 for(const p of specs){
  const b=make('button','S'+p.slot+'\n'+p.def.name,
    'border:1px solid #61b8d5;border-radius:9px;white-space:pre-line;'+
    'color:#fff;background:#102c42ed;min-height:48px;padding:3px;'+
    'font:600 9px system-ui;touch-action:none;user-select:none;');
  b.classList.add('mobile-btn');
  b.setAttribute('aria-label','S'+p.slot+' '+p.def.name);
  const button=b as HTMLButtonElement;
  let down:{id:number;x:number;y:number}|null=null;
  button.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();
    down={id:e.pointerId,x:e.clientX,y:e.clientY};
    button.setPointerCapture(e.pointerId);});
  button.addEventListener('pointerup',e=>{e.stopPropagation();e.preventDefault();
    if(!down||down.id!==e.pointerId)return;
    const a=down;down=null;
    if(!isKnown(p.id)){status.textContent=p.id+' bloqueada por nivel/spec/talento';return;}
    if(!h.equip(p.id,p.slot)){status.textContent='No equipable: '+p.id;return;}
    const drag=Math.hypot(e.clientX-a.x,e.clientY-a.y)>20;
    const ok=h.aim(p.slot,a.x,a.y,e.clientX,e.clientY,drag);
    status.textContent=ok?'Original '+p.id+' · '+(drag?'aim direccional':'cast nativo'):
      'Objetivo/condición nativa no válida para '+p.id;
  });
  button.addEventListener('pointercancel',()=>{down=null;});
  deck.append(button);
 }
 const buffTray=make('section','','position:fixed;z-index:9963;right:max(120px,11vw);'+
  'bottom:6px;width:min(424px,53vw);max-height:40vh;'+
  'background:#12273dea;border:1px solid #477a88;border-radius:8px;'+
  'color:#fff;font:11px system-ui;overflow:hidden;');
 buffTray.id='highfly-v14-buffs';
 const buffToggle=make('button','BUFS / AURAS / POSTURAS / PASIVAS ▾',
  'display:block;width:100%;padding:7px;background:#225064;color:white;'+
  'border:0;text-align:left;font-weight:bold;');
 const list=make('div','','display:none;max-height:33vh;overflow:auto;padding:6px;');
 const allBuffs=v14Buffs(cls);
 for(const d of allBuffs){
  const known=isKnown(d.id);
  const passive=d.passive===true;
  const button=make('button',(passive?'[PASIVA] ':'')+d.name+
    ' · LV'+d.learnLevel+(known?'':' · BLOQUEADA'),
    'margin:2px;border-radius:6px;border:1px solid #426477;'+
    'color:#fff;background:'+(known?'#204758':'#343942')+';padding:6px;'+
    'font:11px system-ui;text-align:left;');
  const b=button as HTMLButtonElement;b.disabled=!known||passive;
  b.title=d.description||d.id;
  b.addEventListener('click',()=>{if(!isKnown(d.id)){status.textContent='Buff no aprendido: '+d.id;return;}
    h.castBuff(d.id);status.textContent='Buff nativo solicitado: '+d.id;});
  list.append(b);
 }
 buffToggle.textContent='BUFS/AURAS/POSTURAS/PASIVAS · '+allBuffs.length+' ▾';
 buffToggle.addEventListener('click',()=>{const open=list.style.display!=='none';
   list.style.display=open?'none':'flex';list.style.flexWrap='wrap';
   buffToggle.textContent='BUFS/AURAS/POSTURAS/PASIVAS · '+allBuffs.length+(open?' ▾':' ▴');});
 buffTray.append(buffToggle,list);
 document.body.append(panel,floating,deck,buffTray);
 document.body.dataset.highflyV14NormalAttack='enabled';
 document.body.dataset.highflyV14OriginalCatalog='90';
 document.body.dataset.highflyV14BuffCatalogue=String(allBuffs.length);
 // Native skill radial duplicates the 10 direct buttons. ATK normal is separate
 // (#mobile-action-attack) and is NEVER disabled or even touched by V14.
 for(const id of ['mobile-action-ring','mobile-action-radial']){
  const el=document.getElementById(id);if(el)el.style.setProperty('display','none','important');
 }
 equipAll();
}
