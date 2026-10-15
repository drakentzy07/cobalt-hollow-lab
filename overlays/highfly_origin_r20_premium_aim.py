#!/usr/bin/env python3
"""R20 Premium Aim V1, isolated post-R19 overlay. Never alters donor repository.
Uses GPU ground indicators and reuses the original native cast authority.
"""
from pathlib import Path
import shutil
def once(path,old,new):
    p=Path(path)
    s=p.read_text(encoding='utf-8')
    n=s.count(old)
    if n!=1: raise SystemExit('R20_SOURCE_DRIFT '+str(path)+' '+str(n)+' '+repr(old[:95]))
    p.write_text(s.replace(old,new,1),encoding='utf-8')
p=Path('src/highfly/highfly_origin_r17_hud.ts')
shutil.copy2('../v9-corrections/game/c1/highfly_origin_r20_premium_aim.ts',
             'src/highfly/highfly_origin_r20_premium_aim.ts')
once(p,
     "import { originFocusRole } from '../sim/highfly_origin_r19_selection';",
     "import { originFocusRole } from '../sim/highfly_origin_r19_selection';\nimport type * as THREE from 'three';\nimport { HighflyAimVisual, highflyAimSpec } from './highfly_origin_r20_premium_aim';")
once(p,
     "  cameraYaw:()=>number;\n  ringSlot:(buttonIndex:number)=>number;",
     "  cameraYaw:()=>number;\n  scene:THREE.Scene;\n  terrain:(x:number,z:number)=>number;\n  ringSlot:(buttonIndex:number)=>number;")
once(p,
     "    if(distance<=0.1||distance>Math.max(6,maxRange))return [];",
     "    if(distance<=0.1||distance>Math.max(0.1,maxRange))return [];")
once(p,
     """  const halo=document.createElement('div');
  halo.id='hf-origin-live-aim';
  halo.style.cssText='display:none;position:fixed;z-index:11999;pointer-events:none;width:60px;height:60px;border:2px solid #88eaff;border-radius:50%;background:#79d5ef2b;box-shadow:0 0 0 5px #51c8ff25,0 0 25px #3ebaff9c;transform:translate(-50%,-50%);';
  document.body.appendChild(halo);
  const showHalo=(x:number,y:number,z:number)=>{
    const pt=h.project(x,y,z);
    if(pt.behind||!Number.isFinite(pt.x)||!Number.isFinite(pt.y)){halo.style.display='none';return;}
    halo.style.display='block';halo.style.left=pt.x+'px';halo.style.top=pt.y+'px';
  };""",
     """  // The HTML floating circle is retired: the indicator is world-space.
  const halo={style:{display:'none'},remove:()=>{}}; // compatibility with legacy cleanup
  const premium=new HighflyAimVisual(h.scene,h.terrain);
  const showHalo=(x:number,_y:number,z:number)=>{
    const id=pending?h.getSlot(pending.slot):null;
    const spec=id?highflyAimSpec(id):null;
    if(spec)premium.show(spec,h.player().pos,{x,z});
    else premium.hide();
  };""")
once(p,
     """    pending={id:ev.pointerId,slot,startX:ev.clientX,startY:ev.clientY,dx:0,dy:0,drag:false};
  };""",
     """    pending={id:ev.pointerId,slot,startX:ev.clientX,startY:ev.clientY,dx:0,dy:0,drag:false};
    const spec=highflyAimSpec(id!);
    if(spec&&spec.shape!=='target'){
      const actor=h.player(),yaw=h.cameraYaw();
      showHalo(actor.pos.x+Math.sin(yaw)*Math.max(1,spec.range),actor.pos.y??0,
        actor.pos.z+Math.cos(yaw)*Math.max(1,spec.range));
    }
  };""")
once(p,
     "if(canceled){indicator.textContent='✕ CANCELAR';halo.style.display='none';}",
     "if(canceled){indicator.textContent='✕ CANCELAR';premium.hide();}")
