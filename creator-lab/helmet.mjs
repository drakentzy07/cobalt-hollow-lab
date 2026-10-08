import * as THREE from 'three';

// HIGHFLY original avian-helmet forge. Coordinates: authentic M_Head bind frame.
// No synthetic skeleton, no donor character, and no mutations to base GLB.
export const HELMET_PARTS=Object.freeze({
 shell:{name:'01 · Carcasa',color:'#161b29',metal:.64,rough:.48},
 mask:{name:'02 · Máscara facial',color:'#191d2a',metal:.66,rough:.52},
 beak:{name:'03 · Pico marfil',color:'#c2b7a3',metal:.62,rough:.40},
 visor:{name:'04 · Visor violeta',color:'#4f17d2',metal:.12,rough:.24,emissive:1.2},
 trim:{name:'05 · Bordes marfil',color:'#b8a992',metal:.75,rough:.39},
 cheeks:{name:'06 · Mejillas',color:'#323b50',metal:.70,rough:.34},
 crest:{name:'07 · Penacho plumado',color:'#2b2240',metal:.31,rough:.62},
 nape:{name:'08 · Plumaje de nuca',color:'#3e295d',metal:.30,rough:.63},
 gem:{name:'09 · Cristal frontal',color:'#a46aff',metal:.3,rough:.15,emissive:1.2}
});
const clamp=(v,min,max,fallback)=>Number.isFinite(+v)?Math.min(max,Math.max(min,+v)):fallback;
export function normalizeHelmet(input={}){
 const src=input&&typeof input==='object'?input:{};
 const colors={};
 for(const [key,def] of Object.entries(HELMET_PARTS)){
   const c=src.colors?.[key];
   colors[key]=typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c)?c:def.color;
 }
 return {enabled:src.enabled!==false,beak:clamp(src.beak,.7,1.4,1.06),
 crest:clamp(src.crest,.5,1.65,1.10),glow:clamp(src.glow,0,2,.90),eyeOffset:clamp(src.eyeOffset,-.35,.35,0),
 colors};
}
const face=(verts,triangles,mat,name,part)=>{
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts.flat(),3));
 geo.setIndex(triangles.flat());geo.computeVertexNormals();
 const obj=new THREE.Mesh(geo,mat);obj.name='HIGHFLY_Avian_'+name;
 obj.userData.creatorHelmetPart=part;obj.castShadow=true;obj.receiveShadow=true;return obj;
};
const material=(part,options)=>{
 const d=HELMET_PARTS[part],c=options.colors[part];
 return new THREE.MeshStandardMaterial({
  color:c,metalness:d.metal,roughness:d.rough,flatShading:false,
  emissive:d.emissive?new THREE.Color(c):new THREE.Color('#000000'),
  emissiveIntensity:(d.emissive||0)*options.glow,
  side:THREE.DoubleSide
 });
};
function ribbonSurface(points,widths,mat,name,part,thickness=.013){
 // Curved, smoothly interpolated three-rail metal/feather shape with raised spine.
 const curve=new THREE.CatmullRomCurve3(points,false,'centripetal'),v=[],idx=[],steps=18;
 for(let j=0;j<=steps;j++){
   const t=j/steps,c=curve.getPoint(t),tan=curve.getTangent(t).normalize();
   let n=new THREE.Vector3(0,1,0).cross(tan).normalize();
   if(n.lengthSq()<.05)n.set(1,0,0);
   const w=(widths[0]*(1-t)+widths[1]*t)*Math.pow(Math.sin(Math.PI*Math.max(.001,Math.min(.999,t))),.68);
   for(let k=0;k<3;k++){const u=k-1,p=c.clone().addScaledVector(n,u*w);
     p.z-=k===1?w*.22:0;v.push(p.toArray());
   }
 }
 for(let i=0;i<steps;i++)for(let k=0;k<2;k++){
   const a=i*3+k,b=a+1,c=a+3,d=c+1;idx.push(a,c,b,b,c,d)
 }
 const len=v.length/3;
 for(let i=0;i<len;i++)v.push([v[i][0],v[i][1],v[i][2]-thickness]);
 const count=idx.length;for(let i=0;i<count;i+=3)idx.push(idx[i+2]+len,idx[i+1]+len,idx[i]+len);
 for(let j=0;j<steps;j++)for(const k of [0,2]){
   let a=j*3+k,b=a+3; if(k===0)idx.push(a,b,a+len,b,b+len,a+len);
   else idx.push(a,a+len,b,b,a+len,b+len);
 }
 for(let k=0;k<2;k++){idx.push(k,k+len,k+1,k+1,k+len,k+1+len);
   const a=steps*3+k;idx.push(a,a+1,a+len,a+1,a+1+len,a+len)
 }
 return face(v,idx,mat,name,part);
}
function shellBands(c,w,h,d,mat,part='shell'){
 const rings=[
  [-.56,.27,.27],[-.46,.39,.40],[-.27,.47,.49],[.02,.51,.53],[.33,.49,.50],[.51,.39,.38],[.62,.18,.18],[.65,.025,.032]
 ];
 const sectors=24,v=[],idx=[];
 rings.forEach(([y,rx,rz])=>{
  for(let i=0;i<sectors;i++){
    const a=i*2*Math.PI/sectors;
    v.push([c.x+w*rx*Math.cos(a),c.y+h*y,c.z+d*rz*Math.sin(a)])
  }
 });
 for(let j=0;j<rings.length-1;j++)for(let k=0;k<sectors;k++){
   const a=j*sectors+k,b=j*sectors+(k+1)%sectors,lo=a+sectors,hi=b+sectors;
   idx.push(a,b,lo,b,hi,lo);
 }
 for(let k=1;k<sectors-1;k++){idx.push(0,k+1,k);const end=(rings.length-1)*sectors;idx.push(end,end+k,end+k+1)}
 return face(v,idx,mat,'ForgedShell',part);
}
function crescentBand(c,w,h,d,atY,halfAngle,radY,radZ,mat,name,part){
 const seg=32,verts=[],idx=[];
 for(let row=0;row<3;row++){
  const yy=atY+row*radY;
  for(let k=0;k<=seg;k++){
   const theta=-halfAngle+2*halfAngle*k/seg;
   verts.push([c.x+w*.58*Math.sin(theta),c.y+h*yy,c.z+d*(radZ-row*.009)*Math.cos(theta)])
  }
 }
 for(let row=0;row<2;row++)for(let k=0;k<seg;k++){
  const a=row*(seg+1)+k,b=a+1,cx=a+seg+1,dd=cx+1;idx.push(a,cx,b,b,cx,dd);
 }
 return face(verts,idx,mat,name,part);
}
function beakForge(c,w,h,d,mat,lengthFactor){
 // Tapered and hooked central ridge built from smooth Catmull-Rom cross sections.
 const L=lengthFactor,centerline=new THREE.CatmullRomCurve3([
  new THREE.Vector3(c.x,c.y+h*.09,c.z+d*.53),
  new THREE.Vector3(c.x,c.y+h*.01,c.z+d*.66),
  new THREE.Vector3(c.x,c.y-h*.10,c.z+d*(.76+L*.07)),
  new THREE.Vector3(c.x,c.y-h*.24,c.z+d*(.83+L*.10)),
  new THREE.Vector3(c.x,c.y-h*.30,c.z+d*(.86+L*.12))
 ],false,'centripetal');
 const rings=24,seg=12,v=[],idx=[];
 for(let i=0;i<=rings;i++){
  const t=i/rings,p=centerline.getPoint(t);
  const width=w*.145*Math.pow(1-t,.86)+w*.004;
  const height=h*.12*Math.pow(1-t,.66)+h*.005;
  for(let j=0;j<seg;j++){
    const a=2*Math.PI*j/seg,ny=Math.sin(a),nx=Math.cos(a);
    v.push([p.x+width*nx,p.y+height*ny,p.z+height*.14*(1-nx*nx)])
  }
 }
 for(let i=0;i<rings;i++)for(let j=0;j<seg;j++){
  const a=i*seg+j,b=i*seg+(j+1)%seg,cx=a+seg,dd=b+seg;idx.push(a,cx,b,b,cx,dd)
 }
 for(let j=1;j<seg-1;j++)idx.push(0,j,j+1);
 const last=rings*seg;for(let j=1;j<seg-1;j++)idx.push(last,last+j+1,last+j);
 return face(v,idx,mat,'CurvedAvianBeak','beak');
}
function visorShape(c,w,h,d,side,mat){
 const s=side,x=c.x,yy=c.y,zz=c.z;
 const v=[
 [x+s*w*.165,yy+h*.17,zz+d*.555],
 [x+s*w*.42,yy+h*.21,zz+d*.477],
 [x+s*w*.36,yy+h*.125,zz+d*.522],
 [x+s*w*.215,yy+h*.11,zz+d*.578],
 [x+s*w*.18,yy+h*.14,zz+d*.575]
 ];
 return face(v,[[0,1,2],[0,2,3],[0,3,4]],mat,side<0?'EyeLeft':'EyeRight','visor');
}

