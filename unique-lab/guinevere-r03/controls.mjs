/** HIGHFLY R03 mobile projection. Screen input up = world away from camera. */
export function cameraScreenToWorld(angle,right,up){
  if(![angle,right,up].every(Number.isFinite))return null;
  const x=Math.cos(angle)*right-Math.sin(angle)*up,z=-Math.sin(angle)*right-Math.cos(angle)*up,len=Math.hypot(x,z);
  return len>1e-7?{x:x/len,z:z/len}:null;
}
export function pointerToWorld(angle,dx,dy){return cameraScreenToWorld(angle,dx,-dy);}
export function joystickToWorld(angle,dx,dy){return cameraScreenToWorld(angle,dx,-dy);}
