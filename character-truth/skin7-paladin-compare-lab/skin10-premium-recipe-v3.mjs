/**
 * HIGHFLY SKIN10 — Premium structural recipe V3.
 * This produces an AUTHORED MODELING BLUEPRINT, not a fake generated GLB.
 * The bad SKIN9-B box/crown is permanently ART NO-GO, even after green CI.
 */
import {parseArmorIntent} from './skin9-armor-core.mjs';
export const PREMIUM_SCHEMA='highfly.skin10.premium-armor-recipe/3';
export const PROTOTYPE_NO_GO='SKIN9B_REY_OSCURO_REJECTED_ART';
export const ELEVEN=['head','chest','back','armL','armR','handL','handR','legL','legR','footL','footR'];
const SLOT_GROUP={head:'head',chest:'chest',back:'back',armL:'arms',armR:'arms',
 handL:'hands',handR:'hands',legL:'legs',legR:'legs',footL:'feet',footR:'feet'};
const DONORS={head:'Armor_paladin_Head',chest:'Armor_paladin_Chest',back:'Armor_paladin_Back',
 armL:'Armor_paladin_ArmL',armR:'Armor_paladin_ArmR',handL:'Armor_paladin_HandL',
 handR:'Armor_paladin_HandR',legL:'Armor_paladin_LegL',legR:'Armor_paladin_LegR',
 footL:'Armor_paladin_FootL',footR:'Armor_paladin_FootR'};
const REFERENCES={head:'M_Head',chest:'M_Torso',back:'M_Torso',armL:'M_ArmL',
 armR:'M_ArmR',handL:'M_HandL',handR:'M_HandR',legL:'M_LegL',
 legR:'M_LegR',footL:'M_FootL',footR:'M_FootR'};
