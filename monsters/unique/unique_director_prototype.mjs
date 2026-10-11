/** UE04 POC ONLY, not imported by the HIGHFLY Sim.
 * Local save is editable: no global anti-cheat guarantee without a server.
 */
export const UNIQUE_POC_VERSION=1;
export function newHunterState(){return {v:1,visits:{},seen:{},cleared:{},claims:{},questFlags:{}};}
function hash(s){let n=2166136261;for(let i=0;i<s.length;i++){n=Math.imul(n^s.charCodeAt(i),16777619);}return n>>>0;}
export function eligibleRegionVisit(st,hunter,boss,eligible){
 if(!eligible||st.cleared[boss])return {manifested:false,eligible:false};
 if(!hunter||!boss)throw Error('unique requires valid IDs');
 const visit=1+(st.visits[boss]??0);st.visits[boss]=visit;
 const occurs=visit>=4 || hash(hunter+'|'+boss+'|'+visit)%100<20;
 if(occurs)st.seen[boss]=true;
 return {manifested:occurs,eligible:true,guaranteed:visit>=4};
}
export function claim(st,hunter,boss,encounter,scope,verified){
 if(!verified||!st.seen[boss])return {ok:false,reason:'UNVERIFIED_ENCOUNTER'};
 if(!hunter||!boss||!encounter)throw Error('invalid claim');
 const key=[hunter,boss,encounter,scope].join('|');
 if(st.claims[key])return {ok:false,reason:'DUPLICATE_CLAIM'};
 if(scope==='FIRST_CLEAR' && st.cleared[boss])return {ok:false,reason:'CLEARED_ALREADY'};
 st.claims[key]=true;
 if(scope==='FIRST_CLEAR')st.cleared[boss]=true;
 return {ok:true,key};
}
