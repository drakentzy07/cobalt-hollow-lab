#!/usr/bin/env python3
"""ORIGIN R1-4C: ONE patch for authoritative resource mirror + owner-only
network snapshot + HUD triad + hotbar affordability, on native game UI.
Apply after R1-4AB. Legacy nine classes and public Pages stay untouched.
"""
from pathlib import Path

def once(path, before, after):
    p=Path(path); text=p.read_text(encoding='utf8')
    n=text.count(before)
    if n!=1:
        raise SystemExit(f'ORIGIN_R14C_SOURCE_DRIFT {path}: {n} matches {before[:110]!r}')
    p.write_text(text.replace(before,after,1),encoding='utf8')

# Entity includes the READ-ONLY mirror, not an independent source of truth:
# offline PlayerMeta references the authoritative object; online self reads
# only server-supplied values. Server never accepts an incoming mirror update.
once('src/sim/types.ts',
     '  resourceType: ResourceType | null;\n  overheadEmoteId:',
     """  resourceType: ResourceType | null;
  /** Owner-only ORIGIN Hunter MP/Stamina projection, absent on legacy entities. */
  originResources?: { mana: number; maxMana: number; stamina: number; maxStamina: number };
  overheadEmoteId:""")

once('src/sim/sim.ts',
     """      meta.originHunter = newOriginHunterProfile();
    }
    // A fresh character sets out provisioned""",
     """      meta.originHunter = newOriginHunterProfile();
    }
    // The original Entity remains the combat/HP truth. MP/stamina are held in
    // the server-owned Hunter profile; this is a read-only view for HUD/wire.
    if (meta.originHunter) player.originResources = meta.originHunter.resources;
    // A fresh character sets out provisioned""")

# SELF only: teammates/mobs never get proprietary personal resource values.
once('server/game.ts',
     """      rtype: p.resourceType,
      gcd: round2(p.gcdRemaining),""",
     """      rtype: p.resourceType,
      // ORIGIN R1-4C owner-only, source = authoritative PlayerMeta.
      // Four scalars instead of a fresh object every broadcast tick.
      ...(meta.originHunter
        ? {
            omp: round2(meta.originHunter.resources.mana),
            omx: meta.originHunter.resources.maxMana,
            ost: round2(meta.originHunter.resources.stamina),
            osx: meta.originHunter.resources.maxStamina,
          }
        : {}),
      gcd: round2(p.gcdRemaining),""")

once('src/net/online.ts',
     """      e.resourceType = s.rtype;
      // Parked mana while shapeshifted""",
     """      e.resourceType = s.rtype;
      // ORIGIN R1-4C: authoritative owner-only four-number mirror. Never
      // synthesize an MP bar from the legacy rage/energy/focus snapshot.
      if (
        typeof s.omp === 'number' && Number.isFinite(s.omp) &&
        typeof s.omx === 'number' && Number.isFinite(s.omx) && s.omx >= 1 &&
        typeof s.ost === 'number' && Number.isFinite(s.ost) &&
        typeof s.osx === 'number' && Number.isFinite(s.osx) && s.osx >= 1
      ) {
        e.originResources = {
          mana: Math.min(s.omx, Math.max(0, s.omp)),
          maxMana: s.omx,
          stamina: Math.min(s.osx, Math.max(0, s.ost)),
          maxStamina: s.osx,
        };
      } else {
        delete e.originResources; // never leak stale Hunter values on a legacy login
      }
      // Parked mana while shapeshifted""")