const STYLE_LIBRARY={
 dragon:{motif:'escamas superpuestas y crestas siguiendo la anatomía',head:'casco bajo de mandíbula dracónica con cuernos retráctiles',arms:'hombreras escamadas de volumen controlado',back:'espina dorsal en placas articuladas'},
 royal:{motif:'filigrana, heráldica y metal grabado',head:'casco noble bajo con corona fusionada al perímetro',arms:'hombreras facetadas con bordes reales',back:'manto segmentado unido al peto'},
 shadow:{motif:'acero negro con biseles de luz y líneas discretas',head:'visera oscura profunda sin ocultar la anatomía',arms:'acero sombreado de perfil elegante',back:'capa corta reforzada y bien sujeta'},
 celestial:{motif:'plumas metálicas y grabados luminosos de moderado relieve',head:'diadema delgada integrada al casco',arms:'hombreras en capas emplumadas controladas',back:'lamelas luminosas ancladas'},
 frost:{motif:'acero templado y cristal facetado embebido',head:'casco aerodinámico con ceja helada',arms:'hombreras escarchadas con cristales bajos',back:'placas segmentadas de hielo opaco'},
 storm:{motif:'canales de energía rebajados entre placas',head:'máscara con líneas de descarga',arms:'capas de metal que conducen energía',back:'conductores gemelos embebidos'},
 nature:{motif:'lamelas orgánicas, vetas y uniones vegetales reales',head:'visera de corteza reforzada',arms:'hombreras como hojas laminadas',back:'raíces talladas en una espaldera'},
 samurai:{motif:'lamelar atado, biseles y cordonería marcada',head:'kabuto ajustado con cresta delgada',arms:'sode articuladas sin voladizos enormes',back:'placas dorsal lamelares'},
 tech:{motif:'juntas mecánicas y paneles de metal mecanizado',head:'casco tecnológico de visor empotrado',arms:'módulos intercambiables pegados al hombro',back:'columna de disipación compacta'},
 demon:{motif:'placas irregulares, textura ósea y metal profundo',head:'rostro demoníaco esculpido con cuernos proporcionados',arms:'bordes amenazantes redondeados y seguros',back:'espinas cortas incrustadas'},
 crystal:{motif:'gemas talladas embebidas y metal pulido',head:'prismas integrados y bajos',arms:'carcasas poligonales biseladas',back:'estructura de cristales cortos'},
 warrior:{motif:'acero martillado, remaches y correajes',head:'casco de batalla bien ajustado',arms:'hombreras de combate reforzadas',back:'espaldar blindado compacto'}
};
const PRIMARY={
 head:'Calota anatómica de doble curvatura; frente definida, visera articulada, reborde y mentón encastrados.',
 chest:'Pechera curva envolviendo pectorales; esternón y abdomen en piezas independientes con cintura legible.',
 back:'Espaldar siguiendo omóplatos; anclar adornos a columna y hombros mediante uniones visibles.',
 armL:'Hombrera sobre deltoides izquierdo, brazo visible, juntas de axila libres.',
 armR:'Hombrera sobre deltoides derecho, brazo visible, juntas de axila libres.',
 handL:'Guantelete articulado izquierdo con nudillos legibles y muñeca despejada.',
 handR:'Guantelete articulado derecho con nudillos legibles y muñeca despejada.',
 legL:'Muslera y greba izquierdas separadas por rodillera, tobillo móvil.',
 legR:'Muslera y greba derechas separadas por rodillera, tobillo móvil.',
 footL:'Bota blindada izquierda siguiendo empeine, punta, talón y articulación.',
 footR:'Bota blindada derecha siguiendo empeine, punta, talón y articulación.'
};
const ATTACH={
 head:['neck','chest'],chest:['neck','waist','armL','armR','back'],back:['chest','shoulderL','shoulderR'],
 armL:['chest','handL'],armR:['chest','handR'],handL:['armL'],handR:['armR'],
 legL:['waist','footL'],legR:['waist','footR'],footL:['legL'],footR:['legR']
};
const STRICT_LIMITS={
 headHeightToOriginalHead:1.15,headWidthToOriginalHead:1.16,
 shoulderSpanToOriginalShoulderSpan:1.24,
 totalArmoredWidthToOriginalBodyWidth:1.44,
 feetWidthToOriginalFootWidth:1.17,
 maxUnattachedComponentGapMeters:.035,
 maxSevereClippingFrames:0,
 maxNakedHeadPixelsWhenClosedHelmet:0
};
const rejectNotes=[
 'Casco desproporcionado, caja o rectángulo sobre el cráneo',
 'Cabeza desnuda o piel blanca visible cuando se exige visor cerrado',
 'Alas, corona o espalda como placas bidimensionales flotantes',
 'Volumen nuevo sin pecho, cintura, brazos y piernas reconocibles',
 'Puntas que atraviesan el rostro, cuello, hombro o la mano',
 'Recolorear una skin existente y declararla una armadura inédita',
 'No respetar las 22 animaciones ni encastre masculino/femenino',
 'Aceptar solo porque GitHub Actions terminó GREEN'
];
const clean=(s,max=1000)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,max);
function validateIntent(intent){
 if(!intent||!Array.isArray(intent.themes)||!intent.intensity||!intent.palette||typeof intent.brief!=='string')
  throw Error('Se necesita una interpretación SKIN9 válida como entrada');
 if(!intent.brief||intent.brief.length>1000)throw Error('Descripción requerida');
 return intent;
}
export function buildPremiumV3(intent,options={}){
 const x=validateIntent(intent);
 const style=x.themes.find(t=>STYLE_LIBRARY[t])||'warrior';
 const motif=STYLE_LIBRARY[style];
 const designName=clean(options.name||'HIGHFLY · '+x.themes.join('+')+' · diseño original',90);
 const pieces=Object.fromEntries(ELEVEN.map(k=>{
  const group=SLOT_GROUP[k];
  const side=k.endsWith('L')?'left':k.endsWith('R')?'right':'central';
  const themeForm=group==='head'?motif.head:group==='arms'?motif.arms:group==='back'?motif.back:motif.motif;
  const explicitShape=x.slotShapes?.[group]||[];
  return [k,{
   id:k,side,donorNativeMesh:DONORS[k],anatomyReference:REFERENCES[k],
   designPurpose:PRIMARY[k],
   requestedForms:explicitShape,
   styleInstructions:themeForm,
   materialPalette:{...x.palette},
   assemblyTo:ATTACH[k],
   steps:[
    'Medir en coordenadas locales el cuerpo ClaudeCraft y capturar encastre al hueso original.',
    'Dibujar perfil frontal, lateral y posterior con masa y curvatura anatómica.',
    'Modelar pieza principal cerrada en 3D (no planos extruidos ni cajas), con espesores realistas.',
    'Añadir biseles, borde secundario, articulación y relieve material respetando jerarquía visual.',
    'Transferir influencias del Rig_Medium, inspeccionar colisiones por movimiento y simetría.'
   ],
   requiredDetailLayers:['shell-curved','bevel-edge','secondary-panel','engraving-or-inset'],
   prohibit:['bounding-box-polygon-as-final','floating-panel','source-triangle-recolor'],
   // Existing browser editor deformation is a preview only, never a new topology.
   previewIntensity:x.intensity[group],requiresFreshBlenderGeometry:true
  }];
 }));
 return {
  schema:PREMIUM_SCHEMA,recipeRevision:3,name:designName,
  origin:{text:x.brief,kind:'text-to-structural-blueprint',imagePaletteUsed:!!x.imagePaletteUsed,
   imageGeometryAnalyzed:false,sourceRig:'Rig_Medium',originalAnimations:22},
  style:{primary:style,themes:[...x.themes],mood:x.mood,materialMood:x.materials,
   motif:motif.motif,palette:{...x.palette}},
  silhouette:{
   overall:'heroic-readable-anatomical',helmet:'fitted-proportional',
   waist:'clearly-visible',armsAndLegs:'distinct-articulated',back:'physically-joined',
   forbidGiantBoxes:true,forbidUnattachedFloatingShapes:true
  },
  anatomyConstraints:{units:'ratios-to-native-male-and-female-body-references',
   referenceMode:'actual-ClaudeCraft-mesh-measurements-NOT-armor-bounding-boxes',
   hardLimits:{...STRICT_LIMITS}},
  pieces,assemblyRules:{
   originalRig:'Rig_Medium',preserve23Joints:true,preserve22Clips:true,
   attachmentRequiresVisualJoint:true,allowSourceMeshAsMeasurementOnly:true,
   independentFourthActor:true,originalThirdActorUnchanged:true,
   maleFemaleFitRequired:true,criticalAnimations:['Idle','Block_1H','Melee_Attack_1H'],
   allClipsChecked:22
  },
  craftStandards:{
   topology:'closed-curved-volume',smoothShading:'flat-smooth-hybrid',
   minimumDetailLayersPerSlot:4,
   materialGuidance:'base-metal, contrasting trim, inlaid accents; not a flat RGB replacement',
   silhouetteViews:['front','side','back'],
   prohibitedMethods:['polygon-outline-extruded-from-old-bbox','giant-cardboard-crown','third-skin-recolor']
  },
  artGate:{
   rejectionReasons:[...rejectNotes],
   rejectKnownPrototype:PROTOTYPE_NO_GO,
   objectiveGeometryQA:'PENDING_MODEL_AND_MEASUREMENT',
   visualReview:'PENDING_EXPLICIT_HUMAN_APPROVAL',
   userApproved:false,gameDeployAllowed:false,
   technicalCIIsNotArtApproval:true,version:'premium-v3-gate-1'
  },
  exports:{target:'blender-authored-new-eleven-slot-skinned-glb',
   status:'BLUEPRINT_NOT_YET_MODELED',gameDeployAllowed:false}
 };
}
export function buildPremiumFromText(prompt,options){
 return buildPremiumV3(parseArmorIntent(prompt),options);
}
/**
 * Hard gate requires measured values and explicit external artwork approval.
 * A green CI may report structural pass, NEVER artistic approval by itself.
 */
