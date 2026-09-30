from pathlib import Path

def rep(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{path}: expected 1 anchor, got {n}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

rep(
    'src/ui/hud/action_bar/ground_aim_controller.ts',
    """  point: AimPoint;
  origin: AimPoint;
  radius: number;
  profile: HighflyAimProfile;
""",
    """  point: AimPoint;
  /** Optional at the shared HUD boundary; player aim supplies it, vehicle aim may omit it. */
  origin?: AimPoint;
  radius: number;
  /** Optional at the shared HUD boundary; absent means the legacy circle presentation. */
  profile?: HighflyAimProfile;
""",
)

rep(
    'src/game/pad_ground_aim_wiring.ts',
    """    point: { x: number; z: number };
    origin: { x: number; z: number };
    radius: number;
    profile: HighflyAimProfile;
    school: string;
""",
    """    point: { x: number; z: number };
    origin?: { x: number; z: number };
    radius: number;
    profile?: HighflyAimProfile;
    school: string;
""",
)

rep(
    'src/game/pad_ground_aim_wiring.ts',
    """          originX: reticle.origin.x,
          originZ: reticle.origin.z,
          radius: reticle.radius,
          profile: reticle.profile,
""",
    """          originX: reticle.origin?.x ?? reticle.point.x,
          originZ: reticle.origin?.z ?? reticle.point.z,
          radius: reticle.radius,
          profile: reticle.profile ?? { shape: 'CIRCLE', radius: reticle.radius },
""",
)

print('HIGHFLY adapter compatibility fix applied')
