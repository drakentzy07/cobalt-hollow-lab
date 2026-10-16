#!/usr/bin/env python3
"""R29 P2 overlay AFTER R28 on a disposable frozen donor; no Pages writes.
Copies REAL upstream MIT effect sources staged from exactly three pinning refs.
Preserves the untouched parent game's skin/skeleton and production code.
"""
from pathlib import Path
import shutil

def one(path,old,new):
 p=Path(path);s=p.read_text('utf8')
 if s.count(old)!=1:raise SystemExit('R29_SOURCE_DRIFT:'+path+':'+str(s.count(old))+':'+repr(old[:120]))
 p.write_text(s.replace(old,new,1),'utf8')

for source in ('casting6','effects7','advanced10'):
 p=Path('../vendor-r29')/source/'src'
 if not (p/'abilities'/'AbilityManager.js').is_file() or not (p/'config'/'settings.js').is_file():
  raise SystemExit('R29_MIT_VENDOR_SOURCE_ABSENT:'+str(p))
 dest=Path('src/highfly/vendor')/source
 dest.parent.mkdir(parents=True,exist_ok=True)
 shutil.copytree(p,dest,dirs_exist_ok=True)
 # Never copy the vendor demo's third-party assets, models, video, sound or HDR.
 if any(i.is_file() and i.suffix.lower() in {'.fbx','.hdr','.glb','.mp3','.png','.jpg'}
        for i in dest.rglob('*')):
  raise SystemExit('R29_VENDOR_UNREVIEWED_BINARY_NOT_ALLOWED')
 src_license=Path('../vendor-r29')/source/'LICENSE'
 if 'MIT License' not in src_license.read_text():raise SystemExit('R29_MISSING_MIT_LICENSE')
 (dest/'LICENSE').write_text(src_license.read_text(),'utf8')

for item,dest in [
 ('highfly_origin_r29_premium_native.ts','src/sim/highfly_origin_r29_premium_native.ts'),
 ('highfly_origin_r29_vendor_runtime.js','src/highfly/highfly_origin_r29_vendor_runtime.js')
]:
 shutil.copy2('../v9-corrections/game/c1/'+item,dest)

# Register 23 namespaced abilities before any Hunter session is instantiated.
one('src/main.ts',
    "import { r28StartSession } from './sim/highfly_origin_r28_session';",
    "import { r28StartSession } from './sim/highfly_origin_r28_session';\nimport { installR29PremiumNativeContracts } from './sim/highfly_origin_r29_premium_native';")
one('src/main.ts',
    "if(import.meta.env.VITE_HIGHFLY_ORIGIN_UNIVERSAL_TESTER==='1')r28StartSession(hunter);",
    "if(import.meta.env.VITE_HIGHFLY_ORIGIN_UNIVERSAL_TESTER==='1'){\n          if(import.meta.env.VITE_HIGHFLY_ORIGIN_R29==='1')installR29PremiumNativeContracts();\n          r28StartSession(hunter);\n        }")

# Native catalog must not duplicate new namespaced skills under CLAUDE ORIGINAL.
catalog='src/sim/highfly_origin_r28_universal_catalog.ts'
one(catalog,
    'const native=Object.values(ABILITIES).map(def=>{',
    "const native=Object.values(ABILITIES).filter(def=>!def.id.startsWith('hf_vfx23_')).map(def=>{")
one(catalog,
    " const premium=R27_PREMIUM_23.map(def=>({",
    " const premium=R27_PREMIUM_23.map(def=>({")
one(catalog,
    "  shape:def.aim.toUpperCase(),effect:def.role,cost:null,pool:null,cooldown:null,",
    "  shape:def.aim.toUpperCase(),effect:def.role,\n  cost:ABILITIES[def.id]?.cost??null,pool:ABILITIES[def.id]&&!ABILITIES[def.id].hiddenFromPlayer?'mana' as const:null,\n  cooldown:ABILITIES[def.id]?.cooldown??null,")
one(catalog,
    "  status:'catalog-only' as const,\n  note:'R27: registro sin VFX ni daño nativo; no seleccionable hasta P2'",
    "  status:(ABILITIES[def.id]&&!ABILITIES[def.id].hiddenFromPlayer?'ready-to-test':'catalog-only') as R28Status,\n  note:ABILITIES[def.id]&&!ABILITIES[def.id].hiddenFromPlayer\n    ? 'R29 P2: VFX MIT original + base nativa de daño (QA pendiente)'\n    : 'VFX original importado; requiere mecánica nativa completa (portal/summon/barrier)'")

