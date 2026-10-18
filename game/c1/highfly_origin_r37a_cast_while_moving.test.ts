import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {ABILITIES} from '../src/sim/content/classes';
import {
  abilityCastSurvivesMovement,highflyOriginMobileStandardCast,
  heldMovementInputWouldMove,
} from '../src/sim/combat/cast_move_gate';
import type {Entity,MoveInput} from '../src/sim/types';

const mobileHunter=()=>({originResources:{stamina:80},auras:[]} as unknown as Entity);
const legacy=()=>({auras:[]} as unknown as Entity);
const res=(id:keyof typeof ABILITIES)=>({def:ABILITIES[id],castTime:ABILITIES[id].castTime??0});
describe('HIGHFLY R37A — real casting while walking/running, donor-first',()=>{
  it('real fireball and lightning bolt can start and survive Hunter movement',()=>{
    const p=mobileHunter();
    for (const id of ['fireball','lightning_bolt','frostbolt','shadow_bolt'] as const){
      expect(ABILITIES[id].castTime).toBeGreaterThan(0);
      expect(highflyOriginMobileStandardCast(p,id,res(id))).toBe(true);
      expect(abilityCastSurvivesMovement(p,id,res(id))).toBe(true);
    }
  });
  it('a normal ClaudeCraft class still stops when casting hard spells and moving',()=>{
    for(const id of ['fireball','lightning_bolt'] as const){
      expect(highflyOriginMobileStandardCast(legacy(),id,res(id))).toBe(false);
      expect(abilityCastSurvivesMovement(legacy(),id,res(id))).toBe(false);
    }
  });
  it('channels, rituals and counterfeit names get NO implicit movement grant',()=>{
    const p=mobileHunter();
    const stationary={def:{id:'rain_of_fire',class:'warlock',castTime:4,channel:true},castTime:4};
    expect(highflyOriginMobileStandardCast(p,'rain_of_fire',stationary)).toBe(false);
    expect(highflyOriginMobileStandardCast(p,'fishing',{def:{id:'fishing',castTime:3},castTime:3})).toBe(false);
    expect(highflyOriginMobileStandardCast(p,'not-fireball',res('fireball'))).toBe(false);
    expect(highflyOriginMobileStandardCast(p,'instant',{def:{id:'instant',class:'mage',castTime:0}})).toBe(false);
  });
  it('native def-level mobile cast grants still work unchanged for classic classes',()=>{
    const p=legacy();
    expect(abilityCastSurvivesMovement(p,'native',{def:{castWhileMoving:true}})).toBe(true);
    expect(abilityCastSurvivesMovement(p,'native',{def:{},castWhileMoving:true})).toBe(true);
  });
  it('GOLDEN movement input is still handled by native motion, not a fake transform',()=>{
    const motion=readFileSync('src/sim/player_motion.ts','utf8');
    const cast=readFileSync('src/sim/combat/casting_lifecycle.ts','utf8');
    expect(motion).toContain('abilityCastSurvivesMovement(p, p.castingAbility, casting)');
    expect(motion).toContain('if (!mobile) deps.cancelCast(p)');
    expect(cast).toContain('!abilityCastSurvivesMovement(p, ability.id, res)');
    expect(cast).toContain('heldMovementInputWouldMove(p, meta.moveInput, ctx.cfg.seed)');
    expect(heldMovementInputWouldMove).toBeTypeOf('function');
    const sim=readFileSync('src/sim/sim.ts','utf8');
    expect(sim).toContain('originHunterEnabled');
  });
  it('no existing native spell resource/target/cooldown logic is replaced',()=>{
    const script=readFileSync('../v9-corrections/overlays/highfly_origin_r37a_mobile_cast.py','utf8');
    expect(script).toContain("src/sim/combat/cast_move_gate.ts");
    expect(script).not.toContain("write_text(Path('src/sim/combat/casting_lifecycle.ts')");
    expect(script).not.toContain("src/render/characters/visual.ts");
    expect(script).not.toContain("src/sim/types.ts");
  });
});
