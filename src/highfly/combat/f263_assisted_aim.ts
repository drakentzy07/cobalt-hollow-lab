/** F2.6.3: optional mobile "near miss" assist at AIM RELEASE, never a homing
 * projectile. Same pure result is used by the ground preview and the cast.
 * No target lock, no target id captured. A monster outside the visible lane
 * cannot get pulled into the spell. */
export type F263AimPoint={x:number;z:number};
export type F263AimEntity={id:number;pos:F263AimPoint};
export function highflyF263AssistAim<T extends F263AimEntity>(
  source:F263AimPoint,
  intended:F263AimPoint,
  entities:Iterable<T>,
  eligible:(entity:T)=>boolean,
  range:number,
):{point:F263AimPoint;assistedId:number|null}{
  const dx=intended.x-source.x,dz=intended.z-source.z;
  const length=Math.hypot(dx,dz);
  if(!Number.isFinite(length)||length<.05)return {point:intended,assistedId:null};
  const ux=dx/length,uz=dz/length;
  const limit=Math.min(range,length+1.2);
  let best:T|null=null,quality=Infinity;
  for(const entity of entities){
    if(!eligible(entity))continue;
    const ex=entity.pos.x-source.x,ez=entity.pos.z-source.z;
    const projection=ex*ux+ez*uz;
    if(projection<1||projection>limit)continue;
    const lateral=Math.abs(ex*uz-ez*ux);
    const tolerance=Math.min(3.1,Math.max(1.35,projection*.17));
    if(lateral>tolerance)continue;
    // Strongly prefer actually pointing at the creature over a distant
    // nearby-by-chance one; closer projection wins tied candidates.
    const score=lateral/tolerance + projection*.002;
    if(score<quality){best=entity;quality=score;}
  }
  return best?{point:{x:best.pos.x,z:best.pos.z},assistedId:best.id}
    :{point:intended,assistedId:null};
}
