import {UniqueGuinevereLab,RULES,LAB_VERSION,normalize,distance} from './core.mjs';
const $=id=>document.getElementById(id);
const canvas=$('arena'),ctx=canvas.getContext('2d',{alpha:false});
const g=new UniqueGuinevereLab();
let width=1,height=1,dpr=1,scale=30,camera=0,frameTimes=[],paused=false,prev=performance.now(),eventSeq=0;
let aim=null,joy=null,cameraPointer=null,joyAxis={x:0,z:0},noticeUntil=0;
const clampUi=(v,a,b)=>Math.max(a,Math.min(b,v));
const names={U1:'PRISMA DEL VÓRTICE',U2:'RUPTURA ASCENDENTE',U3:'TEMPESTAD SUSPENDIDA'};
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';
  scale=Math.min(width/37,height/24);}
addEventListener('resize',resize);resize();
const rotate=(p,angle)=>({x:p.x*Math.cos(angle)-p.z*Math.sin(angle),z:p.x*Math.sin(angle)+p.z*Math.cos(angle)});
function worldScreen(p){const q=rotate({x:p.x-g.player.pos.x,z:p.z-g.player.pos.z},camera);return {x:width*.50+q.x*scale,y:height*.51-q.z*scale*.77};}
function fromDrag(dx,dy){return normalize(rotate({x:dx,z:-dy/.77},-camera));}
function pathCircle(x,y,r,color,opacity=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.globalAlpha=opacity;ctx.fill();ctx.globalAlpha=1;}
function ring(x,y,r,color,thick=2){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=thick;ctx.stroke();}
function line(a,b,color,weight=2){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineWidth=weight;ctx.strokeStyle=color;ctx.stroke();}
function glow(c,r,color){const gr=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,r);gr.addColorStop(0,color);gr.addColorStop(1,'#00000000');ctx.fillStyle=gr;ctx.fillRect(c.x-r,c.y-r,2*r,2*r);}
function renderFloor(){
  const gr=ctx.createLinearGradient(0,0,0,height);gr.addColorStop(0,'#071528');gr.addColorStop(.5,'#0d1b2e');gr.addColorStop(1,'#050b18');ctx.fillStyle=gr;ctx.fillRect(0,0,width,height);
  const block=2.5,span=RULES.boundary;ctx.lineWidth=.7;
  for(let x=-span;x<=span;x+=block){const a=worldScreen({x,z:-span}),b=worldScreen({x,z:span});line(a,b,'#74bfff0b',.8);}
  for(let z=-span;z<=span;z+=block){const a=worldScreen({x:-span,z}),b=worldScreen({x:span,z});line(a,b,'#74bfff0b',.8);}
  const p=[{x:-span,z:-span},{x:span,z:-span},{x:span,z:span},{x:-span,z:span}].map(worldScreen);
  for(let i=0;i<4;i++)line(p[i],p[(i+1)%4],'#7796d433',2);
}
function renderObstacle(o){const c=worldScreen(o.pos),r=o.radius*scale;glow(c,r*2,'#925bba14');pathCircle(c.x,c.y,r,'#1d253b');ring(c.x,c.y,r,'#7a91b1',2);ring(c.x,c.y,r*.7,'#425c90',1);}
function renderTarget(t){const c=worldScreen(t.pos),r=t.radius*scale;const dead=!t.alive;
  glow(c,r*3,dead?'#3c425011':t.kind==='boss'?'#ee526827':'#df996520');pathCircle(c.x,c.y,r,dead?'#293244':t.kind==='boss'?'#8e2a40':'#976a4f');
  ring(c.x,c.y,r+(dead?0:4),dead?'#576173':t.kind==='boss'?'#fa8aa5':'#f4c68b',t.kind==='boss'?3:1.8);
  if(!dead){
    const hpW=Math.max(36,r*2.4);ctx.fillStyle='#1d2536';ctx.fillRect(c.x-hpW/2,c.y-r-18,hpW,5);ctx.fillStyle=t.kind==='boss'?'#e77c82':'#e6b269';ctx.fillRect(c.x-hpW/2,c.y-r-18,hpW*t.hp/t.maxHp,5);
    for(let i=0;i<t.marks;i++){pathCircle(c.x-(t.marks-1)*5+i*10,c.y-r-25,3,'#d59cff');}
    if(t.airborneUntil>g.time){ring(c.x,c.y-r*.9,r*.60,'#e4b5ff',2);line({x:c.x,y:c.y-r*.4},{x:c.x,y:c.y-r*1.5},'#d4afff',2);}
    if(t.slowUntil>g.time)ring(c.x,c.y,r+9,'#72c9ff',1.3);
    if(t.kind==='boss'){ctx.font='800 10px system-ui';ctx.fillStyle='#ffe1e3';ctx.textAlign='center';ctx.fillText('BOSS · POISE '+Math.ceil(t.poise),c.x,c.y+r+16);}
  }
}
function renderActor(){const p=worldScreen(g.player.pos);const tick=g.time;glow(p,90,'#438bff27');ring(p.x,p.y,27,'#4abaf85a',2);
  if(g.ultimate){ring(p.x,p.y,RULES.U3.radius*scale,'#c892ff88',3);const pulse=.94+.08*Math.sin(tick*22);
    ring(p.x,p.y,RULES.U3.radius*scale*pulse,'#e5adff72',1);}
  pathCircle(p.x,p.y,19,'#244d8f');ring(p.x,p.y,19,'#9bdcff',3);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-camera);ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(-9,5);ctx.lineTo(9,5);ctx.closePath();ctx.fillStyle='#ffdf9b';ctx.fill();ctx.restore();
  ctx.font='900 10px system-ui';ctx.fillStyle='#e7f5ff';ctx.textAlign='center';ctx.fillText('HUNTER',p.x,p.y+35);
}
function renderVFX(){
  for(const shot of g.projectiles){const p=worldScreen(shot.pos);glow(p,40,'#af74e888');pathCircle(p.x,p.y,8,'#d8b2ff');ring(p.x,p.y,12,'#ab83ff99',2);}
  for(const e of g.echoes){const p=worldScreen(e.pos),r=RULES.U2.echoRadius*scale;ring(p.x,p.y,r,'#d99bff77',2);glow(p,70,'#bd64f344');
    const progress=1-(e.detonateAt-g.time)/RULES.U2.echoSec;ring(p.x,p.y,r*(1-progress*.65),'#fae2ff',2);}
  if(g.pendingLeap){const {from,to,started,landsAt}=g.pendingLeap;let t=clampUi((g.time-started)/(landsAt-started),0,1);
    const midpoint={x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t},pos=worldScreen(midpoint);
    const dest=worldScreen(to);ring(dest.x,dest.y,RULES.U2.radius*scale,'#83d4f766',2);glow(pos,60,'#6d9df456');pathCircle(pos.x,pos.y-32*Math.sin(Math.PI*t),15,'#fff1d6');
  }
}
function getCastVector(){if(!aim)return null;const dx=aim.x-aim.startX,dy=aim.y-aim.startY;
  if(Math.hypot(dx,dy)<15)return null;return fromDrag(dx,dy);}
