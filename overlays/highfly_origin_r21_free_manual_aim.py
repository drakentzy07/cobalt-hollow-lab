#!/usr/bin/env python3
"""R21 no-snap direction fix, staged AFTER R20. Preview Hunter only.
Do not replace ClaudeCraft combat or movement; all casts remain native.
"""
from pathlib import Path
import shutil

def once(p,old,new):
 p=Path(p);s=p.read_text(encoding='utf-8')
 if s.count(old)!=1:raise SystemExit('R21_ANCHOR_DRIFT '+str(p)+' '+repr(old[:85])+' count '+str(s.count(old)))
 p.write_text(s.replace(old,new,1),encoding='utf-8')

def span(p,first,last,replacement):
 p=Path(p);s=p.read_text(encoding='utf-8')
 if s.count(first)!=1 or s.count(last)!=1:raise SystemExit('R21_SPAN_DRIFT '+str(p))
 a=s.index(first);b=s.index(last,a)
 if b<a:raise SystemExit('R21_SPAN_ORDER_ERROR')
 p.write_text(s[:a]+replacement+s[b:],encoding='utf-8')

src=Path('src/highfly/highfly_origin_r17_hud.ts')
shutil.copy2('../v9-corrections/game/c1/highfly_origin_r21_aim_intent.ts',
             'src/highfly/highfly_origin_r21_aim_intent.ts')
once(src,
 "import { HighflyAimVisual, highflyAimSpec } from './highfly_origin_r20_premium_aim';",
 "import { HighflyAimVisual, highflyAimSpec } from './highfly_origin_r20_premium_aim';\nimport { highflyManualAim,highflyManualRayTarget,highflyEffectiveAimRange } from './highfly_origin_r21_aim_intent';")
once(src,
 "  cameraYaw:()=>number;\n  scene:THREE.Scene;",
 "  cameraYaw:()=>number;\n  face:(point:{x:number;z:number})=>void;\n  scene:THREE.Scene;")
once(src,
 "  const showHalo=(x:number,_y:number,z:number)=>{",
 "  const showHalo=(x:number,_y:number,z:number,valid=true)=>{")
once(src,
 "    if(spec)premium.show(spec,h.player().pos,{x,z});",
 "    if(spec)premium.show(spec,h.player().pos,{x,z},valid);")