export function checkPremiumCandidate(recipe,metrics,{humanApproved=false}={}){
 if(!recipe||recipe.schema!==PREMIUM_SCHEMA)throw Error('Premium V3 recipe missing');
 const reasons=[];
 if(!metrics||typeof metrics!=='object')reasons.push('NO_GEOMETRY_MEASUREMENTS');
 else {
  if(metrics.candidateId===PROTOTYPE_NO_GO)reasons.push('REJECTED_SKIN9B_PROTOTYPE');
  const limits=recipe.anatomyConstraints.hardLimits;
  for(const k of ['headHeightToOriginalHead','headWidthToOriginalHead','shoulderSpanToOriginalShoulderSpan',
   'totalArmoredWidthToOriginalBodyWidth','feetWidthToOriginalFootWidth',
   'maxUnattachedComponentGapMeters','maxSevereClippingFrames','maxNakedHeadPixelsWhenClosedHelmet']){
   if(typeof metrics[k]!=='number'||!Number.isFinite(metrics[k]))reasons.push('MISSING_MEASUREMENT:'+k);
   else if(metrics[k]>limits[k])reasons.push('PROPORTION_OR_CLEARANCE_NO_GO:'+k);
  }
  if(metrics.skinnedArmorPieces!==11)reasons.push('ELEVEN_SKINNED_PIECES_REQUIRED');
  if(metrics.rigJointCount!==23)reasons.push('ORIGINAL_23_JOINTS_REQUIRED');
  if(metrics.originalClipCount!==22)reasons.push('ORIGINAL_22_CLIPS_REQUIRED');
  if(metrics.originalThirdHashUnchanged!==true)reasons.push('THIRD_SKIN_MUST_REMAIN_UNCHANGED');
  if(metrics.maleAndFemaleVisualProof!==true)reasons.push('MALE_FEMALE_SCREENSHOTS_REQUIRED');
  if(metrics.frontSideBackScreenshots!==true)reasons.push('THREE_CAMERA_ANGLES_REQUIRED');
 }
 if(!humanApproved)reasons.push('EXPLICIT_HUMAN_ART_APPROVAL_REQUIRED');
 return {schema:'highfly.skin10.art-gate-result/1',
  technicalMeasurementsPass:reasons.filter(x=>x!=='EXPLICIT_HUMAN_ART_APPROVAL_REQUIRED').length===0,
  artistApproved:reasons.length===0&&humanApproved,
  gameDeployAllowed:false, // Game integration requires an independent gameplay/asset approval.
  status:reasons.length?'NO_GO':'ART_QA_PASSED_PENDING_GAME_INTEGRATION',
  reasons
 };
}
export function legacyPrototypeVerdict(){
 return {candidateId:PROTOTYPE_NO_GO,verdict:'REJECTED_ART',technicalCI:'GREEN_BUT_NOT_ART_APPROVED',
  reasons:['oversized-crown','unreadable-torso','exposed-base-head','floating-back-plates','low-art-quality'],
  gameDeployAllowed:false,templateReusableAsPremium:false,modelReusedForNewPremium:false};
}
