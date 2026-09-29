from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = Path.cwd()

src_dir = ROOT / "training" / "runtime"
test_file = ROOT / "training" / "tests" / "highfly_training_core.test.ts"

if not (UPSTREAM / "src").is_dir():
    raise SystemExit("highfly_training_core_v1.py must run from ClaudeCraft upstream checkout")
if not src_dir.is_dir():
    raise SystemExit(f"missing training runtime source: {src_dir}")
if not test_file.is_file():
    raise SystemExit(f"missing training test: {test_file}")

dst_dir = UPSTREAM / "src" / "highfly" / "training"
dst_dir.mkdir(parents=True, exist_ok=True)

for source in sorted(src_dir.glob("*.ts")):
    shutil.copy2(source, dst_dir / source.name)

tests_dir = UPSTREAM / "tests"
tests_dir.mkdir(parents=True, exist_ok=True)
shutil.copy2(test_file, tests_dir / test_file.name)

print("HIGHFLY_TRAINING_CORE_V1_APPLIED=1")
for path in sorted(dst_dir.glob("*.ts")):
    print(path.as_posix())
print((tests_dir / test_file.name).as_posix())
