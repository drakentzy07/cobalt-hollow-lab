#!/usr/bin/env python3
"""HIGHFLY R26: seven native original skills in a separate disposable preview.
Run after all certified R24A overlays; never touch existing character saves.
"""
from pathlib import Path
import shutil
def once(path,a,b):
    f=Path(path);s=f.read_text('utf8');n=s.count(a)
    if n!=1:raise SystemExit('R26_SOURCE_DRIFT:'+path+':'+str(n)+':'+repr(a[:70]))
    f.write_text(s.replace(a,b,1),'utf8')
shutil.copyfile('../v9-corrections/game/c1/highfly_origin_r26_seven_trial.ts',
                'src/sim/highfly_origin_r26_seven_trial.ts')
once('src/main.ts',"import { offlineWorldConfig } from './game/offline_world_config';",
     "import { offlineWorldConfig } from './game/offline_world_config';\nimport { originR26SessionOnly } from './sim/highfly_origin_r26_seven_trial';")
once('src/main.ts',
     "const trialSave = originHunterTrial ? await loadOriginTrialSave(name) : null;",
     "const trialSave = originHunterTrial && import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB!=='1'\n    ? await loadOriginTrialSave(name) : null;")
once('src/main.ts',
     "        hunter.unequipItem('offhand'); // original native bag move\n        return hunter;",
     "        hunter.unequipItem('offhand'); // original native bag move\n        if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1')originR26SessionOnly(hunter);\n        return hunter;")
once('src/main.ts',"    startOriginTrialAutosave(sim,name);",
     "    if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB!=='1')startOriginTrialAutosave(sim,name);")
tick=chr(96)
template=tick+'highfly:origin:'+chr(36)+'{name}'+tick
once('src/main.ts',"void startGame(sim,sim,null,"+template+",true)",
     "void startGame(sim,sim,null,import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1'\n      ? 'highfly:origin:r26-ephemeral' : "+template+",true)")
aim='src/highfly/highfly_origin_r17_hud.ts'
once(aim,"import { originFocusRole } from '../sim/highfly_origin_r19_selection';",
     "import { originFocusRole } from '../sim/highfly_origin_r19_selection';\nimport { ORIGIN_R26_SEVEN_IDS } from '../sim/highfly_origin_r26_seven_trial';")
once(aim,"  const role=originFocusRole(id);",
     "  if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1' &&\n     (ORIGIN_R26_SEVEN_IDS as readonly string[]).includes(id) &&\n     def&&!def.passive&&!def.hiddenFromPlayer&&originCostDecision(def).ok)return 'combat';\n  const role=originFocusRole(id);")
spec='src/highfly/highfly_origin_r20_premium_aim.ts'
once(spec,"const CONE_IDS=new Set<string>();","const CONE_IDS=new Set(['dragons_breath']);")
once(spec," const radius=aoe?.radius??aoe?.landingAoe?.radius??0;",
     """ const radius=aoe?.radius??aoe?.landingAoe?.radius??0;
 const cone=def.effects.find(e=>e.type==='empoweredCone') as
   ({type:string;stages:readonly {range:number;angle:number}[]})|undefined;
 const coneStage=cone?.stages[0];
 const coneMax=cone?.stages[cone.stages.length-1];""")
once(spec," const selfCentered=range===0&&!positional&&!movement;",
          " const selfCentered=Boolean(def.selfCentered)||range===0&&!positional&&!movement;")
once(spec," else if(positional)shape='circle';\n else if(CONE_IDS.has(id))shape='cone';",
          " else if(CONE_IDS.has(id)&&cone)shape='cone';\n else if(positional)shape='circle';")
once(spec," return {shape,range:actualRange,minRange:",
          " return {shape,range:coneMax?.range??actualRange,minRange:")
once(spec,"radius:Math.max(0,radius),width:range===0?1.5:0.95,angle:Math.PI/3,",
          "radius:Math.max(0,radius),width:range===0?1.5:0.95,\n   angle:coneStage?coneStage.angle*Math.PI/180:Math.PI/3,")