function getAutoTarget(){let nearest=null,best=Infinity;
  for(const t of g.targets.values())if(t.alive){const d=distance(g.player.pos,t.pos);if(d<best){best=d;nearest=t;}}
  return nearest;
}
function aimPlan(skill){const v=getCastVector();const t=getAutoTarget();const fallback=t?normalize({x:t.pos.x-g.player.pos.x,z:t.pos.z-g.player.pos.z}):{x:1,z:0};
  const dir=v||fallback||{x:1,z:0};
  const drag=aim?Math.hypot(aim.x-aim.startX,aim.y-aim.startY):0;
  if(skill==='U2'&&!g.canRecast){
    const dist=v?clampUi(drag/(Math.min(width,height)*.28),.28,1)*RULES.U2.range:Math.min(RULES.U2.range,t?Math.max(.5,distance(g.player.pos,t.pos)-.7):6);
    return {dir,dest:{x:g.player.pos.x+dir.x*dist,z:g.player.pos.z+dir.z*dist}};
  }
  return {dir,dest:null};
}
function renderAim(){if(!aim)return;const skill=aim.skill,start=worldScreen(g.player.pos),plan=aimPlan(skill);
  const color='#ffe3a1',limit=skill==='U1'?RULES.U1.range:skill==='U2'?(g.canRecast?RULES.U2.blinkRange:RULES.U2.range):RULES.U3.radius;
  const dest=skill==='U2'&&!g.canRecast?plan.dest:{x:g.player.pos.x+plan.dir.x*limit,z:g.player.pos.z+plan.dir.z*limit};
  const screen=worldScreen(dest);ctx.setLineDash([7,5]);line(start,screen,color,2.4);ctx.setLineDash([]);
  if(skill==='U2'&&!g.canRecast)ring(screen.x,screen.y,RULES.U2.radius*scale,'#ffe3a1bb',3);
  if(skill==='U3')ring(start.x,start.y,RULES.U3.radius*scale,'#ffe3a1bb',3);
  if(skill==='U1')ring(screen.x,screen.y,10,color,2);
  const cancel=aim.y<height*.25&&Math.abs(aim.x-width*.5)<width*.16;
  $('cancel').classList.add('show');$('cancel').style.borderColor=cancel?'#ff4d65':'#ff9293';
  $('mode').textContent=(cancel?'CANCELANDO':'APUNTANDO')+' · '+names[skill];
  $('hint').textContent=cancel?'Soltar = sin consumo':'Soltar = ejecutar';
}
function showNotice(text){const el=$('notice');el.textContent=text;el.classList.add('visible');noticeUntil=performance.now()+1400;}
function cast(skill,plan){if(skill==='U1')return g.request('U1',plan.dir);
  if(skill==='U2')return g.request('U2',g.canRecast?plan.dir:plan.dest);
  return g.request('U3');}
