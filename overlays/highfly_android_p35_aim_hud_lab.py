#!/usr/bin/env python3
"""HIGHFLY Android P3.5/P3.6: right-hand ATK/USE/TARGET, upper buff bank,
native Fireball LINE, Flamestrike CIRCLE, Heroic Leap landing & Blink DASH.
P3.7 preview gallery behind hf_lab. No real skill grants/save/damage/input changes.
Only applied after green P3 patch in the disposable integration.
"""
from pathlib import Path

def once(path,before,after):
 p=Path(path)
 s=p.read_text(encoding="utf8")
 n=s.count(before)
 if n!=1:raise SystemExit(f"P35_SOURCE_DRIFT {path} count={n} anchor={before[:95]!r}")
 p.write_text(s.replace(before,after,1),encoding="utf8")

def append(path,text):
 p=Path(path)
 with p.open("a",encoding="utf8") as f:f.write(text)

once("src/main.ts",
 "  document.body.classList.toggle('hf-android-p3',androidP2 &&\n    new URLSearchParams(location.search).get('hf_android_p3')==='1');",
 """  document.body.classList.toggle('hf-android-p3',androidP2 &&
    new URLSearchParams(location.search).get('hf_android_p3')==='1');
  document.body.classList.toggle('hf-android-p35',androidP2 &&
    new URLSearchParams(location.search).get('hf_android_p3')==='1' &&
    new URLSearchParams(location.search).get('hf_android_p35')==='1');""")

# Same eight B buttons and original click handlers, always visible at the top
# when assigned. Remove the extra AUX click/expansion step on P3.5 only.
runtime="src/highfly/highfly_android_p3_runtime.ts"
once(runtime,
 "  const grid = document.createElement('div');\n  grid.id = 'hf-p3-aux-grid';\n  grid.hidden = true;",
 """  const grid = document.createElement('div');
  grid.id = 'hf-p3-aux-grid';
  grid.hidden = document.body.classList.contains('hf-android-p35') ? false : true;""")
once(runtime,
 "  aux.append(auxToggle, grid);",
 "  if (document.body.classList.contains('hf-android-p35')) aux.append(grid);\n  else aux.append(auxToggle, grid);")
once(runtime,
 """    auxToggle.hidden = !oldButtons.some(b => !b.hidden);
    if (auxToggle.hidden) {
      grid.hidden = true;
      auxToggle.setAttribute('aria-expanded', 'false');
    }""",
 """    auxToggle.hidden = !oldButtons.some(b => !b.hidden);
    if (document.body.classList.contains('hf-android-p35')) {
      grid.hidden = !oldButtons.some(b => !b.hidden);
    } else if (auxToggle.hidden) {
      grid.hidden = true;
      auxToggle.setAttribute('aria-expanded', 'false');
    }""")

# Player's four reference abilities are shown as VISUAL aim previews from
# the optional training modal, not as a free unlock/attack simulation.
once(runtime,
 "  editorPanel.prepend(preset);\n  syncPanel();",
 """  editorPanel.prepend(preset);
  if (document.body.classList.contains('hf-android-p35')) {
    const samples = document.createElement('div');
    samples.id = 'hf-p35-aim-gallery';
    samples.setAttribute('aria-label', 'Vista previa táctil de cuatro apuntados');
    const title = document.createElement('strong');
    title.textContent = '🎯 APUNTADOS · SOLO VISUAL / SIN CAST';
    samples.appendChild(title);
    for (const id of P3_BASE_IDS) {
      const item = document.createElement('button');
      item.type = 'button';
      item.dataset.abilityId = id;
      item.textContent = ABILITIES[id]?.name ?? id;
      item.title = 'Mostrar geometría en terreno, sin costo ni habilidad concedida';
      item.addEventListener('click', () => {
        originalToggle.click();
        syncPanel();
        document.dispatchEvent(new CustomEvent('hf-origin-aim-gallery',
          {detail:{shape:id}}));
      });
      samples.appendChild(item);
    }
    editorPanel.prepend(samples);
  }
  syncPanel();""")

