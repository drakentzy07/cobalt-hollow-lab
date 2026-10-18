#!/usr/bin/env python3
"""R39 FINAL ONE integrated gameplay patch, applied AFTER R39A-F.
No new actor, no second Sim, no class switch, no Pages, no save-schema change.
Native accepted strike + stamina-funded evade -> typed Sim defense/break events.
"""
from pathlib import Path
import shutil

def one(path,old,new):
    p=Path(path);s=p.read_text(encoding='utf8')
    n=s.count(old)
    if n!=1:raise SystemExit(f'R39_FINAL_SOURCE_DRIFT {path} count={n} {old[:90]!r}')
    p.write_text(s.replace(old,new,1),encoding='utf8')

shutil.copyfile('../v9-corrections/game/c1/highfly_origin_r39_final_runtime.ts',
                'src/sim/highfly_origin_r39_final_runtime.ts')

one('src/sim/sim.ts',
    "export class Sim {",
    """export class Sim {""")
# Append new imports at file head (import declarations may follow later; valid TS).
p=Path('src/sim/sim.ts')
s=p.read_text(encoding='utf8')
if 'r39AcceptedEvade' in s:raise SystemExit('R39_FINAL_ALREADY_INSTALLED')
p.write_text("""import {
  r39AcceptedEvade,r39PhysicalDefense,r39RecordBasic,r39AddGuardPressure,
  r39ConnectConfirmedSkill,
} from './highfly_origin_r39_final_runtime';
"""+s,encoding='utf8')

one('src/sim/sim.ts',
    """    this.events.push(ev);
  }

  /** Drain queued events without advancing simulation (offline HUD sync). */""",
    """    this.events.push(ev);
    // A real castStart is emitted only after native Sim admission.
    if(ev.type==='castStart'){
      const actor=this.entities.get(ev.entityId);
      if(actor && r39ConnectConfirmedSkill(actor,this.time))
        this.events.push({type:'highflyR39SkillLink',
          entityId:actor.id,ability:ev.ability});
    }
  }

  /** Drain queued events without advancing simulation (offline HUD sync). */""")

one('src/sim/player_motion.ts',
    """  originSpendMotionStamina?(p: Entity, action: OriginMotionAction): boolean;""",
    """  originSpendMotionStamina?(p: Entity, action: OriginMotionAction): boolean;
  /** Real legal evade edge, called after paid stamina only (Sim path). */
  originDefensiveEvadeAccepted?(p: Entity): void;""")
one('src/sim/player_motion.ts',
    """    p.highflyEvadeRemaining = HIGHFLY_EVADE_DURATION;
    p.highflyEvadeCooldownRemaining = HIGHFLY_EVADE_COOLDOWN;""",
    """    p.highflyEvadeRemaining = HIGHFLY_EVADE_DURATION;
    p.highflyEvadeCooldownRemaining = HIGHFLY_EVADE_COOLDOWN;
    deps.originDefensiveEvadeAccepted?.(p);""")
one('src/sim/sim.ts',
    """      originSpendMotionStamina: (p, action) =>
        originSpendMotionStamina(this.players.get(p.id)?.originHunter, action),""",
    """      originSpendMotionStamina: (p, action) =>
        originSpendMotionStamina(this.players.get(p.id)?.originHunter, action),
      originDefensiveEvadeAccepted: (p) => r39AcceptedEvade(p,this.time),""")

one('src/sim/sim.ts',
    """  highflyBasicAttack(step: 1 | 2 | 3 | 4, pid?: number): boolean {
    return highflyBasicAttackImpl(this.ctx, step, pid);
  }""",
    """  highflyBasicAttack(step: 1 | 2 | 3 | 4, pid?: number): boolean {
    const resolved=this.ctx.resolve(pid);
    const player=resolved?.e;
    const target=player && player.targetId!==null
      ? this.entities.get(player.targetId) ?? null : null;
    const before=target?.hp ?? 0;
    // Same native admission: swing timer, range, LOS, MP/stamina, elemental.
    const accepted=highflyBasicAttackImpl(this.ctx,step,pid);
    if(!accepted || !player?.originResources)return accepted;
    const definition=target?.kind==='mob'?MOBS[target.templateId]:undefined;
    const immune=!!(definition?.boss||definition?.worldBoss||
      definition?.elite||definition?.ccImmune||definition?.dummy);
    const result=r39RecordBasic(player,target,step,this.time,
      target ? Math.max(0,before-target.hp) : 0,immune);
    if(result.guardBroken && target) this.r39ApplyBreak(player,target);
    return accepted;
  }""")

