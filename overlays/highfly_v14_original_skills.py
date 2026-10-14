#!/usr/bin/env python3
"""V14 opt-in ONLY. No source AbilityDef, damage, autoattack or VFX changes."""
from pathlib import Path
import shutil

def once(path,old,new):
 p=Path(path)
 src=p.read_text(encoding="utf-8")
 if src.count(old)!=1:raise SystemExit("V14_ANCHOR_DRIFT "+path+" "+str(src.count(old))+" "+old[:65])
 p.write_text(src.replace(old,new,1),encoding="utf-8")

source=Path("../v9-corrections/game/v14/highfly_v14_original_skills.ts")
dest=Path("src/highfly/v14_original_skills.ts")
if not source.is_file() or dest.exists():raise SystemExit("V14_SOURCE_MISSING")
shutil.copyfile(source,dest)
once("src/main.ts",
 "import { applyFrameGeometrySetting } from './game/frame_geometry_settings';",
 """import { applyFrameGeometrySetting } from './game/frame_geometry_settings';
import {v14Requested,v14Class,installV14} from './highfly/v14_original_skills';
import {hfAimVector as v14AimVector,hfAimTarget as v14AimTarget,hfPointFromVector as v14AimPoint} from './highfly/manual_skill_aim';
import {createMob as v14CreateMob} from './sim/entity';
import {MOBS as V14_MOBS} from './sim/data';""")
once("src/main.ts","  mobileControls.start();","""  mobileControls.start();
  if(v14Requested() && offlineSim){
    // LV99 is an isolated QA fixture, NOT a persisted balance change.
    offlineSim.setPlayerLevel(99);
    offlineSim.tick();
    const player=offlineSim.player;
    const dummy=v14CreateMob(941401,V14_MOBS.training_dummy,20,{
      x:player.pos.x,y:player.pos.y,z:player.pos.z+6,
    });
    dummy.hostile=true;dummy.hp=dummy.maxHp=999999999;dummy.aiState='idle';
    (offlineSim as unknown as {addEntity(mob:typeof dummy):void}).addEntity(dummy);
    offlineSim.targetEntity(dummy.id,player.id);
    const attackable=(id:number)=>isAttackableEntity(
      world.entities.get(id),world.playerId,activePvpOpponentIds(world));
    installV14({
      equip:(id,slot)=>hud.highflyV14Equip(id,slot),
      cast:(slot)=>hud.castSlot(slot),
      castBuff:(id)=>hud.castCrossHotbarAction({type:'ability',id}),
      known:()=>new Set(offlineSim.known.map(d=>d.def.id)),
      resource:()=>({type:player.resourceType??'mana',current:player.resource,max:player.maxResource}),
      level:()=>player.level,
      aim:(slot,sx,sy,x,y,drag)=>{
        const def=hud.abilityForSlot(slot)?.def;
        if(!def)return false;
        const range=Math.max(def.range??0,def.requiresTarget?5:2);
        const aim=v14AimVector(sx,sy,x,y,input.camYaw,range);
        if(def.targetMode==='position'&&!def.selfCentered){
          const point=v14AimPoint(player.pos,aim);
          hud.castSlot(slot);hud.commitGroundAimAt(point);return true;
        }
        if(def.requiresTarget && (def.targetType==='friendly'||def.partyOnlyTarget)){
          if(def.targetsDead)return false;
          world.targetEntity(world.playerId);
        }else if(def.requiresTarget){
          const id=drag?v14AimTarget(world.entities.values(),player.pos,aim.yaw,range,attackable):dummy.id;
          if(id===null||!attackable(id))return false;
          world.targetEntity(id);
          const ent=world.entities.get(id);
          if(ent)player.facing=Math.atan2(ent.pos.x-player.pos.x,ent.pos.z-player.pos.z);
        }else if(drag)player.facing=aim.yaw;
        hud.castSlot(slot);return true;
      },
    });
  }""")
once("src/main.ts","} else if (diagnosticsAutoOffline) {",
 """} else if(v14Requested()){
  // A unique test character key prevents production save re-use.
  startSitePresence('home');
  void startOffline(v14Class(), 'HFV14Lab', 0);
} else if (diagnosticsAutoOffline) {""")
once("src/ui/hud.ts","  castSlot(barSlot: number): void {",
 """  /** V14: existing native assignment, no auto-attack or combat override. */
  highflyV14Equip(id:string,barSlot:number):boolean{
    if(new URLSearchParams(location.search).get('hf-v14')!=='1')return false;
    if(!Number.isInteger(barSlot)||barSlot<1||barSlot>10)return false;
    if(!this.sim.known.some(a=>a.def.id===id))return false;
    if(!this.actionBarController.isAssignableAction({type:'ability',id}))return false;
    this.commitHotbarActions(placeAbilityOnSlot(this.hotbarActions,id,barSlot-1));
    return true;
  }

  castSlot(barSlot: number): void {""")
assert "highflyV14Equip" in Path("src/ui/hud.ts").read_text()
assert "startOffline(v14Class(), 'HFV14Lab', 0)" in Path("src/main.ts").read_text()
assert "highflyV13MuteNormalAttackHere" not in Path("src/sim/combat/auto_attack.ts").read_text()
print("HIGHFLY_V14_ORIGINAL_NATIVE_ATK_PRESERVED=1")