# Precisely distinguish projectiles from broad arrow-shaped movement lanes.
aim="src/highfly/highfly_origin_r20_premium_aim.ts"
once(aim,
 "export interface HighflyAimSpec {\n  shape:HighflyAimShape;",
 "export interface HighflyAimSpec {\n  abilityId?:string;\n  shape:HighflyAimShape;")
once(aim,
 "const DASH_IDS=new Set(['heroic_leap','solar_step','trailbreak','veilstep']);",
 "const DASH_IDS=new Set(['heroic_leap','solar_step','trailbreak','veilstep','blink']);")
once(aim,
 " return {shape,range:actualRange,minRange:Math.max(0,Number(def.minRange??0)),",
 " return {shape,abilityId:id,range:actualRange,minRange:Math.max(0,Number(def.minRange??0)),")

visual="src/highfly/highfly_origin_r22_premium_visual.ts"
point=" private shapeArrow(origin:P,end:P,length:number,width:number,role:'line'|'dash'):void{"
code=""" private projectileLane(origin:P,end:P,length:number,width:number):void{
   // True thin LINE for a projectile: no giant triangular cone or dash arrow.
   // Draws directional corridor only; native collision radius remains the
   // source of truth. Small endpoint ring marks projectile arrival direction.
   const half=Math.max(.15,Math.min(.38,width*.35));
   const dx=(end.x-origin.x)/length,dz=(end.z-origin.z)/length;
   const nx=-dz*half,nz=dx*half;
   const leftA=point(origin.x+nx,origin.z+nz);
   const leftB=point(end.x+nx,end.z+nz);
   const rightA=point(origin.x-nx,origin.z-nz);
   const rightB=point(end.x-nx,end.z-nz);
   this.quad(this.aura,point(origin.x+nx*1.6,origin.z+nz*1.6),
     point(end.x+nx*1.6,end.z+nz*1.6),
     point(end.x-nx*1.6,end.z-nz*1.6),
     point(origin.x-nx*1.6,origin.z-nz*1.6));
   this.quad(this.fill,leftA,leftB,rightB,rightA);
   this.strip(this.edge,leftA,leftB,.052);
   this.strip(this.edge,rightA,rightB,.052);
   // Impact location hint must never misrepresent native enemy collision.
   this.annulus(this.glyph,end,Math.max(.23,half*.95),.065,24);
 }
"""
once(visual,point,code+point)
once(visual,
 "   if(shape==='line')this.shapeArrow(actor,end,distance,spec.width,'line');",
 """   if(shape==='line' && spec.abilityId==='fireball')
     this.projectileLane(actor,end,distance,spec.width);
   else if(shape==='line')this.shapeArrow(actor,end,distance,spec.width,'line');""")

# Existing visual-only gallery from R22 allows shape demos. In P3.5 the
# optional four buttons request exact native ability shapes/specs instead.
bridge="src/highfly/highfly_origin_r17_hud.ts"
once(bridge,
 "    if(!['line','cone','circle','dash','target'].includes(shape??''))return;",
 """    if(!['line','cone','circle','dash','target',
      'fireball','heroic_leap','blink','flamestrike'].includes(shape??''))return;""")
once(bridge,
 """    const sourceId=shape==='circle'?'blizzard'
      :shape==='dash'?'heroic_leap'
      :shape==='target'?'sinister_strike'
      :'fireball';""",
 """    const sourceId=shape==='circle'?'flamestrike'
      :shape==='dash'?'heroic_leap'
      :shape==='target'?'sinister_strike'
      :['fireball','heroic_leap','blink','flamestrike'].includes(shape??'')?shape!
      :'fireball';""")

