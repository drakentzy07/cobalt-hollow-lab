/**
 * HIGHFLY SF8 — one real Sim per (class fusion × minimum legal LV / 99)
 * No fake combat engine, no generated legacy ability clones, no boss nerfs.
 * This verifies EFFECT OUTCOMES, beyond the SF7 cast/cooldown-only checks.
 *
 * The 9/9 Captain victories in SUPREME still test the classic build: this
 * suite is a stronger (but NOT full Captain) HIGHFLY-equipped combat gate.
 */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {MOBS} from '../src/sim/data';
import type {Entity,PlayerClass} from '../src/sim/types';
import {placeAbilityOnSlot,sanitizeHotbarActions,isAbilityActionBarEligible} from '../src/ui/hud/action_bar/hotbar';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';

type EffectMode='raid'|'seal'|'retreat'|'evasion'|'shadow'|'shield'|'heal'|'blink'|'curse'|'bloom';
const cases:readonly {cls:PlayerClass;skill:string;min:number;mode:EffectMode;enemy:boolean}[]=[
  {cls:'warrior',skill:'hf_warrior_u1',min:25,mode:'raid',enemy:false},
  {cls:'paladin',skill:'hf_paladin_s1',min:1,mode:'seal',enemy:true},
  {cls:'hunter',skill:'hf_hunter_s5',min:20,mode:'retreat',enemy:true},
  {cls:'rogue',skill:'hf_rogue_s4',min:15,mode:'evasion',enemy:false},
  {cls:'priest',skill:'hf_priest_s2',min:5,mode:'shadow',enemy:true},
  {cls:'priest',skill:'hf_priest_s3',min:10,mode:'shield',enemy:false},
  {cls:'shaman',skill:'hf_shaman_s3',min:10,mode:'heal',enemy:false},
  {cls:'mage',skill:'hf_mage_s3',min:10,mode:'blink',enemy:false},
  {cls:'warlock',skill:'hf_warlock_s2',min:5,mode:'curse',enemy:true},
  {cls:'druid',skill:'hf_druid_s3',min:10,mode:'bloom',enemy:false},
];

let inserted:readonly string[]=[];
beforeAll(()=>{
  if(cases.some(c=>ABILITIES[c.skill]))throw Error('SF8 expects isolated opt-in-free original Sim registry');
  inserted=installSf4NativePilots(ABILITIES,CLASSES).registered;
  expect(inserted).toHaveLength(10);
});
afterAll(()=>{
  for(const id of inserted){
    const cls=id.split('_')[1] as PlayerClass;
    delete ABILITIES[id];
    const index=CLASSES[cls].abilities.indexOf(id);
    if(index>=0)CLASSES[cls].abilities.splice(index,1);
  }
});

function stationaryHostile(sim:Sim,id:number,yards:number):Entity{
  const hero=sim.player;
  const mob=createMob(id,MOBS.training_dummy,20,{
    x:hero.pos.x,y:hero.pos.y,z:hero.pos.z+yards,
  });
  mob.hostile=true;
  mob.aiState='idle';
  mob.hp=mob.maxHp=100000;
  (sim as unknown as {addEntity(entity:Entity):void}).addEntity(mob);
  return mob;
}
function distance(a:{x:number;z:number},b:{x:number;z:number}):number{
  return Math.hypot(a.x-b.x,a.z-b.z);
}
function assertBehavior(c:typeof cases[number],sim:Sim,mob:Entity|undefined,initial:{
  hp:number;maxHp:number;mobHp:number;minMobHp:number;pos:{x:number;z:number}
}):void{
  const p=sim.player;
  expect(p.cooldowns.has(c.skill),c.skill+' failed its native cast').toBe(true);
  if(c.mode==='raid'){
    expect(p.auras.some(a=>a.kind==='buff_ap_pct')).toBe(true);
    expect(p.auras.some(a=>a.kind==='buff_maxhp_pct')).toBe(true);
    expect(p.maxHp).toBeGreaterThan(initial.maxHp);
  } else if(c.mode==='seal'){
    expect(initial.minMobHp).toBeLessThan(initial.mobHp);
    expect(p.auras.some(a=>a.id===c.skill&&a.kind==='imbue')).toBe(true);
  } else if(c.mode==='retreat'){
    expect(initial.minMobHp).toBeLessThan(initial.mobHp);
    expect(distance(p.pos,initial.pos)).toBeGreaterThan(1);
  } else if(c.mode==='evasion'){
    expect(p.auras.some(a=>a.kind==='buff_speed')).toBe(true);
    expect(p.auras.some(a=>a.kind==='buff_dodge')).toBe(true);
  } else if(c.mode==='shadow'){
    expect(initial.minMobHp).toBeLessThan(initial.mobHp);
    expect(mob?.auras.some(a=>a.kind==='dot'&&a.sourceId===p.id)).toBe(true);
  } else if(c.mode==='shield'){
    const kinds=p.auras.filter(a=>a.id.startsWith(c.skill)).map(a=>a.kind);
    expect(kinds).toContain('absorb');
    expect(kinds).toContain('hot');
  } else if(c.mode==='heal'){
    expect(p.hp).toBeGreaterThan(initial.hp);
  } else if(c.mode==='blink'){
    expect(distance(p.pos,initial.pos)).toBeGreaterThan(1);
  } else if(c.mode==='curse'){
    expect(initial.minMobHp).toBeLessThan(initial.mobHp);
    expect(mob?.auras.filter(a=>a.id===c.skill&&a.kind==='dot'&&a.sourceId===p.id)).toHaveLength(1);
  } else if(c.mode==='bloom'){
    expect(p.hp).toBeGreaterThan(initial.hp);
    expect(p.auras.some(a=>a.id===c.skill&&a.kind==='hot')).toBe(true);
  }
}

