/**
 * HIGHFLY G1 EXPLORATION QA ONLY.
 * NOT an alternate MMORPG engine: scene controller, input/raycast only, NO SIM,
 * combat, stat or persistent save writes. Real game reuses the authoritative Sim.
 * The synthetic calibration plaza is opt-in and prominently labelled.
 */
import * as THREE from 'three';
import { createG01Hunter, deriveG01Stats } from './g01_core';
import { resolveFreedom360 } from '../combat/freedom_360';
import { mountG01World } from './g01_world_mount';
import { unityG01Position, type G01WorldManifest } from './g01_manifest';

type QAState = {
  mode: 'loading' | 'ready' | 'rgpoly' | 'calibration' | 'blocked';
  position: { x: number; y: number; z: number };
  frame: number;
  collisionChecks: number;
  inputReady: boolean;
  realMapLoaded: boolean;
};
declare global { interface Window { __highflyG1?: QAState } }
const cvs = document.querySelector<HTMLCanvasElement>('#viewport')!;
const modeElement = document.querySelector<HTMLElement>('#mode')!;
const status = document.querySelector<HTMLElement>('#status')!;
const diagButton = document.querySelector<HTMLButtonElement>('#diag-btn')!;
const entry = document.querySelector<HTMLElement>('#entry')!;
const enterWorld = document.querySelector<HTMLButtonElement>('#enter-world')!;
const pad = document.querySelector<HTMLElement>('#pad')!;
const stickThumb = document.querySelector<HTMLElement>('#stick')!;
const look = document.querySelector<HTMLElement>('#look')!;
const jump = document.querySelector<HTMLButtonElement>('#jump')!;
const dash = document.querySelector<HTMLButtonElement>('#dash')!;
const stats = document.querySelector<HTMLElement>('#stats')!;
const hunterProfile = createG01Hunter('g1-preview-only', 'Hunter de pruebas', 'male');
const statValues = deriveG01Stats(hunterProfile);
stats.textContent = Object.entries(statValues).map(([k, v]) => k + ' ' + v).join(' · ');
const state: QAState = {
  mode: 'loading',position: { x: 0, y: 0, z: 0 },
  frame: 0,collisionChecks: 0,inputReady: false,realMapLoaded: false,
};
window.__highflyG1 = state;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#94bac7');
scene.fog = new THREE.Fog('#94bac7', 90, 240);
const cam = new THREE.PerspectiveCamera(62, 2, 0.1, 450);
const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
scene.add(new THREE.HemisphereLight(0xd8edff, 0x56794d, 2.4));
const sun = new THREE.DirectionalLight(0xffecd1, 2.8);
sun.position.set(-32, 70, 24);
scene.add(sun);

const avatar = new THREE.Group();
avatar.name = 'HUNTER_VISUAL_PROXY_KAYKIT_PENDING';
const mantle = new THREE.Mesh(new THREE.CapsuleGeometry(.44, 1.05, 4, 9),new THREE.MeshStandardMaterial({color:0x31647b, roughness:0.75}));
mantle.position.y = 1.14;
avatar.add(mantle);
const hood = new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),new THREE.MeshStandardMaterial({color:0x24384a,roughness:.95}));
hood.position.y = 2.0;avatar.add(hood);
const forwardMarker = new THREE.Mesh(new THREE.ConeGeometry(.12,.36,5),new THREE.MeshStandardMaterial({color:0xf0ad5a}));
forwardMarker.rotation.x=Math.PI/2;forwardMarker.position.set(0,1.2,.49);avatar.add(forwardMarker);
scene.add(avatar);