vis='src/highfly/highfly_origin_r22_premium_visual.ts'
once(vis,"else if(shape==='circle')this.marker(end,Math.max(.2,spec.radius));",
         "else if(shape==='circle')this.marker(spec.selfCentered?actor:end,Math.max(.2,spec.radius));")
# The owner always gets a genuine seven-skill action bar when entering R26.
hud='src/ui/hud.ts'
once(hud,"        ringSlot: (i) => this.mobileSourceSlotForButton(i,'center'),\n      });",
     """        ringSlot: (i) => this.mobileSourceSlotForButton(i,'center'),
      });
      if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1'){
        const originals=['shadow_bolt','meteor','dragons_breath',
          'sinister_strike','heroic_leap','bladestorm','fear'];
        originals.forEach((id,i)=>document.dispatchEvent(new CustomEvent(
          'hf-origin-command',{detail:{kind:'set',slot:i+1,id}})));
        for(let slot=8;slot<=10;slot++)
          document.dispatchEvent(new CustomEvent('hf-origin-command',{
            detail:{kind:'clear',slot}}));
      }""")
# Observe native Dragon's Breath touch events. Its existing empoweredCone
# remains authoritative: never intercept/cancel its original press/release.
once(aim,"  let consumed:{slot:number;at:number}|null=null;",
     """  let consumed:{slot:number;at:number}|null=null;
  let dragonPointer:number|null=null;
  let dragonX=0,dragonY=0;""")
once(aim,"    // Passive and self-only skills keep their original native instant activation.",
     """    if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1' &&
       id==='dragons_breath'&&spec?.shape==='cone'){
      dragonPointer=ev.pointerId;dragonX=ev.clientX;dragonY=ev.clientY;
      const a=h.player(),pt={x:a.pos.x+Math.sin(a.facing)*6,z:a.pos.z+Math.cos(a.facing)*6};
      premium.show({...spec,range:6,angle:55*Math.PI/180},a.pos,pt,true);
      return;
    }
    // Passive and self-only skills keep their original native instant activation.""")
once(aim,"  const move=(ev:PointerEvent)=>{\n    if(!pending||pending.id!==ev.pointerId)return;",
     """  const move=(ev:PointerEvent)=>{
    if(dragonPointer===ev.pointerId){
      const a=h.player(),spec=highflyAimSpec('dragons_breath');
      if(spec){
        const raw=ABILITIES.dragons_breath.effects.find(e=>e.type==='empoweredCone');
        const stages=(raw as {stages?:readonly {range:number;angle:number}[]}|undefined)?.stages;
        const caster=a as typeof a & {castTotal:number;castRemaining:number;castingAbility:string|null};
        const progress=caster.castTotal>0&&caster.castingAbility==='dragons_breath'
          ? Math.max(0,Math.min(1,1-caster.castRemaining/caster.castTotal)):0;
        const idx=Math.min((stages?.length??1)-1,Math.floor(progress*(stages?.length??1)));
        const stage=stages?.[idx]??{range:6,angle:55};
        const goal=highflyManualAim(a.pos,ev.clientX-dragonX,ev.clientY-dragonY,
          stage.range,'cone',h.project,h.cameraYaw());
        h.face(goal.point);
        premium.show({...spec,range:stage.range,angle:stage.angle*Math.PI/180},
          a.pos,goal.point,true);
      }
      return;
    }
    if(!pending||pending.id!==ev.pointerId)return;""")
once(aim,"  const up=(ev:PointerEvent)=>{\n    if(!pending||pending.id!==ev.pointerId)return;",
     "  const up=(ev:PointerEvent)=>{\n    if(dragonPointer===ev.pointerId){dragonPointer=null;premium.hide();return;}\n    if(!pending||pending.id!==ev.pointerId)return;")
once(aim,"  const cancel=(ev:PointerEvent)=>{if(pending?.id===ev.pointerId)clear();};",
     "  const cancel=(ev:PointerEvent)=>{if(dragonPointer===ev.pointerId){dragonPointer=null;premium.hide();}if(pending?.id===ev.pointerId)clear();};")
once(aim,"  const pagehide=()=>clear();","  const pagehide=()=>{dragonPointer=null;clear();};")
print('HIGHFLY_R26_ORIGINAL_SEVEN_DISPOSABLE_LAB_PATCH_READY=1')