# R20 geometry uses true R29 combat footprints, including portal and scribe.
aim='src/highfly/highfly_origin_r20_premium_aim.ts'
one(aim,
    "import { ABILITIES } from '../sim/content/classes';",
    "import { ABILITIES } from '../sim/content/classes';\nimport {R29_PREMIUM_CONTRACTS} from '../sim/highfly_origin_r29_premium_native';")
one(aim,
    "'line'|'cone'|'circle'|'dash'|'target'",
    "'line'|'cone'|'circle'|'dash'|'target'|'gate'|'ring'|'scribe'")
one(aim,
    " const def=ABILITIES[id];if(!def)return null;",
    """ const def=ABILITIES[id];if(!def)return null;
 const premium=R29_PREMIUM_CONTRACTS.find(x=>x.id===id);
 if(premium)return {
   shape:premium.aim as HighflyAimShape,range:premium.range,minRange:0,
   radius:premium.radius,width:1.2,angle:Math.PI/3,
   targetRequired:premium.aim==='line',selfCentered:false
 };""")
one(aim,
    "   }else if(spec.shape==='circle'){",
    """   }else if(spec.shape==='ring'){
     const outer=Math.max(1,spec.radius),inner=Math.max(.2,outer*.72);
     for(let i=0;i<40;i++){
       const a=i*Math.PI*2/40,b=(i+1)*Math.PI*2/40;
       const mk=(r:number,t:number):Pt=>({x:tip.x+Math.sin(t)*r,z:tip.z+Math.cos(t)*r});
       this.quad(mk(inner,a),mk(outer,a),mk(outer,b),mk(inner,b));
     }
   }else if(spec.shape==='gate'){
     const outer=Math.max(1,spec.radius);
     this.fan(tip,.65,0,Math.PI*2,24);
     for(let i=0;i<2;i++){
       const a=Math.atan2(dx,dz)+(i?Math.PI/2:-Math.PI/2);
       const k={x:tip.x+Math.sin(a)*outer,z:tip.z+Math.cos(a)*outer};
       this.fan(k,.38,0,Math.PI*2,16);this.line(k,tip);
     }
   }else if(spec.shape==='scribe'){
     this.fan(tip,Math.max(.6,spec.radius*.25),0,Math.PI*2,32);
     const rr=Math.max(1.2,spec.radius);
     for(let i=0;i<8;i++){
       const a=i*Math.PI/4,b=(i+3)*Math.PI/4;
       this.line({x:tip.x+rr*Math.sin(a),z:tip.z+rr*Math.cos(a)},
         {x:tip.x+rr*Math.sin(b),z:tip.z+rr*Math.cos(b)});
     }
   }else if(spec.shape==='circle'){""")

ui='src/highfly/highfly_origin_r28_universal_tester.ts'
one(ui,
    "import { ABILITIES } from '../sim/content/classes';",
    """import { ABILITIES } from '../sim/content/classes';
import {R29_PREMIUM_CONTRACTS} from '../sim/highfly_origin_r29_premium_native';
// @ts-ignore - pinned MIT JavaScript adapter staged by R29 workflow
import {R29OriginalSourceVFX} from './highfly_origin_r29_vendor_runtime.js';""")
one(ui,
    ' sim:Sim;attackButton:HTMLButtonElement|null;scene:THREE.Scene;',
    ' sim:Sim;attackButton:HTMLButtonElement|null;scene:THREE.Scene;camera?:THREE.PerspectiveCamera;')
one(ui,
    " const visual=new HighflyAimVisual(h.scene,h.terrain);",
    """ const visual=new HighflyAimVisual(h.scene,h.terrain);
 const r29Fx=h.camera?new R29OriginalSourceVFX(h.scene,h.camera):null;
 let raf=0,lastFrame=0;
 const frame=(now:number)=>{
   if(lastFrame)r29Fx?.update(Math.max(0,Math.min(.06,(now-lastFrame)/1000)));
   lastFrame=now;
   raf=requestAnimationFrame(frame);
 };
 if(r29Fx)raf=requestAnimationFrame(frame);""")
one(ui,
    " const ta=tab('CLAUDE ORIGINAL','native'),tb=tab('PREMIUM · 23','premium'),tc=tab('BUFFS','support');",
    " const ta=tab('CLAUDE ORIGINAL','native'),tb=tab('PREMIUM · 23','premium');")
