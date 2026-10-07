// HIGHFLY · CABALLERO CUERVO. Original rig-attached helmet sculpt.
// Input is the native Rig_Medium head BIND-FRAME reference, not a proxy character.
// One rigid wearable is legal at the head joint; the source GLB is never rewritten.
import * as THREE from 'three';

const metal=(color,roughness=.34,metalness=.73,emissive=0x000000,emissiveIntensity=0)=>
  new THREE.MeshStandardMaterial({color,roughness,metalness,flatShading:true,side:THREE.DoubleSide,emissive,emissiveIntensity});

function surface(name,vertices,triangles,material){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));
  g.setIndex(triangles.flat());
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,material);m.name='Armor_HF_Corvus_'+name;
  m.castShadow=true;m.receiveShadow=true;return m;
}

function closedLoft(name,rings,radial,material){
  const verts=[],faces=[];
  for(const r of rings)for(let i=0;i<radial;i++){
    const a=2*Math.PI*i/radial;
    verts.push([r.cx+Math.cos(a)*r.rx,r.y,r.cz+Math.sin(a)*r.rz]);
  }
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<radial;i++){
    const a=j*radial+i,b=j*radial+(i+1)%radial,c=(j+1)*radial+(i+1)%radial,d=(j+1)*radial+i;
    faces.push([a,b,d],[b,c,d]);
  }
  for(let i=1;i<radial-1;i++)faces.push([0,i+1,i]);
  const last=(rings.length-1)*radial;
  for(let i=1;i<radial-1;i++)faces.push([last,last+i,last+i+1]);
  return surface(name,verts,faces,material);
}

function prism(name,polygon,thickness,material){
  // Polygon consists of 3D points in the native head bone frame.
  const n=polygon.length,verts=[...polygon,...polygon.map(p=>[p[0],p[1],p[2]+thickness])],faces=[];
  for(let i=1;i<n-1;i++){faces.push([0,i,i+1],[n,n+i+1,n+i]);}
  for(let i=0;i<n;i++){const j=(i+1)%n;faces.push([i,j,n+j],[i,n+j,n+i]);}
  return surface(name,verts,faces,material);
}

function beak(name,cx,cy,cz,w,h,d,mat){
  // Hand-shaped segmented, down-swept armoured beak: not a cone/primitive.
  const sections=[
    {z:cz+.40*d,width:.39*w,top:cy+.18*h,bottom:cy-.15*h},
    {z:cz+.63*d,width:.32*w,top:cy+.09*h,bottom:cy-.28*h},
    {z:cz+.95*d,width:.23*w,top:cy-.07*h,bottom:cy-.34*h},
    {z:cz+1.20*d,width:.11*w,top:cy-.19*h,bottom:cy-.31*h}
  ];
  const v=[],f=[];
  for(const s of sections)v.push([cx-s.width,s.top,s.z],[cx+s.width,s.top,s.z],[cx+s.width*.72,s.bottom,s.z],[cx-s.width*.72,s.bottom,s.z]);
  for(let j=0;j<sections.length-1;j++)for(let i=0;i<4;i++){
    const a=4*j+i,b=4*j+(i+1)%4,c=4*(j+1)+(i+1)%4,dv=4*(j+1)+i;
    f.push([a,b,dv],[b,c,dv]);
  }
  f.push([0,3,2],[0,2,1]);const k=4*(sections.length-1);f.push([k,k+1,k+2],[k,k+2,k+3]);
  return surface(name,v,f,mat);
}

