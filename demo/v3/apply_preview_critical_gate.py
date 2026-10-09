#!/usr/bin/env python3
"""V3-01 isolated, fail-closed source adaptation.

Repair one launcher dependency: the playable Hunter preview must not wait
for all dungeon mobs, NPCs and scenario models to decode before it initializes.
Keep the complete donor boot preload registry (the real world still needs it).
No rigs, GLBs, stats, gameplay data or animations are changed.
"""
from pathlib import Path

assets = Path("src/render/characters/assets.ts")
main = Path("src/main.ts")
before_assets = assets.read_text(encoding="utf-8")
before_main = main.read_text(encoding="utf-8")

def replace_once(contents: str, old: str, new: str, label: str) -> str:
    n = contents.count(old)
    if n != 1:
        raise SystemExit(f"V3-01 source drift: {label}: expected one anchor, got {n}")
    return contents.replace(old, new, 1)

# PREVIEW first: a subset of the very same exact model URLs that the frozen
# donor boot already enumerates; never add synthetic or mock models.
# Include EVERY class body/clip and native non-cosmetic weapons for class swap.
# Do not make NPC, monster or boss assets prerequisites to showing the hero.
critical = """const highflyPreviewCriticalUrls = preloadUrls.filter(
  (url) =>
    url.startsWith('models/chars/players/') ||
    url.startsWith('models/chars/modular/') ||
    (url.startsWith('models/weapons/') && !streamedSkinUrls.has(url)),
);
"""
before_assets = replace_once(
    before_assets,
    "const characterLoadTasks = new Map<string, Promise<void>>();",
    critical + "const characterLoadTasks = new Map<string, Promise<void>>();",
    "critical asset URL set",
)
before_assets = replace_once(
    before_assets,
    "for (const url of preloadUrls) {\n  registerPreload(prepareCharacterUrl(url));\n}",
    """// Prioritize playable heroes and their real held weapons while preserving
// registration of the entire original donor preload set for world entry.
for (const url of [...highflyPreviewCriticalUrls, ...preloadUrls.filter(
  (u) => !highflyPreviewCriticalUrls.includes(u),
)]) {
  registerPreload(prepareCharacterUrl(url));
}""",
    "preload priority order",
)
ready = """/**
 * The launcher only needs player bodies, authentic class clips and the
 * native weapon GLBs. Its preview must not depend on hoard bosses, NPCs or
 * dungeon creature preloads. World-entry still uses the original full gate.
 * Any truly missing player asset is a HARD failure (no fake visuals).
 */
export async function charactersReadyForPreview(maxAttempts = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const missing = highflyPreviewCriticalUrls.filter((u) => !characterAssetResident(u));
    if (missing.length === 0) return;
    if (attempt > 1) {
      await new Promise((resolve) => setTimeout(resolve, gltfRetryDelayMs(attempt)));
    }
    const results = await Promise.allSettled(missing.map((u) => prepareCharacterUrl(u)));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (attempt === maxAttempts && failures.length > 0) {
      throw new Error(
        'HIGHFLY preview critical assets failed (' + failures.length + '): ' +
        failures.map((r) => String(r.reason)).join('; '),
      );
    }
  }
}

"""
before_assets = replace_once(
    before_assets,
    "export async function charactersReady(maxAttempts = 3): Promise<void> {",
    ready+"export async function charactersReady(maxAttempts = 3): Promise<void> {",
    "targeted preview loader",
)
before_main = replace_once(
    before_main,
    "  charactersReady,\n  ensureCharacterUrl,",
    "  charactersReadyForPreview,\n  ensureCharacterUrl,",
    "main preview import",
)
# The CLEAN canonical patch may wrap the promise in a 'void' statement
# or change line spacing. Identify the actual executable invocation inside
# the launcher block instead of matching the donor's exact indentation.
import re
start = before_main.find("  // Initialize 3D character preview once")
end = before_main.find("// Looping home-page theme", start)
if start < 0 or end < start:
    raise SystemExit("V3-01 source drift: launcher preview region missing")
section = before_main[start:end]
matcher = re.compile(r"(?m)^([ \\t]*(?:void[ \\t]+)?)charactersReady([ \\t]*\\([ \\t]*\\))")
section, replacements = matcher.subn(r"\\1charactersReadyForPreview\\2", section)
if replacements != 1:
    context = "\\n".join(
        row for row in before_main[start:end].splitlines() if "charactersReady" in row
    )
    raise SystemExit(
        f"V3-01 source drift: expected 1 executable preview call, got {replacements}: {context}"
    )
before_main = before_main[:start] + section + before_main[end:]
assets.write_text(before_assets, encoding="utf-8")
main.write_text(before_main, encoding="utf-8")
print("V3_01_PREVIEW_GATE_SOURCE_APPLIED=1")
print("V3_01_PREVIEW_CRITICAL_PLAYER_WEAPON_ONLY=1")
print("V3_01_ORIGINAL_DONOR_FULL_GATING_RETAINED=1")
