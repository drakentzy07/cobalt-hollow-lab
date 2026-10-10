/**
 * SKIN7 artisan catalog: real immutable local reviewed designs with finished edited GLBs.
 * NO game deploy, NO network/upload/overwrite, NO false production QA assertion.
 * IndexedDB storage is per browser/device/origin, export your GLBs separately to keep copies.
 */
const DB='highfly.skin7.artisan-catalog';const STORE='approved';const VERSION=1;
const validRecord=r=>r&&r.schema==='highfly.skin7.reviewed-design/1'&&
 typeof r.id==='string'&&r.id.length>5&&
 typeof r.sha256==='string'&&/^[a-f0-9]{64}$/i.test(r.sha256)&&
 r.approvedBy==='user-local-art-choice'&&r.gameDeployed===false&&
 r.technicalUnityCertified===false;
function db(){
 if(typeof indexedDB==='undefined')return Promise.reject(Error('SKIN7_INDEXEDDB_NOT_SUPPORTED'));
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,VERSION);
  req.onerror=()=>reject(req.error||Error('SKIN7_DB_OPEN_FAILED'));
  req.onupgradeneeded=()=>{
   const d=req.result;if(!d.objectStoreNames.contains(STORE)){
    const s=d.createObjectStore(STORE,{keyPath:'id'});
    s.createIndex('createdAt','createdAt',{unique:false});
   }
  };
  req.onsuccess=()=>resolve(req.result);
 });
}
function once(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
const transaction=(d,mode)=>d.transaction(STORE,mode).objectStore(STORE);
async function sha(bytes){
 const raw=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(raw)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function approveInLocalCatalog({design,prompt,profile,glb}){
 if(!design||!glb||!['crimson','guardian'].includes(profile)||
   typeof prompt!=='string'||prompt.length>1800)throw Error('SKIN7_CATALOG_INVALID_INPUT');
 const buf=glb instanceof Uint8Array?glb:new Uint8Array(glb);
 if(buf.byteLength<15000||buf.byteLength>7000000)throw Error('SKIN7_INVALID_AUTHORED_GLB_SIZE');
 const digest=await sha(buf);
 const r={schema:'highfly.skin7.reviewed-design/1',
  id:crypto.randomUUID(),createdAt:new Date().toISOString(),
  sha256:digest,title:design.title,profile,prompt,design:structuredClone(design),
  approvedBy:'user-local-art-choice',gameDeployed:false,technicalUnityCertified:false,
  productionPublished:false,artReviewedLocally:true,glb:new Blob([buf],{type:'model/gltf-binary'})};
 if(!validRecord(r))throw Error('SKIN7_REVIEW_RECORD_INVALID');
 const database=await db();
 try{
  const old=await once(transaction(database,'readonly').get(r.id));
  if(old)throw Error('SKIN7_CATALOG_IMMUTABLE_ID_COLLISION');
  await once(transaction(database,'readwrite').add(r));
 }finally{database.close()}
 const {glb:unused,...metadata}=r;return metadata;
}
export async function catalogList(){
 const database=await db();
 try{
  const rows=await once(transaction(database,'readonly').getAll());
  return rows.filter(validRecord).map(({glb,...rest})=>rest)
   .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 }finally{database.close()}
}
export async function catalogGet(id){
 if(typeof id!=='string'||id.length>90)throw Error('SKIN7_BAD_CATALOG_ID');
 const database=await db();
 try{
  const entry=await once(transaction(database,'readonly').get(id));
  if(!validRecord(entry))throw Error('SKIN7_CATALOG_ID_NOT_FOUND');
  const data=new Uint8Array(await entry.glb.arrayBuffer());
  if(await sha(data)!==entry.sha256)throw Error('SKIN7_CATALOG_CORRUPT_GLB');
  return {...entry,glb:data};
 }finally{database.close()}
}
export async function catalogExport(id){
 const entry=await catalogGet(id);
 return {name:'HIGHFLY-SKIN7-'+entry.profile+'-'+entry.id.slice(0,8)+'.glb',
  bytes:entry.glb,meta:Object.fromEntries(Object.entries(entry).filter(([k])=>k!=='glb'))};
}