span(src,"  const down=(ev:PointerEvent)=>{","  const click=(ev:MouseEvent)=>{",'''  const down=(ev:PointerEvent)=>{
    if(ev.pointerType!=='touch'||pending)return;
    const target=ev.target;
    if(!(target instanceof Element))return;
    const nativeRing=target.closest<HTMLElement>('.mobile-action-slot[data-mobile-index]');
    const desktop=target.closest<HTMLElement>('.action-btn[data-hotbar-slot]');
    const slot=nativeRing?h.ringSlot(Number(nativeRing.dataset.mobileIndex))
      : desktop?Number(desktop.dataset.hotbarSlot):0;
    if(!Number.isInteger(slot)||slot<1||slot>10)return;
    const id=h.getSlot(slot),def=id?ABILITIES[id]:null;
    const spec=id?highflyAimSpec(id):null;
    // Passive and self-only skills keep their original native instant activation.
    if(!def||!spec||originSkillRole(id!)!=='combat'
       ||(!def.requiresTarget&&def.targetMode!=='position'&&spec.shape!=='dash')
       ||def.empowerStages)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    pending={id:ev.pointerId,slot,startX:ev.clientX,startY:ev.clientY,dx:0,dy:0,drag:false};
    const p=h.player();
    const look=Math.atan2(Math.sin(p.facing),Math.cos(p.facing));
    const initial={x:p.pos.x+Math.sin(look)*Math.max(0.5,spec.range),
                   z:p.pos.z+Math.cos(look)*Math.max(0.5,spec.range)};
    showHalo(initial.x,p.pos.y??0,initial.z,true);
  };
  const isCancelSpot=(ev:PointerEvent)=>{
    // Dedicated top-centre cancellation zone. Never hijack NE drag direction.
    return ev.clientY<56&&ev.clientX>innerWidth*0.41&&ev.clientX<innerWidth*0.59;
  };
  const resolveAim=(p:NonNullable<typeof pending>,def:typeof ABILITIES[string])=>{
    const spec=highflyAimSpec(def.id)!;
    return highflyManualAim(h.player().pos,p.dx,p.dy,
      Math.max(0.5,spec.range),spec.shape,h.project,h.cameraYaw());
  };
  const move=(ev:PointerEvent)=>{
    if(!pending||pending.id!==ev.pointerId)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const p=pending;p.dx=ev.clientX-p.startX;p.dy=ev.clientY-p.startY;
    if(Math.hypot(p.dx,p.dy)<12)return;
    p.drag=true;
    const def=ABILITIES[h.getSlot(p.slot)??''];
    if(!def){premium.hide();return;}
    if(isCancelSpot(ev)){
      premium.hide();
      indicator.textContent='✕ CANCELAR';
      indicator.style.display='block';
      indicator.style.left='45%';
      indicator.style.top='7px';
      return;
    }
    indicator.style.display='none';
    const aimed=resolveAim(p,def);
    let valid=true;
    if(def.requiresTarget){
      const match=highflyManualRayTarget(h.player().pos,h.targets(),
        aimed.dir,highflyEffectiveAimRange(def),1.2,def.minRange??0);
      valid=match!==null;
    }
    // Absolutely NO automatic entity selection or retargeting during dragging.
    // The indicator stays at the independently calculated manual world direction.
    showHalo(aimed.point.x,h.player().pos.y??0,aimed.point.z,valid);
  };
  const clear=()=>{pending=null;indicator.style.display='none';premium.hide();};
  const up=(ev:PointerEvent)=>{
    if(!pending||pending.id!==ev.pointerId)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const p=pending,def=ABILITIES[h.getSlot(p.slot)??''];
    const canceled=p.drag&&isCancelSpot(ev);
    if(!canceled&&def&&originSkillRole(def.id)==='combat'){
      const positional=def.targetMode==='position'&&!def.selfCentered;
      if(p.drag){
        const aimed=resolveAim(p,def);
        if(positional){
          h.face(aimed.point);
          h.castAt(def.id,aimed.point); // original native position-cast with aim
        }else if(def.requiresTarget){
          const id=highflyManualRayTarget(h.player().pos,h.targets(),aimed.dir,
            highflyEffectiveAimRange(def),1.2,def.minRange??0);
          if(id!==null){
            h.face(aimed.point); // local preview turn on release, independent of camera
            h.target(id);
            h.castSlot(p.slot); // native Sim authoritatively checks melee, LOS, weapon etc.
          }
          // Direction with no valid enemy: do not fake a direct-damage projectile.
        }else{
          h.face(aimed.point);
          h.castSlot(p.slot); // directional native forward-mobility effect
        }
      }else{
        // TAP is the only branch with configurable smart assistance.
        const range=highflyEffectiveAimRange(def);
        const chosen=originAimSelect(h.player(),h.targets(),null,range,priority,h.cameraYaw());
        const unit=chosen!==null?h.targets().find(e=>e.id===chosen):null;
        if(positional){
          const actor=h.player();
          const pt=unit?.pos??{x:actor.pos.x+Math.sin(actor.facing)*range,
                                 z:actor.pos.z+Math.cos(actor.facing)*range};
          h.face(pt);h.castAt(def.id,{x:pt.x,z:pt.z});
        }else if(def.requiresTarget){
          if(unit){h.face(unit.pos);h.target(unit.id);h.castSlot(p.slot);}
        }else h.castSlot(p.slot);
      }
    }
    consumed={slot:p.slot,at:Date.now()};
    clear();
  };
''')
# Direct facing in standalone Hunter offline preview only, just before the
# original Sim's authoritative cast. No camera, locomotion, or network hooks.
hud=Path('src/ui/hud.ts')
once(hud,
 "        terrain: (x,z) => highflyAimTerrainHeight(x,z,this.sim.cfg.seed),",
 """        terrain: (x,z) => highflyAimTerrainHeight(x,z,this.sim.cfg.seed),
        face: (pt) => {
          const player=this.sim.player,dx=pt.x-player.pos.x,dz=pt.z-player.pos.z;
          if(Math.hypot(dx,dz)>0.1)player.facing=Math.atan2(dx,dz);
        },""")
print('HIGHFLY_R21_TRUE_MANUAL_SCREEN_DRAG_NO_SNAP_PATCH_READY=1')
