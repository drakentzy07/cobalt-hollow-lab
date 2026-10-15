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
  // Trace actual touch routing. A pointer event can be intercepted by another
  // floating HUD layer even if Playwright force:true bypasses actionability.
  // No game class names or state are modified by the probe; capture listeners only.
  await page.evaluate(()=>{
    const a=document.getElementById('mobile-menu-anchor');
    if(!(a instanceof HTMLElement))throw Error('HF15_UX_MENU_ANCHOR_MISSING');
    const ids=['mobile-menu-mount','mobile-menu-chat','mobile-menu-map',
      'mobile-menu-bags','mobile-social','mobile-quest',
      'mobile-menu-char','mobile-menu-spellbook','mobile-menu',
      'mobile-more','mobile-menu-cancel','mobile-menu-caption'];
    window.__hf15QuickMenuTrace={
      absent:ids.filter(id=>!document.getElementById(id)),
      events:[],
      rect:a.getBoundingClientRect().toJSON(),
    };
    for(const type of ['pointerdown','pointerup','click']){
      document.addEventListener(type,e=>{
        const t=e.target;
        const name=t instanceof HTMLElement?(t.id||t.className||t.tagName):String(t);
        window.__hf15QuickMenuTrace.events.push(type+':'+String(name).slice(0,65));
      },{capture:true});
    }
  });
  // Match HIGHFLY's established S23 smoke: dispatch real pointerType=touch
  // through the original pointer listeners, not Playwright's hanging CDP tap.
  // Critically, hit-test FIRST: dispatch only to the element actually at the
  // visual anchor, otherwise reject an obstructed gameplay control.
  const hf15Touch=async(selector)=>{
    return page.evaluate((sel)=>{
      const anchor=document.querySelector(sel);
      if(!(anchor instanceof HTMLElement))throw Error('HF15_UX_TOUCH_TARGET_MISSING '+sel);
      const r=anchor.getBoundingClientRect(),x=Math.max(2,r.x+r.width/2),y=r.y+r.height/2;
      const top=document.elementFromPoint(x,y);
      if(!(top instanceof Element)||!anchor.contains(top)){
        const stack=document.elementsFromPoint(x,y).slice(0,7).map(e=>e.id||e.tagName);
        throw Error('HF15_UX_TOUCH_TARGET_OBSCURED '+sel+' '+JSON.stringify({x,y,top:top?.id||top?.tagName,stack}));
      }
      const pointerId=950;
      for(const type of ['pointerdown','pointerup']){
        top.dispatchEvent(new PointerEvent(type,{
          bubbles:true,cancelable:true,isPrimary:true,pointerId,pointerType:'touch',
          clientX:x,clientY:y,button:0,buttons:type==='pointerdown'?1:0
        }));
      }
      return {x,y,hit:top.id||top.tagName};
    },selector);
  };
  // CDP read-only: prove whether MobileControls.start() installed the
  // original StripGesture listeners at all. A present anchor alone is not proof.
  const hf15Cdp=await page.context().newCDPSession(page);
  const hf15Remote=await hf15Cdp.send('Runtime.evaluate',{
    expression:"document.getElementById('mobile-menu-anchor')",
    objectGroup:'hf15-menu-probe'
  });
  const hf15ObjectId=hf15Remote.result?.objectId;
  const hf15Listeners=hf15ObjectId
    ? await hf15Cdp.send('DOMDebugger.getEventListeners',{objectId:hf15ObjectId})
    : {listeners:[]};
  result.hf15MenuBindings={
    kinds:(hf15Listeners.listeners||[]).map(l=>({type:l.type,useCapture:l.useCapture,
      scriptId:l.scriptId,lineNumber:l.lineNumber})),
    pointerDown:(hf15Listeners.listeners||[]).filter(l=>l.type==='pointerdown').length,
    pointerUp:(hf15Listeners.listeners||[]).filter(l=>l.type==='pointerup').length,
    click:(hf15Listeners.listeners||[]).filter(l=>l.type==='click').length,
  };
  await hf15Cdp.detach();
  if(!result.hf15MenuBindings.pointerDown||!result.hf15MenuBindings.pointerUp||
     !result.hf15MenuBindings.click){
    const missing=await page.evaluate(()=>({
      required:[
        'mobile-controls','mobile-move-joystick','mobile-move-stick',
        'mobile-camera-joystick','mobile-camera-stick','mobile-menu-anchor',
        'mobile-menu-strip','mobile-menu-cancel','mobile-menu-caption',
        'mobile-menu-mount','mobile-menu-chat','mobile-menu-map',
        'mobile-menu-bags','mobile-social','mobile-quest',
        'mobile-menu-char','mobile-menu-spellbook','mobile-menu','mobile-more'
      ].filter(id=>!document.getElementById(id)),
      caption:!!document.querySelector('#mobile-menu-caption .tt-title'),
      menuAria:document.getElementById('mobile-menu-anchor')?.getAttribute('aria-label'),
      mobileTouch:document.body.classList.contains('mobile-touch')
    }));
    fail('HF15_UX_MENU_GESTURE_LISTENERS_MISSING '+
      JSON.stringify({listeners:result.hf15MenuBindings,dom:missing}));
  }
  result.hf15TouchMethod='hit-tested-pointer-events-matching-original-joystick-qa';
  result.hf15AnchorTouch=await hf15Touch('#mobile-menu-anchor');
  await page.waitForFunction(()=>document.getElementById('mobile-menu-strip')?.classList.contains('open'),null,{timeout:5500}).catch(async()=>{
    const diag=await page.evaluate(()=>({
      anchor:document.getElementById('mobile-menu-anchor')?.getBoundingClientRect().toJSON(),
      expanded:document.getElementById('mobile-menu-anchor')?.getAttribute('aria-expanded'),
      stripClasses:document.getElementById('mobile-menu-strip')?.className,
      mobile:document.body.classList.contains('mobile-touch'),
      active:document.body.classList.contains('game-active'),
      questExists:!!document.getElementById('mobile-quest'),
      touchTrace:window.__hf15QuickMenuTrace,
      menuButtonsPresent:['mobile-menu-cancel','mobile-menu-caption','mobile-menu-mount',
        'mobile-menu-chat','mobile-menu-map','mobile-menu-bags','mobile-social','mobile-quest',
        'mobile-menu-char','mobile-menu-spellbook','mobile-menu','mobile-more']
        .map(id=>({id,found:!!document.getElementById(id)})),
      hitStack:(()=>{
        const r=document.getElementById('mobile-menu-anchor')?.getBoundingClientRect();
        if(!r)return [];
        return document.elementsFromPoint(Math.max(2,r.left+r.width/2),r.top+r.height/2)
          .slice(0,8).map(el=>({id:el.id,tag:el.tagName,
            cls:String(el.className).slice(0,70),pe:getComputedStyle(el).pointerEvents}));
      })()
    }));
    fail('HF15_UX_QUICK_ACTIONS_NOT_OPEN initial '+JSON.stringify(diag));
  });
  await hf15Touch('#mobile-more');
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
  await page.touchscreen.tap(12,12);
  await page.waitForFunction(()=>!document.body.classList.contains('mobile-more-open'),null,{timeout:3500});
  const hf15Closed=await hf15Measure();
  hf15AssertSeats(hf15Before,hf15Closed,'more-closed');
  // Reuse original mobile-quest button and original Quest Log callback.
  // The strip may still be open depending on the release path; open only if shut.
  const hf15StripOpen=await page.evaluate(()=>document.getElementById('mobile-menu-strip')?.classList.contains('open')===true);
  if(!hf15StripOpen)await hf15Touch('#mobile-menu-anchor');
  await page.waitForFunction(()=>document.getElementById('mobile-menu-strip')?.classList.contains('open'),null,{timeout:5500}).catch(async()=>{
    const diag=await page.evaluate(()=>({
      expanded:document.getElementById('mobile-menu-anchor')?.getAttribute('aria-expanded'),
      stripClasses:document.getElementById('mobile-menu-strip')?.className,
    }));
    fail('HF15_UX_QUICK_ACTIONS_NOT_OPEN quest '+JSON.stringify(diag));
  });
  await hf15Touch('#mobile-quest');
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
