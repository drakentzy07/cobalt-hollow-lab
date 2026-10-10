// SKIN7 -- deterministic, inspectable commission-to-Blender bridge.
// ChatGPT can assist with art decisions in chat; this static browser app is
// explicitly NOT an autonomous text/image-to-3D model.
const SLOT_NAMES=['head','chest','arms','hands','legs','feet','back'];
const OLD_SHAPE={
 head:{scale:[1.09,1.08,1.10],flare:.06,curvature:.14},
 chest:{scale:[1.11,1.08,1.11],flare:.04,curvature:.12},
 arms:{scale:[1.22,1.12,1.12],flare:.16,curvature:.26},
 hands:{scale:[1.08,1.08,1.06],flare:.02,curvature:.10},
 legs:{scale:[1.09,1.09,1.07],flare:.05,curvature:.11},
 feet:{scale:[1.08,1.05,1.04],flare:.02,curvature:.07},
 back:{scale:[1.09,1.08,1.07],flare:.02,curvature:.10}
};
const DEFAULT={head:1.08,chest:1.04,arms:1.17,hands:.92,legs:.99,feet:.88,back:1.11};
const MATCH={
 head:/casco|yelmo|visera|corona|helmet|head/i,
 chest:/pechera|peto|coraza|chest|armadura frontal/i,
 arms:/hombrera|hombro|brazal|pauldron|shoulder/i,
 hands:/guante|mano|gauntlet/i,
 legs:/greba|rodillera|pierna|shin|knee/i,
 feet:/bota|pie|toe|foot/i,
 back:/espalda|ala|capa|dorsal|back|wing/i
};
export const SLOTS=[...SLOT_NAMES];
export function commissionIntensity(text){
 const t=String(text||'').slice(0,1400);
 const modifier=/gigante|imponente|enorme|heroic|colosal|masiv/i.test(t)?.11:
   /ligero|sutil|delicad|fino|minimal/i.test(t)?-.12:0;
 return Object.fromEntries(SLOT_NAMES.map(slot=>{
  const focus=MATCH[slot].test(t)?.08:-.04;
  const n=DEFAULT[slot]+focus+modifier;
  return [slot,Math.max(.15,Math.min(1.3,Math.round(n*100)/100))];
 }));
}
export function commissionRecipe(text,{intensity=null,palette=null}={}){
 const brief=String(text||'').trim().replace(/\s+/g,' ');
 if(brief.length<12)throw Error('Describí la transformación con al menos 12 caracteres.');
 if(brief.length>1000)throw Error('El encargo excede 1000 caracteres.');
 const settings=intensity??commissionIntensity(brief);
 if(SLOT_NAMES.some(slot=>!Number.isFinite(settings[slot])||settings[slot]<.15||settings[slot]>1.3))
  throw Error('Los controles de geometría están fuera del rango seguro.');
 const colors=palette??{enamel:'#314f74',metal:'#d4a953',accent:'#70d5e6'};
 if(Object.keys(colors).sort().join(',')!=='accent,enamel,metal'||Object.values(colors).some(c=>!/^#[0-9a-f]{6}$/i.test(c)))
  throw Error('Paleta RGB inválida.');
 return {
  schema:'highfly.skin7.paladin-source-reforge-recipe/2',
  id:'paladin-encargo-'+Math.round([...brief].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,17)),
  title:'Paladín · Encargo de cuarta estación',
  brief,
  sourceUpstreamCommit:'9b57e49c9676d75962700f828cc00a50a9a988b5',
  sourceGlbBlobSha1:'e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2',
  sourceRig:'Rig_Medium',
  palette:colors,
  slots:structuredClone(OLD_SHAPE),
  hardSurface:{style:'sacred-vanguard-hard-surface-v2',slotIntensity:Object.fromEntries(SLOT_NAMES.map(s=>[s,settings[s]]))},
  artistApproved:false,
  automatedForger:'assistant-authored-structured-recipe-followed-by-reproducible-Blender-processing',
  gameDeployAllowed:false
 };
}