# UI: add two native bar siblings, keeping the original HP untouched. The
# legacy class resource bar is hidden only on a Hunter mirror with real data.
once('index.html',
     """<div class="bar mana ui-bevel ui-bevel--res" id="pf-resource"><div class="bar-fill ui-bevel-fill" id="pf-res"></div><div class="ui-bevel-ticks" aria-hidden="true"><span></span><span></span><span></span><span></span></div><div class="ui-bevel-edge" aria-hidden="true"></div><div class="bar-text ui-bevel-text" id="pf-res-text"></div><div class="low-resource-label" id="pf-low-resource"></div></div>""",
     """<div class="bar mana ui-bevel ui-bevel--res" id="pf-resource"><div class="bar-fill ui-bevel-fill" id="pf-res"></div><div class="ui-bevel-ticks" aria-hidden="true"><span></span><span></span><span></span><span></span></div><div class="ui-bevel-edge" aria-hidden="true"></div><div class="bar-text ui-bevel-text" id="pf-res-text"></div><div class="low-resource-label" id="pf-low-resource"></div></div>
              <div id="origin-resource-bars" class="origin-resource-bars" hidden aria-label="HIGHFLY ORIGIN MP y stamina">
                <div class="origin-bar origin-bar--mana" role="progressbar" id="origin-mp-meter" aria-label="MP" aria-valuemin="0"><div class="origin-bar-fill" id="origin-mp-fill"></div><span class="origin-bar-text" id="origin-mp-text">MP</span></div>
                <div class="origin-bar origin-bar--stamina" role="progressbar" id="origin-stamina-meter" aria-label="Stamina" aria-valuemin="0"><div class="origin-bar-fill" id="origin-stamina-fill"></div><span class="origin-bar-text" id="origin-stamina-text">Stamina</span></div>
              </div>""")

# CSS adds no assets and no extra skins.
once('index.html',
     '</style>\n</head>',
     """.origin-resource-bars { display: grid; gap: 2px; width: 100%; min-width: 0; }
.origin-resource-bars[hidden] { display: none !important; }
.origin-bar { position: relative; height: 13px; overflow: hidden; border: 1px solid #413d31; border-radius: 3px; background: #161722; }
.origin-bar-fill { position: absolute; inset: 0 auto 0 0; width: 100%; transition: width .10s linear; }
.origin-bar--mana .origin-bar-fill { background: linear-gradient(90deg,#174c9a,#3796e9); }
.origin-bar--stamina .origin-bar-fill { background: linear-gradient(90deg,#257340,#80c946); }
.origin-bar-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 700; text-shadow: 0 1px 2px #000; white-space: nowrap; }
</style>
</head>""")

once('src/ui/hud.ts',
     "  private pfResourceEl = $('#pf-resource');",
     """  private pfResourceEl = $('#pf-resource');
  private originResourceBarsEl = $('#origin-resource-bars');
  private originMpFillEl = $('#origin-mp-fill');
  private originMpTextEl = $('#origin-mp-text');
  private originMpMeterEl = $('#origin-mp-meter');
  private originStaminaFillEl = $('#origin-stamina-fill');
  private originStaminaTextEl = $('#origin-stamina-text');
  private originStaminaMeterEl = $('#origin-stamina-meter');""")

once('src/ui/hud.ts',
     """    this.playerFramePainter.paint(unitFrameViewInto(this.playerFrameBuffer, playerFrame));
    this.updateLowHealthVignette(p.hp, p.maxHp);
    this.updateLowResource(p);""",
     """    this.playerFramePainter.paint(unitFrameViewInto(this.playerFrameBuffer, playerFrame));
    this.updateOriginResourceBars(p);
    this.updateLowHealthVignette(p.hp, p.maxHp);
    if (!p.originResources) this.updateLowResource(p);""")