append("src/styles/hud.mobile.css",r"""
/* P3.5 — strictly Android-P3 opt-in, GOLDEN inputs untouched. */
body.mobile-touch.hf-game-c1.hf-game-c25.hf-android-p3.hf-android-p35 #mobile-interact {
  display:flex !important;
  right:calc(20px + env(safe-area-inset-right)) !important;
  bottom:calc(8px + env(safe-area-inset-bottom)) !important;
  width:45px !important;height:45px !important;
  min-width:45px !important;min-height:45px !important;
  border-radius:50% !important;
  z-index:187 !important;
}
body.mobile-touch.hf-game-c1.hf-game-c25.hf-android-p3.hf-android-p35 #mobile-action-attack {
  right:calc(17px + env(safe-area-inset-right)) !important;
  bottom:calc(82px + env(safe-area-inset-bottom)) !important;
  width:70px !important;height:70px !important;
  z-index:186 !important;
}
body.mobile-touch.hf-game-c1.hf-game-c25.hf-android-p3.hf-android-p35 #mobile-target-cycle {
  display:flex !important;pointer-events:auto !important;
  right:calc(28px + env(safe-area-inset-right)) !important;
  bottom:calc(176px + env(safe-area-inset-bottom)) !important;
  width:46px !important;height:46px !important;
  min-width:46px !important;min-height:46px !important;
  z-index:186 !important;
}
body.mobile-touch.hf-android-p3.hf-android-p35.game-active:not(.hf-p3-lab-open) #hf-p3-aux-root {
  display:block !important;
  left:45% !important;top:calc(8px + env(safe-area-inset-top)) !important;
  bottom:auto !important;
  transform:translateX(-50%);
  width:auto;
}
body.mobile-touch.hf-android-p3.hf-android-p35 #hf-p3-aux-toggle { display:none !important; }
body.mobile-touch.hf-android-p3.hf-android-p35 #hf-p3-aux-grid {
  display:flex !important;
  position:static !important;
  flex-direction:row;flex-wrap:wrap;
  max-width:min(335px,42vw);
  gap:5px;padding:0;
  border:0;background:none;
  transform:none !important;
  pointer-events:none !important;
}
body.mobile-touch.hf-android-p3.hf-android-p35 #hf-p3-aux-grid button[data-origin-buff]{
  position:relative !important;
  display:flex !important;
  pointer-events:auto !important;
  width:34px !important;height:34px !important;
  min-width:34px !important;min-height:34px !important;
  border-radius:7px !important;
  padding:2px !important;
}
body.mobile-touch.hf-android-p3.hf-android-p35 #hf-p3-aux-grid[hidden],
body.mobile-touch.hf-android-p3.hf-android-p35 #hf-p3-aux-grid button[hidden] {
  display:none !important;
}
/* Passive/buff state remains the original, not a fake extra spell bar. */
body.mobile-touch.hf-game-c25.hf-android-p35 #buff-bar {
  top:calc(49px + env(safe-area-inset-top)) !important;
  bottom:auto !important;
  left:32vw !important;
}
body.mobile-touch.hf-game-c25.hf-android-p35 #debuff-bar {
  top:calc(84px + env(safe-area-inset-top)) !important;
  bottom:auto !important;
  left:32vw !important;
}
body.mobile-touch.hf-android-p35 #hf-p35-aim-gallery {
  display:flex;flex-wrap:wrap;align-items:center;gap:5px;
  padding:7px 0;border-bottom:1px solid #6386a1;
}
body.mobile-touch.hf-android-p35 #hf-p35-aim-gallery strong { flex:0 0 100%;font:700 12px system-ui; }
body.mobile-touch.hf-android-p35 #hf-p35-aim-gallery button {
  flex:1 1 43%;min-height:39px;
  border:1px solid #78afd1;border-radius:8px;
  background:#123959;color:white;font:700 11px system-ui;
  touch-action:manipulation;
}
""")
print("HIGHFLY_ANDROID_P35_TARGET_ABOVE_ATK_USE_BELOW_TOP_BUFFS_FOUR_NATIVE_AIM_SHAPES_READY=1")