describe('SF8 — 9/9 original classes, 10 HIGHFLY skills, real combat-effect outcomes',()=>{
  for(const [index,c] of cases.entries()){
    for(const level of [c.min,99]){
      it(c.cls+' '+c.skill+' LV'+level+' native cast + target + effect outcome',()=>{
        expect(abilitiesKnownAt(c.cls,level).some(a=>a.def.id===c.skill)).toBe(true);
        const actions=placeAbilityOnSlot(Array.from({length:10},()=>null),c.skill,2);
        const bar=sanitizeHotbarActions(actions,id=>isAbilityActionBarEligible(ABILITIES[id]));
        expect(bar[2]).toEqual({type:'ability',id:c.skill});
        const sim=new Sim({seed:54001+index*101+level,playerClass:c.cls,autoEquip:true});
        sim.setPlayerLevel(level);sim.tick();
        const hero=sim.player;
        hero.resource=hero.maxResource;
        hero.hp=Math.max(1,Math.round(hero.maxHp*0.3));
        hero.hitBonus=1;
        const mob=c.enemy?stationaryHostile(sim,56000+index*101+level,c.mode==='shadow'||c.mode==='curse'?8:2):undefined;
        if(mob)sim.targetEntity(mob.id,hero.id);
        const snapshot={
          hp:hero.hp,maxHp:hero.maxHp,
          mobHp:mob?.hp??0,
          // Real training dummies can recover to full while out of combat.
          // Observe genuine HP loss at ANY original Sim tick, not a fake hit.
          minMobHp:mob?.hp??0,
          pos:{x:hero.pos.x,z:hero.pos.z},
        };
        // Use the exact action id emitted by the original action-bar controller.
        const selected=bar[2];
        if(!selected||selected.type!=='ability')throw Error('SF8 cannot resolve actionbar skill');
        sim.castAbility(selected.id,hero.id);
        for(let tick=0;tick<110;tick++){
          sim.tick();
          if(mob)snapshot.minMobHp=Math.min(snapshot.minMobHp,mob.hp);
        }
        assertBehavior(c,sim,mob,snapshot);
      },20000);
    }
  }
  it('catalog remains 9 original classes, 10 native pilots, and zero forbidden extra fusions',()=>{
    const knownByClass=new Map<string,string[]>();
    for(const cls of Object.keys(CLASSES) as PlayerClass[]){
      const actual=abilitiesKnownAt(cls,99).filter(a=>a.def.id.startsWith('hf_')).map(a=>a.def.id);
      knownByClass.set(cls,actual);
      expect(actual.length,cls).toBeGreaterThanOrEqual(1);
      expect(actual.every(id=>inserted.includes(id)),cls).toBe(true);
    }
    expect(knownByClass.size).toBe(9);
    expect([...knownByClass.values()].flat().sort()).toEqual([...inserted].sort());
  });
});
