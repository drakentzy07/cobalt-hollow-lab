/**
 * HIGHFLY REBORN touch HUD. Move native ATK, DASH, SALTO and USAR buttons
 * without cloning their listeners. S1-S4 cast actual Sim-registered abilities.
 * Scoped only to the REBORN offline entry.
 */
type Point = { x:number; z:number };
type RebornWorld = {
  player: {
    pos: {x:number; y:number; z:number}; facing:number;
    highflyEvadeCooldownRemaining?:number;
  };
  castAbility(id:string):void;
  castAbilityAt(id:string,aim:Point):void;
};
type RebornRenderer = {groundPoint(x:number,y:number,groundY:number):Point|null};

export function mountRebornHud(world:RebornWorld, renderer:RebornRenderer):void {
  if(document.getElementById('hf-reborn-hud'))return;
  const container=document.createElement('section');
  container.id='hf-reborn-hud';
  container.setAttribute('aria-label','Combate HIGHFLY FURY 360');
  container.innerHTML = [
    '<div class="hf-native" id="hf-atk-dock"></div>',
    '<div class="hf-native" id="hf-dash-dock"></div>',
    '<div class="hf-native" id="hf-jump-dock"></div>',
    '<div class="hf-native" id="hf-use-dock"></div>',
    '<button type="button" class="hf-action hf-s1" data-hf-skill="highfly_arc_shot" aria-label="S1 Pulso Arcano">S1</button>',
    '<button type="button" class="hf-action hf-s2" data-hf-skill="highfly_cross_cut" aria-label="S2 Corte Cruzado">S2</button>',
    '<button type="button" class="hf-action hf-s3" data-hf-skill="highfly_breakstep" aria-label="S3 Paso Quebrador">S3</button>',
    '<button type="button" class="hf-action hf-s4" data-hf-skill="highfly_storm_circle" aria-label="S4 Círculo de Tormenta">S4</button>',
    '<button type="button" class="hf-cancel" id="hf-reborn-cancel" hidden aria-label="Cancelar habilidad">✕</button>',
    '<div id="hf-reborn-aim" hidden aria-hidden="true"></div>',
    '<output id="hf-reborn-hint" role="status" aria-live="polite"></output>',
  ].join('');
  document.body.append(container);

  // Existing native touch handlers are retained when DOM nodes are MOVED.
  const originals:[string,string][]=[
    ['mobile-action-attack','hf-atk-dock'],
    ['mobile-evade','hf-dash-dock'],
    ['mobile-jump','hf-jump-dock'],
    ['mobile-interact','hf-use-dock'],
  ];
  for(const [id,dockId] of originals){
    const button=document.getElementById(id);
    const dock=document.getElementById(dockId);
    if(!button || !dock) {
      console.error('HIGHFLY_REBORN_NATIVE_BUTTON_NOT_FOUND',id);
      continue;
    }
    dock.append(button);
    if(id==='mobile-action-attack'){
      button.textContent='ATK';
      button.setAttribute('aria-label','Ataque básico');
    }
    if(id==='mobile-jump'){
      button.textContent='SALTO';
      button.setAttribute('aria-label','Salto doble y mortal');
    }
    if(id==='mobile-evade'){
      button.textContent='DASH';
      button.setAttribute('aria-label','Evadir');
    }
    if(id==='mobile-interact'){
      button.textContent='USAR';
      button.setAttribute('aria-label','Interactuar y recoger');
    }
  }

  const cancel=container.querySelector<HTMLButtonElement>('#hf-reborn-cancel')!;
  const cursor=container.querySelector<HTMLElement>('#hf-reborn-aim')!;
  const hint=container.querySelector<HTMLOutputElement>('#hf-reborn-hint')!;
  const skillBtns=Array.from(container.querySelectorAll<HTMLButtonElement>('[data-hf-skill]'));
  let active:{
    id:string;pointer:number;x:number;y:number;originX:number;originY:number;dragged:boolean;button:HTMLButtonElement
  }|null=null;
  let hintToken=0;
  function showHint(message:string):void{
    hint.textContent=message;
    const token=++hintToken;
    window.setTimeout(()=>{if(token===hintToken)hint.textContent='';},1400);
  }
  function clearAim():void{
    if(active){
      try{active.button.releasePointerCapture(active.pointer);}catch{}
      active.button.classList.remove('hf-aiming');
    }
    active=null;cancel.hidden=true;cursor.hidden=true;
  }
  cancel.addEventListener('pointerdown',e=>{
    e.preventDefault(); e.stopPropagation(); clearAim(); showHint('Habilidad cancelada');
  });
  const forwardAim=(range:number):Point=>{
    const p=world.player;
    return {x:p.pos.x+Math.sin(p.facing)*range,z:p.pos.z+Math.cos(p.facing)*range};
  };
  for(const button of skillBtns){
    const id=button.dataset.hfSkill!;
    const groundTarget=id==='highfly_arc_shot'||id==='highfly_storm_circle';
    if(groundTarget){
      button.addEventListener('pointerdown',e=>{
        if(e.button!==0 || active)return;
        e.preventDefault();e.stopPropagation();
        button.setPointerCapture(e.pointerId);
        active={id,pointer:e.pointerId,x:e.clientX,y:e.clientY,
          originX:e.clientX,originY:e.clientY,dragged:false,button};
        button.classList.add('hf-aiming');cancel.hidden=false;cursor.hidden=false;
        cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';
        showHint(id==='highfly_arc_shot'?'Arrastrar S1 • soltar dispara':'Arrastrar S4 • soltar coloca área');
      });
      button.addEventListener('pointermove',e=>{
        if(!active || active.button!==button || active.pointer!==e.pointerId)return;
        e.preventDefault();e.stopPropagation();
        active.x=e.clientX;active.y=e.clientY;
        if(Math.hypot(e.clientX-active.originX,e.clientY-active.originY)>11)active.dragged=true;
        cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';
      });
      button.addEventListener('pointerup',e=>{
        if(!active || active.button!==button || active.pointer!==e.pointerId)return;
        e.preventDefault();e.stopPropagation();
        const skill=active.id;
        const dragged=active.dragged;
        let location:Point|null=null;
        if(dragged)location=renderer.groundPoint(e.clientX,e.clientY,world.player.pos.y);
        else location=forwardAim(skill==='highfly_arc_shot'?9:8);
        clearAim();
        if(!location){showHint('No hay terreno válido');return;}
        // Authoritative Sim checks line-of-sight, range, cooldown and damage.
        world.castAbilityAt(skill,location);
        showHint(skill==='highfly_arc_shot'?'Pulso Arcano':'Círculo de Tormenta');
      });
      button.addEventListener('pointercancel',()=>clearAim());
    }else{
      button.addEventListener('pointerdown',e=>{
        if(e.button!==0)return;
        e.preventDefault();e.stopPropagation();
        if(id==='highfly_cross_cut'){
          world.castAbility(id);
          showHint('Corte Cruzado');
          return;
        }
        // S3: the native dodge owns translation and collision. No fake teleport.
        const dash=document.getElementById('mobile-evade') as HTMLButtonElement|null;
        if(!dash){showHint('DASH no disponible');return;}
        if((world.player.highflyEvadeCooldownRemaining??0)>0){showHint('Dash enfriándose');return;}
        dash.click();
        window.setTimeout(()=>{
          // No damage unless the native Sim accepted the dash and started cooldown.
          if((world.player.highflyEvadeCooldownRemaining??0)>0)
            world.castAbility('highfly_breakstep');
        },140);
        showHint('Paso Quebrador');
      });
    }
  }
}
