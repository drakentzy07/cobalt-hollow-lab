import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {ITEMS} from '../src/sim/data';
import {canEquipItem} from '../src/sim/equipment_rules';
import {universalHunterCanEquip,universalHunterCanEquipSlot} from '../src/highfly/origin/universal_equipment';
import {isHighflyUpperBodyTrack,highflyPhysicalBasic,highflySomersaultPitch,HIGHFLY_SOMERSAULT_SECONDS} from '../src/render/characters/highfly_combat_presentation';
const f=(p:string)=>readFileSync(p,'utf8');

describe('HIGHFLY ORIGIN F2.2 MASSIVE combat and classless Hunter integration',()=>{
  it('full physical swing moves arms and torso, NEVER legs or root translation',()=>{
    for(const x of ['Spine.quaternion','mixamorig:RightArm.quaternion','Rig_Medium/upperarm_l.quaternion','Hand_R.quaternion','chest.quaternion'])
      expect(isHighflyUpperBodyTrack(x)).toBe(true);
    for(const x of ['Hips.position','Root.quaternion','LeftUpLeg.quaternion','foot_r.quaternion','spine.position','Arm.scale','LeftToeBase.quaternion'])
      expect(isHighflyUpperBodyTrack(x)).toBe(false);
    expect(highflyPhysicalBasic(undefined)).toBe(true);
    for(const i of [1,2,3,4])expect(highflyPhysicalBasic('highfly_basic_'+i)).toBe(true);
    expect(highflyPhysicalBasic('meteor_strike')).toBe(false);
    const vis=f('src/render/characters/visual.ts');
    expect(vis).toContain('this.playOriginPhysicalGesture(name,');
    expect(vis).toContain('this.playOriginPhysicalGesture(handClip,');
    expect(vis).toContain('this.playOriginPhysicalGesture(override,');
    expect(vis).toContain('tracks.filter(track=>isHighflyUpperBodyTrack(track.name))');
    expect(vis).toContain('this.originGroundMoving');
    expect(vis).toContain('this.mixer.clipAction(masked)');
    expect(vis).toContain('this.fadeTo(this.baseAction(),0.045,false)');
  });
  it('one complete directed second-jump somersault (returns neutral pitch)',()=>{
    expect(highflySomersaultPitch(0)).toBe(0);
    expect(highflySomersaultPitch(HIGHFLY_SOMERSAULT_SECONDS)).toBe(0);
    expect(highflySomersaultPitch(-2)).toBe(0);
    expect(highflySomersaultPitch(0.1,true)).toBe(0);
    expect(highflySomersaultPitch(HIGHFLY_SOMERSAULT_SECONDS/2)).toBeCloseTo(-Math.PI);
    expect(highflySomersaultPitch(HIGHFLY_SOMERSAULT_SECONDS-0.001)).toBeLessThan(-6);
    const render=f('src/render/renderer.ts');
    expect(render).toContain('e.highflyAirJumpUsed === true');
    expect(render).toContain('st.highflyAirFlip =');
    const motion=f('src/sim/player_motion.ts');
    expect(motion).toContain('inp.highflyAirDashEnabled === true && p.jumping');
    expect(motion).toContain('p.vx = wishX * wishSpeed');
    const main=f('src/main.ts');
    expect(main).toContain("mi.highflyAirDashEnabled = document.body.classList.contains('hf-origin-f1')");
  });
  it('Hunter universally equips across schools without weakening donor rules',()=>{
    const r=ITEMS['worn_sword'];
    expect(r?.kind).toBe('weapon');
    expect(universalHunterCanEquip(r!)).toBe(true);
    expect(universalHunterCanEquipSlot(r!,'mainhand')).toBe(true);
    expect(universalHunterCanEquipSlot(r!,'chest')).toBe(false);
    const item=f('src/sim/items.ts'),cfg=f('src/game/offline_world_config.ts');
    expect(item).toContain("ctx.cfg.originUniversalHunter === true");
    expect(item).toContain("universalHunterCanEquipSlot(def, slot)");
    expect(item).toContain("meetsLevelRequirement(p.level, def)");
    expect(item).toContain("uniqueEquipConflictSlot(");
    expect(item).toContain("slotAcceptsItem(def, targetSlot)");
    expect(cfg).toContain('originUniversalHunter: options.originUniversalHunter === true');
    expect(f('src/main.ts')).toContain('originUniversalHunter: !world');
    expect(typeof canEquipItem).toBe('function');
  });
  it('knowledge comes from acquisition, not Warrior level-up; other 8 schools visible',()=>{
    const sim=f('src/sim/sim.ts'),book=f('src/ui/spellbook_window.ts');
    expect(sim).toContain('if (this.cfg.originUniversalHunter) return;');
    expect(book).toContain('Object.values(CLASSES).flatMap(school => school.abilities)');
    expect(book).toContain('showUndiscovered: universalHunter');
    expect(book).toContain('if (known && isAbilityActionBarEligible(def))');
  });
  it('uses F2.1 complete HUD and resource improvements without another motor',()=>{
    const rt=f('src/highfly/game_c1_runtime.ts');
    const mp=f('src/main.ts');
    expect(rt).toContain('const ORIGIN_HUD_TARGETS');
    expect(rt).toContain("id:'use',label:'USAR'");
    expect(mp).toContain("const kind = magical ? 'mana' : 'stamina'");
    expect(mp).toContain('if (success) resource?.spend(kind,cost)');
    expect(f('src/styles/hud.mobile.css')).toContain('right:122px !important');
    expect(mp).not.toContain('new FreedomWorld(');
  });
});
