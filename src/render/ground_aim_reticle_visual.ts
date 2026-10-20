import * as THREE from 'three';
import { floorVfxRenderOrder } from './floor_vfx_layer';
import { type GroundAimGeometryState, sameGroundAimGeometry } from './ground_aim_reticle_core';

const SEGMENTS = 96;
// Refusal red, deliberately outside the school palette.
const BLOCKED_RETICLE_COLOR = 0xd94040;
const INNER_GUIDE_RATIO = 0.62;
const BAND_INNER_RATIO = 0.82;
const OUTER_LIFT = 0.08;
const INNER_LIFT = 0.075;
const BAND_LIFT = 0.055;
const TICK_LIFT = 0.09;
const PULSE_HZ = 2;

export interface GroundAimVisualState {
  x: number;
  z: number;
  radius: number;
  color: number;
  dimmed: boolean;
  blocked?: boolean;
  shape?: 'line'|'cone'|'circle'|'leap';
  originX?:number;
  originZ?:number;
}

/** Terrain-draped ground targeting guide. Its outer edge is the gameplay radius. */
export class GroundAimReticleVisual {
  readonly group = new THREE.Group();

  private readonly outerGeometry = circleGeometry();
  private readonly innerGeometry = circleGeometry();
  private readonly bandGeometry = bandGeometry();
  private readonly tickGeometry = tickGeometry();
  private readonly outerMaterial = lineMaterial();
  private readonly innerMaterial = lineMaterial();
  private readonly bandMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  private readonly tickMaterial = lineMaterial();
  private readonly directionalMaterial = lineMaterial();
  private readonly directionalGeometry = new THREE.BufferGeometry();
  private readonly directionalLine = new THREE.LineSegments(this.directionalGeometry,this.directionalMaterial);
  private readonly outer: THREE.LineLoop;
  private readonly inner: THREE.LineLoop;
  private readonly band: THREE.Mesh;
  private readonly ticks: THREE.LineSegments;
  private elapsed = 0;
  private dimmed = false;
  private disposed = false;
  private readonly geometryState: GroundAimGeometryState = {
    x: Number.NaN,
    z: Number.NaN,
    radius: Number.NaN,
  };

  constructor(
    private readonly scene: THREE.Scene,
    private readonly heightAt: (x: number, z: number) => number,
    private readonly colorBoost = 1,
  ) {
    this.group.name = 'ground-aim-reticle';
    this.group.visible = false;
    this.directionalGeometry.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(256*3),3));
    this.directionalGeometry.setDrawRange(0,0);
    this.directionalLine.name='highfly-f24-ground-direction';
    this.directionalLine.frustumCulled=false;
    this.directionalLine.renderOrder=floorVfxRenderOrder('reticle',0);

    this.band = new THREE.Mesh(this.bandGeometry, this.bandMaterial);
    this.band.name = 'ground-aim-band';
    this.outer = new THREE.LineLoop(this.outerGeometry, this.outerMaterial);
    this.outer.name = 'ground-aim-outer-edge';
    this.inner = new THREE.LineLoop(this.innerGeometry, this.innerMaterial);
    this.inner.name = 'ground-aim-inner-guide';
    this.ticks = new THREE.LineSegments(this.tickGeometry, this.tickMaterial);
    this.ticks.name = 'ground-aim-ticks';

    for (const object of [this.band, this.outer, this.inner, this.ticks]) {
      object.frustumCulled = false;
      object.renderOrder = floorVfxRenderOrder('reticle', 0);
      this.group.add(object);
    }
    this.group.add(this.directionalLine);
    this.scene.add(this.group);
  }

  setAim(aim: GroundAimVisualState | null): void {
    if (this.disposed) return;
    if (!aim) {
      this.group.visible = false;
      this.geometryState.x = Number.NaN;
      this.geometryState.z = Number.NaN;
      this.geometryState.radius = Number.NaN;
      this.directionalGeometry.setDrawRange(0,0);
      return;
    }

    const radius = Math.max(0, aim.radius);
    if (!sameGroundAimGeometry(this.geometryState, aim.x, aim.z, radius)) {
      this.rebuild(aim.x, aim.z, radius);
      this.geometryState.x = aim.x;
      this.geometryState.z = aim.z;
      this.geometryState.radius = radius;
    }
    this.rebuildDirectional(aim);
    this.dimmed = aim.dimmed || aim.blocked === true;
    // A blocked aim (inside the ability's minimum range) will be REFUSED at
    // commit, so it drops the school identity for a refusal red; a merely
    // dimmed aim still casts and keeps its school color.
    const color = aim.blocked ? BLOCKED_RETICLE_COLOR : aim.color;
    for (const material of [
      this.outerMaterial,
      this.innerMaterial,
      this.bandMaterial,
      this.tickMaterial,
      this.directionalMaterial,
    ]) {
      material.color.setHex(color);
      material.color.multiplyScalar(this.colorBoost);
    }
    this.group.visible = true;
    this.applyOpacity();
  }

  update(dt: number): void {
    if (!this.group.visible || this.disposed) return;
    this.elapsed += Math.max(0, dt);
    this.applyOpacity();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.remove(this.group);
    this.outerGeometry.dispose();
    this.innerGeometry.dispose();
    this.bandGeometry.dispose();
    this.tickGeometry.dispose();
    this.outerMaterial.dispose();
    this.innerMaterial.dispose();
    this.bandMaterial.dispose();
    this.tickMaterial.dispose();
    this.directionalMaterial.dispose();
    this.directionalGeometry.dispose();
  }

  /** An actual terrain-draped aiming line / cone. Circular and leap skills
   * retain the donor's original ground ring. No camera-facing 2D substitute. */
  private rebuildDirectional(aim:GroundAimVisualState):void{
    const shape=aim.shape;
    const p=this.directionalGeometry.getAttribute('position') as THREE.BufferAttribute;
    if(!shape||shape==='circle'||shape==='leap' ||
       !Number.isFinite(aim.originX)||!Number.isFinite(aim.originZ)){
      this.directionalGeometry.setDrawRange(0,0);return;
    }
    const x=aim.originX!,z=aim.originZ!,dx=aim.x-x,dz=aim.z-z;
    const len=Math.hypot(dx,dz);
    if(len<0.05){this.directionalGeometry.setDrawRange(0,0);return;}
    const ux=dx/len,uz=dz/len;
    let i=0;
    const v=(ax:number,az:number)=>{
      if(i+3>p.count*3)return;
      p.setXYZ(i++,ax,this.heightAt(ax,az)+0.105,az);
    };
    const segment=(ax:number,az:number,bx:number,bz:number)=>{
      v(ax,az);v(bx,bz);
    };
    if(shape==='line'){
      const width=0.48;
      for(const sign of [-1,1]){
        const off=width*sign,ox=-uz*off,oz=ux*off;
        segment(x+ox,z+oz,aim.x+ox,aim.z+oz);
      }
      segment(aim.x-ux*0.9-uz*1,aim.z-uz*0.9+ux*1,aim.x,aim.z);
      segment(aim.x-ux*0.9+uz*1,aim.z-uz*0.9-ux*1,aim.x,aim.z);
    }else if(shape==='cone'){
      const facing=Math.atan2(ux,uz),angle=0.43;
      const at=(theta:number)=>({x:x+Math.sin(theta)*len,z:z+Math.cos(theta)*len});
      const left=at(facing-angle),right=at(facing+angle);
      segment(x,z,left.x,left.z);segment(x,z,right.x,right.z);
      let prev=left;
      for(let k=1;k<=14;k++){
        const next=at(facing-angle+2*angle*k/14);
        segment(prev.x,prev.z,next.x,next.z);prev=next;
      }
    }
    this.directionalGeometry.setDrawRange(0,i);
    p.needsUpdate=true;
  }

  private rebuild(x: number, z: number, radius: number): void {
    writeCircle(this.outerGeometry, x, z, radius, OUTER_LIFT, this.heightAt);
    writeCircle(this.innerGeometry, x, z, radius * INNER_GUIDE_RATIO, INNER_LIFT, this.heightAt);
    writeBand(this.bandGeometry, x, z, radius, this.heightAt);
    writeTicks(this.tickGeometry, x, z, radius, this.heightAt);
  }

  private applyOpacity(): void {
    const pulse = 0.65 + 0.15 * Math.sin(this.elapsed * Math.PI * 2 * PULSE_HZ);
    const dim = this.dimmed ? 0.45 : 1;
    this.outerMaterial.opacity = pulse * dim;
    this.innerMaterial.opacity = pulse * 0.52 * dim;
    this.bandMaterial.opacity = pulse * 0.15 * dim;
    this.tickMaterial.opacity = pulse * 0.82 * dim;
    this.directionalMaterial.opacity=pulse*0.95*dim;
  }
}

