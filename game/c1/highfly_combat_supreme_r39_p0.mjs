/**
 * HIGHFLY ORIGIN R39-P0 — pure combat intent contract, NO world/Sim patch.
 * One persisted Hunter; no character swap, no skill grants, no side effects.
 * Native Sim stays authoritative for all damage, resources, hit/LOS, cooldown,
 * movement/collision, equip, ability rights and persistent player/enemy state.
 * This kernel suggests an explicit action in response to an explicit input.
 * Its result is NOT an accepted strike, damage, dodge or ability.
 */
export const R39_BUFFER_MS = 170;
export const R39_ACTIONS = Object.freeze({
  basic1: {startup:100,active:145,connect:115,recovery:150,moving:true},
  basic2: {startup:100,active:150,connect:120,recovery:170,moving:true},
  basic3: {startup:135,active:190,connect:115,recovery:205,moving:true},
  running_attack: {startup:105,active:160,connect:135,recovery:180,moving:true},
  dash_attack: {startup:90,active:145,connect:115,recovery:160,moving:true},
  air_attack: {startup:95,active:170,connect:110,recovery:165,moving:true},
  plunge: {startup:140,active:200,connect:0,recovery:240,moving:false},
  wall_strike: {startup:115,active:165,connect:85,recovery:180,moving:true},
  glide_dive: {startup:140,active:180,connect:0,recovery:225,moving:false},
  back_attack: {startup:100,active:155,connect:125,recovery:185,moving:true},
  dodge_counter: {startup:90,active:150,connect:160,recovery:150,moving:true},
  parry_counter: {startup:85,active:170,connect:160,recovery:155,moving:true},
  down_execution: {startup:220,active:240,connect:0,recovery:320,moving:false},
});
export const R39_BRANCHES = Object.freeze({
  basic1:['basic2','dash_attack','air_attack','skill'],
  basic2:['basic3','dash_attack','air_attack','skill'],
  basic3:['dash_attack','air_attack','skill'],
  running_attack:['basic2','dash_attack','skill'],
  dash_attack:['basic2','air_attack','skill'],
  air_attack:['air_attack','plunge','skill'],
  wall_strike:['air_attack','skill'],
  back_attack:['basic2','dash_attack','skill'],
  dodge_counter:['basic2','air_attack','skill'],
  parry_counter:['basic3','dash_attack','skill'],
  plunge:[],
  glide_dive:[],
  down_execution:[],
  skill:['basic2','dash_attack','air_attack','skill'],
});
/** No context adds an action without an explicit, distinct input receipt. */
export function selectR39Attack(ctx) {
  if (ctx.dead || ctx.stunned || ctx.inputLocked) return {id:null,reason:'unable-to-act'};
  const unlocked = new Set(ctx.unlockedMoves ?? []);
  const validEnemy = ctx.enemyInReach === true && ctx.enemyHostile === true;
  const eligible = (name) => unlocked.has(name);
  if (validEnemy && ctx.enemyDowned && eligible('down_execution'))
    return {id:'down_execution',reason:'downed'};
  if (validEnemy && ctx.parryCounterOpen && eligible('parry_counter'))
    return {id:'parry_counter',reason:'perfect-parry'};
  if (validEnemy && ctx.dodgeCounterOpen && eligible('dodge_counter'))
    return {id:'dodge_counter',reason:'perfect-dodge'};
  if (ctx.airborne && ctx.falling && eligible('plunge'))
    return {id:'plunge',reason:'falling'};
  if (ctx.airborne && eligible('air_attack'))
    return {id:'air_attack',reason:'airborne'};
  if (ctx.gliding && eligible('glide_dive'))
    return {id:'glide_dive',reason:'gliding'};
  if (ctx.wallContact && eligible('wall_strike'))
    return {id:'wall_strike',reason:'wall'};
  if (ctx.dashWindow && eligible('dash_attack'))
    return {id:'dash_attack',reason:'dash'};
  if (validEnemy && ctx.behindEnemy && eligible('back_attack'))
    return {id:'back_attack',reason:'behind'};
  if (ctx.running && eligible('running_attack'))
    return {id:'running_attack',reason:'running'};
  return {id:ctx.basicStep===2?'basic2':ctx.basicStep===3?'basic3':'basic1',reason:'basic'};
}
/** A presentation-friendly phase; NEVER a source of Sim damage. */
export function r39Phase(id,elapsedMs) {
  const a=R39_ACTIONS[id];
  if(!a||!Number.isFinite(elapsedMs)||elapsedMs<0)return 'invalid';
  if(elapsedMs<a.startup)return 'startup';
  if(elapsedMs<a.startup+a.active)return 'active';
  if(elapsedMs<a.startup+a.active+a.connect)return 'connect';
  if(elapsedMs<a.startup+a.active+a.connect+a.recovery)return 'recovery';
  return 'finished';
}
/** Design gate for proposed follow-ups. Not a bypass of native cast legality. */
export function r39CanConnect(currentId,nextId,elapsedMs,opts={}) {
  const nextKind=String(nextId).startsWith('skill:')?'skill':nextId;
  if(!(R39_BRANCHES[currentId]??[]).includes(nextKind))return false;
  if(r39Phase(currentId,elapsedMs)!=='connect')return false;
  if(opts.hitRequired && !opts.hitConfirmed)return false;
  if(nextKind==='skill'&&!opts.skillAuthorized)return false;
  if(opts.immobilized||opts.dead)return false;
  return true;
}
/** Bounded, deterministic once-only input buffering. Inputs never auto-repeat. */
export class R39InputBuffer {
  constructor(windowMs=R39_BUFFER_MS) {
    if(!Number.isFinite(windowMs)||windowMs<1||windowMs>500)
      throw Error('R39_INVALID_BUFFER_WINDOW');
    this.windowMs=windowMs;
    this.pending=[];
    this.seen=new Set();
    this.receipts=[];
  }
  push(input) {
    if(!input||typeof input.receipt!=='string'||!input.receipt||
       !Number.isFinite(input.atMs)||
       !['attack','skill','dash','jump','parry'].includes(input.kind))
      return false;
    if(this.seen.has(input.receipt))return false;
    this.seen.add(input.receipt);this.receipts.push(input.receipt);
    if(this.receipts.length>128) {
      const drop=this.receipts.shift();this.seen.delete(drop);
    }
    this.pending.push(Object.freeze({...input}));
    // Oldest event first even if touch events were delivered out-of-order.
    this.pending.sort((a,b)=>a.atMs-b.atMs);
    return true;
  }
  take(nowMs,accept) {
    if(!Number.isFinite(nowMs)||typeof accept!=='function')return null;
    this.pending=this.pending.filter(e=>e.atMs<=nowMs && nowMs-e.atMs<=this.windowMs);
    // No later event may overtake an earlier still-eligible input.
    const e=this.pending[0];
    if(!e||!accept(e))return null;
    this.pending.shift();
    return e;
  }
  clear() {this.pending=[];}
  size(){return this.pending.length;}
}
/**
 * Authoritative enemy Break must run on native server later.
 * Pure preview transition is separate from HP and cannot apply damage.
 */
export function r39BreakPreview(state,breakDamage,dtMs) {
  const max=Number(state?.max);
  if(!Number.isFinite(max)||max<=0||!Number.isFinite(breakDamage)||
    !Number.isFinite(dtMs)||dtMs<0)throw Error('R39_INVALID_BREAK_STATE');
  const amount=Math.max(0,breakDamage);
  let phase=state.phase==='broken'?'broken':'guarded';
  let remaining=Math.max(0,Math.min(max,Number(state.remaining) || 0));
  let punishMs=Math.max(0,Number(state.punishMs)||0);
  if(phase==='broken') {
    punishMs=Math.max(0,punishMs-dtMs);
    if(punishMs===0){phase='guarded';remaining=max;}
  }else if(amount>0){
    remaining=Math.max(0,remaining-amount);
    if(remaining===0){phase='broken';punishMs=Math.max(200,Math.min(10000,Number(state.breakWindowMs)||2500));}
  }
  return {phase,remaining,max,punishMs};
}