once('src/ui/hud.ts',
     "  private updateLowResource(p: Entity): void {",
     """  /** R1-4C: three real bars, no false legacy Rage/Energy/Focus row.
   * Uses shared Entity mirror offline and owner-only snapshot online. */
  private updateOriginResourceBars(p: Entity): void {
    const resources = p.originResources;
    const show = resources !== undefined;
    if (this.originResourceBarsEl.hidden === show) this.originResourceBarsEl.hidden = !show;
    this.pfResourceEl.style.display = show ? 'none' : '';
    if (!resources) return;
    const mp = Math.max(0, Math.min(resources.maxMana, resources.mana));
    const sta = Math.max(0, Math.min(resources.maxStamina, resources.stamina));
    const mpPct = (mp / Math.max(1, resources.maxMana)) * 100;
    const staPct = (sta / Math.max(1, resources.maxStamina)) * 100;
    const mpLabel = 'MP ' + Math.round(mp) + '/' + Math.round(resources.maxMana);
    const staLabel = 'Stamina ' + Math.round(sta) + '/' + Math.round(resources.maxStamina);
    const mpWidth = mpPct.toFixed(1) + '%';
    const staWidth = staPct.toFixed(1) + '%';
    if (this.originMpFillEl.style.width !== mpWidth) this.originMpFillEl.style.width = mpWidth;
    if (this.originStaminaFillEl.style.width !== staWidth) this.originStaminaFillEl.style.width = staWidth;
    if (this.originMpTextEl.textContent !== mpLabel) this.originMpTextEl.textContent = mpLabel;
    if (this.originStaminaTextEl.textContent !== staLabel) this.originStaminaTextEl.textContent = staLabel;
    this.originMpMeterEl.setAttribute('aria-valuenow', String(Math.round(mp)));
    this.originMpMeterEl.setAttribute('aria-valuemax', String(Math.round(resources.maxMana)));
    this.originStaminaMeterEl.setAttribute('aria-valuenow', String(Math.round(sta)));
    this.originStaminaMeterEl.setAttribute('aria-valuemax', String(Math.round(resources.maxStamina)));
  }

  private updateLowResource(p: Entity): void {""")

# Action bar must agree with server resource-cost decision. Never mark native
# exceptional mechanics usable just because an old carrier bar has rage.
once('src/ui/hud/action_bar/action_bar_view.ts',
     "import { executeWindowBlocksCast } from '../../../sim/combat/execute_threshold';",
     """import { executeWindowBlocksCast } from '../../../sim/combat/execute_threshold';
import { originCostDecision } from '../../../sim/highfly_origin_universal_resources';""")
once('src/ui/hud/action_bar/action_bar_view.ts',
     "  resource: number;\n  /** Which pool the live bar shows.",
     """  resource: number;
  /** Owner-only Hunter resource projection. Absent on nine legacy classes. */
  originResources?: { mana: number; maxMana: number; stamina: number; maxStamina: number };
  /** Which pool the live bar shows.""")
once('src/ui/hud/action_bar/action_bar_view.ts',
     """        const castingPool =
          player.resourceType !== 'mana' && willAutoUnshift(player.auras, def)
            ? player.savedMana
            : player.resource;
        slot.usable =
          secondaryRequirementsMet(world, ability) &&""",
     """        const originDecision = player.originResources ? originCostDecision(def) : null;
        const castingPool =
          player.originResources && originDecision?.ok
            ? originDecision.pool === 'mana'
              ? player.originResources.mana
              : player.originResources.stamina
            : player.resourceType !== 'mana' && willAutoUnshift(player.auras, def)
              ? player.savedMana
              : player.resource;
        slot.usable =
          (!player.originResources || originDecision?.ok === true) &&
          secondaryRequirementsMet(world, ability) &&""")

for path, fragments in {
  'src/sim/types.ts':['originResources?:'],
  'src/sim/sim.ts':['player.originResources = meta.originHunter.resources;'],
  'server/game.ts':['omp: round2','ost: round2'],
  'src/net/online.ts':['e.originResources = {','delete e.originResources'],
  'src/ui/hud.ts':['updateOriginResourceBars(p)','MP ',"Stamina "],
  'src/ui/hud/action_bar/action_bar_view.ts':['originDecision','originCostDecision(def)'],
  'index.html':['id="origin-mp-meter"','id="origin-stamina-meter"'],
}.items():
    value=Path(path).read_text(encoding='utf8')
    for fragment in fragments:
        if fragment not in value: raise SystemExit(f'ORIGIN_R14C_MISSING_{path}: {fragment}')
print('HIGHFLY_ORIGIN_R14C_NATIVE_HUD_OWNER_WIRE_ACTIONBAR_RESOURCE_PARITY_CONNECTED=1')