function handleResult(skill,result){if(!result?.ok){const labels={BUSY:'Ocupado — espera fin del cast',MANA:'MP insuficiente',COOLDOWN:'Habilidad en cooldown',WALL:'Obstáculo: destino bloqueado',OUT_OF_RANGE:'Fuera de alcance',BAD_DESTINATION:'Destino inválido',NO_RECAST:'Recast expirado'};
    showNotice('✕ '+(labels[result.reason]||result.reason));}
  else showNotice(result.buffered?'⏳ Combo en cola':'✦ '+names[skill]);}
for(const button of document.querySelectorAll('.skill')){
  button.addEventListener('pointerdown',ev=>{if(aim)return;ev.preventDefault();ev.stopPropagation();
    const skill=button.dataset.skill;aim={pointerId:ev.pointerId,skill,startX:ev.clientX,startY:ev.clientY,x:ev.clientX,y:ev.clientY};button.classList.add('pressed');button.setPointerCapture(ev.pointerId);
    $('mode').textContent='APUNTANDO · '+names[skill];});
  button.addEventListener('pointermove',ev=>{if(aim?.pointerId===ev.pointerId){aim.x=ev.clientX;aim.y=ev.clientY;}});
  button.addEventListener('pointerup',ev=>{if(aim?.pointerId!==ev.pointerId)return;ev.preventDefault();
    aim.x=ev.clientX;aim.y=ev.clientY;const skill=aim.skill,cancel=aim.y<height*.25&&Math.abs(aim.x-width*.5)<width*.16;
    const plan=aimPlan(skill);button.classList.remove('pressed');aim=null;$('cancel').classList.remove('show');
    $('mode').textContent='KIT GUINEVERE';$('hint').textContent='Arrastrar desde la skill para apuntar';
    if(cancel){g.cancelPreview(skill);showNotice('✕ Apuntado cancelado');return;}
    handleResult(skill,cast(skill,plan));});
  button.addEventListener('pointercancel',ev=>{if(aim?.pointerId===ev.pointerId){g.cancelPreview(aim.skill);aim=null;button.classList.remove('pressed');$('cancel').classList.remove('show');}});
}
const joyEl=$('joy'),nub=$('nub');
function updateJoy(e){const rect=joyEl.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
  const x=clampUi((e.clientX-cx)/(rect.width*.35),-1,1),y=clampUi((e.clientY-cy)/(rect.height*.35),-1,1);
  const vec=normalize({x,z:-y});const mag=Math.min(1,Math.hypot(x,y));joyAxis=vec?{x:vec.x*mag,z:vec.z*mag}:{x:0,z:0};
  nub.style.transform=`translate(${x*rect.width*.22}px,${y*rect.height*.22}px)`;}
