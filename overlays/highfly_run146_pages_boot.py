from pathlib import Path

p = Path("src/main.ts")
s = p.read_text()

old = """  loadPhaseStart('locale-fetch');
  try {
    await Promise.all([
      ensureLocaleLoaded(getLanguage()),
      ...CONTENT_LOCALE_CHANNEL_ENSURERS.map((ensure) => ensure(getLanguage())),
    ]);
  } catch {
    // Soft fallback: English is statically resident; boot in English (the picker can retry).
  }
  loadPhaseEnd('locale-fetch');
  loadPhaseStart('assets-ready');
"""

new = """  loadPhaseStart('locale-fetch');
  // HIGHFLY Pages: locale/content chunks are useful but must never be allowed
  // to wedge world entry forever. A stalled CDN/module request previously left
  // the curtain at the generic "CARGANDO MUNDO..." before assetsReady could
  // emit its X/Y progress. Keep the load alive in the background, but release
  // the boot after a bounded wait; t() already has the authored English
  // resident fallback until the selected locale becomes resident.
  setLoadingStatus('PREPARANDO IDIOMA...');
  const highflyLocaleLoad = Promise.all([
    ensureLocaleLoaded(getLanguage()),
    ...CONTENT_LOCALE_CHANNEL_ENSURERS.map((ensure) => ensure(getLanguage())),
  ]);
  try {
    await Promise.race([
      highflyLocaleLoad,
      new Promise<void>((resolve) => window.setTimeout(resolve, 10_000)),
    ]);
  } catch {
    // Soft fallback: English is statically resident; boot in English (the picker can retry).
  }
  void highflyLocaleLoad.catch(() => {});
  setLoadingStatus('CARGANDO MUNDO...');
  loadPhaseEnd('locale-fetch');
  loadPhaseStart('assets-ready');
"""

if s.count(old) != 1:
    raise SystemExit(f"RUN146 locale-fetch anchor expected once, found {s.count(old)}")
p.write_text(s.replace(old, new))
print("HIGHFLY_RUN146_PAGES_BOOT_GUARD_APPLIED=1")
