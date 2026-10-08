import * as THREE from 'three';

// Production QA: inspect real geometry, not merely a Boolean "exported".
export const MOBILE_LIMITS=Object.freeze({triangles:30000,materials:24,meshes:180});
export function inspectAccessory(root,{maxTriangles=MOBILE_LIMITS.triangles}={}){
  let meshes=0,verts=0,triangles=0,degenerate=0,invalid=0;
  const mats=new Set(),bounds=new THREE.Box3();let hasBounds=false;
  root.traverse(o=>{
    if(!o.isMesh)return;
    meshes++;const geo=o.geometry,a=geo?.getAttribute('position');
    if(!a)return;
    verts+=a.count;let visibleValid=true;
    for(let i=0;i<a.count;i++)for(const v of [a.getX(i),a.getY(i),a.getZ(i)])
      if(!Number.isFinite(v)){invalid++;visibleValid=false}
    if(visibleValid){geo.computeBoundingBox();if(geo.boundingBox){const b=geo.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if(!hasBounds){bounds.copy(b);hasBounds=true}else bounds.union(b)}}
    (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m)mats.add(m)});
    const idx=geo.index,count=idx?idx.count:a.count;
    triangles+=Math.floor(count/3);
    const aa=new THREE.Vector3(),bb=new THREE.Vector3(),cc=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3();
    for(let i=0;i+2<count;i+=3){
      const ia=idx?idx.getX(i):i,ib=idx?idx.getX(i+1):i+1,ic=idx?idx.getX(i+2):i+2;
      if(ia<0||ib<0||ic<0||ia>=a.count||ib>=a.count||ic>=a.count){invalid++;continue}
      aa.fromBufferAttribute(a,ia);bb.fromBufferAttribute(a,ib);cc.fromBufferAttribute(a,ic);
      if(ab.subVectors(bb,aa).cross(ac.subVectors(cc,aa)).lengthSq()<1e-16)degenerate++;
    }
  });
  const warnings=[];
  if(triangles>maxTriangles)warnings.push('Triángulos por encima del presupuesto móvil');
  if(mats.size>MOBILE_LIMITS.materials)warnings.push('Demasiados materiales en accesorio móvil');
  if(meshes>MOBILE_LIMITS.meshes)warnings.push('Demasiadas mallas independientes');
  if(degenerate)warnings.push('Triángulos degenerados: '+degenerate);
  if(invalid)warnings.push('Vértices/índices inválidos: '+invalid);
  return {meshes,vertices:verts,triangles,materials:mats.size,degenerate,invalid,
    bounds:hasBounds?bounds.getSize(new THREE.Vector3()).toArray():null,warnings,
    valid:meshes>0&&invalid===0&&triangles>0,mobileBudget:triangles<=maxTriangles&&mats.size<=MOBILE_LIMITS.materials&&meshes<=MOBILE_LIMITS.meshes};
}
