#!/usr/bin/env python3
"""HF15-UX02: extend HIGHFLY's disposable S23 Chromium smoke; no donor edits.

Run after the P09 adapter on a *copied* mobile smoke file.
This adds real browser menu/quest checks before the existing joystick tests,
using the same viewport, local WebGL bundle and original input handlers.
"""
import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("Usage: highfly_v15_mobile_ux_smoke.py <copied-s23-smoke.mjs>")
path = Path(sys.argv[1])
if not path.is_file():
    raise SystemExit(f"HF15_UX_SMOKE_SOURCE_MISSING: {path}")
text = path.read_text(encoding="utf-8")
anchor = """  if(result.hud.slots.length!==10||result.hud.slots.some(r=>!r||r.display==='none'||r.visibility==='hidden'||r.right>846||r.bottom>392))fail('S23 10-slot GOLDEN HUD violated');"""
if text.count(anchor) != 1:
    raise SystemExit(f"HF15_UX_SMOKE_ANCHOR_DRIFT: {text.count(anchor)}")
if "HF15_UX_MORE_QUEST_QA" in text:
    raise SystemExit("HF15_UX_SMOKE_ALREADY_PATCHED")

injected = r"""
  // HF15_UX_MORE_QUEST_QA: genuine on-device-class browser DOM geometry.
  // No source edits or simulated class/HP/item changes. The menu must leave
  // the GOLDEN joystick, ring, quick actions and canvas in their original seats.
  result.phase='hf15-more-quest-mobile-regression';
  const hf15Measure=()=>page.evaluate(()=>{
    const rect=id=>{
      const el=document.querySelector(id);
      if(!(el instanceof HTMLElement))return null;
      const r=el.getBoundingClientRect();
      return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};
    };
    return {
      attack:rect('#mobile-action-attack'),
      joystick:rect('#mobile-move-joystick'),
      jump:rect('#mobile-jump'),
      menu:rect('#mobile-menu-anchor'),
      canvas:rect('#game-canvas'),
      viewport:{w:innerWidth,h:innerHeight},
      modal:rect('#mobile-extra-controls'),
      moreOpen:document.body.classList.contains('mobile-more-open'),
      questVisible:(()=>{
        const el=document.querySelector('#quest-log-window');
        if(!(el instanceof HTMLElement))return false;
        const cs=getComputedStyle(el),r=el.getBoundingClientRect();
        return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none';
      })(),
    };
  });
  const hf15AssertSeats=(first,now,phase)=>{
    for(const key of ['attack','joystick','jump','menu','canvas']){
      const a=first[key],b=now[key];
      if(!a||!b)fail('HF15_UX_SEAT_MISSING '+phase+' '+key);
      for(const axis of ['x','y','w','h']){
        if(Math.abs(a[axis]-b[axis])>3)
          fail('HF15_UX_HUD_SHIFT '+phase+' '+key+' '+axis+' '+JSON.stringify({before:a,after:b}));
      }
    }
  };
  const hf15Before=await hf15Measure();
  await page.evaluate(()=>document.getElementById('mobile-menu-anchor')?.click());
  await page.waitForFunction(()=>document.getElementById('mobile-menu-strip')?.classList.contains('open'),null,{timeout:3500});
  await page.evaluate(()=>document.getElementById('mobile-more')?.click());
  await page.waitForFunction(()=>document.body.classList.contains('mobile-more-open'),null,{timeout:3500});
  await page.waitForTimeout(240);
  const hf15Open=await hf15Measure();
  hf15AssertSeats(hf15Before,hf15Open,'more-open');
  if(!hf15Open.modal||hf15Open.modal.w<100||hf15Open.modal.h<80||
     hf15Open.modal.x< -2||hf15Open.modal.y< -2||
     hf15Open.modal.right>hf15Open.viewport.w+2||
     hf15Open.modal.bottom>hf15Open.viewport.h+2)
    fail('HF15_UX_MORE_MODAL_CLIPPED '+JSON.stringify(hf15Open.modal));
  // Native close path: a press outside the modal; no test-only class mutation.
  await page.evaluate(()=>{
    const el=document.getElementById('game-canvas');
    el?.dispatchEvent(new PointerEvent('pointerdown',{
      bubbles:true,cancelable:true,pointerId:610,pointerType:'touch',isPrimary:true,
      clientX:12,clientY:12
    }));
    el?.dispatchEvent(new PointerEvent('pointerup',{
      bubbles:true,cancelable:true,pointerId:610,pointerType:'touch',isPrimary:true,
      clientX:12,clientY:12
    }));
  });
  await page.waitForFunction(()=>!document.body.classList.contains('mobile-more-open'),null,{timeout:3500});
  const hf15Closed=await hf15Measure();
  hf15AssertSeats(hf15Before,hf15Closed,'more-closed');
  // Reuse original mobile-quest button and original Quest Log callback.
  // The strip may still be open depending on the release path; open only if shut.
  await page.evaluate(()=>{
    const strip=document.getElementById('mobile-menu-strip');
    if(!strip?.classList.contains('open'))
      document.getElementById('mobile-menu-anchor')?.click();
  });
  await page.waitForFunction(()=>document.getElementById('mobile-menu-strip')?.classList.contains('open'),null,{timeout:3500});
  await page.evaluate(()=>document.getElementById('mobile-quest')?.click());
  await page.locator('#quest-log-window').waitFor({state:'visible',timeout:6500});
  const hf15Quest=await hf15Measure();
  hf15AssertSeats(hf15Before,hf15Quest,'quest-open');
  result.hf15Ux={
    moreModalFits:true, hudNoShift:true, questLogOpens:true,
    viewport:hf15Before.viewport
  };
  await page.keyboard.press('Escape');
  await page.screenshot({path:'../hf15-v15-more-quest-s23.png',fullPage:true}).catch(()=>{});
  // HF15_UX_MORE_QUEST_QA end; continue existing golden joystick/camera tests.
"""
updated=text.replace(anchor,anchor+"\n"+injected,1)
path.write_text(updated,encoding="utf-8")
print("HF15_UX_MORE_QUEST_QA_INSTALLED=1")
