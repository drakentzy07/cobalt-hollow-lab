/**
 * HIGHFLY C5 — FURY REAL skill aiming, existing Three.js reticle and Sim.
 * Single physical movement engine. No target snap on manual skillshots.
 */
import {FuryAimGesture} from '../fury/fury_core';
import {lineSkillHit} from './aim_line';
type Point={x:number;z:number};
type Actor={id:number;pos:Point;hostile?:boolean;dead:boolean};
type Game={
 playerId:number;entities:Map<number,Actor>;
 player:{pos:{x:number;y:number;z:number};facing:number;highflyEvadeRemaining?:number;highflyEvadeCooldownRemaining?:number};
 castAbility(id:string):void;
 castAbilityAt(id:string,aim:Point):void;
 castAbilityOn(id:string,targetId:number):void;
};
type SceneRenderer={
 setGroundAimReticle(value:{x:number;z:number;radius:number;school:string;dimmed:boolean}|null):void;
};
type GameInput={camYaw:number};
const skillRange:Record<string,number>={highfly_arc_shot:18,highfly_storm_circle:15};
export function mountRebornHud(world:Game,renderer:SceneRenderer,input:GameInput):void{
 if(document.getElementById('hf-reborn-hud'))return;
 const container=document.createElement('section');
 container.id='hf-reborn-hud';
 container.setAttribute('aria-label','HIGHFLY FURY 360° Combate');
 container.innerHTML=[
 '<div class="hf-native" id="hf-atk-dock"></div>',
 '<div class="hf-native" id="hf-dash-dock"></div>',
 '<div class="hf-native" id="hf-jump-dock"></div>',
 '<div class="hf-native" id="hf-use-dock"></div>',
 '<button type="button" class="hf-action hf-s1" data-hf-skill="highfly_arc_shot" aria-label="S1 Proyectil direccional">S1</button>',
 '<button type="button" class="hf-action hf-s2" data-hf-skill="highfly_cross_cut" aria-label="S2 Corte Cruzado">S2</button>',
 '<button type="button" class="hf-action hf-s3" data-hf-skill="highfly_breakstep" aria-label="S3 Paso Quebrador">S3</button>',
 '<button type="button" class="hf-action hf-s4" data-hf-skill="highfly_storm_circle" aria-label="S4 Área Meteórica">S4</button>',
 '<button type="button" id="hf-reborn-cancel" class="hf-cancel" hidden aria-label="Cancelar lanzamiento">✕</button>',
 '<output id="hf-reborn-hint" role="status" aria-live="polite"></output>',
 ].join('');
 document.body.appendChild(container);

 // Move the original buttons so original listeners stay authoritative.
 const original=[['mobile-action-attack','hf-atk-dock','ATK'],['mobile-evade','hf-dash-dock','DASH'],
  ['mobile-jump','hf-jump-dock','SALTO'],['mobile-interact','hf-use-dock','USAR']];
 for(const [id,dockId,label] of original){
   const btn=document.getElementById(id), dock=document.getElementById(dockId);
   if(!btn || !dock){console.error('HIGHFLY_C5_NATIVE_BUTTON_MISSING',id);continue;}
   dock.appendChild(btn);btn.textContent=label;
   btn.setAttribute('aria-label',label);
 }
 const aim=new FuryAimGesture();
 const cancel=container.querySelector<HTMLButtonElement>('#hf-reborn-cancel')!;
 const hint=container.querySelector<HTMLOutputElement>('#hf-reborn-hint')!;
 let active:{pointer:number;id:string;button:HTMLButtonElement;x:number;y:number}|null=null;
 let hintToken=0;
 function report(msg:string){
   hint.textContent=msg;const token=++hintToken;
   window.setTimeout(()=>{if(token===hintToken)hint.textContent='';},1300);
 }
 function reset(){
   if(active) {
     active.button.classList.remove('hf-aiming');
     try{active.button.releasePointerCapture(active.pointer)}catch{}
   }
   active=null;aim.clear();cancel.hidden=true;
   renderer.setGroundAimReticle(null);
 }
 const context=()=>({x:world.player.pos.x,z:world.player.pos.z});
 const update=(pointer:number,x:number,y:number)=>{
   if(!active || active.pointer!==pointer)return null;
   aim.updateContext(pointer,context(),input.camYaw);
   const a=aim.preview(pointer,x-active.x,y-active.y);
   if(a)renderer.setGroundAimReticle({
     x:a.world.x,z:a.world.z,radius:active.id==='highfly_arc_shot'?1:4.5,
     school:active.id==='highfly_arc_shot'?'arcane':'fire',dimmed:false});
   return a;
 };
 cancel.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();reset();report('Cancelado, sin gastar recursos')});
 window.addEventListener('blur',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
 const buttons=Array.from(container.querySelectorAll<HTMLButtonElement>('[data-hf-skill]'));
 for(const button of buttons){
   const id=button.dataset.hfSkill!;
   const ranged=id==='highfly_arc_shot'||id==='highfly_storm_circle';
   if(ranged){
     button.addEventListener('pointerdown',e=>{
       if(e.button!==0 || active)return;
       e.preventDefault();e.stopPropagation();
       const started=aim.start(e.pointerId,{
         abilityId:id,shape:id==='highfly_arc_shot'?'line':'circle',
         range:skillRange[id],sensitivity:0.8,horizontalSign:-1,fullDragPx:150
       },context(),input.camYaw);
       if(!started)return;
       button.setPointerCapture(e.pointerId);
       active={pointer:e.pointerId,id,button,x:e.clientX,y:e.clientY};
       button.classList.add('hf-aiming');cancel.hidden=false;
       update(e.pointerId,e.clientX,e.clientY);
       report(id==='highfly_arc_shot'?'FURY: línea, arrastrar y soltar':'FURY: círculo, arrastrar y soltar');
     });
     button.addEventListener('pointermove',e=>{
       if(!active || active.pointer!==e.pointerId || active.button!==button)return;
       e.preventDefault();e.stopPropagation();update(e.pointerId,e.clientX,e.clientY);
     });
     button.addEventListener('pointerup',e=>{
       if(!active || active.pointer!==e.pointerId || active.button!==button)return;
       e.preventDefault();e.stopPropagation();
       const result=update(e.pointerId,e.clientX,e.clientY);
       const skill=active.id;
       reset();
       if(!result)return;
       if(skill==='highfly_arc_shot'){
         // No aim assist: nearest entity physically intersected by shot corridor.
         const idHit=lineSkillHit(context(),result.world,world.entities.values(),18,1.0);
         if(idHit===null){report('DISPARO FALLADO');return;}
         world.castAbilityOn(skill,idHit);
         report('Proyectil enviado');
       }else{
         world.castAbilityAt(skill,result.world);
         report('Área enviada');
       }
     });
     button.addEventListener('pointercancel',()=>reset());
   }else{
     button.addEventListener('pointerdown',e=>{
       if(e.button!==0)return;
       e.preventDefault();e.stopPropagation();
       if(id==='highfly_cross_cut'){
         world.castAbility(id);report('Corte Cruzado');return;
       }
       const dash=document.getElementById('mobile-evade') as HTMLButtonElement|null;
       if(!dash){report('DASH no disponible');return;}
       if((world.player.highflyEvadeCooldownRemaining??0)>0){report('DASH recargando');return;}
       dash.click(); // Native Sim owns movement, collision, stamina.
       window.setTimeout(()=>{
         if((world.player.highflyEvadeCooldownRemaining??0)>0)
           world.castAbility(id); // AoE at final position, not a second teleport.
       },215);
       report('Paso Quebrador');
     });
   }
 }
}
