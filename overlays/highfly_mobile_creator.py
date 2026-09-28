from pathlib import Path

p = Path("src/styles/shell.css")
s = p.read_text(encoding="utf-8")

old = """    body.mobile-touch #offline-select .char-preview-container {
      height: 100px;
      min-height: 0;
      flex-shrink: 0;
    }
"""
new = """    body.mobile-touch #offline-select .char-preview-container {
      /* HIGHFLY RUN0.8: the original 100px landscape stage crushed the
         character preview on wide phones (S23 Ultra class devices). Keep a
         real turntable-sized viewport and let the details column scroll. */
      height: clamp(180px, 42vh, 240px);
      min-height: 180px;
      flex-shrink: 0;
    }
"""
if s.count(old) != 1:
    raise SystemExit(f"mobile creator preview block: expected 1, found {s.count(old)}")
p.write_text(s.replace(old, new), encoding="utf-8")
print("HIGHFLY_MOBILE_CREATOR_APPLIED=1")
