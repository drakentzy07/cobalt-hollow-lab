import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolveFreedom360 } from '../src/highfly/combat/freedom_360';

describe('HIGHFLY F2.0 — camera-relative free 360° movement', () => {
  it('is silent at rest and never rotates the Hunter from a camera-only gesture', () => {
    expect(resolveFreedom360({ x: 0, y: 0 }, Math.PI)).toBeNull();
    expect(resolveFreedom360({ x: 0.0001, y: 0 }, 2)).toBeNull();
  });

  it('keeps the proven ClaudeCraft +Z forward and -X right basis at yaw=0', () => {
    expect(resolveFreedom360({ x: 0, y: -1 }, 0)).toMatchObject({
      worldX: 0, worldZ: 1, analog: 1, facing: 0,
    });
    const right = resolveFreedom360({ x: 1, y: 0 }, 0)!;
    expect(right.worldX).toBeCloseTo(-1);
    expect(right.worldZ).toBeCloseTo(0);
    expect(right.facing).toBeCloseTo(-Math.PI / 2);
  });

  it('turns the entire movement basis as the camera orbits, without snap-to-quadrants', () => {
    const front = resolveFreedom360({ x: 0, y: -1 }, Math.PI / 2)!;
    expect(front.worldX).toBeCloseTo(1);
    expect(front.worldZ).toBeCloseTo(0);
    expect(front.facing).toBeCloseTo(Math.PI / 2);
    const diagonal = resolveFreedom360({ x: 0.6, y: -0.8 }, Math.PI / 4)!;
    expect(Math.hypot(diagonal.worldX, diagonal.worldZ)).toBeCloseTo(1);
    expect(diagonal.facing).toBeCloseTo(Math.atan2(diagonal.worldX, diagonal.worldZ));
  });

  it('preserves radial analog magnitude and all eight octants', () => {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const raw = { x: Math.sin(a) * 0.72, y: -Math.cos(a) * 0.72 };
      const step = resolveFreedom360(raw, -0.3)!;
      expect(step.analog).toBeCloseTo(0.72);
      expect(Math.hypot(step.worldX, step.worldZ)).toBeCloseTo(0.72);
      expect(Number.isFinite(step.facing)).toBe(true);
    }
  });

  it('rejects corrupt touch/camera values without poisoning the movement Sim', () => {
    expect(resolveFreedom360({ x: Number.NaN, y: -1 }, 0)).toBeNull();
    expect(resolveFreedom360({ x: 0, y: -1 }, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('uses ONE authoritative movement pipeline and keeps the protected F1 HUD', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    const mobile = readFileSync('src/game/mobile_controls.ts', 'utf8');
    const hud = readFileSync('src/styles/hud.mobile.css', 'utf8');
    expect(main).toContain('resolveFreedom360(input.highflyTouchVector(), input.camYaw)');
    expect(main).toContain('mi.highflyWorldX = freedomMove.worldX');
    expect(main).toContain('mi.highflyWorldZ = freedomMove.worldZ');
    expect(mobile).toContain('this.input.setHighflyTouchVector(highflyMove)');
    expect(mobile).toContain('this.input.clearHighflyTouchVector()');
    expect(hud).toContain('#mobile-action-ring .mobile-action-slot[data-mobile-index="3"]');
    expect(main).not.toContain('new FreedomWorld(');
  });
});
