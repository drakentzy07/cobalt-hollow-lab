import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {ABILITIES} from '../src/sim/content/classes';
import {highflyAimSpec} from '../src/highfly/highfly_origin_r20_premium_aim';
import {HighflyAimVisual} from '../src/highfly/highfly_origin_r22_premium_visual';
import {P3_BASE_IDS} from '../src/highfly/highfly_android_p3_runtime';
import {highflyR37AimTruth,HIGHFLY_R37_REFERENCE_SKILLS}
  from '../src/highfly/highfly_origin_r37_aim_truth';

describe('HIGHFLY R37 native S1 / meteor / ground AoE Android QA',()=>{
  it('S1 is ClaudeCraft real Cinderbolt projectile ID fireball; premium LINE only',()=>{
    expect(P3_BASE_IDS[0]).toBe('fireball');
    const s=highflyR37AimTruth('fireball');
    expect(s).toMatchObject({id:'fireball',shape:'line',range:30,radius:0,targetMode:'entity'});
    expect(highflyAimSpec('fireball')?.abilityId).toBe('fireball');
    expect(ABILITIES.fireball.effects.some(e=>e.type==='directDamage')).toBe(true);
    const geometry=readFileSync('src/highfly/highfly_origin_r22_premium_visual.ts','utf8');
    expect(geometry).toContain("spec.abilityId==='fireball'");
    expect(geometry).toContain('R37 S1 Cinderbolt: this is a PROJECTILE');
    expect(geometry).not.toContain('this.annulus(this.glyph,impact,impactRadius,.065,24)');
  });
  it('no bogus giant cone: S1 ground lane stays narrow and inside native range',()=>{
    const spec=highflyAimSpec('fireball')!;
    const visual=new HighflyAimVisual(new THREE.Scene(),()=>0);
    visual.show(spec,{x:0,z:0},{x:0,z:20});
    const vertices=visual.root.children.flatMap(mesh=>{
      const g=(mesh as THREE.Mesh).geometry as THREE.BufferGeometry;
      const attr=g.getAttribute('position') as THREE.BufferAttribute;
      return Array.from({length:g.drawRange.count},(_,i)=>({x:attr.getX(i),z:attr.getZ(i)}));
    });
    expect(vertices.length).toBeGreaterThan(24);
    expect(Math.max(...vertices.map(x=>Math.abs(x.x)))).toBeLessThan(.8);
    expect(Math.max(...vertices.map(x=>x.z))).toBeLessThanOrEqual(20.001);
    visual.dispose();
  });
  it('native Meteor/Skystone is circular, 8 radius, 30 range, delayed TWO seconds',()=>{
    const s=highflyR37AimTruth('meteor');
    expect(s).toMatchObject({shape:'circle',radius:8,range:30,delaySeconds:2,cooldown:45});
    expect(ABILITIES.meteor.effects[0]).toMatchObject({type:'groundAoE',radius:8,delayed:true,interval:2,igniteFrac:.4});
    expect(ABILITIES.meteor.targetMode).toBe('position');
  });
  it('native Flamestrike, Rain of Fire, Blizzard all genuine ground-area casts',()=>{
    expect(highflyR37AimTruth('flamestrike')).toMatchObject({shape:'circle',radius:7,range:30,delaySeconds:2});
    expect(highflyR37AimTruth('rain_of_fire')).toMatchObject({shape:'circle',radius:7,range:30,delaySeconds:1,durationSeconds:4});
    expect(highflyR37AimTruth('blizzard')).toMatchObject({shape:'circle',radius:7,range:30,delaySeconds:1,durationSeconds:6.5});
    expect(HIGHFLY_R37_REFERENCE_SKILLS.length).toBe(5);
  });
  it('optional R37 lab can demonstrate all, casts only if learned, never grants',()=>{
    const runtime=readFileSync('src/highfly/highfly_android_p3_runtime.ts','utf8');
    const aim=readFileSync('src/highfly/highfly_origin_r17_hud.ts','utf8');
    expect(runtime).toContain("get('hf_r37')==='1'");
    expect(runtime).toContain("r37Lab");
    expect(runtime).toContain("'meteor', 'rain_of_fire', 'blizzard'");
    expect(runtime).toContain("sim.known.some(skill=>skill.def.id===id)");
    expect(runtime).toContain("sim.castAbilityAt(id,at)");
    expect(runtime).not.toContain('sim.learnOriginHunterSkillTrusted(');
    expect(aim).toContain("'meteor','rain_of_fire','blizzard'].includes(shape??'')");
  });
});
