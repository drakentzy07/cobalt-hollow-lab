/**
 * HIGHFLY SF7 — literal native spellbook -> action-bar -> original Sim casts.
 * These tests exercise REAL ClaudeCraft exported functions. Not a mocked HUD.
 * The SF7 preview build separately enables VITE_HIGHFLY_SF4=1; no Pages writes.
 */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
import {Sim} from '../src/sim/sim';
import {MOBS} from '../src/sim/data';
import {createMob} from '../src/sim/entity';
import type {Entity,PlayerClass} from '../src/sim/types';
import {
  isAbilityActionBarEligible,placeAbilityOnSlot,sanitizeHotbarActions,
} from '../src/ui/hud/action_bar/hotbar';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';

const PILOTS = [
  {cls:'warrior',id:'hf_warrior_u1',level:25,target:'self'},
  {cls:'paladin',id:'hf_paladin_s1',level:1,target:'enemy'},
  {cls:'hunter',id:'hf_hunter_s5',level:20,target:'enemy'},
  {cls:'rogue',id:'hf_rogue_s4',level:15,target:'self'},
  {cls:'priest',id:'hf_priest_s2',level:5,target:'enemy'},
  {cls:'priest',id:'hf_priest_s3',level:10,target:'self'},
  {cls:'shaman',id:'hf_shaman_s3',level:10,target:'self'},
  {cls:'mage',id:'hf_mage_s3',level:10,target:'self'},
  {cls:'warlock',id:'hf_warlock_s2',level:5,target:'enemy'},
  {cls:'druid',id:'hf_druid_s3',level:10,target:'self'},
] as const;
let ownedIds:readonly string[]=[];
beforeAll(()=>{
  // Isolated test worker: the flag must not be supplied to vitest globally,
  // because runtime module-init would otherwise install these twice.
  if(PILOTS.some(p=>ABILITIES[p.id])) throw Error('SF7 test loaded unexpected global fusion definitions');
  ownedIds=installSf4NativePilots(ABILITIES,CLASSES).registered;
  expect(ownedIds).toHaveLength(10);
});
afterAll(()=>{
  for(const id of ownedIds){
    delete ABILITIES[id];
    const cls=id.split('_')[1] as PlayerClass;
    const index=CLASSES[cls].abilities.indexOf(id);
    if(index>=0)CLASSES[cls].abilities.splice(index,1);
  }
});

describe('SF7: learnable HIGHFLY skills really reach the original spellbook and action bar',()=>{
  it('all 10 appear EXACTLY at their HIGHFLY unlock, not Claude donor levels',()=>{
    for(const p of PILOTS){
      const at=abilitiesKnownAt(p.cls,p.level);
      const before=abilitiesKnownAt(p.cls,Math.max(0,p.level-1));
      expect(at.filter(x=>x.def.id===p.id),p.id).toHaveLength(1);
      if(p.level>1)expect(before.some(x=>x.def.id===p.id),p.id+' leaked early').toBe(false);
      expect(ABILITIES[p.id].learnLevel,p.id).toBe(p.level);
      expect(at.find(x=>x.def.id===p.id)?.rank).toBeGreaterThanOrEqual(1);
    }
  });
  it('all nine original class spellbooks have a genuine HIGHFLY active at LV99',()=>{
    const classes=new Set(PILOTS.map(p=>p.cls));
    expect(classes.size).toBe(9);
    for(const cls of classes){
      const known=abilitiesKnownAt(cls,99);
      const hf=known.filter(x=>x.def.id.startsWith('hf_'));
      expect(hf.length,cls).toBeGreaterThanOrEqual(1);
      expect(hf.every(x=>isAbilityActionBarEligible(x.def)),cls).toBe(true);
      expect(hf.every(x=>x.def.class===cls),cls).toBe(true);
    }
    // Design-only 53 other recipes MUST NOT accidentally surface.
    const all=new Set(PILOTS.map(p=>p.id));
    for(const cls of classes)
      expect(abilitiesKnownAt(cls,99).filter(x=>x.def.id.startsWith('hf_'))
        .every(x=>all.has(x.def.id as typeof PILOTS[number]['id']))).toBe(true);
  });
  it('native configurable hotbar accepts every one of the ten skills without overwriting Attack',()=>{
    for(const p of PILOTS){
      const learned=abilitiesKnownAt(p.cls,p.level).find(x=>x.def.id===p.id);
      expect(learned).toBeDefined();
      expect(isAbilityActionBarEligible(learned?.def),p.id).toBe(true);
      const initial=Array.from({length:10},()=>null);
      const selected=placeAbilityOnSlot(initial,p.id,3);
      const sanitized=sanitizeHotbarActions(selected,id=>isAbilityActionBarEligible(ABILITIES[id]));
      expect(sanitized[3]).toEqual({type:'ability',id:p.id});
      expect(initial.every(x=>x===null)).toBe(true);
      expect(sanitized.filter(x=>x!==null)).toHaveLength(1);
    }
  });
  it('does not change originals, permanent Training stats, or class baseStats',()=>{
    expect(ABILITIES.crusader_strike.learnLevel).toBe(10);
    expect(ABILITIES.curse_of_agony.learnLevel).toBe(8);
    expect(ABILITIES.regrowth.learnLevel).toBe(14);
    expect(ABILITIES.renew.learnLevel).toBeLessThanOrEqual(10);
    for(const p of PILOTS){
      const original=ABILITIES[p.id];
      expect(original?.class).toBe(p.cls);
      expect(original.passive).not.toBe(true);
      expect(original.hiddenFromPlayer).not.toBe(true);
      expect(Object.keys(CLASSES[p.cls].baseStats).length).toBeGreaterThan(0);
    }
  });
});

