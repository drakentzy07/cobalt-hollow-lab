#!/usr/bin/env python3
"""R32-P2 disposable WebGL assembly over the COMPLETE certified R31 donor build.

One original Sim, one Claude actionbar and C2.8 settings/editor; NO production
writes, persistent skill grants, new damage engine, premium VFX or public deploy.
LAB only: four temporary native skill definitions, never serialized.
"""
from pathlib import Path
import shutil

def replace_one(path, before, after):
    file = Path(path)
    source = file.read_text(encoding="utf8")
    matches = source.count(before)
    if matches != 1:
        raise SystemExit(f"R32_SOURCE_DRIFT:{file}:{matches}:{before[:130]!r}")
    file.write_text(source.replace(before, after, 1), encoding="utf8")

def main():
    runtime = Path("src/highfly/game_c1_runtime.ts")
    style = Path("src/styles/hf_game_c1.css")
    for path in (runtime, style):
        if not path.is_file():
            raise SystemExit("R32_MISSING_CLAUDE_NATIVE_SEAM:"+str(path))
    # Surgical adaptation of the fully assembled C2.8 runtime: do not
    # replace its PR16 GEM guide, PR18/19 UX, menues, or native callbacks.
    replace_one(runtime, "const w = window as HighflyGameWindow;",
      """const w = window as HighflyGameWindow;
const originR32Mode = import.meta.env.VITE_HIGHFLY_ORIGIN_R32 === '1';""")
    replace_one(runtime, "function ensureSpecialSeats(): void {",
      """function ensureSpecialSeats(): void {
  if (originR32Mode) { document.getElementById('hf-c1-special-seats')?.remove(); return; }""")
    replace_one(runtime, "function ensureGhostSkillSeats(): void {",
      """function ensureGhostSkillSeats(): void {
  if (originR32Mode) { document.getElementById('hf-c22-ghost-skills')?.remove(); return; }""")
    replace_one(runtime, "function paintContextualAttack(): void {",
      """function ensureR32UseButton(): void {
  if (!originR32Mode) return;
  let button = document.getElementById('hf-r32-use') as HTMLButtonElement | null;
  if (!button) {
    button = document.createElement('button');
    button.id = 'hf-r32-use';
    button.type = 'button';
    button.textContent = 'USAR';
    button.title = 'Interactuar con el mundo';
    button.setAttribute('aria-label', 'Usar / Interactuar');
    button.addEventListener('click', () => {
      if (w.__highflyGameC1Context?.canUse?.() !== true) return;
      w.__game?.hud?.onMobileContextualUse?.();
    });
    document.body.append(button);
  }
  button.disabled = !document.body.classList.contains('hf-c25-world-ready')
    || w.__highflyGameC1Context?.canUse?.() !== true;
}

function paintContextualAttack(): void {""")
    # Native actionbar is nested inside ClaudeCraft's desktop bottom bar.
    # That ANCESTOR is hidden on touch devices. Changing display on the
    # descendant alone cannot override display:none of its ancestor.
    # Move the already-wired DOM node; do not clone, recreate or fake casts.
    replace_one(runtime,
      "function paintContextualAttack(): void {",
      """function ensureR32NativeSkillBar(): void {
  if (!originR32Mode || !w.__game?.sim?.player?.originResources) return;
  const bar = document.getElementById('actionbar');
  if (!bar || bar.parentElement === document.body) return;
  // Keep the original event listeners, authoritative Sim and 33-slot model.
  document.body.appendChild(bar);
}

function paintContextualAttack(): void {""")
    replace_one(runtime,
      "  const use = w.__highflyGameC1Context?.canUse?.() === true;",
      "  const use = !originR32Mode && w.__highflyGameC1Context?.canUse?.() === true;")
    replace_one(runtime, "  ...Array.from({ length: 10 }, (_, index) => ({",
      "  ...Array.from({ length: originR32Mode ? 4 : 10 }, (_, index) => ({")
    replace_one(runtime,
      """  { id: 'esp1', label: 'ESPECIAL 1', selectors: ['#hf-c1-esp1'] },
  { id: 'esp2', label: 'ESPECIAL 2', selectors: ['#hf-c1-esp2'] },
  { id: 'ult', label: 'ULT', selectors: ['#hf-c1-ult'] },
  { id: 'target', label: 'TARGET', selectors: ['#mobile-target-cycle'] },""",
      """  ...(originR32Mode ? [{ id: 'use', label: 'USAR', selectors: ['#hf-r32-use'] }] : [
    { id: 'esp1', label: 'ESPECIAL 1', selectors: ['#hf-c1-esp1'] },
    { id: 'esp2', label: 'ESPECIAL 2', selectors: ['#hf-c1-esp2'] },
    { id: 'ult', label: 'ULT', selectors: ['#hf-c1-ult'] },
    { id: 'target', label: 'TARGET', selectors: ['#mobile-target-cycle'] },
  ]),""")
    replace_one(runtime,
      "const HIGHFLY_HUD_STORE_PREFIX = 'highfly:c282:hud:';",
      "const HIGHFLY_HUD_STORE_PREFIX = originR32Mode ? 'highfly:r32:hud:' : 'highfly:c282:hud:';")
    replace_one(runtime,
      """function highflyHudDefault(targetId: string): HighflyHudTransform {
  const value""",
      """function highflyHudDefault(targetId: string): HighflyHudTransform {
  if (originR32Mode && (/^s[1-4]$/.test(targetId) || targetId === 'attack'
     || targetId === 'jump' || targetId === 'evade' || targetId === 'use'))
    return { x: 0, y: 0, scale: 1, opacity: 1 };
  const value""")
    replace_one(runtime,
      """    ensureSpecialSeats();
    ensureGhostSkillSeats();
    ensureUtilityLane();
    installSkillTouch();""",
      """    document.body.classList.toggle('hf-origin-r32-combat',
      originR32Mode && !!w.__game?.sim?.player?.originResources);
    ensureSpecialSeats();
    ensureGhostSkillSeats();
    ensureUtilityLane();
    ensureR32UseButton();
    installSkillTouch();""")
    # The previous R32 assembly instruction creates ensureR32UseButton()
    # first. Only after that may P3 add the native hotbar relocation call.
    replace_one(runtime,
      "    ensureR32UseButton();\\n    installSkillTouch();",
      "    ensureR32UseButton();\\n    ensureR32NativeSkillBar();\\n    installSkillTouch();")
    # Append only the verified R32 CSS override; keep every prior PR16/C2.8 rule.
    r32_css = Path("../v9-corrections/game/c1/hud.css").read_text(encoding="utf8")
    marker = "/* ==========================================================================" + chr(10) + "   HIGHFLY R32 P1 NATIVE HUD"
    idx = r32_css.find(marker)
    if idx < 0 or "hf-origin-r32-combat" not in r32_css[idx:]:
        raise SystemExit("R32_CSS_EXTENSION_MISSING")
    style.write_text(style.read_text(encoding="utf8") + chr(10) + r32_css[idx:],
                     encoding="utf8")
    # R32/P3 visibility repair: the actionbar must be independently visible
    # and touchable even if ClaudeCraft hides its parent desktop HUD container.
    # Preserve native HP, joystick, ATK, menu, jump, dash, GEM, buffs and USAR.
    style.write_text(style.read_text(encoding="utf8") + """
/* HIGHFLY R32 P3: physical S23 native bar visibility correction. */
body.mobile-touch.hf-origin-r32-combat #actionbar {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  z-index: 181 !important;
  pointer-events: none !important;
  overflow: visible !important;
}
body.mobile-touch.hf-origin-r32-combat #actionbar .action-btn[data-hotbar-slot] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
body.mobile-touch.hf-origin-r32-combat #actionbar :is(
  .action-btn[data-hotbar-slot="1"],.action-btn[data-hotbar-slot="2"],
  .action-btn[data-hotbar-slot="3"],.action-btn[data-hotbar-slot="4"]
) {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  position: fixed !important;
  z-index: 182 !important;
  max-width: 48px !important;
  max-height: 48px !important;
  width: 48px !important;
  height: 48px !important;
  touch-action: none !important;
}
body.mobile-touch.hf-origin-r32-combat #actionbar [data-hotbar-slot="1"] { right: 185px !important; bottom: 40px !important; }
body.mobile-touch.hf-origin-r32-combat #actionbar [data-hotbar-slot="2"] { right: 185px !important; bottom: 98px !important; }
body.mobile-touch.hf-origin-r32-combat #actionbar [data-hotbar-slot="3"] { right: 179px !important; bottom: 156px !important; }
body.mobile-touch.hf-origin-r32-combat #actionbar [data-hotbar-slot="4"] { right: 137px !important; bottom: 212px !important; }
/* Keep the R18 training/editor implementation available in the build,
   but do not display obsolete S1–S10/B1–B8 UI over the R32 HUD. */
body.mobile-touch.hf-origin-r32-combat #hf-origin-training {
  display: none !important;
  pointer-events: none !important;
}
/* Keep the existing editor/menus and privacy of future unique skills. */
""" ,encoding="utf8")
    if "VITE_HIGHFLY_ORIGIN_R32" not in runtime.read_text():
        raise SystemExit("R32_MISSING_ISOLATED_HUNTER_FLAG")

    session = "src/sim/highfly_origin_r28_session.ts"
    replace_one(session,
        "export function r28Reapply(meta:LabMeta,level=1):void {",
        """// R32 disposable four-BASE loadout. Native definitions, native resource costs.
const r32SessionLoadouts = new WeakMap<object,readonly string[]>();
export const R32_P2_BASE_IDS = ['fireball','heroic_leap','blink','flamestrike'] as const;
export function r32StartSession(sim:Sim):void {
 const meta=sim.players.get(sim.playerId);
 if(!meta?.originHunter||!sim.player.originResources)
   throw Error('R32_REQUIRES_EPHEMERAL_HUNTER');
 const selected=R32_P2_BASE_IDS.map(id=>r28Resolved(id));
 r32SessionLoadouts.set(meta,R32_P2_BASE_IDS);
 meta.known=selected;
 // No learnedSkillIds / XP / mastery / permanent save data changed.
}
export function r28Reapply(meta:LabMeta,level=1):void {
 const r32=r32SessionLoadouts.get(meta);
 if(r32){meta.known=r32.map(id=>r28Resolved(id,level));return;}""")
    # R30 freezes only its 45 curated identities; Heroic Leap is a real,
    # native and Origin-approved mobility action outside the R30 top-five.
    # R32's isolated opt-in may resolve precisely this ID from the original
    # ABILITIES registry, subject to r28Selectable and Origin guard. It does
    # not add a permanent learn/unlock or modify R30's 45 admission set.
    # Original Charge has the server-blocked legacy "charge" effect and
    # MUST NOT be injected: it aborts Hunter entry before the world loads.
    # Blink/Flitstep is a safe native movement fallback until Charge is
    # genuinely adapted to HP/MP/Stamina. No server resource guards bypassed.
    replace_one(session,
        "if(import.meta.env.VITE_HIGHFLY_ORIGIN_R30==='1')return r30ResolveSelected(id,level);",
        "if(import.meta.env.VITE_HIGHFLY_ORIGIN_R30==='1' && !(import.meta.env.VITE_HIGHFLY_ORIGIN_R32==='1' && (id==='blink'||id==='heroic_leap')))return r30ResolveSelected(id,level);")
    replace_one("src/main.ts",
        "import { r28StartSession } from './sim/highfly_origin_r28_session';",
        "import { r28StartSession, r32StartSession } from './sim/highfly_origin_r28_session';")
    replace_one("src/main.ts",
        "r28StartSession(hunter);",
        """r28StartSession(hunter);
          if(import.meta.env.VITE_HIGHFLY_ORIGIN_R32==='1')r32StartSession(hunter);""")

    # Turn OFF R28's top-right selection overlay & its interception of ATK.
    # Claude's native action buttons remain bound to the authoritative Sim.
    hud = "src/ui/hud.ts"
    replace_one(hud,
        "if (import.meta.env.VITE_HIGHFLY_ORIGIN_UNIVERSAL_TESTER==='1' &&",
        """if (import.meta.env.VITE_HIGHFLY_ORIGIN_UNIVERSAL_TESTER==='1' &&
        import.meta.env.VITE_HIGHFLY_ORIGIN_R32!=='1' &&""")
    replace_one(hud,
        "    this.buildMobileConsumableSeat();",
        """    if(import.meta.env.VITE_HIGHFLY_ORIGIN_R32==='1' && this.sim.player.originResources){
      // Existing R17/Claude command -> original hotbar serialization in the
      // ephemeral R28 namespace. No fake buttons or bypassed cast mechanics.
      (['fireball','heroic_leap','blink','flamestrike'] as const).forEach((id,i)=>{
        if (!this.sim.known.some(k=>k.def.id===id) || originSkillRole(id)!=='combat')
          throw Error('R32_EXPECT_FOUR_NATIVE_COMBAT_SKILLS_'+id);
        // Do not trust an early UI event: use the SAME authoritative hotbar
        // mutation that R17 invokes after player-driven equip, then verify.
        this.commitHotbarActions(placeAbilityOnSlot(this.hotbarActions,id,i));
      });
      (['fireball','heroic_leap','blink','flamestrike'] as const).forEach((id,i)=>{
        const assigned=this.actionForSlot(i+1);
        if(assigned?.type!=='ability'||assigned.id!==id)
          throw Error('R32_INCOMPLETE_FOUR_SLOT_HOTBAR_'+(i+1)+'_'+id);
      });
    }
    this.buildMobileConsumableSeat();""")

    # Existing C1 context function is still the sole handler for USE,
    # but ATK must not consume interaction in new R32 mode.
    controller="src/ui/hud/action_bar/mobile_action_ring_controller.ts"
    replace_one(controller,
        "if (deps.contextualUse()) {",
        "if (!document.body.classList.contains('hf-origin-r32-combat') && deps.contextualUse()) {")
    native=Path(hud).read_text(encoding="utf8")
    if "onMobileContextualUse" not in native:
        raise SystemExit("R32_NATIVE_USE_SEAM_MISSING")
    for ability in ("fireball","heroic_leap","blink","flamestrike"):
        if ability not in Path(session).read_text(encoding="utf8"):
            raise SystemExit("R32_BASE_MISSING_"+ability)
    print("HIGHFLY_R32_P2_CLAUDE_NATIVE_4_BASE_ATK_SEPARATE_USE_NO_SAVES=1")

if __name__ == "__main__":
    main()
