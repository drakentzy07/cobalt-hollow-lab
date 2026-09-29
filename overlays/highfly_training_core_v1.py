from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = Path.cwd()

src_dir = ROOT / "training" / "runtime"
tests_src_dir = ROOT / "training" / "tests"

if not (UPSTREAM / "src").is_dir():
    raise SystemExit("highfly_training_core_v1.py must run from ClaudeCraft upstream checkout")
if not src_dir.is_dir():
    raise SystemExit(f"missing training runtime source: {src_dir}")
if not tests_src_dir.is_dir():
    raise SystemExit(f"missing training tests dir: {tests_src_dir}")

dst_dir = UPSTREAM / "src" / "highfly" / "training"
dst_dir.mkdir(parents=True, exist_ok=True)

for source in sorted(src_dir.glob("*.ts")):
    shutil.copy2(source, dst_dir / source.name)

tests_dir = UPSTREAM / "tests"
tests_dir.mkdir(parents=True, exist_ok=True)
copied_tests = []
for test_file in sorted(tests_src_dir.glob("highfly_training_*.test.ts")):
    shutil.copy2(test_file, tests_dir / test_file.name)
    copied_tests.append(tests_dir / test_file.name)
if not copied_tests:
    raise SystemExit("no HIGHFLY training tests found")

print("HIGHFLY_TRAINING_CORE_V1_APPLIED=1")
for path in sorted(dst_dir.glob("*.ts")):
    print(path.as_posix())
for path in copied_tests:
    print(path.as_posix())