function faceFeatherChevron(c,w,h,d,mat){
 return face([
  [c.x,c.y+h*.34,c.z+d*.535],[c.x-w*.22,c.y+h*.43,c.z+d*.43],
  [c.x-w*.35,c.y+h*.32,c.z+d*.37],[c.x,c.y+h*.18,c.z+d*.58],
  [c.x+w*.35,c.y+h*.32,c.z+d*.37],[c.x+w*.22,c.y+h*.43,c.z+d*.43]
 ],[[0,1,2],[0,2,3],[0,3,4],[0,4,5]],mat,'ForeheadAvianChevron','trim');
}
function eyeSocket(c,w,h,d,side,mat){
 const x=c.x,y=c.y,z=c.z,s=side;
 return face([
  [x+s*w*.115,y+h*.22,z+d*.55],[x+s*w*.47,y+h*.265,z+d*.42],
  [x+s*w*.48,y+h*.070,z+d*.47],[x+s*w*.21,y+h*.055,z+d*.578]
 ],[[0,1,2],[0,2,3]],mat,'RecessedSocket_'+(s<0?'L':'R'),'mask');
}
function templePlumage(c,w,h,d,side,row,mat){
 const s=side;
 const start=new THREE.Vector3(c.x+s*w*(.39+row*.018),c.y+h*(.37-row*.125),c.z+d*(.25-row*.030));
 const middle=new THREE.Vector3(c.x+s*w*(.50+row*.015),c.y+h*(.25-row*.12),c.z-d*(.14+row*.025));
 const tip=new THREE.Vector3(c.x+s*w*(.43+row*.025),c.y+h*(.10-row*.12),c.z-d*(.44+row*.04));
 return ribbonSurface([start,middle,tip],[w*.122,w*.008],mat,'TempleFeather_'+(s<0?'L':'R')+'_'+row,'nape',w*.012);
}
function tipQuill(c,w,h,d,side,layer,kind,mat,part,factor=1){
 const s=side,back=kind==='crest';
 const start=back
  ?new THREE.Vector3(c.x+s*w*(.07+layer*.065),c.y+h*(.43-layer*.035),c.z-d*(.10+layer*.062))
  :new THREE.Vector3(c.x+s*w*(.34+layer*.018),c.y+h*(.15-layer*.084),c.z-d*(.13+layer*.078));
 const dst=back
  ?new THREE.Vector3(c.x+s*w*(.20+layer*.10),c.y+h*(.70-layer*.01),c.z-d*(.43+layer*.060))
  :new THREE.Vector3(c.x+s*w*(.43+layer*.055),c.y-h*(.08+layer*.10),c.z-d*(.52+layer*.06));
 dst.sub(start).multiplyScalar(factor).add(start);
 const middle=start.clone().lerp(dst,.43).add(new THREE.Vector3(s*w*.04,h*.12,0));
 return ribbonSurface([start,middle,dst],[w*(back?.12:.125),w*.006],mat,(back?'Crest':'CheekFeather')+'_'+(s<0?'L':'R')+'_'+layer,part,w*.011);
}
function makeGem(c,w,h,d,mat,name){
 const g=new THREE.OctahedronGeometry(1,0),m=new THREE.Mesh(g,mat);
 m.name=name;m.userData.creatorHelmetPart='gem';
 m.position.set(c.x,c.y+h*.43,c.z+d*.485);
 m.scale.set(w*.075,h*.13,d*.054);m.rotation.z=Math.PI/4;m.rotation.y=.25;m.castShadow=true;
 return m;
}
export function buildLegendaryHelmet(bounds,input,landmarks=null){
 const options=normalizeHelmet(input);const root=new THREE.Group();root.name='HIGHFLY_LEGENDARY_AVIAN_HELMET';
 root.userData.hfAttachBone='head';root.userData.rig='Rig_Medium';root.userData.nonSkinnedRigidHeadwear=true;
 if(!options.enabled)return root;
 const c=bounds.center,w=bounds.size.x,h=bounds.size.y,d=bounds.size.z;
 if(![w,h,d,c.x,c.y,c.z].every(Number.isFinite)||Math.min(w,h,d)<.02)throw Error('Native M_Head bind dimensions invalid');
 const mats=Object.fromEntries(Object.keys(HELMET_PARTS).map(k=>[k,material(k,options)]));
 // Align visor and brow to REAL M_Eye_almond in Rig_Medium head bind coordinates.
 const eyeDelta=landmarks?.verified
    ?THREE.MathUtils.clamp(landmarks.eyeY-(c.y+h*.17),-h*.35,h*.35)+options.eyeOffset*h
    :options.eyeOffset*h;
 root.userData.facialAlignment={
   verified:landmarks?.verified===true,offset:eyeDelta,
   nativeY:landmarks?.eyeY??null,absoluteVisorY:c.y+h*.17+eyeDelta
 };
 const add=(o)=>{root.add(o);return o};
 add(shellBands(c,w,h,d,mats.shell));
 add(faceFeatherChevron(c,w,h,d,mats.trim));
 add(crescentBand(c,w,h,d,-.30,.90,.115,.54,mats.mask,'LowerMask','mask'));
 // Replaced the wide horizontal forehead band with a subtle V-chevron.
 add(crescentBand(c,w,h,d,-.38,.82,.025,.535,mats.trim,'ChinEdge','trim'));
 add(beakForge(c,w,h,d,mats.beak,options.beak));
 add(makeGem(c,w,h,d,mats.gem,'HIGHFLY_Avian_ForeheadCrystal'));
 for(const side of [-1,1]){
   const socket=eyeSocket(c,w,h,d,side,mats.mask);socket.position.y+=eyeDelta;add(socket);
   const visor=visorShape(c,w,h,d,side,mats.visor);visor.position.y+=eyeDelta;add(visor);
   for(let row=0;row<5;row++)add(templePlumage(c,w,h,d,side,row,row%2?mats.crest:mats.nape));
   const browGuard=ribbonSurface([
     new THREE.Vector3(c.x+side*w*.13,c.y+h*.22,c.z+d*.55),
     new THREE.Vector3(c.x+side*w*.32,c.y+h*.25,c.z+d*.515),
     new THREE.Vector3(c.x+side*w*.46,c.y+h*.20,c.z+d*.35)
   ],[w*.026,w*.006],mats.trim,side<0?'LeftIvoryBrow':'RightIvoryBrow','trim');
   browGuard.position.y+=eyeDelta;add(browGuard);
   add(ribbonSurface([
     new THREE.Vector3(c.x+side*w*.40,c.y-h*.13,c.z+d*.35),
     new THREE.Vector3(c.x+side*w*.50,c.y-h*.33,c.z+d*.08),
     new THREE.Vector3(c.x+side*w*.39,c.y-h*.49,c.z-d*.18)
   ],[w*.09,w*.008],mats.cheeks,'CheekArmor_'+side,'cheeks'));
   for(let layer=0;layer<5;layer++)add(tipQuill(c,w,h,d,side,layer,'crest',mats.crest,'crest',options.crest));
   for(let layer=0;layer<5;layer++)add(tipQuill(c,w,h,d,side,layer,'nape',mats.nape,'nape'));
 }
 const points=[
  new THREE.Vector3(c.x,c.y-h*.30,c.z+d*.545),
  new THREE.Vector3(c.x,c.y-h*.33,c.z+d*.61),
  new THREE.Vector3(c.x,c.y-h*.26,c.z+d*.69)
 ];
 add(ribbonSurface(points,[w*.035,w*.008],mats.trim,'BeakSeam','trim'));
 root.userData.helmetParts=Object.keys(HELMET_PARTS);
 root.userData.sourceHead='M_Head';
 root.userData.kind='original_HIGHFLY_legendary';
 return root;
}
