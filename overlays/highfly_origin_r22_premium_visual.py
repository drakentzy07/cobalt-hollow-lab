#!/usr/bin/env python3
"""HIGHFLY R22 native WebGL UI patch, applied AFTER R21.
Only swaps preview drawing. Does NOT change original Sim, GOLDEN camera,
persistent save, skill learning, equip rules, cast costs or hit geometry.
Optional in-panel visual gallery shows examples with NO skill granted/cast.
"""
from pathlib import Path
import shutil
def once(path,old,new):
  p=Path(path)
  data=p.read_text(encoding='utf8')
  n=data.count(old)
  if n!=1:raise SystemExit(f'R22_SOURCE_DRIFT {p} {n} '+repr(old[:110]))
  p.write_text(data.replace(old,new,1),encoding='utf8')

shutil.copy2('../v9-corrections/game/c1/highfly_origin_r22_premium_visual.ts',
             'src/highfly/highfly_origin_r22_premium_visual.ts')
aim='src/highfly/highfly_origin_r17_hud.ts'
once(aim,
     "import { HighflyAimVisual, highflyAimSpec } from './highfly_origin_r20_premium_aim';",
     "import { highflyAimSpec } from './highfly_origin_r20_premium_aim';\nimport { HighflyAimVisual } from './highfly_origin_r22_premium_visual';")

# The optional showcase is only invoked from the existing Hunter skills
# editor (not a new floating combat panel). Real skills/levels untouched.
once(aim,
     "  document.addEventListener('hf-origin-command',command);",
     """  let visualPreviewTimer:number|null=null;
  const visualPreview=(event:Event)=>{
    if(pending)return;
    const shape=(event as CustomEvent<{shape?:string}>).detail?.shape;
    if(!['line','cone','circle','dash','target'].includes(shape??''))return;
    const sourceId=shape==='circle'?'blizzard'
      :shape==='dash'?'heroic_leap'
      :shape==='target'?'sinister_strike'
      :'fireball';
    const native=highflyAimSpec(sourceId);
    if(!native)return;
    const sample=shape==='cone'
      ? {...native,shape:'cone' as const,range:9,angle:Math.PI/2,radius:0}
      :shape==='target'
      ? {...native,shape:'target' as const,range:4.5,radius:0}
      :native;
    const p=h.player(),yaw=h.cameraYaw();
    const d=Math.min(sample.range,shape==='circle'?13:shape==='dash'?15:shape==='target'?3.5:16);
    const aimPoint={x:p.pos.x+Math.sin(yaw)*d,z:p.pos.z+Math.cos(yaw)*d};
    if(visualPreviewTimer!==null)window.clearTimeout(visualPreviewTimer);
    premium.show(sample,p.pos,aimPoint,true);
    visualPreviewTimer=window.setTimeout(()=>{
      visualPreviewTimer=null;
      if(!pending)premium.hide();
    },2400);
  };
  document.addEventListener('hf-origin-aim-gallery',visualPreview);
  document.addEventListener('hf-origin-command',command);""")
once(aim,
     "    document.removeEventListener('hf-origin-command',command);",
     """    document.removeEventListener('hf-origin-aim-gallery',visualPreview);
    if(visualPreviewTimer!==null)window.clearTimeout(visualPreviewTimer);
    document.removeEventListener('hf-origin-command',command);""")

trial='src/highfly/highfly_origin_trial_runtime.ts'
once(trial,
     "  mountOriginR18Editor(sim,panel,list,referencePanel,status,refresh);",
     """  // R22 opt-in PREVIEW gallery, inside the existing Hunter skills menu only.
  // Every button is VISUAL ONLY: no learned spells, target, equipment,
  // damage, combat resources, cooldown or save state is modified.
  const gallery=document.createElement('details');
  gallery.id='hf-origin-r22-visual-gallery';
  const galleryTitle=document.createElement('summary');
  galleryTitle.textContent='🎯 PRUEBA VISUAL DE APUNTADOS (sin lanzar skills)';
  galleryTitle.style.cssText='color:#e9c987;padding:8px;cursor:pointer';
  const galleryRow=document.createElement('div');
  galleryRow.style.cssText='display:flex;flex-wrap:wrap;gap:5px;padding:6px;';
  const models:[string,string][]=[
    ['line','LÍNEA'],['cone','CONO (DEMO)'],['circle','ÁREA'],
    ['dash','DASH'],['target','OBJETIVO']
  ];
  for(const [shape,title] of models){
    const btn=button(title);
    btn.style.cssText+='font-size:11px;min-width:58px;min-height:30px;padding:5px;';
    bindTouchTap(btn,()=>{
      panel.hidden=true;
      document.dispatchEvent(new CustomEvent('hf-origin-aim-gallery',{detail:{shape}}));
    });
    galleryRow.appendChild(btn);
  }
  const galleryNote=document.createElement('small');
  galleryNote.textContent='Muestra 2,4 segundos sobre el suelo. No desbloquea ni ejecuta habilidades. El cono es una muestra visual: todavía no está asociado a un golpe nativo.';
  galleryNote.style.cssText='display:block;padding:6px;color:#b3c6d9;';
  gallery.append(galleryTitle,galleryRow,galleryNote);
  panel.insertBefore(gallery,referencePanel);
  mountOriginR18Editor(sim,panel,list,referencePanel,status,refresh);""")
print('HIGHFLY_ORIGIN_R22_PREMIUM_GROUND_INDICATOR_GALLERY_NO_CAST_READY=1')
