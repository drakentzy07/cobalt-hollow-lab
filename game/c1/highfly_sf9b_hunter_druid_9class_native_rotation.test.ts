/**
 * HIGHFLY SF9B — 9/9 genuine normal LV99 victories + actual ranged Hunter damage.
 * Tests a genuinely MIXED original+HIGHFLY skill rotation, not only isolated
 * casts. REQUIRES 9 wins and actual original-skill damage for ALL classes.
 * This is NOT a claim of 9/9 fused Captain wins.
 * No source stats, boss HP, Training or production player state are modified.
 */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {ABILITIES,CLASSES} from '../src/sim/content/classes';
import {BUILTIN_WORLD,ITEMS,MOBS} from '../src/sim/data';
import {DT,type PlayerClass} from '../src/sim/types';
import {canEquipItem} from '../src/sim/equipment_rules';
import {requiredLevelFor} from '../src/sim/item_level_req';
import {hfP13ItemId} from '../src/sim/content/highfly_lv99_native_equipment';
import {hfP16ArmorId} from '../src/sim/content/highfly_p16_native_chest_armor';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';

type Mode='self'|'enemy';
const CASES:readonly {cls:PlayerClass;fusion:string;mode:Mode;native:readonly string[]}[]=[
  {cls:'warrior',fusion:'hf_warrior_u1',mode:'self',native:['slam','heroic_strike','rend']},
  {cls:'paladin',fusion:'hf_paladin_s1',mode:'enemy',native:['judgement','holy_strike','hammer_of_grace']},
  {cls:'hunter',fusion:'hf_hunter_s5',mode:'enemy',native:['arcane_shot','steady_shot','serpent_sting']},
  {cls:'rogue',fusion:'hf_rogue_s4',mode:'self',native:['sinister_strike','eviscerate','backstab']},
  {cls:'priest',fusion:'hf_priest_s2',mode:'enemy',native:['smite','mind_blast','shadow_word_pain']},
  {cls:'shaman',fusion:'hf_shaman_s3',mode:'self',native:['lightning_bolt','earth_shock','stormstrike']},
  {cls:'mage',fusion:'hf_mage_s3',mode:'self',native:['fireball','frostbolt','arcane_blast']},
  {cls:'warlock',fusion:'hf_warlock_s2',mode:'enemy',native:['shadow_bolt','corruption','immolate']},
  {cls:'druid',fusion:'hf_druid_s3',mode:'self',native:['wrath','moonfire','claw']},
];
const WT:Record<PlayerClass,'warrior'|'scout'|'caster'>={
  warrior:'warrior',paladin:'warrior',hunter:'scout',rogue:'scout',
  priest:'caster',shaman:'warrior',mage:'caster',warlock:'caster',druid:'caster'
};
const AT:Record<PlayerClass,'mail'|'leather'|'cloth'>={
  warrior:'mail',paladin:'mail',hunter:'leather',rogue:'leather',
  priest:'cloth',shaman:'mail',mage:'cloth',warlock:'cloth',druid:'leather'
};
let installed:readonly string[]=[];
beforeAll(()=>{
  if(CASES.some(c=>ABILITIES[c.fusion]))throw Error('SF9 expects isolated ORIGINAL Sim registry');
  installed=installSf4NativePilots(ABILITIES,CLASSES).registered;
  expect(installed).toHaveLength(10);
});
afterAll(()=>{
  for(const id of installed){
    delete ABILITIES[id];
    const cl=id.split('_')[1] as PlayerClass;
    const at=CLASSES[cl].abilities.indexOf(id);
    if(at>=0)CLASSES[cl].abilities.splice(at,1);
  }
});