once(p,
     """      const chosen=originAimSelect(h.player(),h.targets(),{dx:p.dx,dy:p.dy},def?.range??30,priority,h.cameraYaw());""",
     """      const chosen=originAimSelect(h.player(),h.targets(),{dx:p.dx,dy:p.dy},def?.range??30,'nearest',h.cameraYaw());""")
once(p,
     """      if(enemy)showHalo(enemy.pos.x,(enemy.pos.y??0)+1.2,enemy.pos.z);
      else halo.style.display='none';""",
     """      if(enemy)showHalo(enemy.pos.x,enemy.pos.y??0,enemy.pos.z);
      else {
        const fallback=originAimGroundPoint(h.player(),{dx:p.dx,dy:p.dy},h.cameraYaw(),def?.range??30);
        if(id&&highflyAimSpec(id)?.shape==='line')
          showHalo(fallback.x,h.player().pos.y??0,fallback.z);
        else premium.hide();
      }""")
once(p,
     "    indicator.style.display='block';\n    indicator.style.borderColor=canceled?'#ff8f8f':'#8ee6ff';",
     "    indicator.style.display=canceled?'block':'none';\n    indicator.style.borderColor=canceled?'#ff8f8f':'#8ee6ff';")
once(p,
     "  const clear=()=>{pending=null;indicator.style.display='none';halo.style.display='none';};",
     "  const clear=()=>{pending=null;indicator.style.display='none';premium.hide();};")
once(p,
     """          const chosen=originAimSelect(h.player(),h.targets(),p.drag?{dx:p.dx,dy:p.dy}:null,def.range??30,priority,h.cameraYaw());""",
     """          const chosen=originAimSelect(h.player(),h.targets(),p.drag?{dx:p.dx,dy:p.dy}:null,def.range??30,p.drag?'nearest':priority,h.cameraYaw());""")
once(p,
     "    pending=null;halo.style.display='none';",
     "    pending=null;premium.hide();")
once(p,
     "    indicator.remove();halo.remove();",
     "    indicator.remove();premium.dispose();")
# Visual-only capture: the scene belongs to ClaudeCraft's Renderer, not a
# new Three.js renderer/camera. Ground samples come from the native world.
hud=Path('src/ui/hud.ts')
once(hud,
     "import { installOriginAimAndLoadout, originSkillRole } from '../highfly/highfly_origin_r17_hud';",
     "import { installOriginAimAndLoadout, originSkillRole } from '../highfly/highfly_origin_r17_hud';\nimport { groundHeight as highflyAimTerrainHeight } from '../sim/world';")
once(hud,
     "        cameraYaw: () => this.renderer.camYaw,",
     "        cameraYaw: () => this.renderer.camYaw,\n        scene: this.renderer.scene,\n        terrain: (x,z) => highflyAimTerrainHeight(x,z,this.sim.cfg.seed),")
# Buff window/QuickActions must not be overlaid by a second fixed menu.
trial=Path('src/highfly/highfly_origin_trial_runtime.ts')
once(trial,
     "  utility.style.cssText='position:fixed;left:31%;bottom:clamp(112px,22vh,190px);width:min(26vw,256px);z-index:8400;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:8px;border:1px solid #b7a47799;border-radius:13px;background:linear-gradient(150deg,#111d2eea,#28384dee);box-shadow:0 8px 28px #0008,inset 0 0 0 1px #ffebae18;touch-action:manipulation;';",
     "  utility.style.cssText='position:fixed;left:37%;bottom:calc(8px + env(safe-area-inset-bottom));width:min(26vw,220px);z-index:8400;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;padding:4px;border:1px solid #b7a47766;border-radius:8px;background:#111d2ebc;touch-action:manipulation;';\n  const supportVisibility=document.createElement('style');\n  supportVisibility.textContent='body.mobile-window-open #hf-origin-utility-row,body.mobile-more-open #hf-origin-utility-row,body:has(#hf-origin-training section:not([hidden])) #hf-origin-utility-row{display:none!important}';\n  document.head.appendChild(supportVisibility);")
print('HIGHFLY_ORIGIN_R20_PREMIUM_AIM_WORLD_MESH_PATCH_READY=1')
