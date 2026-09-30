from pathlib import Path

main_overlay = Path("src/main.ts")
text = main_overlay.read_text(encoding="utf-8")
old = """  setActiveTrainingBridgeFlags({
    enabled: true,
    applyMovement: false,
    applyPerception: true,
    applyIntelligence: false,
  });
"""
new = """  setActiveTrainingBridgeFlags({
    enabled: true,
    applyMovement: true,
    applyPerception: true,
    applyIntelligence: true,
  });
"""
if old not in text:
    raise SystemExit("RUN1-J J3A flags seam not found")
main_overlay.write_text(text.replace(old, new, 1), encoding="utf-8")
print("HIGHFLY_RUN1J_J3A_FLAGS_APPLIED=1")
