/**
 * HIGHFLY UNIQUE LAB R02 — standalone deterministic combat kernel.
 * ORIGINAL mechanics inspired by genre conventions; no Mobile Legends code/art.
 * This is a laboratory model, NOT an integration with ClaudeCraft's authoritative Sim.
 * All tuning values are HIGHFLY PROTOTYPE VALUES, not MLBB data.
 */
export const LAB_VERSION = 'HIGHFLY-UNIQUE-GUINEVERE-R02';
export const RULES = Object.freeze({
  boundary: 25, playerRadius: .54,
  U1: {range: 15, speed: 25, radius: .52, cost: 14, cd: 4.4, damage: 78, slow: .72, slowSec: 1.6, markSec: 5, cooldownRefund: .6},
  U2: {range: 8, radius: 2.1, cost: 23, cd: 15, leapSec: .42, damage: 96, airborneSec: .85, recastSec: 4.2, blinkRange: 4.7, echoSec: 1.5, echoRadius: 2.05, echoDamage: 45},
  U3: {radius: 4.2, cost: 40, cd: 40, duration: 2.0, hits: 11, totalDamage: 352, launchOnMarks: 3, extraAirborneSec: .23, maxJuggles: 8},
  maxMarks: 3, inputBufferSec: .48, manaRegenPerSec: 3.5, staminaRegenPerSec: 2.5,
});
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const pt=p=>({x:p.x,z:p.z});
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function normalize(d) {const l=Math.hypot(d.x,d.z);return l>1e-7&&Number.isFinite(l)?{x:d.x/l,z:d.z/l}:null;}
export function segmentCircle(a,b,center,radius){
  const dx=b.x-a.x,dz=b.z-a.z,ox=a.x-center.x,oz=a.z-center.z;
  const A=dx*dx+dz*dz,C=ox*ox+oz*oz-radius*radius;
  if(C<=0)return 0;
  if(A<1e-12)return null;
  const B=2*(ox*dx+oz*dz),disc=B*B-4*A*C;
  if(disc<0)return null;
  const t=(-B-Math.sqrt(disc))/(2*A);
  return t>=0&&t<=1?t:null;
}
export function firstContact(a,b,targets,radius){
  let best=null;
  for(const t of targets){
    const at=segmentCircle(a,b,t.pos,radius+(t.radius??0));
    if(at===null)continue;
    if(!best||at<best.t-1e-8||(Math.abs(at-best.t)<1e-8&&String(t.id)<String(best.id))){
      best={id:t.id,t:at,point:{x:a.x+(b.x-a.x)*at,z:a.z+(b.z-a.z)*at}};
    }
  }
  return best;
}
const isPos=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
export class UniqueGuinevereLab {
  constructor({targets,obstacles}={}) {this.seedTargets=targets;this.seedObstacles=obstacles;this.reset();}
  reset(){
    this.time=0;this.sequence=0;
    this.player={pos:{x:0,z:0},hp:1000,maxHp:1000,mp:180,maxMp:180,stamina:100,maxStamina:100,dead:false,immuneUntil:0};
    this.cd={U1:0,U2:0,U3:0};this.castLockUntil=0;this.facing={x:0,z:1};
    this.targets=new Map();this.projectiles=[];this.pendingU1=[];this.pendingLeap=null;this.recast=null;this.echoes=[];this.ultimate=null;this.buffered=null;
    this.events=[];
    const d=this.seedTargets??[
      {id:'dummy-a',pos:{x:5,z:2},hp:1200,kind:'mob',radius:.66},
      {id:'dummy-b',pos:{x:7,z:1},hp:1300,kind:'mob',radius:.68},
      {id:'boss',pos:{x:11,z:-4},hp:6000,kind:'boss',radius:1.15,poise:320},
    ];
    for(const t of d)this.addTarget(t);
    this.obstacles=(this.seedObstacles??[{id:'pillar',pos:{x:-4,z:3},radius:1.5}]).map(o=>({...o,pos:pt(o.pos)}));
    this.emit('reset',{version:LAB_VERSION});
  }
  addTarget(t){
    if(!t?.id||!isPos(t.pos)||!Number.isFinite(t.hp)||t.hp<=0||this.targets.has(t.id))throw Error('INVALID_TARGET');
    const x={id:t.id,pos:pt(t.pos),kind:t.kind==='boss'?'boss':'mob',hp:t.hp,maxHp:t.hp,radius:t.radius??.6,
      alive:true,marks:0,markUntil:0,slowUntil:0,slowMult:1,airborneUntil:0,poise:t.poise??(t.kind==='boss'?260:0),maxPoise:t.poise??(t.kind==='boss'?260:0),juggles:0};
    this.targets.set(x.id,x);return x;
  }
  emit(type,data={}){
    const evt={seq:++this.sequence,at:Number(this.time.toFixed(4)),type,...data};this.events.push(evt);
    if(this.events.length>1200)this.events.splice(0,this.events.length-1200);
    return evt;
  }
  get available(){return Object.fromEntries(Object.entries(this.cd).map(([k,v])=>[k,Math.max(0,v-this.time)]));}
  get busy(){return !!(this.pendingLeap||this.ultimate||this.time+1e-9<this.castLockUntil);}
  get canRecast(){return !!(this.recast&&this.time<=this.recast.until&&this.player.hp>0);}
  within(p){return isPos(p)&&Math.abs(p.x)<=RULES.boundary&&Math.abs(p.z)<=RULES.boundary;}
  lineClear(a,b,margin=.4){return !this.obstacles.some(o=>segmentCircle(a,b,o.pos,o.radius+margin)!==null);}
  validateCast(skill,cost){
    if(this.player.dead)return 'DEAD';
    if(this.busy)return 'BUSY';
    if((this.cd[skill]??Infinity)>this.time+1e-7)return 'COOLDOWN';
    if(this.player.mp+1e-7<cost)return 'MANA';
    return null;
  }
  commit(skill,cost){this.player.mp-=cost;this.cd[skill]=this.time+RULES[skill].cd;if(skill==='U1')this.castLockUntil=this.time+.18;this.emit('cast',{skill,mp:this.player.mp});}
  denied(skill,reason){this.emit('refused',{skill,reason});return {ok:false,reason};}
  accepted(){return {ok:true};}
  castU1(direction){
    const v=normalize(direction??{});if(!v)return this.denied('U1','BAD_DIRECTION');
    const err=this.validateCast('U1',RULES.U1.cost);if(err)return this.denied('U1',err);
    this.commit('U1',RULES.U1.cost);
    this.facing=v;this.pendingU1.push({dir:v,origin:pt(this.player.pos),at:this.time+.14});
    this.emit('cast_windup',{skill:'U1',releaseAt:this.time+.14});return this.accepted();
  }
  castU2(destination){
    if(!this.within(destination))return this.denied('U2','BAD_DESTINATION');
    const err=this.validateCast('U2',RULES.U2.cost);if(err)return this.denied('U2',err);
    if(distance(this.player.pos,destination)>RULES.U2.range+1e-8)return this.denied('U2','OUT_OF_RANGE');
    if(!this.lineClear(this.player.pos,destination,RULES.playerRadius))return this.denied('U2','WALL');
    this.commit('U2',RULES.U2.cost);
    const v=normalize({x:destination.x-this.player.pos.x,z:destination.z-this.player.pos.z});if(v)this.facing=v;
    this.pendingLeap={from:pt(this.player.pos),to:pt(destination),started:this.time,landsAt:this.time+RULES.U2.leapSec};
    this.emit('leap_start',{skill:'U2',destination:pt(destination)});return this.accepted();
  }
  recastU2(direction){
    if(!this.canRecast)return this.denied('U2','NO_RECAST');
    if(this.busy)return this.denied('U2','BUSY');
    const v=normalize(direction??{});if(!v)return this.denied('U2','BAD_DIRECTION');
    const origin=pt(this.player.pos), to={x:origin.x+v.x*RULES.U2.blinkRange,z:origin.z+v.z*RULES.U2.blinkRange};
    if(!this.within(to))return this.denied('U2','BAD_DESTINATION');
    if(!this.lineClear(origin,to,RULES.playerRadius))return this.denied('U2','WALL');
    this.player.pos=to;this.facing=v;this.recast=null;
    const echo={id:'echo-'+(++this.sequence),pos:origin,detonateAt:this.time+RULES.U2.echoSec};this.echoes.push(echo);
    this.emit('blink',{skill:'U2',from:origin,to:pt(to)});this.emit('echo_spawn',{id:echo.id,x:origin.x,z:origin.z});return this.accepted();
  }
  castU3(){
    const err=this.validateCast('U3',RULES.U3.cost);if(err)return this.denied('U3',err);
    this.commit('U3',RULES.U3.cost);
    this.player.immuneUntil=this.time+RULES.U3.duration;
    this.ultimate={started:this.time,ends:this.time+RULES.U3.duration,processed:0};
    this.emit('ultimate_start',{skill:'U3',hits:RULES.U3.hits,duration:RULES.U3.duration});return this.accepted();
  }
  /** A single buffered command during a leap, consumed as soon as the leap finishes. */
  request(skill,payload){
    if(skill==='U2'&&this.canRecast)return this.recastU2(payload);
    if(this.pendingLeap&&skill!=='U2'){
      this.buffered={skill,payload,until:this.pendingLeap.landsAt+RULES.inputBufferSec};this.emit('input_buffered',{skill,until:this.buffered.until});return {ok:true,buffered:true};
    }
    if(this.busy&&!this.pendingLeap){
      this.buffered={skill,payload,until:this.time+RULES.inputBufferSec};this.emit('input_buffered',{skill,until:this.buffered.until});return {ok:true,buffered:true};
    }
    if(skill==='U1')return this.castU1(payload);
    if(skill==='U2')return this.castU2(payload);
    if(skill==='U3')return this.castU3();
    return this.denied(String(skill),'UNKNOWN_SKILL');
  }
  /** In the game adapter, pointercancel calls cancelPreview *before* any request. */
  cancelPreview(skill){this.emit('aim_cancel',{skill});return {ok:true,canceled:true};}
  damage(target,amount,skill,tag){
    if(!target?.alive||!Number.isFinite(amount)||amount<=0)return;
    const dealt=Math.min(target.hp,amount);target.hp=Math.max(0,target.hp-amount);
    this.emit('damage',{skill,target:target.id,amount:dealt,tag,hp:target.hp});
    if(target.hp<=0){target.alive=false;target.airborneUntil=0;target.marks=0;this.emit('death',{target:target.id});}
  }
  mark(target,source){
    if(!target.alive)return;
    if(target.markUntil<=this.time)target.marks=0;
    target.marks=clamp(target.marks+1,0,RULES.maxMarks);target.markUntil=this.time+RULES.U1.markSec;
    this.emit('mark',{target:target.id,source,stacks:target.marks,until:target.markUntil});
  }
  crowdControl(target,seconds,source){
    if(!target.alive)return;
    if(target.kind==='boss'){
      const loss=source==='U3'?9:42;target.poise=Math.max(0,target.poise-loss);
      this.emit('boss_poise',{skill:source,target:target.id,loss,poise:target.poise});
      if(target.poise===0){this.emit('boss_stagger',{target:target.id,source});target.poise=target.maxPoise;}
      return;
    }
    target.airborneUntil=Math.max(target.airborneUntil,this.time+seconds);
    this.emit('airborne',{skill:source,target:target.id,until:target.airborneUntil});
  }
  landLeap(leap){
    this.player.pos=pt(leap.to);this.pendingLeap=null;
    this.emit('leap_land',{skill:'U2',x:leap.to.x,z:leap.to.z});
    for(const target of this.targets.values())if(target.alive&&distance(target.pos,leap.to)<=RULES.U2.radius+target.radius){
      this.damage(target,RULES.U2.damage,'U2','landing');
      if(target.alive){this.mark(target,'U2');this.mark(target,'U2');this.crowdControl(target,RULES.U2.airborneSec,'U2');}
    }
    this.recast={until:this.time+RULES.U2.recastSec};this.emit('recast_open',{skill:'U2',until:this.recast.until});
    if(this.buffered){const b=this.buffered;this.buffered=null;
      if(b.until+1e-7>=this.time){this.emit('input_dequeued',{skill:b.skill});this.request(b.skill,b.payload);}
      else this.emit('input_expired',{skill:b.skill});
    }
  }
  ultimateHit(index){
    const dmg=RULES.U3.totalDamage/RULES.U3.hits;
    this.emit('ultimate_tick',{skill:'U3',index:index+1});
    for(const target of this.targets.values()){
      if(!target.alive||distance(target.pos,this.player.pos)>RULES.U3.radius+target.radius)continue;
      const marked=target.marks>=RULES.U3.launchOnMarks&&target.markUntil>this.time;
      const wasAirborne=target.airborneUntil>this.time;
      this.damage(target,dmg,'U3','tick-'+(index+1));
      if(!target.alive)continue;
      // Every third pulse pressures boss poise even without prior marks.
      // Bosses are never displaced by this lab's airborne model.
      if(target.kind==='boss'&&index%3===0)this.crowdControl(target,0,'U3');
      if(marked){target.marks=0;target.markUntil=0;this.emit('mark_consumed',{target:target.id,skill:'U3'});this.crowdControl(target,.48,'U3');}
      else if((wasAirborne||target.airborneUntil>this.time)&&target.juggles<RULES.U3.maxJuggles){
        target.juggles++;this.crowdControl(target,RULES.U3.extraAirborneSec,'U3');
      }
    }
  }
  updateProjectiles(step){
    const remaining=[];
    for(const b of this.projectiles){
      const a=pt(b.pos), travel=Math.min(RULES.U1.speed*step,RULES.U1.range-b.travelled);
      const to={x:a.x+b.dir.x*travel,z:a.z+b.dir.z*travel};
      const enemies=[...this.targets.values()].filter(t=>t.alive).map(t=>({id:t.id,pos:t.pos,radius:t.radius}));
      const walls=this.obstacles.map(o=>({id:'wall-'+o.id,pos:o.pos,radius:o.radius}));
      const hit=firstContact(a,to,[...enemies,...walls],RULES.U1.radius);
      if(hit){b.pos=hit.point;if(String(hit.id).startsWith('wall-'))this.emit('projectile_blocked',{skill:'U1',obstacle:hit.id});
        else{const target=this.targets.get(hit.id);
          if(target?.alive){this.damage(target,RULES.U1.damage,'U1','impact');
            if(target.alive){target.slowUntil=this.time+RULES.U1.slowSec;target.slowMult=RULES.U1.slow;this.emit('slow',{skill:'U1',target:target.id,until:target.slowUntil});this.mark(target,'U1');}
            for(const s of Object.keys(this.cd))this.cd[s]=Math.max(this.time,this.cd[s]-RULES.U1.cooldownRefund);
            this.emit('cooldown_refund',{skill:'U1',seconds:RULES.U1.cooldownRefund,target:target.id});
          }
        }
      }else{
        b.pos=to;b.travelled+=travel;
        if(b.travelled+1e-8<RULES.U1.range)remaining.push(b);
        else this.emit('projectile_miss',{skill:'U1'});
      }
    }
    this.projectiles=remaining;
  }
  updateEchoes(){
    const current=[];
    for(const e of this.echoes){
      if(e.detonateAt>this.time){current.push(e);continue;}
      this.emit('echo_detonate',{skill:'U2',id:e.id,x:e.pos.x,z:e.pos.z});
      for(const target of this.targets.values())if(target.alive&&distance(target.pos,e.pos)<=RULES.U2.echoRadius+target.radius)
        this.damage(target,RULES.U2.echoDamage,'U2','echo');
    }
    this.echoes=current;
  }
  /** Fixed substeps -> sweep collision and tick sequencing do not depend on display FPS. */
  step(dt){
    if(!Number.isFinite(dt)||dt<0)throw Error('INVALID_DT');
    let remain=Math.min(dt,2);
    while(remain>1e-9){const sub=Math.min(remain,1/120);remain-=sub;
      this.time+=sub;
      this.player.mp=Math.min(this.player.maxMp,this.player.mp+sub*RULES.manaRegenPerSec);
      this.player.stamina=Math.min(this.player.maxStamina,this.player.stamina+sub*RULES.staminaRegenPerSec);
      if(this.player.dead)continue;
      if(this.pendingLeap&&this.time+1e-8>=this.pendingLeap.landsAt)this.landLeap(this.pendingLeap);
      if(this.pendingU1.length){const later=[];for(const cast of this.pendingU1){
        if(cast.at>this.time){later.push(cast);continue;}
        const bullet={id:'bolt-'+(++this.sequence),pos:pt(cast.origin),dir:cast.dir,travelled:0};
        this.projectiles.push(bullet);this.emit('projectile_spawn',{skill:'U1',x:bullet.pos.x,z:bullet.pos.z});
      }this.pendingU1=later;}
      this.updateProjectiles(sub);
      if(this.ultimate){
        const u=this.ultimate;
        while(u.processed<RULES.U3.hits&&this.time+1e-8>=u.started+(u.processed+1)*RULES.U3.duration/RULES.U3.hits){
          this.ultimateHit(u.processed);u.processed++;
        }
        if(this.time+1e-8>=u.ends){this.ultimate=null;this.player.immuneUntil=0;this.emit('ultimate_end',{skill:'U3'});for(const t of this.targets.values())t.juggles=0;}
      }
      this.updateEchoes();
      if(this.buffered&&!this.busy){const b=this.buffered;this.buffered=null;
        if(b.until+1e-7>=this.time){this.emit('input_dequeued',{skill:b.skill});this.request(b.skill,b.payload);}
        else this.emit('input_expired',{skill:b.skill});}
      if(this.recast&&this.time>this.recast.until){this.recast=null;this.emit('recast_expire',{skill:'U2'});}
      if(this.buffered&&this.time>this.buffered.until&&!this.pendingLeap){this.emit('input_expired',{skill:this.buffered.skill});this.buffered=null;}
      for(const t of this.targets.values()){
        if(t.markUntil<=this.time)t.marks=0;
        if(t.slowUntil<=this.time)t.slowMult=1;
      }
    }
  }
  movePlayer(direction,dt){
    if(this.player.dead||this.pendingLeap)return false;
    const v=normalize(direction??{});if(!v)return false;
    const speed=this.ultimate?3.5:6;
    const dest={x:clamp(this.player.pos.x+v.x*speed*dt,-RULES.boundary,RULES.boundary),z:clamp(this.player.pos.z+v.z*speed*dt,-RULES.boundary,RULES.boundary)};
    if(!this.lineClear(this.player.pos,dest,RULES.playerRadius))return false;
    this.player.pos=dest;this.facing=v;return true;
  }
  /** Hit from the enemy; U3 prevents control, not enemy damage. */
  hitPlayer({damage=0,control=false}={}){
    if(this.player.dead)return false;
    if(control&&this.player.immuneUntil>this.time){this.emit('cc_immune',{source:'U3'});return false;}
    if(damage>0){this.player.hp=Math.max(0,this.player.hp-damage);this.emit('player_damage',{amount:damage});}
    if(this.player.hp===0){this.player.dead=true;this.projectiles=[];this.pendingU1=[];this.echoes=[];this.ultimate=null;this.pendingLeap=null;this.recast=null;this.buffered=null;this.castLockUntil=0;this.player.immuneUntil=0;this.emit('player_death');}
    return true;
  }
  snapshot(){return {version:LAB_VERSION,time:this.time,player:structuredClone(this.player),cd:{...this.cd},targets:[...this.targets.values()].map(t=>structuredClone(t)),
    obstacles:structuredClone(this.obstacles),projectiles:structuredClone(this.projectiles),pendingU1:structuredClone(this.pendingU1),facing:{...this.facing},castLockUntil:this.castLockUntil,leap:this.pendingLeap?structuredClone(this.pendingLeap):null,
    recast:this.recast?structuredClone(this.recast):null,echoes:structuredClone(this.echoes),ultimate:this.ultimate?structuredClone(this.ultimate):null,events:this.events.slice(-30)};}
}
