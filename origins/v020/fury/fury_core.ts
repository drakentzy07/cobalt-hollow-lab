// HIGHFLY FURY 360° — true continuous analogue movement, camera-relative.
// x: stick right positive; y: stick down positive.
// ClaudeCraft yaw=0 screen-right is world -X (not +X).
export interface FuryMotion {
  worldX: number;
  worldZ: number;
  power: number;
  facing: number;
}
export function furyStickWorld(x:number,y:number,cameraYaw:number,deadzone=0.12):FuryMotion|null {
  if (![x,y,cameraYaw,deadzone].every(Number.isFinite) || deadzone<0 || deadzone>=1) return null;
  const rawLength=Math.hypot(x,y);
  if(rawLength<=deadzone) return null;
  const length=Math.min(1,rawLength);
  const power=Math.min(1,(length-deadzone)/(1-deadzone));
  const right=x/rawLength;
  const forward=-y/rawLength;
  const worldX=(forward*Math.sin(cameraYaw)-right*Math.cos(cameraYaw))*power;
  const worldZ=(forward*Math.cos(cameraYaw)+right*Math.sin(cameraYaw))*power;
  return {worldX,worldZ,power,facing:Math.atan2(worldX,worldZ)};
}
