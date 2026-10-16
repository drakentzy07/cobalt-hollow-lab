/**
 * HIGHFLY UNIQUE LAB R02 | actual modular KayKit GLB + original 3D VFX.
 * Rendering is observational: only core.mjs resolves hits, damage, costs or CD.
 * Frozen source upstream 9b57e49..., CC0 KayKit model. No external assets at runtime.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {UniqueGuinevereLab,RULES,LAB_VERSION,normalize,distance} from './core.mjs';

const $=(id)=>document.getElementById(id);
const game=new UniqueGuinevereLab();
const canvas=$('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=false; // thermal-friendly S23 target
const scene=new THREE.Scene();scene.background=new THREE.Color(0x090c22);scene.fog=new THREE.FogExp2(0x0d1126,.015);
scene.add(new THREE.HemisphereLight(0x8bbaff,0x1d0a32,2.8));
const sunlight=new THREE.DirectionalLight(0xfff3e6,3.2);sunlight.position.set(7,13,8);scene.add(sunlight);
const purpleLight=new THREE.PointLight(0x9146ff,36,22,2);purpleLight.position.set(0,5,0);scene.add(purpleLight);
const camera=new THREE.PerspectiveCamera(57,1,.08,115);let camAngle=.05,camHeight=12,camDistance=17;
const root=new THREE.Group();scene.add(root);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(110,110),new THREE.MeshStandardMaterial({color:0x17283a,roughness:.95,metalness:.06}));floor.rotation.x=-Math.PI/2;floor.position.y=-.055;scene.add(floor);
const grid=new THREE.GridHelper(50,50,0x46517a,0x2d385b);grid.position.y=-.044;grid.material.transparent=true;grid.material.opacity=.28;scene.add(grid);
const arenaDisc=new THREE.Mesh(new THREE.RingGeometry(23.9,24.15,120),new THREE.MeshBasicMaterial({color:0x964eee,side:THREE.DoubleSide,transparent:true,opacity:.56}));arenaDisc.rotation.x=-Math.PI/2;arenaDisc.position.y=.008;scene.add(arenaDisc);
const stars=[];for(let i=0;i<80;i++){const phi=i*2.39996322,r=9+(i%17)*.8;const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.07+(i%4)*.02,0),new THREE.MeshBasicMaterial({color:i%3===0?0x7f8ffe:0x51487e}));crystal.position.set(Math.cos(phi)*r,.3+(i%5)*.15,Math.sin(phi)*r);scene.add(crystal);stars.push(crystal);}
const glowMat=(c,opacity=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const ringGeo=new THREE.RingGeometry(.985,1.015,64);
function ring(position,radius,color,opacity=.8){const m=new THREE.Mesh(ringGeo,glowMat(color,opacity));m.rotation.x=-Math.PI/2;m.scale.setScalar(radius);m.position.set(position.x,.045,position.z);scene.add(m);return m;}
const reticle=ring({x:0,z:0},2,0x9ac8ff,.75);reticle.visible=false;
const aimLine=new THREE.Mesh(new THREE.PlaneGeometry(1,1),glowMat(0x8ce5ff,.26));aimLine.rotation.x=-Math.PI/2;scene.add(aimLine);aimLine.visible=false;
const hitGeo=new THREE.IcosahedronGeometry(.15,1);
const FX_LIMIT=170;const fx=[];
function effect(mesh,seconds,opts={}){if(fx.length>=FX_LIMIT){const old=fx.shift();scene.remove(old.mesh);if(old.disposeGeo)old.mesh.geometry.dispose();}
 scene.add(mesh);fx.push({mesh,life:seconds,age:0,opts,disposeGeo:opts.disposeGeo??false});return mesh;}
function burst(p,color,count=12,scale=1){for(let i=0;i<Math.min(count,22);i++){
 const a=i*2.39996322;const speed=1.3+(i%5)*.45;const m=new THREE.Mesh(hitGeo,glowMat(color,.95));m.position.set(p.x,.3+(i%4)*.21,p.z);
 m.scale.setScalar(.26+((i+2)%4)*.11);effect(m,.45+((i%4)*.07),{velocity:new THREE.Vector3(Math.sin(a)*speed,1.7+(i%3)*.8,Math.cos(a)*speed),fade:true});
}}
function shockwave(p,radius,color=0xcc82ff,duration=.48){const m=ring(p,.05,color,.96);effect(m,duration,{grow:radius,fade:true});return m;}
function beam(a,b,color=0xe89bff,seconds=.18){const start=new THREE.Vector3(a.x,.9,a.z),end=new THREE.Vector3(b.x,1.2,b.z),d=end.clone().sub(start);
 const m=new THREE.Mesh(new THREE.CylinderGeometry(.045,.09,d.length(),6,1,true),glowMat(color,.88));m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());effect(m,seconds,{fade:true});}
function runFX(dt){for(let i=fx.length-1;i>=0;i--){const e=fx[i];e.age+=dt;const pct=e.age/e.life;const {opts:o,mesh:m}=e;
 if(o.grow)m.scale.setScalar(Math.max(.02,pct*o.grow));
 if(o.velocity){m.position.addScaledVector(o.velocity,dt);o.velocity.y-=dt*3.2;}
 if(o.fade)m.material.opacity=Math.max(0,1-pct)*(.92);
 if(pct>=1){scene.remove(m);if(e.disposeGeo)m.geometry.dispose();m.material.dispose();fx.splice(i,1);}
}}
const actor=new THREE.Group();scene.add(actor);
let actualRig=null,rigClips=[],mixer=null,currentAction=null,currentClip='',rigOffset=0,rigScale=1,rigReady=false;
const preferredClips={idle:['Idle'],run:['Running_A','Walking_A'],U1:['Spellcast_Shoot','Spellcasting'],U2:['Jump_Idle','Spellcast_Raise'],U3:['Spellcast_Raise','Spellcasting']};
function chooseClip(kind){for(const name of (preferredClips[kind]??preferredClips.idle)){const clip=rigClips.find(c=>c.name===name);if(clip)return clip;}return rigClips.find(c=>/idle/i.test(c.name))||rigClips[0]||null;}
function playClip(kind,oneshot=false){if(!mixer||!rigClips.length)return;const clip=chooseClip(kind);if(!clip)return;
 if(currentClip===clip.name&&!oneshot)return;const next=mixer.clipAction(clip);next.reset();next.enabled=true;next.setEffectiveWeight(1);
 next.setEffectiveTimeScale((kind==='U3'&&oneshot)?Math.max(.8,clip.duration/1.8):1);
 next.setLoop(oneshot?THREE.LoopOnce:THREE.LoopRepeat,oneshot?1:Infinity);next.clampWhenFinished=oneshot;
 if(currentAction&&currentAction!==next)currentAction.fadeOut(.12);next.fadeIn(.12).play();currentAction=next;currentClip=clip.name;
}
function decodeInlineGlb(){const b64=window.__HIGHFLY_KAYKIT_GLB_BASE64__;
 if(!b64||b64==='__INJECT_MODEL_BASE64__')throw Error('FALTA GLB: este HTML debe generarse con build-r02.mjs y el asset CC0 congelado');
 const ascii=atob(b64);const bytes=new Uint8Array(ascii.length);for(let i=0;i<ascii.length;i++)bytes[i]=ascii.charCodeAt(i);return bytes.buffer;}
// Keep the original KTX2-compressed KayKit textures, entirely offline. THREE.FileLoader
// is bridged only for the two pinned Basis transcoder resources; no network requests.
const decodeBase64=(s)=>{const raw=atob(s);const out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;};
const nativeFileLoad=THREE.FileLoader.prototype.load;
THREE.FileLoader.prototype.load=function(url,onLoad,onProgress,onError){
 const name=String(url??'');
 if(name.endsWith('basis_transcoder.js')||name.endsWith('basis_transcoder.wasm')){
  const js=name.endsWith('.js');const encoded=window[js?'__HIGHFLY_BASIS_JS_BASE64__':'__HIGHFLY_BASIS_WASM_BASE64__'];
  if(!encoded){queueMicrotask(()=>onError?.(new Error('MISSING_INLINE_BASIS_TRANSCODER')));return this;}
  queueMicrotask(()=>{try{const bin=decodeBase64(encoded);onLoad(js?new TextDecoder().decode(bin):bin.buffer);}catch(err){onError?.(err);}});return this;
 }
 return nativeFileLoad.call(this,url,onLoad,onProgress,onError);
};
async function loadRig(){try{
 const ktx=new KTX2Loader().setTranscoderPath('/highfly-inline-basis/');ktx.detectSupport(renderer);
 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);loader.setKTX2Loader(ktx);
 const parsed=await new Promise((resolve,reject)=>loader.parse(decodeInlineGlb(),'',resolve,reject));
 actualRig=parsed.scene;rigClips=parsed.animations||[];
 actualRig.traverse(o=>{if(o.isMesh||o.isSkinnedMesh){o.frustumCulled=false;}});
 // keep Rig_Medium skeleton/animations/weights unmodified: scale only scene container.
 actualRig.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(actualRig);
 const height=box.max.y-box.min.y;if(Number.isFinite(height)&&height>.01)rigScale=Math.min(6,Math.max(.1,2.55/height));
 actualRig.scale.setScalar(rigScale);rigOffset=-box.min.y*rigScale;actualRig.position.y=rigOffset;
 actor.add(actualRig);mixer=new THREE.AnimationMixer(actualRig);rigReady=true;playClip('idle');
 $('loading').style.display='none';notify('✓ Hunter modular auténtico · '+rigClips.length+' animaciones');
 }catch(err){$('loading').textContent='No se pudo cargar el GLB KayKit real: '+String(err).slice(0,170);console.error(err);}}
const targets=new Map();function makeDummy(t){const group=new THREE.Group();scene.add(group);
 const boss=t.kind==='boss';const stone=new THREE.MeshStandardMaterial({color:boss?0x795b75:0x536884,metalness:.42,roughness:.42});
 const base=new THREE.Mesh(new THREE.CylinderGeometry(boss?1.05:.62,boss?1.15:.75,boss?2.25:1.55,8),stone);base.position.y=boss?1.13:.82;group.add(base);
 const helm=new THREE.Mesh(new THREE.DodecahedronGeometry(boss?.82:.56,0),new THREE.MeshStandardMaterial({color:boss?0xb570d6:0x7da9c3,metalness:.55,roughness:.32}));helm.position.y=boss?2.35:1.95;group.add(helm);
 for(const delta of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),glowMat(boss?0xff7c9b:0xaed7ff,.85));eye.position.set(delta*(boss?.3:.21),boss?2.44:2.03,boss?.72:.5);group.add(eye);}
 const healthBG=new THREE.Mesh(new THREE.PlaneGeometry(boss?2.4:1.7,.15),new THREE.MeshBasicMaterial({color:0x320f2b,side:THREE.DoubleSide}));healthBG.position.y=boss?3.35:2.85;group.add(healthBG);
 const health=new THREE.Mesh(new THREE.PlaneGeometry(boss?2.35:1.65,.11),new THREE.MeshBasicMaterial({color:boss?0xec94cb:0x7dd9c5,side:THREE.DoubleSide}));health.position.y=healthBG.position.y+.005;health.position.z=.008;group.add(health);
 targets.set(t.id,{group,health,healthBG,helm,boss,width:boss?2.35:1.65});}
for(const t of game.targets.values())makeDummy(t);
for(const o of game.obstacles){const stone=new THREE.Mesh(new THREE.CylinderGeometry(o.radius*.83,o.radius,4.2,8),new THREE.MeshStandardMaterial({color:0x4a4a69,metalness:.16,roughness:.68}));stone.position.set(o.pos.x,2.1,o.pos.z);scene.add(stone);}
const lastAim={skill:null,v:null,destination:null};let aim=null;let joyId=null,joyAxis={x:0,z:0},cameraPointer=null,paused=false,softAim=true,lastSeq=0;
const screenVec=(dx,dy)=>{const az=camAngle;const vx=Math.cos(az)*dx+Math.sin(az)*dy;const vz=-Math.sin(az)*dx+Math.cos(az)*dy;return normalize({x:vx,z:vz});};
function findSoftTarget(max=16){let best=null;for(const t of game.targets.values()){if(!t.alive)continue;const d=distance(game.player.pos,t.pos);if(d>max)continue;
 const front={x:t.pos.x-game.player.pos.x,z:t.pos.z-game.player.pos.z};const n=normalize(front);const dot=n?(n.x*game.facing.x+n.z*game.facing.z):1;
 const score=d-(dot>.1?1.75:0);if(best===null||score<best.score)best={t,score};}return best?.t??null;}
function resolveAim(skill,dx=0,dy=0){const amt=Math.hypot(dx,dy);let dir=null,target=null;
 if(amt>14)dir=screenVec(dx,-dy);
 else if(softAim){target=findSoftTarget(skill==='U2'?RULES.U2.range+2:RULES.U1.range);if(target)dir=normalize({x:target.pos.x-game.player.pos.x,z:target.pos.z-game.player.pos.z});}
 dir??=game.facing??{x:0,z:1};
 const range=skill==='U2'?Math.min(RULES.U2.range,Math.max(3,amt/60*RULES.U2.range)):RULES.U1.range;
 const destination=skill==='U2'?(target&&amt<=14?{...target.pos}:{x:game.player.pos.x+dir.x*range,z:game.player.pos.z+dir.z*range}):null;
 return {dir,destination};}
function dispatch(skill,plan){if(skill==='U1')return game.request('U1',plan.dir);if(skill==='U2')return game.request('U2',game.canRecast?plan.dir:plan.destination);return game.request('U3');}
function notify(msg){const e=$('toast');e.textContent=msg;e.classList.add('visible');e.dataset.expires=String(performance.now()+1250);}
const rejectNames={COOLDOWN:'En cooldown',MANA:'MP insuficiente',BUSY:'Ocupado',WALL:'Pared bloquea',OUT_OF_RANGE:'Fuera de alcance',BAD_DESTINATION:'Objetivo inválido',DEAD:'Hunter caído',NO_RECAST:'Sin segunda activación'};
function onCastResult(skill,r){if(!r.ok)notify((skill||'')+' · '+(rejectNames[r.reason]||r.reason));else if(r.buffered)notify('Combo '+skill+' en cola ✓');}
for(const btn of document.querySelectorAll('.skill')){
 const skill=btn.dataset.skill;
 btn.addEventListener('pointerdown',e=>{if(aim)return;e.preventDefault();btn.setPointerCapture(e.pointerId);aim={id:e.pointerId,skill,x:e.clientX,y:e.clientY,dx:0,dy:0,cancelled:false};btn.classList.add('active');$('cancel').classList.add('open');});
 btn.addEventListener('pointermove',e=>{if(!aim||aim.id!==e.pointerId)return;aim.dx=e.clientX-aim.x;aim.dy=e.clientY-aim.y;const cr=$('cancel').getBoundingClientRect();aim.cancelled=e.clientX>=cr.left&&e.clientX<=cr.right&&e.clientY>=cr.top&&e.clientY<=cr.bottom;});
 btn.addEventListener('pointerup',e=>{if(!aim||aim.id!==e.pointerId)return;btn.classList.remove('active');$('cancel').classList.remove('open');const a=aim;aim=null;
 if(a.cancelled){game.cancelPreview(a.skill);notify('Apuntado cancelado ✓');return;}onCastResult(skill,dispatch(skill,resolveAim(skill,a.dx,a.dy)));});
 btn.addEventListener('pointercancel',e=>{if(!aim||aim.id!==e.pointerId)return;btn.classList.remove('active');$('cancel').classList.remove('open');game.cancelPreview(skill);aim=null;});
}
const joy=$('joy');function moveJoy(e){const rect=joy.getBoundingClientRect();const dx=(e.clientX-rect.left-rect.width/2)/(rect.width*.35),dy=(e.clientY-rect.top-rect.height/2)/(rect.height*.35);const d=normalize({x:dx,z:-dy}),mag=Math.min(1,Math.hypot(dx,dy));joyAxis=d?{x:d.x*mag,z:d.z*mag}:{x:0,z:0};$('nub').style.transform=`translate(${Math.max(-1,Math.min(1,dx))*rect.width*.22}px,${Math.max(-1,Math.min(1,dy))*rect.height*.22}px)`;}
joy.addEventListener('pointerdown',e=>{if(joyId!==null)return;joyId=e.pointerId;joy.setPointerCapture(joyId);moveJoy(e);});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)moveJoy(e);});for(const type of ['pointerup','pointercancel'])joy.addEventListener(type,e=>{if(e.pointerId!==joyId)return;joyId=null;joyAxis={x:0,z:0};$('nub').style.transform='';});
canvas.addEventListener('pointerdown',e=>{if(cameraPointer)return;canvas.setPointerCapture(e.pointerId);cameraPointer={id:e.pointerId,x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointermove',e=>{if(!cameraPointer||cameraPointer.id!==e.pointerId)return;const dx=e.clientX-cameraPointer.x,dy=e.clientY-cameraPointer.y;camAngle-=dx*.007;camHeight=Math.min(19,Math.max(6,camHeight+dy*.04));cameraPointer.x=e.clientX;cameraPointer.y=e.clientY;});
for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,e=>{if(cameraPointer?.id===e.pointerId)cameraPointer=null;});
$('reset').addEventListener('click',()=>{game.reset();lastSeq=0;for(const e of fx){scene.remove(e.mesh);e.mesh.material.dispose();}fx.length=0;$('eventlines').replaceChildren();notify('Laboratorio reiniciado');});
$('autoaim').addEventListener('click',()=>{softAim=!softAim;$('autoaim').textContent='SOFT-AIM: '+(softAim?'ON':'OFF');});
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';});
addEventListener('keydown',e=>{if(e.repeat)return;if(['Digit1','Digit2','Digit3'].includes(e.code)){const skill='U'+e.code.slice(-1);onCastResult(skill,dispatch(skill,resolveAim(skill)));}if(e.code==='KeyR')$('reset').click();});
const pretty={cast:'Cast',projectile_hit:'Impacto U1',projectile_blocked:'U1 bloqueado',mark:'Marca',airborne:'Elevación',boss_poise:'Postura',leap_land:'Aterrizaje',recast_open:'Recast',blink:'Blink',echo_detonate:'Eco',ultimate_tick:'Combo',cooldown_refund:'CD −0.6s',refused:'Rechazado'};
function events3d(){for(const e of game.events){if(e.seq<=lastSeq)continue;lastSeq=e.seq;
 if(e.type==='projectile_spawn')burst(game.player.pos,0xc984ff,5,.6);
 else if(e.type==='projectile_hit'){const t=game.targets.get(e.target);if(t){shockwave(t.pos,1.1,0xc989ff);burst(t.pos,0xa4a6ff,16);}}
 else if(e.type==='leap_start'){shockwave(game.player.pos,1.25,0x7ed9ff,.36);playClip('U2',true);}
 else if(e.type==='leap_land'){shockwave({x:e.x,z:e.z},RULES.U2.radius,0xc884ff,.58);burst({x:e.x,z:e.z},0xb4a4ff,18);}
 else if(e.type==='blink'){shockwave(e.from,1.9,0xb5b2ff,.48);shockwave(e.to,1.2,0xdfeaff,.34);playClip('U2',true);}
 else if(e.type==='echo_detonate'){shockwave({x:e.x,z:e.z},RULES.U2.echoRadius,0xf17cde,.6);burst({x:e.x,z:e.z},0xd8b7ff,16);}
 else if(e.type==='ultimate_start'){playClip('U3',true);shockwave(game.player.pos,RULES.U3.radius,0xb36aff,.8);}
 else if(e.type==='ultimate_tick'){shockwave(game.player.pos,RULES.U3.radius*(.55+(e.index%4)*.12),e.index%2?0xd8a9ff:0x6ca3ff,.3);
 for(const t of game.targets.values())if(t.alive&&distance(t.pos,game.player.pos)<RULES.U3.radius+t.radius){if(e.index%2===0)beam(game.player.pos,t.pos);if(e.index%3===0)burst(t.pos,0xd2a4ff,5);}}
 else if(e.type==='cast'&&e.skill==='U1')playClip('U1',true);
 const printed=['damage','mark','airborne','boss_poise','blink','ultimate_tick','cooldown_refund','refused','echo_detonate','recast_open'];
 if(printed.includes(e.type)){const l=document.createElement('div');l.textContent=`${pretty[e.type]||e.type} ${e.skill||''} ${e.target?'→ '+e.target:''} ${e.amount?'-'+e.amount.toFixed(0):''} ${e.index?e.index+'/11':''}`;$('eventlines').appendChild(l);while($('eventlines').children.length>4)$('eventlines').firstChild.remove();}
}}
const projectileVisuals=new Map(),projectileMat=glowMat(0xe5afff,1),projectileGeo=new THREE.OctahedronGeometry(.32,1);
function updateProjectiles(){const active=new Set();for(const b of game.projectiles){active.add(b.id);let m=projectileVisuals.get(b.id);if(!m){m=new THREE.Mesh(projectileGeo,projectileMat);scene.add(m);projectileVisuals.set(b.id,m);}m.position.set(b.pos.x,1.0+Math.sin(game.time*25)*.1,b.pos.z);m.rotation.y+=.12;}
 for(const [id,m] of projectileVisuals){if(active.has(id))continue;scene.remove(m);projectileVisuals.delete(id);}}
const ultOrbit=new THREE.Group();scene.add(ultOrbit);const orbitRings=[];for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(2.55+i*.39,.04,5,70),glowMat(i===0?0xe0a0ff:i===1?0x91d2ff:0xaf7dff,.65));m.rotation.x=.18+i*.36;ultOrbit.add(m);orbitRings.push(m);}
function updateActors(dt){const p=game.player.pos;actor.position.set(p.x,0,p.z);const facing=game.facing;
 actor.rotation.y=Math.atan2(facing.x,facing.z);
 if(game.pendingLeap){const l=game.pendingLeap,progress=Math.max(0,Math.min(1,(game.time-l.started)/(l.landsAt-l.started)));
 actor.position.set(l.from.x+(l.to.x-l.from.x)*progress,Math.sin(progress*Math.PI)*2.75,l.from.z+(l.to.z-l.from.z)*progress);
 }else if(game.ultimate)actor.position.y=.28+Math.sin(game.time*10)*.13;
 if(mixer){mixer.update(dt);if(!game.busy){if(Math.hypot(joyAxis.x,joyAxis.z)>.15)playClip('run');else playClip('idle');}}
 purpleLight.position.set(p.x,4,p.z);ultOrbit.visible=!!game.ultimate;ultOrbit.position.set(actor.position.x,actor.position.y+1.2,actor.position.z);
 orbitRings.forEach((m,i)=>{m.rotation.z+=dt*(1.25+i*.8);m.rotation.y+=dt*(.5+i*.4);m.material.opacity=.6+.18*Math.sin(game.time*11+i);});
 for(const t of game.targets.values()){const mesh=targets.get(t.id);if(!mesh)continue;mesh.group.position.set(t.pos.x,0,t.pos.z);
 mesh.group.visible=t.alive;mesh.health.scale.x=Math.max(.001,t.hp/t.maxHp);mesh.health.position.x=-(mesh.width/2)*(1-t.hp/t.maxHp);
 const airt=t.kind==='mob'&&t.airborneUntil>game.time?Math.min(1.8,(t.airborneUntil-game.time)*1.8):0;mesh.group.position.y=airt;
 mesh.healthBG.quaternion.copy(camera.quaternion);mesh.health.quaternion.copy(camera.quaternion);
 mesh.helm.rotation.y+=dt*.4;
 }}
function updatePreview(){if(!aim||aim.skill==='U3'){reticle.visible=!!(aim&&aim.skill==='U3');aimLine.visible=false;if(aim){reticle.position.set(game.player.pos.x,.03,game.player.pos.z);reticle.scale.setScalar(RULES.U3.radius);}return;}
 const plan=resolveAim(aim.skill,aim.dx,aim.dy),p=game.player.pos;reticle.visible=true;
 if(aim.skill==='U2'&&!game.canRecast){reticle.position.set(plan.destination.x,.035,plan.destination.z);reticle.scale.setScalar(RULES.U2.radius);aimLine.visible=true;
 }else{reticle.position.set(p.x+plan.dir.x*RULES.U1.range,.035,p.z+plan.dir.z*RULES.U1.range);reticle.scale.setScalar(.6);aimLine.visible=true;}
 const end=plan.destination||{x:p.x+plan.dir.x*RULES.U1.range,z:p.z+plan.dir.z*RULES.U1.range};const dx=end.x-p.x,dz=end.z-p.z,len=Math.hypot(dx,dz);
 aimLine.scale.set(.46,len,1);aimLine.position.set(p.x+dx*.5,.028,p.z+dz*.5);aimLine.rotation.z=Math.atan2(-dz,dx)-Math.PI/2;}
function updateUi(dt){const p=game.player;for(const [k,v,max] of [['hp',p.hp,p.maxHp],['mp',p.mp,p.maxMp],['sta',p.stamina,p.maxStamina]]){$(k).style.width=(v/max*100)+'%';$(k+'text').textContent=Math.round(v)+'/'+max;}
 for(const b of document.querySelectorAll('.skill')){const s=b.dataset.skill,remaining=game.available[s],recast=(s==='U2'&&game.canRecast);b.classList.toggle('oncd',remaining>.01&&!recast);b.querySelector('.cool').textContent=remaining.toFixed(1)+'s';b.querySelector('.name').textContent=recast?'U2 · RECAST/ECO':s==='U1'?'U1 · PRISMA':s==='U2'?'U2 · RUPTURA':'U3 · TEMPESTAD';}
 $('fps').textContent=String(Math.round(1/Math.max(.001,dt)))+' FPS';if(performance.now()>Number($('toast').dataset.expires||0))$('toast').classList.remove('visible');}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
let last=performance.now();function frame(now){const dt=Math.min(.055,Math.max(.001,(now-last)/1000));last=now;
 if(!paused){if(joyId!==null){const dir=screenVec(joyAxis.x,joyAxis.z);if(dir){const mag=Math.min(1,Math.hypot(joyAxis.x,joyAxis.z));game.movePlayer({x:dir.x*mag,z:dir.z*mag},dt);}}
 game.step(dt);events3d();runFX(dt);updateProjectiles();}
 camera.position.set(game.player.pos.x+Math.sin(camAngle)*camDistance,camHeight,game.player.pos.z+Math.cos(camAngle)*camDistance);camera.lookAt(game.player.pos.x,1.45,game.player.pos.z);
 updateActors(paused?0:dt);updatePreview();updateUi(dt);renderer.render(scene,camera);requestAnimationFrame(frame);}
requestAnimationFrame(frame);void loadRig();
window.__HIGHFLY_UNIQUE_R02_QA=Object.freeze({snapshot:()=>game.snapshot(),rig:()=>({loaded:rigReady,clips:rigClips.map(c=>c.name),scale:rigScale,source:'warrior_modular.glb'}),version:LAB_VERSION});
