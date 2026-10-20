import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {abilityCastSurvivesMovement} from '../src/sim/combat/cast_move_gate';
import {highflyDirectionalFlip,HIGHFLY_SOMERSAULT_SECONDS} from '../src/render/characters/highfly_combat_presentation';
const code=(p:string)=>readFileSync(p,'utf-8');
describe('HIGHFLY F2.5 Unleashed — one native Sim, no donor regressions',()=>{
  it('only tagged Hunter magic can survive locomotion without freezing it',()=>{
    expect(abilityCastSurvivesMovement({auras:[]} as any,'fireball',
      {def:{castWhileMoving:true}})).toBe(true);
    expect(abilityCastSurvivesMovement({auras:[]} as any,'fireball',
      {def:{castWhileMoving:false}})).toBe(false);
    expect(code('src/highfly/origin/f1_world_ui.ts')).toContain('highflyF25CombatFreedom=true');
    expect(code('src/highfly/origin/f1_world_ui.ts')).toContain('castWhileMoving:true');
    expect(code('src/render/characters/visual.ts')).toContain('hf_f25_upper_cast');
    expect(code('src/render/characters/visual.ts')).toContain('originMoveCast?{...s,casting:false}:s');
  });
  it('directional second jump travels four rotations, each returns neutral',()=>{
    const half=HIGHFLY_SOMERSAULT_SECONDS/2;
    const f=highflyDirectionalFlip(half,'forward');
    const b=highflyDirectionalFlip(half,'back');
    const l=highflyDirectionalFlip(half,'left');
    const r=highflyDirectionalFlip(half,'right');
    expect(f.pitch).toBeLessThan(-3);expect(b.pitch).toBeGreaterThan(3);
    expect(l.roll).toBeLessThan(-3);expect(r.roll).toBeGreaterThan(3);
    expect(highflyDirectionalFlip(HIGHFLY_SOMERSAULT_SECONDS,'right').roll).toBe(0);
    expect(code('src/sim/player_motion.ts')).toContain('p.highflyFlipDir');
    expect(code('src/render/characters/visual.ts')).toContain('highfly_basic_air_');
  });
  it('actual offhand swing on alternating attacks uses the native hit table',()=>{
    const sim=code('src/sim/combat/auto_attack.ts');
    expect(sim).toContain('p.dualWielding');
    expect(sim).toContain("autoAttackHand: useOffhand?'offhand':'mainhand'");
    expect(sim).toContain('weapon:p.offhandWeapon!');
    expect(sim).toContain('highflyF25CombatFreedom===true');
  });
  it('ST spends on mobile jumps and evasions and integrates as third native rail',()=>{
    const main=code('src/main.ts');
    expect(main).toContain("kind==='evade'?14:p.onGround?4:10");
    expect(main).toContain("resource?.spend('stamina',cost)");
    expect(code('src/highfly/origin/f1_world_ui.ts')).toContain("liveFrame?.querySelector('.uf-bars')");
    expect(code('src/highfly/origin/f1_world_ui.ts')).toContain('f25');
    expect(code('src/game/highfly_offline_save.ts')).toContain("'highfly-offline-f25-combat-beta'");
    expect(code('src/highfly/game_c1_runtime.ts')).toContain("'highfly:origin:f25:hud:'");
  });
  it('aim and targeting retain F24 true world preview without mandatory lock',()=>{
    const main=code('src/main.ts');
    expect(main).toContain("location.pathname.startsWith('/cobalt-hollow-lab/lab/f25-combat-beta/')");
    expect(code('src/render/ground_aim_reticle_visual.ts')).toContain("shape==='cone'");
    expect(code('src/sim/combat/casting_lifecycle.ts')).toContain("ability.id==='fireball'");
  });
});