joyEl.addEventListener('pointerdown',e=>{if(joy)return;e.preventDefault();joy=e.pointerId;joyEl.setPointerCapture(e.pointerId);updateJoy(e);});
joyEl.addEventListener('pointermove',e=>{if(joy===e.pointerId)updateJoy(e);});
function releaseJoy(e){if(joy===e.pointerId){joy=null;joyAxis={x:0,z:0};nub.style.transform='';}}
joyEl.addEventListener('pointerup',releaseJoy);joyEl.addEventListener('pointercancel',releaseJoy);
canvas.addEventListener('pointerdown',e=>{if(cameraPointer)return;cameraPointer={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(cameraPointer?.id===e.pointerId){const dx=e.clientX-cameraPointer.x;camera=clampUi(camera+dx*.007,-Math.PI,Math.PI);cameraPointer.x=e.clientX;}});
for(const typ of ['pointerup','pointercancel'])canvas.addEventListener(typ,e=>{if(cameraPointer?.id===e.pointerId)cameraPointer=null;});
$('reset').addEventListener('click',()=>{g.reset();eventSeq=0;$('eventlines').replaceChildren();showNotice('↻ Laboratorio reiniciado');});
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'▶ Reanudar':'Ⅱ Pausa';});
addEventListener('keydown',e=>{if(e.repeat)return;
  if(['Digit1','Digit2','Digit3'].includes(e.code)){const s='U'+e.code.slice(-1);handleResult(s,cast(s,aimPlan(s)));}
  if(e.code==='KeyR'){$('reset').click();}});
function renderUi(dt){
  $('hp').style.width=g.player.hp/g.player.maxHp*100+'%';$('mp').style.width=g.player.mp/g.player.maxMp*100+'%';$('sta').style.width=g.player.stamina/g.player.maxStamina*100+'%';
  $('hptext').textContent=Math.round(g.player.hp)+' / '+g.player.maxHp;
  $('mptext').textContent=Math.round(g.player.mp)+' / '+g.player.maxMp;
  $('statext').textContent=Math.round(g.player.stamina)+' / '+g.player.maxStamina;
  for(const button of document.querySelectorAll('.skill')){
    const skill=button.dataset.skill,cd=Math.max(0,g.cd[skill]-g.time),recast=skill==='U2'&&g.canRecast;
    button.classList.toggle('cooling',cd>.04&&!recast);
    button.querySelector('.cd').textContent=cd.toFixed(1)+'s';
    button.querySelector('.name').textContent=recast?'↪ ECO / BLINK':skill==='U1'?'PRISMA':skill==='U2'?'RUPTURA':'TEMPESTAD';
    button.setAttribute('aria-disabled',String((cd>.04&&!recast)||g.player.mp<RULES[skill].cost));
  }
  const recent=g.events.filter(e=>e.seq>eventSeq);if(recent.length){eventSeq=recent[recent.length-1].seq;
    const chosen=recent.filter(e=>['damage','airborne','mark','cooldown_refund','boss_poise','blink','echo_detonate','leap_land','refused','ultimate_tick','death','recast_open'].includes(e.type)).slice(-5);
    if(chosen.length){const lines=$('eventlines');for(const e of chosen){const div=document.createElement('div');div.className='line';const label={damage:()=>`${e.skill} · −${e.amount.toFixed(0)} HP → ${e.target}`,mark:()=>`Marca ${e.stacks}/3 → ${e.target}`,airborne:()=>`Airborne → ${e.target}`,cooldown_refund:()=>'Refund CD por impacto',boss_poise:()=>`Boss posture −${e.loss}`,blink:()=>'Teleport + eco',echo_detonate:()=>'Eco: detonación',leap_land:()=>'Salto: impacto real',refused:()=>`Rechazada: ${e.reason}`,ultimate_tick:()=>`U3 evento ${e.index}/11`,death:()=>`Objetivo ${e.target} eliminado`,recast_open:()=>'U2: segundo lanzamiento disponible'};div.textContent=label[e.type]?.()||e.type;lines.appendChild(div);}
      while(lines.children.length>5)lines.firstChild.remove();}}
  frameTimes.push(dt);if(frameTimes.length>40)frameTimes.shift();const avg=frameTimes.reduce((s,n)=>s+n,0)/frameTimes.length;
  $('frame').textContent=Math.round(1/Math.max(.001,avg))+' FPS';
  if(performance.now()>noticeUntil)$('notice').classList.remove('visible');
}
function loop(now){const dt=Math.min(.05,Math.max(0,(now-prev)/1000));prev=now;
  if(!paused){if(joy){const v=rotate(joyAxis,-camera);g.movePlayer(v,dt);}g.step(dt);}
  ctx.setTransform(dpr,0,0,dpr,0,0);renderFloor();for(const o of g.obstacles)renderObstacle(o);
  for(const t of g.targets.values())renderTarget(t);renderVFX();renderActor();renderAim();renderUi(dt);
  requestAnimationFrame(loop);
}
$('mode').textContent=LAB_VERSION;requestAnimationFrame(loop);

// Read-only laboratory QA bridge. Never installed in the production client.
window.__HIGHFLY_UNIQUE_LAB_QA=Object.freeze({snapshot:()=>g.snapshot(),version:LAB_VERSION});
