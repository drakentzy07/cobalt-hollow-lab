/** HIGHFLY P4B1 — independently testable mobility state machine.
 * Touch/offline only. Uses the original engine's collision/gravity path.
 * Double-jump somersault animation is deliberately NOT faked here.
 */
export interface FuryInput {
  furyDashSeq?: number;
  furyJumpSeq?: number;
  analogWorldX?: number;
  analogWorldZ?: number;
}
export interface FuryPlayer {
  onGround: boolean;
  jumping: boolean;
  facing: number;
}
export interface FuryMobilityResult {
  dash: { x: number; z: number; speed: number } | null;
  doubleJump: boolean;
  energy: number;
  secondJumpDirection: number | null;
}
interface State {
  energy: number;
  cooldown: number;
  dashTimer: number;
  dashX: number;
  dashZ: number;
  jumpSeq: number;
  dashSeq: number;
  jumpCount: number;
  lastOnGround: boolean;
}
const DASH_SPEED=13;
const DASH_DURATION=0.19;
const DASH_COOLDOWN=0.85;
const DASH_COST=25;
const ENERGY_REGEN=12;
export class FuryMobility {
  private states=new WeakMap<FuryPlayer,State>();
  update(player:FuryPlayer,inp:FuryInput,dt:number,blocked=false):FuryMobilityResult {
    let s=this.states.get(player);
    if(!s){s={energy:100,cooldown:0,dashTimer:0,dashX:0,dashZ:1,jumpSeq:inp.furyJumpSeq??0,dashSeq:inp.furyDashSeq??0,jumpCount:player.onGround?0:1,lastOnGround:player.onGround};this.states.set(player,s);}
    const frame=Math.max(0,Math.min(dt,0.1));
    s.cooldown=Math.max(0,s.cooldown-frame);
    s.energy=Math.min(100,s.energy+ENERGY_REGEN*frame);
    if(blocked){s.dashTimer=0;}
    if(player.onGround){
      if(!s.lastOnGround){s.jumpCount=0;}
      // A new press on the ground is the FIRST jump, not a double jump.
      s.jumpCount=0;
    } else if(s.lastOnGround){
      // Took off from ground; the first jump has happened.
      s.jumpCount=Math.max(s.jumpCount,1);
    }
    let doubleJump=false;
    let secondJumpDirection:null|number=null;
    const jumpSeq=inp.furyJumpSeq??0;
    if(jumpSeq!==s.jumpSeq){
      s.jumpSeq=jumpSeq;
      if(!player.onGround && player.jumping && s.jumpCount===1 && !blocked){
        s.jumpCount=2;
        doubleJump=true;
        secondJumpDirection=player.facing;
      } else if(player.onGround){
        s.jumpCount=1;
      }
    }
    const dashSeq=inp.furyDashSeq??0;
    if(dashSeq!==s.dashSeq){
      s.dashSeq=dashSeq;
      if(!blocked && s.cooldown===0 && s.energy>=DASH_COST){
        const rawX=inp.analogWorldX??0,rawZ=inp.analogWorldZ??0;
        const len=Math.hypot(rawX,rawZ);
        s.dashX=len>0.12?rawX/len:Math.sin(player.facing);
        s.dashZ=len>0.12?rawZ/len:Math.cos(player.facing);
        s.energy-=DASH_COST;
        s.dashTimer=DASH_DURATION;
        s.cooldown=DASH_COOLDOWN;
      }
    }
    const dash=!blocked&&s.dashTimer>0 ? {x:s.dashX,z:s.dashZ,speed:DASH_SPEED}:null;
    s.dashTimer=Math.max(0,s.dashTimer-frame);
    s.lastOnGround=player.onGround;
    return {dash,doubleJump,energy:s.energy,secondJumpDirection};
  }
}