function lineMaterial(): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
}

function circleGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEGMENTS * 3), 3));
  return geometry;
}

function bandGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(SEGMENTS * 2 * 3), 3),
  );
  const indices = new Uint16Array(SEGMENTS * 6);
  for (let i = 0; i < SEGMENTS; i++) {
    const next = (i + 1) % SEGMENTS;
    const offset = i * 6;
    const inner = i * 2;
    const outer = inner + 1;
    const nextInner = next * 2;
    const nextOuter = nextInner + 1;
    indices.set([inner, outer, nextOuter, inner, nextOuter, nextInner], offset);
  }
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}

function tickGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 2 * 3), 3));
  return geometry;
}

function writeCircle(
  geometry: THREE.BufferGeometry,
  cx: number,
  cz: number,
  radius: number,
  lift: number,
  heightAt: (x: number, z: number) => number,
): void {
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < SEGMENTS; i++) {
    const angle = (i / SEGMENTS) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const z = cz + Math.sin(angle) * radius;
    positions.setXYZ(i, x, heightAt(x, z) + lift, z);
  }
  positions.needsUpdate = true;
}

function writeBand(
  geometry: THREE.BufferGeometry,
  cx: number,
  cz: number,
  radius: number,
  heightAt: (x: number, z: number) => number,
): void {
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < SEGMENTS; i++) {
    const angle = (i / SEGMENTS) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let edge = 0; edge < 2; edge++) {
      const edgeRadius = radius * (edge === 0 ? BAND_INNER_RATIO : 1);
      const x = cx + cos * edgeRadius;
      const z = cz + sin * edgeRadius;
      positions.setXYZ(i * 2 + edge, x, heightAt(x, z) + BAND_LIFT, z);
    }
  }
  positions.needsUpdate = true;
}

function writeTicks(
  geometry: THREE.BufferGeometry,
  cx: number,
  cz: number,
  radius: number,
  heightAt: (x: number, z: number) => number,
): void {
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let end = 0; end < 2; end++) {
      const tickRadius = radius * (end === 0 ? BAND_INNER_RATIO : 1.04);
      const x = cx + cos * tickRadius;
      const z = cz + sin * tickRadius;
      positions.setXYZ(i * 2 + end, x, heightAt(x, z) + TICK_LIFT, z);
    }
  }
  positions.needsUpdate = true;
}
