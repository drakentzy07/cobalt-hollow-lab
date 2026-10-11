/**
 * HIGHFLY SKIN 11 — TRUE ORIGINAL ARMOR FACTORY CONTRACT.
 * Independent from skin7/9/10 live deformation. This creates a verified,
 * versioned commission for a FUTURE original mesh, not a fake 3D output.
 * The authored mesh must be created from zero geometry in Blender or approved
 * generator; legacy armor is permitted for rig/fit only, never copied or warped.
 */
export const COMMISSION_SCHEMA='highfly.skin11.original-armor-commission/1';
export const ARTIFACT_SCHEMA='highfly.skin11.original-geometry-proof/1';
export const NO_GO_PROTOTYPES=['SKIN9B_REY_OSCURO_REJECTED_ART'];
export const ALLOWED_IMAGES=['image/jpeg','image/png','image/webp'];
export const SLOTS=['head','chest','armL','armR','handL','handR','waist','legL','legR','footL','footR','back'];
export const STAGES=['INPUT_RECEIVED','AI_DESIGN_PENDING','DESIGN_BLUEPRINT_READY','BLENDER_GEOMETRY_PENDING','BLENDER_GEOMETRY_CREATED','RIG_QA_PENDING','VISUAL_ART_QA_PENDING','HUMAN_ART_APPROVED','GAME_INTEGRATION_PENDING'];
const clean=(v,max=1200)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);
const fnv32=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')};
function assertSafeHex(v){return typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v)}
function checkedImage(ref){
 if(!ref)return null;
 if(typeof ref!=='object'||!ALLOWED_IMAGES.includes(ref.mime)||!Number.isInteger(ref.width)||
  !Number.isInteger(ref.height)||ref.width<32||ref.height<32||ref.width>8192||ref.height>8192||
  !/^[a-f0-9]{64}$/i.test(ref.sha256||''))
  throw Error('Referencia inválida: se necesita imagen JPG/PNG/WebP, tamaño verificable y SHA-256');
 const pal=ref.dominantColors||[];
 if(!Array.isArray(pal)||pal.length>8||pal.some(x=>!assertSafeHex(x)))throw Error('Paleta de imagen incorrecta');
 return {mime:ref.mime,width:ref.width,height:ref.height,
  sha256:ref.sha256.toLowerCase(),dominantColors:[...pal],
  pixelsUsedForSculpt:false,imageSemanticsAnalyzed:false,
  fileTransfer:'LOCAL_UNTIL_SECURE_AI_SERVICE_EXISTS'};
}
function checkedAI(design){
 if(!design)return {status:'NOT_CONNECTED',provider:null,semanticImageAnalysis:false,
  generatedMesh:false,textImageToModel:false,authority:'NONE'};
 // No browser self-asserted "AI verified". Only a trusted server should sign
 // AI plan attestations before the modeling pipeline accepts them.
 throw Error('No se admiten resultados de IA autodeclarados por el navegador');
}
function classifyWords(prompt){
 const tags=[];
 const words=[['dragon',/dragon|drag[oó]n|drac[oó]nic|escamas/i],
 ['royal',/real|rey|imperial|corona/i],['dark',/oscuro|abisal|sombr[íi]o|negro/i],
 ['celestial',/angel|celestial|sagrado|divin/i],['ice',/hielo|glacial|escarcha/i],
 ['storm',/tormenta|rayo|electric/i],['nature',/naturaleza|bosque|druid/i],
 ['tech',/futurist|mec[aá]nic|cyber|mecha/i],['samurai',/samurai|shogun|ronin/i]];
 for(const [tag,re] of words)if(re.test(prompt))tags.push(tag);
 return tags.length?tags:['custom-original'];
}
function slotIntent(slot,brief){
 const isHead=slot==='head',isArms=slot.startsWith('arm');
 const isChest=slot==='chest',isBack=slot==='back';
 return {
  slot,
  construction:'DESIGN_AND_MODEL_FROM_ZERO',
  originalMeshCopied:false,sourceTrianglesReused:0,sourceVerticesReused:0,
  sourceRig:'Rig_Medium',
  donorUse:['measure-human-anatomy','skeleton','socket-fit','weight-transfer-reference-only'],
  sculptDirection:isHead?'Casco anatómico conformado al cráneo; jamás un bloque o caja':isArms?
   'Hombros y brazos articulados, volumen que sigue la anatomía':
   isChest?'Pechera con curva torácica, esternón y abdomen legibles':
   isBack?'Espaldar y adornos con anclajes visibles':
   slot==='waist'?'Cintura y faldones separados para conservar movilidad':
   'Blindaje nuevo ajustado a la articulación real; evitar extrusiones planas',
  detailLayers:['closed-surface','beveled-secondary-rim','joint-or-attachment','ornament-sculpted'],
  requireFrontSideBack:true,maleFemaleFitRequired:true
 };
}
export function createOriginalCommission({prompt='',reference=null}={}){
 const text=clean(prompt);
 const image=checkedImage(reference);
 if(!image&&text.length<12)throw Error('Describí tu armadura en al menos 12 caracteres o adjuntá una imagen');
 if(text.length>1000)throw Error('Pedido demasiado largo (máximo 1000 caracteres)');
 const mode=image?(text.length?'text+image':'image'):'text';
 const instructions=text||'Crear diseño original de armadura siguiendo la referencia visual adjunta';
 const id='HF11-'+fnv32(JSON.stringify({instructions,imageHash:image?.sha256||'',mode}));
 return {
  schema:COMMISSION_SCHEMA,id,mode,
  input:{prompt:instructions,image,textLength:text.length,
   aiInterpretation:checkedAI(null),imageGeometryExtraction:'NOT_IMPLEMENTED'},
  uniqueness:{newGlbPerApprovedDesign:true,
   independentOfLegacyMeshes:true,legacySkinsUsedAsReferenceOnly:true,
   sourceMeshRecolorForbidden:true,sourceMeshDeformForbidden:true,
   sourceMeshRetopologyForbidden:true,oldSkin3ReadOnly:true,
   oldSkin9BRejected:true},
  design:{tags:classifyWords(instructions),
   objective:'Original high quality fitted armor, NOT a modified ClaudeCraft skin',
   requiredSlots:Object.fromEntries(SLOTS.map(s=>[s,slotIntent(s,instructions)])),
   geometryEngine:'BLENDER_OR_APPROVED_ORIGINAL_MODEL_GENERATOR',
   geometryCreated:false,artistApproved:false},
  implementationPipeline:[
   {stage:'AI_DESIGN_PENDING',needs:'Trusted AI image/text interpretation or assistant-authored concept; not supplied by this static page'},
   {stage:'DESIGN_BLUEPRINT_READY',needs:'Art-directed shapes per slot and proportion constraints'},
   {stage:'BLENDER_GEOMETRY_PENDING',needs:'Fresh independently authored Blender meshes; body/rig reference only'},
   {stage:'RIG_QA_PENDING',needs:'Rig_Medium 23 bones, 22 animation clips, original waist/shoulder clearance'},
   {stage:'VISUAL_ART_QA_PENDING',needs:'M/F front-side-back renders and explicit human approval'},
   {stage:'GAME_INTEGRATION_PENDING',needs:'Separate HIGHFLY asset integration approval'}
  ],
  currentStage:'AI_DESIGN_PENDING',
  requiredOriginalRig:'Rig_Medium',originalBoneCount:23,originalClips:22,
  provenance:{legacyReferences:['ClaudeCraft body','Rig_Medium','original armor attachment landmarks'],
    forbiddenGeometryInputs:['HF7RF_PALADIN','HF9NEW_PALADIN','Armor_paladin source triangles'],
    requestedFreshMesh:true},
  gate:{technicalApproved:false,artistApproved:false,premiumApproved:false,gameDeployAllowed:false},
  autoGenerated3D:false
 };
}
export function evaluateNewGeometry(commission,proof,{artistApproval=false}={}){
 if(!commission||commission.schema!==COMMISSION_SCHEMA)throw Error('Comisión SKIN11 inválida');
 const errors=[];
 if(!proof||proof.schema!==ARTIFACT_SCHEMA)errors.push('NEW_GLTF_NOT_PROVIDED');
 else{
  if(proof.commissionId!==commission.id)errors.push('COMMISSION_ID_MISMATCH');
  if(proof.creationMode!=='AUTHOR_FRESH_TOPOLOGY')errors.push('NOT_FRESH_TOPOLOGY');
  if(proof.sourceMeshDeformed!==false||proof.sourceTrianglesCopied!==0||
   proof.sourceVerticesCopied!==0)errors.push('LEGACY_GEOMETRY_CONTAMINATION');
  if(proof.legacyPrototypeId&&NO_GO_PROTOTYPES.includes(proof.legacyPrototypeId))
   errors.push('REJECTED_ART_PROTOTYPE');
  if(proof.armorSlots!==12)errors.push('TWELVE_INDEPENDENT_ARMOR_SLOTS_REQUIRED');
  if(proof.rigBoneCount!==23||proof.animationClips!==22)errors.push('CLAUDECRAFT_RIG_AND_22_CLIPS_REQUIRED');
  if(proof.maleFemaleScreenshots!==true||proof.frontSideBackScreenshots!==true)
   errors.push('ALL_GENDERS_AND_ANGLES_REQUIRED');
  if(proof.anatomyFitMeasured!==true||proof.floatingComponents===true||
    (Number.isFinite(proof.severeClipFrames)?proof.severeClipFrames!==0:true))
   errors.push('ANATOMY_OR_COLLISION_NOGO');
 }
 if(!artistApproval)errors.push('HUMAN_ART_APPROVAL_PENDING');
 return {technicalPass:errors.filter(x=>x!=='HUMAN_ART_APPROVAL_PENDING').length===0,
  artistApproved:errors.length===0&&artistApproval,gameDeployAllowed:false,
  status:errors.length?'NO_GO':'ART_APPROVED_PENDING_GAME_QA',errors};
}