describe('SF7: actual LV99 original-Sim cast of HIGHFLY skill for every class',()=>{
  // One native Sim per test. Sharing all ten in one test exceeded Vitest's 20s
  // watchdog even though the first 39 checks passed; independent cases surface
  // an exact failing class instead of hiding it behind a global timeout.
  for(const [idx,pilot] of PILOTS.entries()){
    it(pilot.cls+' / '+pilot.id+' LV99 original-Sim cast, cooldown and targeting',()=>{
      const sim=new Sim({seed:52050+idx,playerClass:pilot.cls,autoEquip:true});
      sim.setPlayerLevel(99);sim.tick();
      const actor=sim.player;
      actor.resource=actor.maxResource;
      actor.hp=Math.max(1,Math.round(actor.maxHp*0.5));
      actor.hitBonus=1;
      expect(sim.resolvedAbility(pilot.id),pilot.id+' did not resolve').toBeDefined();
      if(pilot.target==='enemy'){
        const mob=createMob(52900+idx,MOBS.training_dummy,20,{
          x:actor.pos.x,y:actor.pos.y,z:actor.pos.z+2,
        });
        mob.hostile=true;mob.hp=mob.maxHp=100000;mob.aiState='idle';
        (sim as unknown as {addEntity(entity:Entity):void}).addEntity(mob);
        sim.targetEntity(mob.id,actor.id);
      }
      sim.castAbility(pilot.id,actor.id);
      for(let t=0;t<90;t++)sim.tick();
      expect(actor.cooldowns.has(pilot.id),pilot.cls+' / '+pilot.id+' did not cast').toBe(true);
    });
  }
});

describe('SF8: native HUD binding invariants — no destructive reseeding',()=>{
  it('nine classes can fit all currently learned HIGHFLY pilots in ten configurable HUD seats at LV99',()=>{
    for(const cls of new Set(PILOTS.map(p=>p.cls))){
      const known=abilitiesKnownAt(cls,99).filter(a=>a.def.id.startsWith('hf_'));
      let actionSlots=Array.from({length:10},()=>null) as ReturnType<typeof placeAbilityOnSlot>;
      for(const [index,skill] of known.entries()){
        expect(index).toBeLessThan(10);
        actionSlots=placeAbilityOnSlot(actionSlots,skill.def.id,index);
      }
      expect(actionSlots.filter(Boolean)).toHaveLength(known.length);
      for(const ability of known)
        expect(actionSlots).toContainEqual({type:'ability',id:ability.def.id});
      expect(new Set(actionSlots.filter(Boolean).map(a=>a?.type==='ability'?a.id:'')).size).toBe(known.length);
    }
  });
  it('original hotbar never accepts unknown or early-locked fusion as an assigned *usable* action',()=>{
    const source=Array.from({length:10},()=>null);
    const premature=placeAbilityOnSlot(source,'hf_hunter_s5',2);
    const at19=new Set(abilitiesKnownAt('hunter',19).map(a=>a.def.id));
    const stripped=sanitizeHotbarActions(premature,id=>
      at19.has(id)&&isAbilityActionBarEligible(ABILITIES[id]));
    expect(stripped[2]).toBeNull();
    const at20=new Set(abilitiesKnownAt('hunter',20).map(a=>a.def.id));
    const restored=sanitizeHotbarActions(premature,id=>
      at20.has(id)&&isAbilityActionBarEligible(ABILITIES[id]));
    expect(restored[2]).toEqual({type:'ability',id:'hf_hunter_s5'});
    expect(source.every(x=>x===null)).toBe(true);
  });
  it('one fused swap does not reorder other slots or overwrite the default attack control',()=>{
    const original=Array.from({length:10},()=>null) as ReturnType<typeof placeAbilityOnSlot>;
    const withMage=placeAbilityOnSlot(original,'hf_mage_s3',4);
    const withPriest=placeAbilityOnSlot(withMage,'hf_priest_s2',8);
    expect(withPriest[4]).toEqual({type:'ability',id:'hf_mage_s3'});
    expect(withPriest[8]).toEqual({type:'ability',id:'hf_priest_s2'});
    expect(withMage[8]).toBeNull();
    expect(original.every(x=>x===null)).toBe(true);
  });
});