// Builds an original crow-knight silhouette around the actual head reference.
// Caller parents the returned group directly to the REAL 'head' bone, root identity.
export function buildCorvusHelmet(refScene){
  const b=new THREE.Box3();let found=0;
  refScene.updateMatrixWorld(true);
  refScene.traverse(o=>{
    if(!o.isMesh)return;
    const n=String(o.name||'');
    if(n==='M_Head'||n.startsWith('M_Head_')){b.expandByObject(o,true);found++;}
  });
  if(!found||b.isEmpty())throw new Error('Real M_Head bind reference not found');
  const dims=new THREE.Vector3(),ctr=new THREE.Vector3();b.getSize(dims);b.getCenter(ctr);
  if(![dims.x,dims.y,dims.z].every(v=>Number.isFinite(v)&&v>0.025))throw new Error('Invalid native M_Head bounds');
  const w=dims.x,h=dims.y,d=dims.z,cx=ctr.x,cy=ctr.y,cz=ctr.z;
  const root=new THREE.Group();root.name='HF_CORVUS_RIGID_HEAD';root.userData.bindReference='head';
  const graphite=metal(0x161922,.43,.76),crown=metal(0x222937,.38,.79),steel=metal(0x71808f,.30,.86);
  const horn=metal(0x303744,.34,.68),violet=metal(0x604eaa,.24,.56,0x4d2aa6,.36);
  const shadow=metal(0x080b13,.67,.28),seam=metal(0x9eabb8,.31,.83);
  const add=m=>{root.add(m);return m};
  add(closedLoft('HelmetShell',[
    {cx,cz,y:cy-.48*h,rx:.38*w,rz:.37*d},
    {cx,cz,y:cy-.32*h,rx:.56*w,rz:.50*d},
    {cx,cz,y:cy+.04*h,rx:.62*w,rz:.56*d},
    {cx,cz,y:cy+.36*h,rx:.56*w,rz:.52*d},
    {cx,cz,y:cy+.56*h,rx:.36*w,rz:.36*d},
    {cx,cz,y:cy+.67*h,rx:.055*w,rz:.09*d}
  ],14,graphite));
  // A shielded brow and separately sculpted steel beak make the bird silhouette readable.
  add(beak('ForgedBeak',cx,cy,cz,w,h,d,horn));
  for(const s of [-1,1]){
    const eye=prism('Eye_'+(s<0?'L':'R'),[
      [cx+s*.10*w,cy+.22*h,cz+.57*d],
      [cx+s*.46*w,cy+.29*h,cz+.42*d],
      [cx+s*.36*w,cy+.05*h,cz+.50*d],
      [cx+s*.18*w,cy+.08*h,cz+.60*d]
    ],.012*d,violet);
    add(eye);
    add(prism('Brow_'+(s<0?'L':'R'),[
      [cx+s*.08*w,cy+.30*h,cz+.59*d],
      [cx+s*.52*w,cy+.38*h,cz+.38*d],
      [cx+s*.49*w,cy+.29*h,cz+.40*d],
      [cx+s*.12*w,cy+.22*h,cz+.57*d]
    ],.024*d,steel));
    add(prism('CheekFin_'+(s<0?'L':'R'),[
      [cx+s*.50*w,cy+.12*h,cz+.26*d],
      [cx+s*.80*w,cy+.04*h,cz-.22*d],
      [cx+s*.62*w,cy-.27*h,cz-.12*d],
      [cx+s*.44*w,cy-.28*h,cz+.26*d]
    ],.055*d,crown));
    add(prism('TempleTrim_'+(s<0?'L':'R'),[
      [cx+s*.62*w,cy+.21*h,cz+.01*d],
      [cx+s*.78*w,cy+.08*h,cz-.22*d],
      [cx+s*.57*w,cy-.10*h,cz-.13*d]
    ],.016*d,steel));
  }
  // Restrained three-plate crest, clearly armour rather than a bird's natural feathers.
  const crest=[
    {x:0,height:.93,back:-.48,width:.125},
    {x:-.26,height:.76,back:-.58,width:.105},
    {x:.26,height:.76,back:-.58,width:.105}
  ];
  crest.forEach((q,i)=>add(prism('Crest_'+i,[
    [cx+(q.x-q.width)*w,cy+.35*h,cz-.22*d],
    [cx+(q.x-.05)*w,cy+q.height*h,cz+q.back*d],
    [cx+(q.x+.05)*w,cy+q.height*h,cz+q.back*d],
    [cx+(q.x+q.width)*w,cy+.36*h,cz-.22*d]
  ],.045*d,i===0?steel:crown)));
  add(prism('NoseRidge',[
    [cx-.08*w,cy+.37*h,cz+.52*d],
    [cx+.08*w,cy+.37*h,cz+.52*d],
    [cx+.05*w,cy-.01*h,cz+.74*d],
    [cx-.05*w,cy-.01*h,cz+.74*d]
  ],.012*d,seam));
  add(prism('JawGuard',[
    [cx-.37*w,cy-.30*h,cz+.39*d],
    [cx+.37*w,cy-.30*h,cz+.39*d],
    [cx+.21*w,cy-.56*h,cz+.16*d],
    [cx-.21*w,cy-.56*h,cz+.16*d]
  ],.045*d,shadow));
  root.userData.hfNativeHeadReference={part:'M_Head',sourceMeshes:found,width:w,height:h,depth:d};
  root.userData.hfRigCompatible=true;
  return root;
}