one('src/sim/sim.ts',
    """  mobSwing(mob: Entity, target: Entity): void {
    const missChance = swingMissChance(mob, target);""",
    """  /** REAL guard break: normal mobs only, through native CC resistance. */
  private r39ApplyBreak(attacker:Entity,mob:Entity):void {
    const def=MOBS[mob.templateId];
    if(mob.dead||mob.kind!=='mob'||!mob.hostile||
       def?.boss||def?.worldBoss||def?.elite||def?.ccImmune||def?.dummy)return;
    this.applyAura(mob,{
      id:'highfly_r39_guard_broken',name:'Guard Break',kind:'stun',
      duration:1.1,remaining:1.1,value:0,
      sourceId:attacker.id,school:'physical',
    });
    this.emit({type:'highflyR39GuardBreak',sourceId:attacker.id,targetId:mob.id});
  }

  mobSwing(mob: Entity, target: Entity): void {
    // One real physical melee impact, not a speculative HUD parry.
    // Origin-only: old classes preserve their exact original RNG/hit table.
    const defense=r39PhysicalDefense(target,mob,this.time);
    if(defense) {
      this.emit({
        type:'damage',sourceId:mob.id,targetId:target.id,amount:0,
        crit:false,school:'physical',ability:null,
        kind:defense==='perfect-dodge'?'dodge':'parry',
      });
      this.emit({type:'highflyR39Defense',
        sourceId:mob.id,targetId:target.id,action:defense});
      if(defense==='parry'){
        const def=MOBS[mob.templateId];
        const immune=!!(def?.boss||def?.worldBoss||def?.elite||def?.ccImmune||def?.dummy);
        if(r39AddGuardPressure(mob,this.time,30,immune))this.r39ApplyBreak(target,mob);
      }
      return; // No HP loss, no affix proc, no phantom second swing.
    }
    const missChance = swingMissChance(mob, target);""")

one('src/sim/types.ts',
    """  | {
      type: 'heal';
      targetId: number;""",
    """  | { type:'highflyR39Defense'; sourceId:number; targetId:number;
      action:'perfect-dodge'|'parry' }
  | { type:'highflyR39GuardBreak'; sourceId:number; targetId:number }
  | { type:'highflyR39SkillLink'; entityId:number; ability:string }
  | {
      type: 'heal';
      targetId: number;""")

one('src/render/renderer.ts',
    """      case 'damage': {
        // Every melee/ranged hit animates the attacker.""",
    """      case 'highflyR39Defense': {
        if(ev.action==='parry')
          this.triggerAttack(ev.targetId,'highfly_r39_parry');
        break;
      }
      case 'highflyR39SkillLink': {
        // Combo confirmed only when the native skill really starts.
        this.vfx.meleeSpark(ev.entityId,false);
        break;
      }
      case 'highflyR39GuardBreak': {
        this.triggerHit(ev.targetId);
        this.vfx.meleeSpark(ev.targetId,true);
        break;
      }
      case 'damage': {
        // Every melee/ranged hit animates the attacker.""")

one('src/render/renderer.ts',
    """          this.triggerAttack(ev.sourceId, attackAbilityId(ev.ability));""",
    """          this.triggerAttack(ev.sourceId,
            sourceEntity?.originResources && /^highfly_basic_([1-4])(?:_|$)/.test(ev.abilityId ?? '')
              ? 'highfly_basic_'+(ev.abilityId ?? '').match(/^highfly_basic_([1-4])/)![1]
              : attackAbilityId(ev.ability));""")

one('src/render/characters/visual.ts',
    """import {r39MaskedMobilePair, type R39MaskedPair} from './highfly_r39_anim_split';""",
    """import {r39MaskedMobilePair, type R39MaskedPair} from './highfly_r39_anim_split';
import {r39ContextualAttackClip} from '../../sim/highfly_origin_r39_final_runtime';""")
one('src/render/characters/visual.ts',
    """  private r39MovingGround = false;""",
    """  private r39MovingGround = false;
  private r39Airborne=false;
  private r39Falling=false;""")
one('src/render/characters/visual.ts',
    """    // Read movement from ACTUAL renderer state. Never invent body displacement.""",
    """    // R39 FINAL: visual-only live pose context, no collision/root motion.
    this.r39Airborne=Boolean(s.airborne);
    this.r39Falling=Boolean(s.airborne&&s.falling);
    // Read movement from ACTUAL renderer state. Never invent body displacement.""")
one('src/render/characters/visual.ts',
    """    const signature = abilityId ? `Signature_${abilityId}` : null;""",
    """    if(this.def.modular && this.key.startsWith('player_')){
      if(abilityId==='highfly_r39_parry' && this.action('Block')){
        this.playOneShot('Block',1.1);
        this.currentOneShotIsAttack=false;
        return;
      }
      const match=abilityId?.match(/^highfly_basic_([1-4])$/);
      if(match){
        const clip=r39ContextualAttackClip(Number(match[1]) as 1|2|3|4,
          this.r39Airborne,this.r39Falling);
        if(clip && this.action(clip)){
          this.playOneShot(clip,this.r39Falling?1.45:1.3);
          this.currentOneShotIsAttack=true;
          return;
        }
      }
    }
    const signature = abilityId ? `Signature_${abilityId}` : null;""")

for p,anchors in {
  'src/sim/sim.ts':['r39RecordBasic(player,target,step,this.time','r39PhysicalDefense(target,mob,this.time)','r39ApplyBreak('],
  'src/sim/player_motion.ts':['originDefensiveEvadeAccepted?.(p)'],
  'src/render/characters/visual.ts':['r39ContextualAttackClip(Number(match[1])','this.r39Falling=Boolean(s.airborne&&s.falling)'],
  'src/render/renderer.ts':['case \'highflyR39Defense\':','case \'highflyR39GuardBreak\':'],
}.items():
  body=Path(p).read_text(encoding='utf8')
  for anchor in anchors:
    if anchor not in body:raise SystemExit(f'R39_FINAL_ASSERT {p} {anchor}')
print('HIGHFLY_R39_FINAL_REAL_SIM_AND_RIG_INTEGRATION_APPLIED=1')