one(ui,
    "  tc.style.borderColor=category==='support'?'#b0e9ff':'#446079';",
    "  // Buffs remain below near GEM/food, not in the combat tester.")
one(ui,
    "  const works=item.kind==='native'&&r28Selectable(item.id);",
    "  const works=r28Selectable(item.id);")
one(ui,
    "   status.textContent=works?'TOCAR PARA PROBAR EN ATK':item.note;",
    "   status.textContent=works?'TOCAR PARA PROBAR EN ATK · daño/CD/MP nativos':item.note;")
one(ui,
    "   attack.title=data?'ATK · '+data.name+' [CLAUDE ORIGINAL]':'ATK normal';",
    "   attack.title=data?'ATK · '+data.name+' ['+data.id+']':'ATK normal';")
one(ui,
    "  const id=selected,def=ABILITIES[id],spec=highflyAimSpec(id);",
    "  const id=selected,def=ABILITIES[id],spec=highflyAimSpec(id);\n  const premium=R29_PREMIUM_CONTRACTS.find(x=>x.id===id);\n  const eventsBefore=h.sim.events.length;")
one(ui,
    "  state.textContent='SIM NATIVO · '+def.name+' · comprobar efecto/daño';",
    """  const error=h.sim.events.slice(eventsBefore).find(e=>e.type==='error');
  if(error){
    state.textContent='RECHAZADO POR SIM · '+error.text;
    return;
  }
  if(premium){
    if(premium.readiness==='visual-only-behavior-pending'){
      state.textContent='NO LANZABLE: requiere mecánica de '+premium.role;
      return;
    }
    if(!r29Fx){state.textContent='VFX NO INICIALIZADO';return;}
    const out=r29Fx.start(premium.sourceId,premium.source,actor.pos,aimed.point);
    state.textContent=out.ok
      ?'VFX ORIGINAL + COMBATE SIM · '+premium.name
      :'VFX ERROR · '+out.reason+' '+(out.detail??'');
    return;
  }
  state.textContent='SIM NATIVO · '+def.name+' · comprobar efecto/daño';""")
one(ui,
    "  tile?.remove();icon?.remove();root.remove();visual.dispose();",
    "  cancelAnimationFrame(raf);r29Fx?.dispose();\n  tile?.remove();icon?.remove();root.remove();visual.dispose();")

# Keep the original HUD experience, but disable redundant development windows
# in R29 preview only; do not change buttons of the public branch.
one(ui,
    " root.append(trigger,panel,state);body.appendChild(root);",
    """ root.append(trigger,panel,state);body.appendChild(root);
 if(import.meta.env.VITE_HIGHFLY_ORIGIN_R29==='1'){
   const redundant=document.getElementById('hf-origin-training');
   if(redundant)redundant.style.display='none';
   filters.style.display='none';
 }""")
# R17/21 legacy mobile HUD uses the original five input projection shapes.
# R29 gate/ring/scribe retain their native distinctive mesh, while the
# projection Jacobian correctly maps all three to ground-position selection.
legacy_hud='src/highfly/highfly_origin_r17_hud.ts'
one(legacy_hud,
    "Math.max(0.5,spec.range),spec.shape,h.project,h.cameraYaw());",
    "Math.max(0.5,spec.range),"+
    "(spec.shape==='gate'||spec.shape==='ring'||spec.shape==='scribe'?'circle':spec.shape),"+
    "h.project,h.cameraYaw());")

hud='src/ui/hud.ts'
one(hud,
    "        scene:this.renderer.scene,",
    "        scene:this.renderer.scene,\n        camera:this.renderer.camera,")
# R21's projection uses only linear/zone/dash; ring/gate/scribe are
# richer VISUALS but pick their placement using the circle Jacobian.
ui_file=Path(ui)
projection_input="spec.shape,h.project,h.cameraYaw()"
raw=ui_file.read_text('utf8')
# This file is the R28 tester after prior R29 patches above and has two uses.
assert raw.count(projection_input)==2, 'R29_MOBILE_PROJECTION_SOURCE_DRIFT'
raw=raw.replace(projection_input,
    "(spec.shape==='ring'||spec.shape==='gate'||spec.shape==='scribe'?'circle':spec.shape),h.project,h.cameraYaw()")
ui_file.write_text(raw,'utf8')

print('R29_P2_REAL_MIT_23_SOURCE_VFX_COPIED_NATIVE_SIM_METADATA_AIM_ADAPTER=1')
