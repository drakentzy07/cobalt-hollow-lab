import math

# Mirrors RUN0.5 Lucid mapping in src/main.ts after overlays:
# forward=(sin(yaw), cos(yaw)), right=(-cos(yaw), sin(yaw))
# browser joystick Y grows downward, so stick-forward is -screenY.
def map_stick(x, screen_y, yaw):
    forward = -screen_y
    right = x
    s, c = math.sin(yaw), math.cos(yaw)
    wx = forward * s - right * c
    wz = forward * c + right * s
    n = math.hypot(wx, wz)
    if n > 1e-9:
        wx, wz = wx / n, wz / n
    facing = math.atan2(wx, wz)
    return wx, wz, facing

def basis(yaw):
    s, c = math.sin(yaw), math.cos(yaw)
    return (s, c), (-c, s)

cases = {
    "UP": (0, -1, 0, 1),
    "UP_RIGHT": (1, -1, 1, 1),
    "RIGHT": (1, 0, 1, 0),
    "DOWN_RIGHT": (1, 1, 1, -1),
    "DOWN": (0, 1, 0, -1),
    "DOWN_LEFT": (-1, 1, -1, -1),
    "LEFT": (-1, 0, -1, 0),
    "UP_LEFT": (-1, -1, -1, 1),
}

for yaw in (0.0, 0.73, -1.91, math.pi):
    f, r = basis(yaw)
    for name, (sx, sy, want_right, want_forward) in cases.items():
        wx, wz, facing = map_stick(sx, sy, yaw)
        proj_forward = wx * f[0] + wz * f[1]
        proj_right = wx * r[0] + wz * r[1]
        scale = math.hypot(want_right, want_forward)
        ef = want_forward / scale
        er = want_right / scale
        assert abs(proj_forward - ef) < 1e-9, (yaw, name, "forward", proj_forward, ef)
        assert abs(proj_right - er) < 1e-9, (yaw, name, "right", proj_right, er)
        # Facing vector must be identical to travel vector: no strafe/backpedal/moonwalk.
        fx, fz = math.sin(facing), math.cos(facing)
        assert abs(fx - wx) < 1e-9 and abs(fz - wz) < 1e-9, (yaw, name, "facing")

print("HIGHFLY_8WAY_BODY_FORWARD_OK=1")
