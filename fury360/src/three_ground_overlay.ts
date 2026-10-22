/**
 * HIGHFLY FURY F2 — an opt-in Three.js ground telegraph renderer.
 * Uses the host's existing THREE constructors and Scene. No second canvas,
 * render loop, camera, player controller or physics engine.
 */
import { raiseFuryPreview } from './skill_preview.ts';
import type { FuryGroundPreview, FuryRaisedPreview, FuryPoint3, FuryPreviewTone } from './skill_preview.ts';

export interface FuryBufferAttribute {
  readonly array: Float32Array;
  needsUpdate: boolean;
  setUsage?(usage:number): FuryBufferAttribute;
}
export interface FuryBufferGeometry {
  setAttribute(name:'position', attribute:FuryBufferAttribute):void;
  setDrawRange(start:number,count:number):void;
  dispose():void;
}
export interface FuryMaterial {
  color?: { setHex(hex:number):void };
  dispose():void;
}
export interface FuryRenderObject {
  visible:boolean;
}
export interface FuryThreeFacade {
  BufferGeometry: new() => FuryBufferGeometry;
  BufferAttribute: new(array:Float32Array,itemSize:number) => FuryBufferAttribute;
  MeshBasicMaterial: new(params:Record<string,number|boolean>) => FuryMaterial;
  LineBasicMaterial: new(params:Record<string,number|boolean>) => FuryMaterial;
  Mesh: new(geometry:FuryBufferGeometry, material:FuryMaterial)=>FuryRenderObject;
  Line: new(geometry:FuryBufferGeometry, material:FuryMaterial)=>FuryRenderObject;
  DoubleSide:number;
  DynamicDrawUsage?:number;
}
export interface FuryOverlayScene {
  add(obj:FuryRenderObject):void;
  remove(obj:FuryRenderObject):void;
}
export interface FuryThreeOverlayOptions {
  readonly terrainHeightAt:(x:number,z:number)=>number;
  /** World-space height offset to avoid z-fighting. */
  readonly groundLift?:number;
  /** Optional existing world-scene root, never an additional scene. */
  readonly scene:FuryOverlayScene;
  readonly three:FuryThreeFacade;
}
interface OverlayBuffer {
  readonly geometry:FuryBufferGeometry;
  readonly attribute:FuryBufferAttribute;
  readonly material:FuryMaterial;
  readonly object:FuryRenderObject;
  readonly maxVertices:number;
}
const MAX_POLYGON = 64; // skill_preview.ts bounds samples to 48.
const TONE_COLORS:Record<FuryPreviewTone,number>={
  offensive:0x3da6ff, friendly:0x31d59d, mobility:0xffc857,
};
function createBuffer(
  opts:FuryThreeOverlayOptions, kind:'fill'|'line',maxVertices:number,
):OverlayBuffer {
  const {three,scene}=opts;
  const geometry=new three.BufferGeometry();
  const attribute=new three.BufferAttribute(new Float32Array(maxVertices*3),3);
  if (three.DynamicDrawUsage!==undefined) attribute.setUsage?.(three.DynamicDrawUsage);
  geometry.setAttribute('position',attribute);
  geometry.setDrawRange(0,0);
  const material=kind==='fill'
    ? new three.MeshBasicMaterial({color:TONE_COLORS.offensive,
      transparent:true,opacity:0.20,depthTest:true,depthWrite:false,side:three.DoubleSide})
    : new three.LineBasicMaterial({color:TONE_COLORS.offensive,
      transparent:true,opacity:0.95,depthTest:true,depthWrite:false});
  const object=kind==='fill'
    ? new three.Mesh(geometry,material) : new three.Line(geometry,material);
  object.visible=false;
  scene.add(object);
  return {geometry,attribute,material,object,maxVertices};
}
function writeVertices(buffer:OverlayBuffer,points: readonly FuryPoint3[]):boolean {
  if(points.length>buffer.maxVertices) return false;
  const arr=buffer.attribute.array;
  let off=0;
  for(const p of points){
    if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.z)) return false;
    arr[off++]=p.x;arr[off++]=p.y;arr[off++]=p.z;
  }
  buffer.geometry.setDrawRange(0,points.length);
  buffer.attribute.needsUpdate=true;
  buffer.object.visible=points.length>=2;
  return true;
}
/** Convex ring triangulation, without changing any skill hitbox. */
function triangulate(points:readonly FuryPoint3[]):FuryPoint3[] {
  if(points.length<3)return [];
  const centroid={x:0,y:0,z:0};
  for(const p of points){centroid.x+=p.x;centroid.y+=p.y;centroid.z+=p.z;}
  centroid.x/=points.length;centroid.y/=points.length;centroid.z/=points.length;
  const tris:FuryPoint3[]=[];
  for(let i=0;i<points.length;i++){
    tris.push(centroid,points[i],points[(i+1)%points.length]);
  }
  return tris;
}
/**
 * Reuses 3 GPU buffers across all pointer moves (no per-frame material rebuild).
 * Scene ownership stays with the existing ClaudeCraft renderer.
 */
export class FuryThreeGroundOverlay {
  private buffers: {fill:OverlayBuffer;outline:OverlayBuffer;trajectory:OverlayBuffer}|null=null;
  private readonly opts:FuryThreeOverlayOptions;
  constructor(opts:FuryThreeOverlayOptions) { this.opts=opts; }
  private ensureBuffers(){
    if(this.buffers)return this.buffers;
    this.buffers={
      fill:createBuffer(this.opts,'fill',MAX_POLYGON*3),
      outline:createBuffer(this.opts,'line',MAX_POLYGON+1),
      trajectory:createBuffer(this.opts,'line',2),
    };
    return this.buffers;
  }
  show(preview:FuryGroundPreview|null):boolean {
    if(!preview){this.hide();return false;}
    const points=raiseFuryPreview(preview,this.opts.terrainHeightAt,this.opts.groundLift??0.07);
    if(!points){this.hide();return false;}
    const b=this.ensureBuffers();
    const filled=triangulate(points.fill);
    const ok=writeVertices(b.fill,filled) &&
      writeVertices(b.outline,points.outline) &&
      writeVertices(b.trajectory,points.trajectory);
    if(!ok){this.hide();return false;}
    const color=TONE_COLORS[preview.tone]??TONE_COLORS.offensive;
    b.fill.material.color?.setHex(color);
    b.outline.material.color?.setHex(color);
    b.trajectory.material.color?.setHex(color);
    b.fill.object.visible=filled.length>=3;
    return true;
  }
  hide():void {
    if(!this.buffers)return;
    for(const b of Object.values(this.buffers)){
      b.object.visible=false;
      b.geometry.setDrawRange(0,0);
    }
  }
  dispose():void {
    if(!this.buffers)return;
    for(const b of Object.values(this.buffers)){
      this.opts.scene.remove(b.object);
      b.geometry.dispose();
      b.material.dispose();
    }
    this.buffers=null;
  }
}