const player = { x: 0, y: 0, z: 0, vy: 0, groundY: 0, jumps: 0, dashUntil: 0 };
let yaw = 0, pitch = 0.32, last = performance.now(), frame = 0;
const move = { x:0, y:0 }, pressed = new Set<string>();
let padPointer:number|null=null, lookPointer:number|null=null, prevLookX=0, prevLookY=0;
let activeWorld: THREE.Group|null=null;
let sourceManifest:G01WorldManifest|null=null;
const raycaster = new THREE.Raycaster();
const groundLine = new THREE.Vector3();
const blockers:THREE.Box3[]=[];
function makeMesh(size:[number,number,number],color:number){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:.92}));
  return mesh;
}
function diagnosticPlaza(){
  scene.background = new THREE.Color('#84b9ce');
  const ground=makeMesh([100,1,100],0x6a9a68);ground.position.y=-.5;scene.add(ground);
  const road=makeMesh([8,.045,90],0xaa9479);road.position.y=.018;scene.add(road);
  for (let i=0;i<8;i++){
    const z=-34+i*9;
    for(const side of [-1,1]){
      const house=makeMesh([5,4.5,5],i%2?0xc49a74:0xdac8a6);
      house.position.set(side*12,2.25,z);scene.add(house);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(4.4,2.6,4),new THREE.MeshStandardMaterial({color:0x835448,roughness:1}));
      roof.rotation.y=Math.PI/4;roof.position.set(side*12,5.6,z);scene.add(roof);
      blockers.push(new THREE.Box3().setFromObject(house));
    }
  }
  const tower=makeMesh([6,11,6],0x9d9587);tower.position.set(0,5.5,39);scene.add(tower);
  blockers.push(new THREE.Box3().setFromObject(tower));
  player.x=0;player.y=0;player.z=-39;player.groundY=0;
  sourceManifest=null;activeWorld=null;
  state.mode='calibration';
  modeElement.textContent='PLAZA TÉCNICA · no es RG Poly · sin guardado';
  status.textContent='Plaza técnica activa: joystick, cámara, salto, dash y colisiones de prueba.';
  status.style.display='none';
  document.body.classList.add('playing');
}
function computeSourceBounds(manifest:G01WorldManifest){
  blockers.length=0;
  for(const c of manifest.colliders) {
    const s=c.unityWorldBoundsSize;
    const p=unityG01Position(c.unityWorldBoundsCenter);
    if(Math.min(s.x,s.y,s.z)<=.01 || s.x>25 || s.z>25 || s.y<.5)continue;
    blockers.push(new THREE.Box3(
      new THREE.Vector3(p.x-s.x/2,p.y-s.y/2,p.z-s.z/2),
      new THREE.Vector3(p.x+s.x/2,p.y+s.y/2,p.z+s.z/2),
    ));
  }
}
function beginWorld(root:THREE.Group,manifest:G01WorldManifest,spawn:THREE.Vector3){
  activeWorld=root;sourceManifest=manifest;
  computeSourceBounds(manifest);
  player.x=spawn.x;player.z=spawn.z;player.y=spawn.y;player.groundY=spawn.y;
  state.mode='ready';state.realMapLoaded=true;
  modeElement.textContent='RG Poly cargado · Presioná ENTRAR A LA CIUDAD';
  status.style.display='none';
  entry.classList.add('ready');
}
function mapGroundHeight(x:number,z:number,fromY:number){
  if(!activeWorld)return 0;
  groundLine.set(x,fromY+4,z);
  raycaster.set(groundLine,new THREE.Vector3(0,-1,0));raycaster.far=12;
  const hits=raycaster.intersectObject(activeWorld,true);
  for(const hit of hits)if(hit.face?.normal && hit.point.y<=fromY+3 && hit.point.y>=fromY-8)return hit.point.y;
  return fromY;
}
function collides(x:number,z:number,y:number){
  state.collisionChecks++;
  const sphere={radius:.4,height:1.75};
  return blockers.some(b=>
    y+1.2 > b.min.y && y+.15 < b.max.y &&
    x > b.min.x-sphere.radius && x < b.max.x+sphere.radius &&
    z > b.min.z-sphere.radius && z < b.max.z+sphere.radius
  );
}
function reposition(dt:number,now:number){
  const horiz=(pressed.has('KeyD')||pressed.has('ArrowRight')?1:0)-(pressed.has('KeyA')||pressed.has('ArrowLeft')?1:0);
  const vert=(pressed.has('KeyS')||pressed.has('ArrowDown')?1:0)-(pressed.has('KeyW')||pressed.has('ArrowUp')?1:0);
  const stick={x:Math.max(-1,Math.min(1,move.x+horiz)),y:Math.max(-1,Math.min(1,move.y+vert))};
  const intent=resolveFreedom360(stick,yaw);
  if(intent){
    const speed=(now<player.dashUntil?14:5)*intent.analog;
    const deltaX=intent.worldX*speed*dt;
    const deltaZ=intent.worldZ*speed*dt;
    if(!collides(player.x+deltaX,player.z,player.y)) player.x+=deltaX;
    if(!collides(player.x,player.z+deltaZ,player.y)) player.z+=deltaZ;
    avatar.rotation.y=intent.facing;
  }
  const candidateGround=mapGroundHeight(player.x,player.z,player.y);
  const nearFloor=player.y <= candidateGround+.06 && player.vy<=0;
  if(nearFloor){
    player.groundY=candidateGround;player.y=candidateGround;player.vy=0;player.jumps=0;
  }else{
    player.vy=Math.max(-20,player.vy-22*dt);
    player.y+=player.vy*dt;
    if(player.y<candidateGround){player.y=candidateGround;player.vy=0;player.jumps=0;}
  }
  avatar.position.set(player.x,player.y,player.z);
  const distance=5.6;
  const follow=new THREE.Vector3(player.x-Math.sin(yaw)*Math.cos(pitch)*distance,
    player.y+2+Math.sin(pitch)*distance,
    player.z-Math.cos(yaw)*Math.cos(pitch)*distance);
  cam.position.lerp(follow,Math.min(1,dt*11));
  cam.lookAt(player.x,player.y+1.45,player.z);
  state.position={x:+player.x.toFixed(2),y:+player.y.toFixed(2),z:+player.z.toFixed(2)};
}
function jumpNow(){
  if(!document.body.classList.contains('playing'))return;
  if(player.jumps>=2)return;
  player.vy=player.jumps===0?8.1:7.0;player.jumps++;
}
function dashNow(){if(document.body.classList.contains('playing')) player.dashUntil=performance.now()+230;}
function animate(now:number){
  const dt=Math.min(.045,Math.max(0,(now-last)/1000));last=now;
  const w=window.innerWidth,h=window.innerHeight;
  if(cvs.width!==Math.round(w*renderer.getPixelRatio())||cvs.height!==Math.round(h*renderer.getPixelRatio())){
    renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
  }
  if(state.mode==='rgpoly'||state.mode==='calibration')reposition(dt,now);
  renderer.render(scene,cam);
  state.frame=++frame;requestAnimationFrame(animate);
}
function padUpdate(e:PointerEvent){
  const b=pad.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
  const dx=e.clientX-cx,dy=e.clientY-cy,dist=Math.hypot(dx,dy),rad=45,scale=dist>rad?rad/dist:1;
  const px=dx*scale,py=dy*scale;
  move.x=px/rad;move.y=py/rad;
  stickThumb.style.transform='translate('+px+'px,'+py+'px)';
}
pad.addEventListener('pointerdown',e=>{e.preventDefault();padPointer=e.pointerId;pad.setPointerCapture(e.pointerId);padUpdate(e);});
pad.addEventListener('pointermove',e=>{if(e.pointerId===padPointer)padUpdate(e);});
function resetStick(e:PointerEvent){if(e.pointerId!==padPointer)return;padPointer=null;move.x=move.y=0;stickThumb.style.transform='translate(0,0)';}
pad.addEventListener('pointerup',resetStick);pad.addEventListener('pointercancel',resetStick);
look.addEventListener('pointerdown',e=>{e.preventDefault();lookPointer=e.pointerId;look.setPointerCapture(e.pointerId);prevLookX=e.clientX;prevLookY=e.clientY;});
look.addEventListener('pointermove',e=>{
  if(e.pointerId!==lookPointer)return;
  const dx=e.clientX-prevLookX,dy=e.clientY-prevLookY;prevLookX=e.clientX;prevLookY=e.clientY;
  yaw-=dx*.006; pitch=THREE.MathUtils.clamp(pitch+dy*.004,-.22,1.10);
});
const releaseLook=(e:PointerEvent)=>{if(e.pointerId===lookPointer)lookPointer=null;};
look.addEventListener('pointerup',releaseLook);look.addEventListener('pointercancel',releaseLook);
jump.addEventListener('pointerdown',e=>{e.preventDefault();jumpNow();});
dash.addEventListener('pointerdown',e=>{e.preventDefault();dashNow();});
window.addEventListener('keydown',e=>{pressed.add(e.code);if(e.code==='Space'&&!e.repeat){e.preventDefault();jumpNow();}if(e.code.startsWith('Shift'))dashNow();});
window.addEventListener('keyup',e=>pressed.delete(e.code));
diagButton.addEventListener('click',diagnosticPlaza);
enterWorld.addEventListener('click', () => {
  if (state.mode !== 'ready' || !activeWorld || !sourceManifest) return;
  entry.classList.remove('ready');
  state.mode='rgpoly';
  modeElement.textContent='RG Poly CIUDAD REAL · G1 exploración experimental';
  document.body.classList.add('playing');
  void screen.orientation?.lock?.('landscape').catch(() => undefined);
});
state.inputReady=true;
const base=import.meta.env.BASE_URL;
void mountG01World(scene,base).then(world=>{
  beginWorld(world.visual,world.manifest,world.hunterSpawn);
}).catch(err=>{
  state.mode='blocked';
  status.innerHTML='El mapa auténtico RG Poly todavía no está exportado. La app principal no fue modificada. <small>Podés probar controles en una plaza temporal, sin guardados.</small><div id="error-msg"></div>';
  const errorEl=document.querySelector<HTMLElement>('#error-msg')!;
  errorEl.textContent=err instanceof Error?err.message:'GLB no disponible';
  errorEl.style.cssText='font-size:10px;color:#e5b3a3;margin-top:5px;overflow-wrap:anywhere';
  status.appendChild(diagButton.parentElement!);
  diagButton.style.display='inline-block';
});
requestAnimationFrame(animate);
