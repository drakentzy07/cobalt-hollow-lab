/** HIGHFLY Skill Factory R0: opt-in tactile ability aiming.
 * This module owns no combat math, cooldowns, save data or item effects.
 * The authoritative Sim alone accepts casts; cancel NEVER calls cast.
 */
export type HfAimShape = 'target' | 'line' | 'cone' | 'area' | 'dash';
export interface HfAimSpec {
  slot: number;
  id: string;
  label: string;
  shape: HfAimShape;
  range: number;
  radius: number;
  cooldown: number;
}
export interface HfAimVector {
  yaw: number;
  distance: number;
  dx: number;
  dy: number;
}
export function hfAimVector(
  startX: number, startY: number, x: number, y: number,
  cameraYaw: number, range: number,
): HfAimVector {
  const dx = x - startX;
  const dy = y - startY;
  const length = Math.hypot(dx, dy);
  return {
    // Camera-relative: up = facing, right = facing + 90 degrees.
    yaw: cameraYaw + Math.atan2(dx, -dy),
    distance: Math.max(0, Math.min(range, length / 125 * range)),
    dx, dy,
  };
}
export function hfPointFromVector(
  origin: {x: number; z: number}, vector: HfAimVector,
): {x: number; z: number} {
  return {
    x: origin.x + Math.sin(vector.yaw) * vector.distance,
    z: origin.z + Math.cos(vector.yaw) * vector.distance,
  };
}
export function hfInsideCancel(
  x: number, y: number, bounds: {left:number;top:number;right:number;bottom:number},
): boolean {
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}
export function hfAimTarget(
  entities: Iterable<{id:number;pos:{x:number;z:number}}>,
  origin: {x:number;z:number}, yaw:number, range:number,
  attackable: (id:number)=>boolean,
): number | null {
  let best: number | null = null;
  let bestScore = Infinity;
  const sx = Math.sin(yaw), sz = Math.cos(yaw);
  for (const entity of entities) {
    if (!attackable(entity.id)) continue;
    const dx = entity.pos.x - origin.x, dz = entity.pos.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (!(distance > 0.001 && distance <= range)) continue;
    const cosine = (dx * sx + dz * sz) / distance;
    // Strict +/-25 degree manual shot; no automatic 360 correction.
    if (cosine < Math.cos(Math.PI * 25 / 180)) continue;
    const score = (1 - cosine) * 15 + distance * 0.08;
    if (score < bestScore || (score === bestScore && (best === null || entity.id < best))) {
      best = entity.id;
      bestScore = score;
    }
  }
  return best;
}
export interface HfAimHooks {
  resolve(buttonIndex: number): HfAimSpec | null;
  cameraYaw(): number;
  begin(spec:HfAimSpec): void;
  preview(spec:HfAimSpec, vector:HfAimVector): void;
  commit(spec:HfAimSpec, vector:HfAimVector, wasDrag:boolean): void;
  cancel(): void;
  isGroundAimActive(): boolean;
}
export function installHighflyManualAim(hooks:HfAimHooks): void {
  // Opt-in LAB only. Default v9.1 controls retain native radial/petal behavior.
  if (!new URLSearchParams(location.search).has('hf-manual-aim')) return;
  const cancel = document.createElement('button');
  cancel.id = 'hf-manual-aim-cancel';
  cancel.textContent = 'CANCELAR';
  cancel.setAttribute('aria-label', 'Cancelar habilidad sin consumir recursos');
  Object.assign(cancel.style, {
    position:'fixed',top:'18%',right:'4%',zIndex:'9996',width:'102px',height:'56px',
    border:'2px solid #f5f5f5',borderRadius:'12px',fontWeight:'700',
    background:'rgba(110,12,18,.9)',color:'#fff',display:'none',touchAction:'none',
  });
  const canvas = document.createElement('canvas');
  canvas.id = 'hf-manual-aim-preview';
  Object.assign(canvas.style, {
    position:'fixed',inset:'0',width:'100%',height:'100%',zIndex:'9994',
    pointerEvents:'none',display:'none',
  });
  const tooltip = document.createElement('div');
  tooltip.id = 'hf-manual-aim-tooltip';
  Object.assign(tooltip.style, {
    position:'fixed',top:'10%',left:'25%',maxWidth:'50vw',zIndex:'9997',
    display:'none',padding:'10px 14px',borderRadius:'8px',color:'#fff',
    background:'rgba(9,22,34,.93)',fontSize:'14px',pointerEvents:'none',
  });
  document.body.append(canvas,cancel,tooltip);
  const ctx = canvas.getContext('2d');
  let active: {
    pointer:number; sx:number;sy:number;x:number;y:number;
    spec:HfAimSpec; timer:ReturnType<typeof setTimeout>|null;
    inspected:boolean;
  } | null = null;
  const show = () => {
    cancel.style.display='block';
    canvas.style.display='block';
    canvas.width=innerWidth * devicePixelRatio;
    canvas.height=innerHeight * devicePixelRatio;
    ctx?.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  };
  function hide():void {
    if (active?.timer) clearTimeout(active.timer);
    active=null;
    tooltip.style.display='none';
    cancel.style.display='none';
    canvas.style.display='none';
    ctx?.clearRect(0,0,innerWidth,innerHeight);
  }
  function cancelNow():void { hooks.cancel(); hide(); }
  function draw():void {
    if (!active || !ctx) return;
    const a=active, v=hfAimVector(a.sx,a.sy,a.x,a.y,hooks.cameraYaw(),a.spec.range);
    ctx.clearRect(0,0,innerWidth,innerHeight);
    ctx.save();
    ctx.strokeStyle='rgba(80,205,255,.92)';
    ctx.fillStyle='rgba(80,205,255,.14)';
    ctx.lineWidth=3;
    ctx.setLineDash([7,5]);
    ctx.beginPath();
    ctx.moveTo(a.sx,a.sy);ctx.lineTo(a.x,a.y);ctx.stroke();
    ctx.setLineDash([]);
    if (a.spec.shape==='area') {
      ctx.beginPath();ctx.arc(a.x,a.y,Math.max(18,a.spec.radius*5),0,Math.PI*2);ctx.fill();ctx.stroke();
    } else if (a.spec.shape==='cone') {
      const angle=Math.atan2(v.dy,v.dx);
      ctx.beginPath();ctx.moveTo(a.sx,a.sy);
      ctx.arc(a.sx,a.sy,Math.max(55,Math.min(135,Math.hypot(v.dx,v.dy))),angle-0.45,angle+0.45);
      ctx.closePath();ctx.fill();ctx.stroke();
    } else {
      ctx.beginPath();ctx.arc(a.x,a.y,12,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
  cancel.addEventListener('pointerdown',(e)=>{
    e.preventDefault();e.stopImmediatePropagation();cancelNow();
  },true);
  document.addEventListener('pointerdown',(e:PointerEvent)=>{
    if (e.pointerType!=='touch' || active) return;
    if (!document.body.classList.contains('mobile-touch')) return;
    if (document.body.classList.contains('mobile-window-open')) return;
    const el=(e.target as Element | null)?.closest?.('.mobile-action-slot') as HTMLElement | null;
    if (!el) return;
    const index=Number(el.dataset.mobileIndex);
    if (!Number.isInteger(index)) return;
    const spec=hooks.resolve(index);
    if (!spec) return; // self-buffs and unhandled actions remain native.
    e.preventDefault();
    e.stopImmediatePropagation(); // never open donor's radial for this pilot gesture.
    active={pointer:e.pointerId,sx:e.clientX,sy:e.clientY,
      x:e.clientX,y:e.clientY,spec,timer:null,inspected:false};
    show();
    hooks.begin(spec);
    active.timer=setTimeout(()=>{
      if (!active || active.pointer!==e.pointerId) return;
      if (Math.hypot(active.x-active.sx,active.y-active.sy)>16) return;
      active.inspected=true;
      tooltip.textContent=spec.label+' · '+spec.shape+' · alcance '+spec.range.toFixed(1)+
        ' · CD '+spec.cooldown.toFixed(1)+' s · arrastrar para apuntar';
      tooltip.style.display='block';
    },520);
  },true);
  document.addEventListener('pointermove',(e:PointerEvent)=>{
    if (!active || e.pointerId!==active.pointer) return;
    e.preventDefault();e.stopImmediatePropagation();
    active.x=e.clientX;active.y=e.clientY;
    const v=hfAimVector(active.sx,active.sy,active.x,active.y,
      hooks.cameraYaw(),active.spec.range);
    if (Math.hypot(v.dx,v.dy)>16) {
      if (active.timer) clearTimeout(active.timer);
      active.timer=null;active.inspected=false;
      tooltip.style.display='none';
    }
    hooks.preview(active.spec,v);draw();
  },true);
  document.addEventListener('pointerup',(e:PointerEvent)=>{
    if (!active || e.pointerId!==active.pointer) return;
    e.preventDefault();e.stopImmediatePropagation();
    const a=active;
    const v=hfAimVector(a.sx,a.sy,e.clientX,e.clientY,
      hooks.cameraYaw(),a.spec.range);
    const canceled=hfInsideCancel(e.clientX,e.clientY,cancel.getBoundingClientRect());
    if (canceled || a.inspected) { cancelNow(); return; }
    const drag=Math.hypot(v.dx,v.dy)>22;
    // Ground spells: tap arms the existing reticle, drag commits immediately.
    if (a.spec.shape==='area' && !drag) {
      hide();
      // Keep CANCELAR visible while donor's original reticle awaits a world tap.
      cancel.style.display='block';
      return;
    }
    hooks.commit(a.spec,v,drag);
    hide();
  },true);
  const interrupted=(e:PointerEvent)=>{
    if(active && e.pointerId===active.pointer){e.stopImmediatePropagation();cancelNow();}
  };
  document.addEventListener('pointercancel',interrupted,true);
  document.addEventListener('pointerup',()=>{
    if (!active && cancel.style.display==='block' && !hooks.isGroundAimActive()) {
      cancel.style.display='none';
    }
  });
  window.addEventListener('blur',()=>{if(active)cancelNow();});
  window.addEventListener('keydown',(e)=>{
    if(e.key==='Escape' && (active || cancel.style.display==='block')){cancelNow();}
  });
}
