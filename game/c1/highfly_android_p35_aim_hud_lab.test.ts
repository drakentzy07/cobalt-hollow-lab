import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {highflyAimSpec} from '../src/highfly/highfly_origin_r20_premium_aim';
import {HighflyAimVisual} from '../src/highfly/highfly_origin_r22_premium_visual';

const source=(p:string)=>readFileSync(p,'utf8');
const previewVerts=(v:HighflyAimVisual)=>{
  return v.root.children.flatMap(child=>{
    const g=(child as THREE.Mesh).geometry as THREE.BufferGeometry;
    const p=g.getAttribute('position') as THREE.BufferAttribute;
    return Array.from({length:g.drawRange.count},(_,i)=>({x:p.getX(i),y:p.getY(i),z:p.getZ(i)}));
  });
};
describe('HIGHFLY Android P3.5/P3.6 — true shapes and HUD without cosmetic lies',()=>{
  it('scope: Android P2+P3+P35 only, never PC, P2, P3 or movement/input',()=>{
    expect(source('src/main.ts')).toContain("get('hf_android_p35')==='1'");
    expect(source('src/main.ts')).toContain("document.body.classList.toggle('hf-android-p35',androidP2 &&");
    expect(source('src/styles/hud.mobile.css')).toContain('hf-android-p35');
  });
  it('target button above native ATK, native interact separate below ATK',()=>{
    const s=source('src/styles/hud.mobile.css');
    expect(s).toContain('hf-android-p35 #mobile-target-cycle');
    expect(s).toContain('bottom:calc(176px + env(safe-area-inset-bottom))');
    expect(s).toContain('bottom:calc(82px + env(safe-area-inset-bottom))');
    expect(s).toContain('bottom:calc(8px + env(safe-area-inset-bottom))');
    expect(s).toContain('hf-android-p35 #buff-bar');
    expect(s).toContain('hf-android-p35 #debuff-bar');
  });
  it('no AUX button: original buff action nodes moved to top, empty slots hidden',()=>{
    const s=source('src/highfly/highfly_android_p3_runtime.ts');
    expect(s).toContain("if (document.body.classList.contains('hf-android-p35')) aux.append(grid)");
    expect(s).toContain("grid.hidden = !oldButtons.some(b => !b.hidden)");
    expect(s).toContain('grid.appendChild(button)');
    expect(s).not.toContain('learnOriginHunterSkillTrusted(');
  });
  it('LINE fireball is a narrow lane, never a broad triangular cone',()=>{
    const spec=highflyAimSpec('fireball')!;
    expect(spec).toMatchObject({shape:'line',abilityId:'fireball'});
    const v=new HighflyAimVisual(new THREE.Scene(),()=>0);
    v.show(spec,{x:0,z:0},{x:0,z:16});
    const verts=previewVerts(v);
    expect(verts.length).toBeGreaterThan(24);
    expect(Math.max(...verts.map(p=>Math.abs(p.x)))).toBeLessThan(.8);
    expect(Math.max(...verts.map(p=>p.z))).toBeLessThanOrEqual(16.001);
    v.dispose();
  });
  it('Blink uses directional DASH; Heroic Leap native 6m landing AoE',()=>{
    expect(highflyAimSpec('blink')).toMatchObject({shape:'dash',abilityId:'blink',range:15});
    expect(highflyAimSpec('heroic_leap')).toMatchObject({shape:'dash',radius:6});
    const v=new HighflyAimVisual(new THREE.Scene(),()=>0);
    v.show(highflyAimSpec('heroic_leap')!,{x:0,z:0},{x:0,z:17});
    const verts=previewVerts(v);
    expect(Math.max(...verts.map(p=>p.z))).toBeGreaterThan(22.7);
    v.dispose();
  });
  it('Flamestrike native area target has actual AoE circle, and preview is visual-only',()=>{
    const spec=highflyAimSpec('flamestrike')!;
    expect(spec.shape).toBe('circle');
    expect(spec.radius).toBeGreaterThan(0);
    const v=new HighflyAimVisual(new THREE.Scene(),()=>0);
    v.show(spec,{x:0,z:0},{x:0,z:12});
    const verts=previewVerts(v);
    expect(Math.max(...verts.map(p=>Math.hypot(p.x,p.z-12)))).toBeLessThanOrEqual(spec.radius+.01);
    v.dispose();
    const runtime=source('src/highfly/highfly_android_p3_runtime.ts');
    expect(runtime).toContain("id = 'hf-p35-aim-gallery'");
    expect(runtime).toContain("'hf-origin-aim-gallery'");
    expect(runtime).not.toContain('sim.cast(');
    expect(runtime).not.toContain('sim.learnOriginHunterSkillTrusted(');
  });
});
