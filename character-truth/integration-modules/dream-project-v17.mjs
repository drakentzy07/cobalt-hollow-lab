/**
 * V17 project layer, NEVER modifies original ClaudeCraft/Highfly 3D files.
 * Only three separately validated existing engines: Factory V4, V13 paint,
 * V14 vertex-shape. Images are not embedded or persisted.
 */
import {readFactoryV4,saveFactoryV4} from './factory-recipe-v4.mjs';
import {validPremiumPaint} from './premium-paint-v13.mjs';
import {validPremiumShape} from './native-shape-v14.mjs';
export const PROJECT_SCHEMA='highfly.dream.studio-project/v17';
const MAX=180_000;
export function createDreamProject({name='Mi skin',factory,paint,shape,text='',notes='',helmetFit=null}){
 return validateDreamProject({
  schema:PROJECT_SCHEMA,version:17,name,factory,paint,shape,text,notes,
  helmetFit,originalSource:'Rig_Medium',sourceHunterIncluded:false,
  imagePixelsStored:false
 });
}
export function validateDreamProject(value){
 const p=typeof value==='string'?JSON.parse(value):value;
 if(!p||typeof p!=='object'||Array.isArray(p)||
   JSON.stringify(p).length>MAX||p.schema!==PROJECT_SCHEMA||p.version!==17||
   p.originalSource!=='Rig_Medium'||p.sourceHunterIncluded!==false||
   p.imagePixelsStored!==false||typeof p.name!=='string'||p.name.length>70||
   typeof p.text!=='string'||p.text.length>1800||
   typeof p.notes!=='string'||p.notes.length>1800)
  throw Error('V17_PROJECT_SOURCE_OR_FIELD_INVALID');
 const factory=saveFactoryV4(readFactoryV4(p.factory));
 const paint=validPremiumPaint(p.paint);
 const shape=validPremiumShape(p.shape);
 if(p.helmetFit!==null){
  const fit=p.helmetFit;
  if(!fit||typeof fit!=='object'||Array.isArray(fit)||
   !['open','semi_closed','closed','oni_heavy','samurai_masked'].includes(fit.preset)||
   !['none','full'].includes(fit.occlusion)||
   ![fit.scale,fit.x,fit.y,fit.z].every(Number.isFinite)||
   fit.scale<.55||fit.scale>1.15||
   [fit.x,fit.y,fit.z].some(v=>Math.abs(v)>.15))throw Error('V17_HELMET_FIT_NOT_SAFE');
 }
 return {...p,factory,paint,shape};
}
export function serializeProject(p){return JSON.stringify(validateDreamProject(p),null,2)}
export function historyReducer(history,action){
 const {undo=[],redo=[],current}=history;
 if(action.type==='capture')return {current:action.snapshot,undo:[...undo,current].filter(Boolean).slice(-30),redo:[]};
 if(action.type==='undo'){
  if(!undo.length)return history;
  return {current:undo.at(-1),undo:undo.slice(0,-1),
   redo:[current,...redo].filter(Boolean).slice(0,30)};
 }
 if(action.type==='redo'){
  if(!redo.length)return history;
  return {current:redo[0],undo:[...undo,current].filter(Boolean).slice(-30),redo:redo.slice(1)};
 }
 throw Error('V17_UNKNOWN_HISTORY_ACTION');
}