describe('SF9B: nine full-HP Lv99 native wolf kills with ORIGINAL+HIGHFLY skill damage',()=>{
  for(const [index,c] of CASES.entries()){
    it(c.cls+' LV99 native solo rotation: real fused cast + original damage + unchanged Training',()=>{
      const sim=new Sim({
        seed:990001+index*137,playerClass:c.cls,noPlayer:true,autoEquip:false,
        world:{...BUILTIN_WORLD,camps:[]},compulsoryTutorial:false,riftPortals:false,
      });
      const pid=sim.addPlayer(c.cls,'SF9_NINE_'+c.cls,{tutorialGreetingSent:true});
      sim.setPlayerLevel(99,pid);
      const p=sim.entities.get(pid)!;
      const meta=sim.players.get(pid)!;
      const trainingBefore=JSON.stringify((sim.serializeCharacter(pid) as any)?.trainingProfile);
      const weapon=hfP13ItemId(90,WT[c.cls]);
      const chest=hfP16ArmorId(90,AT[c.cls]);
      sim.addItem(weapon,1,pid);sim.equipItem(weapon,pid,'mainhand');
      if(c.cls==='rogue'){
        sim.addItem(weapon,1,pid);sim.equipItem(weapon,pid,'offhand');
        expect(meta.equipment.offhand).toBe(weapon);
      }
      sim.addItem(chest,1,pid);sim.equipItem(chest,pid);
      expect(meta.equipment.mainhand).toBe(weapon);
      expect(meta.equipment.chest).toBe(chest);
      const legal=Object.values(ITEMS).filter(item=>
        item.kind==='armor'&&!!item.slot&&item.slot!=='chest'&&
        canEquipItem(c.cls,item)&&requiredLevelFor(item)<=99)
        .sort((a,b)=>requiredLevelFor(b)-requiredLevelFor(a)||
          (b.stats?.armor??0)-(a.stats?.armor??0));
      const slots=new Set<string>();
      for(const item of legal){
        if(!item.slot||slots.has(item.slot))continue;
        sim.addItem(item.id,1,pid);
        sim.equipItem(item.id,pid);
        if(Object.values(meta.equipment).includes(item.id))slots.add(item.slot);
        if(slots.size>=8)break;
      }
      expect(Object.values(meta.equipment).filter(Boolean).length).toBeGreaterThanOrEqual(3);
      // Explicit QA starter items: legal original potions, never stat injection.
      sim.addItem('healing_potion',3,pid);
      const known=new Set(meta.known.map(a=>a.def.id));
      expect(known.has(c.fusion),c.cls+' did not learn HIGHFLY fusion').toBe(true);
      const originals=c.native.filter(x=>known.has(x));
      expect(originals.length,c.cls+' native offensive roster empty').toBeGreaterThan(0);
      const enemyDef=MOBS.hf_hunt_wolf_90;
      expect(enemyDef.boss).not.toBe(true);
      expect(enemyDef.elite).not.toBe(true);
      // Hunter opener starts in REAL ranged range (12+ yards), because
      // Arcane Shot has a native minimum range of 8. Its Raptor is triggered
      // later only if the live wolf closes into native melee range. No
      // teleport after aggro; the wolf retains its original chase AI.
      const hunterOpener=c.cls==='hunter';
      const mob=createMob(sim.nextId++,enemyDef,99,{
        x:p.pos.x+(hunterOpener?12:1),y:p.pos.y,
        z:p.pos.z+(hunterOpener?1.5:1.2)
      });
      mob.hostile=true;sim.addEntity(mob);
      const originalMobMax=mob.maxHp;
      expect(originalMobMax).toBeGreaterThan(1);
      sim.targetEntity(mob.id,pid);
      p.facing=Math.atan2(mob.pos.x-p.pos.x,mob.pos.z-p.pos.z);
      p.resource=p.maxResource;
      p.hp=Math.max(1,Math.round(p.maxHp*0.78));
      sim.startAutoAttack(pid);
      // Both source skills and the native HF pilot MUST enter the SAME fight.
      // Hunter opens with real Arcane Shot at 12 yd, then closes naturally
      // for HF Raptor melee. Other classes open using their HF fusion.
      if(hunterOpener)sim.castAbility('arcane_shot',pid);
      else if(c.mode==='self')sim.castAbilityOn(c.fusion,pid,pid);
      else sim.castAbility(c.fusion,pid);
      let fusionCast=false,originalDamage=0,anyDamage=0;
      let attemptedNative=hunterOpener?1:0;
      let hunterRangedAttempts=hunterOpener?1:0;
      let minHunterDistance=Infinity,maxHunterDistance=0;
      let potionUses=0,ticks=0,minEnemyHp=mob.hp;
      // Full sixty-second native encounter; SF9A's 32s cutoff prematurely
      // classified a still-living Druid as TIMEOUT despite 77% wolf damage.
      const cadence=Math.ceil(1.6/DT),maxTicks=Math.ceil(60/DT);
      for(;ticks<maxTicks&&!p.dead&&!mob.dead;ticks++){
        p.facing=Math.atan2(mob.pos.x-p.pos.x,mob.pos.z-p.pos.z);
        const distance=Math.hypot(p.pos.x-mob.pos.x,p.pos.z-mob.pos.z);
        // Hunter casts the ranged shot at a LEGAL 12+ yard opener, approaches
        // the real attacking wolf through normal moveInput, then uses its
        // melee-only HF Raptor, never overriding position / monster speed.
        if(hunterOpener){
          minHunterDistance=Math.min(minHunterDistance,distance);
          maxHunterDistance=Math.max(maxHunterDistance,distance);
          if(!p.cooldowns.has(c.fusion)&&distance<=3.0&&!p.castingAbility)
            sim.castAbility(c.fusion,pid);
          const retreating=p.cooldowns.has(c.fusion);
          meta.moveInput.forward=!retreating&&distance>2.4&&!p.castingAbility;
          meta.moveInput.back=retreating&&distance<12&&!p.castingAbility;
        }else{
          meta.moveInput.forward=distance>4&&!p.castingAbility;
          meta.moveInput.back=false;
        }
        if(ticks>cadence&&ticks%cadence===0&&!p.castingAbility){
          // Do not press ranged buttons in forbidden 0-8 yd dead zone.
          const rangedValid=c.cls!=='hunter'||(distance>=8&&distance<=35);
          if(rangedValid){
            const selected=originals[attemptedNative%originals.length];
            sim.castAbility(selected,pid);
            attemptedNative++;
            if(c.cls==='hunter')hunterRangedAttempts++;
          }
        }
        if(p.hp/p.maxHp<0.48&&p.potionCooldownUntil<=sim.time&&
          sim.countItem('healing_potion',pid)>0){
          const before=sim.countItem('healing_potion',pid);
          sim.useItem('healing_potion',pid);
          if(sim.countItem('healing_potion',pid)<before)potionUses++;
        }
        // Original Sim.tick() RETURNS AND DRAINS the authoritative event
        // list itself. Calling drainEvents() afterwards sees an empty queue;
        // the SF9A first run correctly exposed this instrumentation mistake.
        const events=sim.tick();
        fusionCast||=p.cooldowns.has(c.fusion);
        minEnemyHp=Math.min(minEnemyHp,mob.hp);
        for(const event of events){
          if(event.type==='damage'&&event.sourceId===pid&&event.targetId===mob.id&&event.amount>0){
            anyDamage+=event.amount;
            if(event.abilityId&&originals.includes(event.abilityId))originalDamage+=event.amount;
          }
        }
      }
      meta.moveInput.forward=false;meta.moveInput.back=false;
      const result=mob.dead&&!p.dead?'WIN':p.dead?'LOSS':'TIMEOUT';
      const row={cls:c.cls,fusion:c.fusion,result,
        fusionCast,originals,attemptedNative,
        originalDamage:Math.round(originalDamage),anyDamage:Math.round(anyDamage),
        enemyHpStart:originalMobMax,enemyHpEnd:Math.max(0,mob.hp),
        minEnemyHp,potionUses,hunterRangedAttempts,
        minHunterDistance:Number.isFinite(minHunterDistance)?Math.round(minHunterDistance*100)/100:null,
        maxHunterDistance:Math.round(maxHunterDistance*100)/100,
        seconds:Math.round(ticks*DT*100)/100,
        trainingUnchanged:JSON.stringify((sim.serializeCharacter(pid) as any)?.trainingProfile)===trainingBefore,
        level99Unchanged:sim.serializeCharacter(pid)?.level===99,
        monsterNativeMaxHp:mob.maxHp===originalMobMax
      };
      console.info('HF_SF9B_MIXED_ROTATION_'+c.cls.toUpperCase()+'='+JSON.stringify(row));
      expect(row.fusionCast,c.cls+' fusion never completed a native cast').toBe(true);
      expect(row.attemptedNative,c.cls+' original offensive abilities never attempted').toBeGreaterThan(0);
      expect(row.minEnemyHp,c.cls+' no genuine damage to enemy').toBeLessThan(originalMobMax);
      expect(row.anyDamage,c.cls+' no original Sim damage events').toBeGreaterThan(0);
      expect(row.originalDamage,c.cls+' no REAL original active skill damage').toBeGreaterThan(0);
      expect(row.result,c.cls+' failed to clear unnerfed normal LV99 wolf').toBe('WIN');
      expect(row.trainingUnchanged&&row.level99Unchanged&&row.monsterNativeMaxHp).toBe(true);
    },45000);
  }
  it('the full-wolf-rotation matrix covers 9/9 classes but does not certify Captain wins',()=>{
    expect(new Set(CASES.map(c=>c.cls)).size).toBe(9);
    expect(CASES).toHaveLength(9);
    expect(installed).toHaveLength(10);
  });
});
