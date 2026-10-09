/** HIGHFLY V18: bounded, deterministic geometry-only diagnostic for the REAL original Hunter.
 * No replacement skeleton. No claim of triangle-perfect collision detection.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
export function validBox(b,name='box'){
 if(!b||!['min','max','center','size'].every(k=>Array.isArray(b[k])&&b[k].length===3&&b[k].every(finite)))
  throw Error('V18_INVALID_'+name);
 for(let k=0;k<3;k++)if(b.size[k]<=0||b.max[k]<b.min[k])
  throw Error('V18_BAD_GEOMETRY_'+name);
 return b;
}
export function geometryReport(g,gender='male'){
 if(gender!=='male'&&gender!=='female')throw Error('V18_INVALID_GENDER');
 if(!g||g.rig!=='Rig_Medium'||!g.originalHeadsPreserved)
  throw Error('V18_ORIGINAL_RIG_REQUIRED');
 const h=validBox(gender==='male'?g.male:g.female,'SOURCE_HEAD');
 if(!g.crown||!g.faceplate)return {helmetLoaded:false,gender,originalRig:true,headWidth:h.size[0],
  warnings:['Primero cargar Kage-Oni auténtico.']};
 const c=validBox(g.crown,'CROWN'),p=validBox(g.faceplate,'FACEPLATE');
 const ratio=c.size[0]/h.size[0];
 const xError=Math.abs(c.center[0]-h.center[0])/h.size[0];
 const yError=Math.abs(c.center[1]-h.center[1])/h.size[1];
 const frontalOffset=(p.center[2]-h.center[2])/h.size[2];
 const warnings=[];
 if(ratio<0.95||ratio>1.3)warnings.push('Ancho de corona fuera del margen orientativo (0.95–1.30 × cabeza).');
 if(xError>0.15)warnings.push('Corona descentrada lateralmente.');
 if(yError>0.33)warnings.push('Corona alejada verticalmente del cráneo.');
 if(Math.abs(frontalOffset)>1.2)warnings.push('Máscara alejada del plano facial.');
 return {helmetLoaded:true,gender,originalRig:true,headWidth:h.size[0],
  crownWidth:c.size[0],ratio,xError,yError,frontalOffset,
  structuralValid:true,clearanceVerified:false,allAnimationClipsVerified:false,
  warnings,needsArtistReview:true};
}
export function proposeFit(current,geometry,gender='male'){
 if(!current||!['scale','x','y','z'].every(k=>finite(current[k]))||
  !['open','semi_closed','closed','oni_heavy','samurai_masked'].includes(current.preset))
  throw Error('V18_INVALID_EXISTING_FIT');
 const a=geometryReport(geometry,gender);
 if(!a.helmetLoaded)throw Error('V18_HELMET_REQUIRED');
 const head=gender==='male'?geometry.male:geometry.female,crown=geometry.crown;
 // Only fit the separate helmet. Conservative bounded correction.
 // Z remains unchanged: choosing the face forward axis from bounds alone is unsafe.
 const desiredRatio=1.12;
 const rawScale=current.scale*(desiredRatio/a.ratio);
 const scale=clamp(rawScale,Math.max(.55,current.scale-.18),Math.min(1.15,current.scale+.18));
 const x=clamp(current.x+clamp((head.center[0]-crown.center[0])*.75,-.045,.045),-.15,.15);
 const y=clamp(current.y+clamp((head.center[1]+head.size[1]*.08-crown.center[1])*.55,-.045,.045),-.15,.15);
 const proposed={preset:current.preset,occlusion:current.occlusion,scale,x,y,z:current.z};
 return {fit:proposed,original:current,desiredRatio,
  scaleLimited:Math.abs(scale-rawScale)>1e-5,
  warning:'Estimación geométrica, no encastre artístico certificado. Máscara y clipping deben revisarse en múltiples poses.'};
}
