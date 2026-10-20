// HIGHFLY F2.2 BETA — viewport smoke against the Pages lab path.
// Deliberately does NOT claim offline capability; F1's root SW is untouched.
import puppeteer from 'puppeteer-core';
import { BROWSER_PATH } from './browser_path.mjs';

const BASE = process.env.F261_BETA_URL ?? 'http://127.0.0.1:4173/cobalt-hollow-lab/lab/f261-combat-beta/';
const betaKey = 'highfly.origin.f261-combat-beta.primary.v1';
const rootKey = 'highfly.origin.primary.v1';
const browser = await puppeteer.launch({
  executablePath:BROWSER_PATH,headless:'new',protocolTimeout:240000,
  args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
        '--window-size=844,390','--use-gl=angle','--use-angle=swiftshader',
        '--enable-unsafe-swiftshader'],
  defaultViewport:{width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1}
});
const page=await browser.newPage();
page.on('pageerror',e=>console.log('F26_BETA_PAGE_ERROR',e.message));
try {
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:120000});
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('highfly.origin.primary.v1','F1_SAVE_MUST_SURVIVE');
    localStorage.setItem('highfly.origin.f2-combat-beta.primary.v1','OLD_F2_SAVE_MUST_SURVIVE');
    localStorage.setItem('woc.cameraModePrompt.shown','1');
  });
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForSelector('#btn-play',{timeout:90000});
  await page.evaluate(()=>document.getElementById('btn-play')?.click());
  await page.waitForFunction(()=>!!document.querySelector('#offline-appearance.appearance-customizer'),{timeout:65000});
  await page.waitForFunction(()=>document.getElementById('char-preview-canvas')?.dataset.highflyPreviewHeldPropCount !== undefined,{timeout:90000});
  const before=await page.evaluate(()=>({
    heldPropCount:Number(document.getElementById('char-preview-canvas')?.dataset.highflyPreviewHeldPropCount||'-1'),
    name:document.getElementById('char-name')?.value,
    hasRootSentinel:localStorage.getItem('highfly.origin.primary.v1')==='F1_SAVE_MUST_SURVIVE',
    hasOldF2Sentinel:localStorage.getItem('highfly.origin.f2-combat-beta.primary.v1')==='OLD_F2_SAVE_MUST_SURVIVE',
    betaSave:localStorage.getItem('highfly.origin.f261-combat-beta.primary.v1')
  }));
  if(before.name||!before.hasRootSentinel||!before.hasOldF2Sentinel||before.betaSave)throw Error('F26_BETA_INHERITED_F1_DATA '+JSON.stringify(before));
  if(before.heldPropCount!==0)throw Error('F26_BETA_CREATOR_STILL_SHOWS_DONOR_SWORD '+JSON.stringify(before));
  await page.evaluate(()=>{
    document.getElementById('char-name').value='Wayfarer';
    document.getElementById('char-name').dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('btn-start-offline')?.click();
  });
  await page.waitForSelector('#mobile-preflight-continue',{visible:true,timeout:20000})
    .then(()=>page.evaluate(()=>document.getElementById('mobile-preflight-continue')?.click())).catch(()=>{});
  await page.waitForFunction(()=>!!window.__game?.sim?.player,{timeout:180000});
  await page.waitForSelector('#hf-origin-f1-hud',{timeout:45000});
  await page.evaluate(()=>document.body.classList.remove('mobile-chrome-idle'));
  // The F2.6.1 design uses ONLY native jump + evade; no independent Flash.
  await page.waitForFunction(()=>
    document.getElementById('mobile-jump')?.getBoundingClientRect().width>10 &&
    document.getElementById('mobile-evade')?.getBoundingClientRect().width>10,
    {timeout:12000});
  const comfort=await page.evaluate(()=>{
    const jump=document.getElementById('mobile-jump');
    const evade=document.getElementById('mobile-evade');
    const player=window.__game.sim.player;
    return {
      on:player.highflyF261Controls===true,
      jumpPresent:!!jump&&jump.getBoundingClientRect().width>10,
      evadePresent:!!evade&&evade.getBoundingClientRect().width>10,
      noFlashButton:!document.getElementById('hf-origin-f26-flash'),
      noFlashInSkills:!window.__game.sim.known.some(s=>s.def.id==='blink'),
      noMovedControls:!jump?.style.translate&&!evade?.style.translate,
      nativeBlinkEffectsRemain:true,
      isolatedSaveKey:'highfly.origin.f261-combat-beta.primary.v1',
    };
  });
  if(!comfort.on||!comfort.jumpPresent||!comfort.evadePresent||
     !comfort.noFlashButton||!comfort.noFlashInSkills||!comfort.noMovedControls)
    throw Error('F261_S23_JUMP_EVADE_ONLY_MISSING '+JSON.stringify(comfort));
  console.log('HIGHFLY_F261_S23_JUMP_EVADE_ONLY_GREEN=1',JSON.stringify(comfort));
  const state=await page.evaluate(()=>{
    const player=window.__game.sim.player;
    const meta=window.__game.sim.players.get(window.__game.sim.playerId);
    const atk=document.getElementById('mobile-action-attack')?.getBoundingClientRect();
    const slots=[...document.querySelectorAll('#mobile-action-ring .mobile-action-slot')];
    return {pos:{x:player.pos.x,z:player.pos.z},name:meta?.name,
      eq:meta?.equipment,atk:{x:atk?.x,y:atk?.y,w:atk?.width,h:atk?.height},
      slots:slots.filter(x=>x.getBoundingClientRect().width>=40).length,
      positions:slots.filter(el=>el.getBoundingClientRect().width>=40).map(el=>{
        const r=el.getBoundingClientRect();
        return {index:Number(el.dataset.mobileIndex),cx:r.x+r.width/2,cy:r.y+r.height/2,w:r.width,h:r.height};
      }).sort((a,b)=>a.index-b.index),
      legacies:[...document.querySelectorAll('#hf-c1-esp1,#hf-c1-esp2,#hf-c1-ult,#hf-c22-ghost-skills,#actionbar')]
        .filter(e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden')
        .map(e=>e.id),
      veteran:[...window.__game.sim.entities.values()].find(e=>e.templateId==='hf_origin_wayfarer')?.pos,
      noRootChange:localStorage.getItem('highfly.origin.primary.v1')==='F1_SAVE_MUST_SURVIVE'};
  });
  if(state.name!=='Wayfarer'||state.eq?.mainhand||state.pos.x< -50||
     Math.hypot(state.pos.x+94,state.pos.z+58)<40||
     Math.hypot(state.pos.x-(state.veteran?.x??1000),state.pos.z-(state.veteran?.z??1000))>9||
     state.slots!==4||!state.atk.w||!state.noRootChange||state.legacies.length)
    throw Error('F26_BETA_ENTRY_HUD '+JSON.stringify(state));
  const seats=state.positions;
  // Symmetric *inner crescent* in screen space: BASE1/BASE4 on the
  // outer x-column, BASE2/BASE3 on the inner x-column; all have 48px hits.
  if(seats.length!==4||seats.some(x=>x.w<44||x.h<44)||
     !(seats[0].cy>seats[1].cy&&seats[1].cy>seats[2].cy&&seats[2].cy>seats[3].cy)||
     Math.abs(seats[0].cx-seats[3].cx)>12||
     Math.abs(seats[1].cx-seats[2].cx)>12||
     seats[0].cx-seats[1].cx<20||
     seats[0].cy-seats[3].cy<140)
    throw Error('F26_BETA_NOT_SYMMETRIC_CRESCENT '+JSON.stringify(seats));
  await page.touchscreen.tap(state.atk.x+state.atk.w/2,state.atk.y+state.atk.h/2);
  await page.waitForFunction(()=>Number(document.body.dataset.highflyBasicAttackCount||0)>0,{timeout:11000});
  // Sim accepts the attack on the input tick, while a separate WebGL frame
  // picks up the renderer event. Under emulated S23/software GPU they may
  // settle on different frames. Wait for ACTUAL animation, never fake it.
  await page.waitForFunction(()=>Number(window.__game?.renderer?.abilityVfxAttackCount?.()||0)>0,{timeout:11000}).catch(()=>{});
  const attack=await page.evaluate(()=>({
    combo:Number(document.body.dataset.highflyBasicAttackCount||0),
    animation:window.__game?.renderer?.abilityVfxAttackCount()||0,
    modal:document.getElementById('hf-origin-f1-modal-backdrop')?.style.display
  }));
  if(attack.combo<1||attack.animation<1||attack.modal!=='none')throw Error('F26_BETA_ATK_REGRESSION '+JSON.stringify(attack));
  await page.waitForFunction(()=>{
    const e=document.getElementById('hf-origin-f1-guide');return e&&getComputedStyle(e).display!=='none';
  },{timeout:18000});
  await page.evaluate(()=>document.getElementById('hf-origin-f1-open')?.click());
  await page.waitForFunction(()=>document.getElementById('hf-origin-f1-modal-backdrop')?.style.display==='flex',{timeout:15000});
  await page.evaluate(()=>document.querySelector('#hf-origin-f1-options [data-starter="worn_sword"]')?.click());
  await page.waitForFunction(()=>window.__game.sim.players.get(window.__game.sim.playerId)?.equipment.mainhand==='worn_sword',{timeout:15000});
  // F2.2: logical inventory equality was not enough. Count the REAL GLB
  // prop holders in the ACTIVE skinned rig (no screenshot/DOM shortcuts).
  const heldBody=() => ({
    equipment:window.__game?.sim?.players?.get(window.__game.sim.playerId)?.equipment?.mainhand,
    held:(()=>{
      const v=window.__game?.renderer?.views?.get(window.__game.sim.playerId)?.visual;
      const holders=[];
      v?.model?.traverse?.(o=>{if(o.userData?.swapWeaponHolder)holders.push(o.uuid)});
      return holders;
    })()
  });
  await page.waitForFunction(heldBody,{timeout:15000}).catch(()=>{});
  await page.waitForFunction(()=>{
    const v=window.__game?.renderer?.views?.get(window.__game.sim.playerId)?.visual;
    let count=0;v?.model?.traverse?.(o=>{if(o.userData?.swapWeaponHolder)count++});
    return count>0;
  },{timeout:25000});
  const sword=await page.evaluate(heldBody);
  if(sword.held.length<1)throw Error('F26_SWORD_IN_INVENTORY_BUT_NOT_IN_HAND '+JSON.stringify(sword));
  // F2.3: the Veteran is a real paid teacher, not just a cosmetic skill list.
  // Supply TEST-ONLY earned currency through the native Sim, pay exactly five,
  // hydrate the spellbook and confirm the save keeps it (no free spawn skills).
  await page.evaluate(()=>{
    const g=window.__game;
    g.sim.players.get(g.sim.playerId).copper=25;
    document.getElementById('hf-origin-f1-open')?.click();
  });
  await page.waitForSelector('#hf-origin-f23-trainer [data-learn-skill="fireball"]',{visible:true,timeout:15000});
  await page.evaluate(()=>document.querySelector('[data-learn-skill="fireball"]')?.click());
  await page.waitForFunction(()=>window.__game?.sim?.known?.some(k=>k.def.id==='fireball'),{timeout:18000});
  const skillPurchase=await page.evaluate(()=>{
    const g=window.__game;
    const hunter=g.sim.players.get(g.sim.playerId);
    const save=JSON.parse(localStorage.getItem('highfly.origin.f261-combat-beta.primary.v1')??'null');
    return {copper:hunter.copper,known:g.sim.known.map(k=>k.def.id),
      manaType:g.sim.player.resourceType,persisted:save?.originF1?.learnedAbilityIds};
  });
  if(skillPurchase.copper!==20 || !skillPurchase.known.includes('fireball') ||
     skillPurchase.manaType!=='mana'||!skillPurchase.persisted?.includes('fireball'))
    throw Error('F26_MASTER_TRAINING_NOT_PERSISTENT '+JSON.stringify(skillPurchase));
  // F2.6: a real world-space 3D line must appear during the Fireball aim.
  // This checks the same input seam as pointerdown/move, not a fake CSS cursor.
  const aimStarted=await page.evaluate(()=>{
    const g=window.__game;
    const a={type:'ability',id:'fireball'};
    const started=g.hud.onHighflyAimGesture?.('start',a,0,0)===true;
    const moved=g.hud.onHighflyAimGesture?.('move',a,94,0)===true;
    return {started,moved};
  });
  if(!aimStarted.started||!aimStarted.moved)throw Error('F26_MOBILE_AIM_INPUT_NOT_CONNECTED '+JSON.stringify(aimStarted));
  await page.waitForFunction(()=>{
    const r=window.__game?.renderer?.groundAimReticle;
    return r?.group?.visible===true && r?.directionalGeometry?.drawRange?.count>0;
  },{timeout:15000});
  const worldAim=await page.evaluate(()=>{
    const v=window.__game.renderer.groundAimReticle;
    return {visible:v.group.visible,geometry:v.directionalGeometry.drawRange.count};
  });
  if(worldAim.geometry<4)throw Error('F26_FIREBALL_3D_LINE_NOT_DRAWN '+JSON.stringify(worldAim));
  // F2.6: use the one authoritative native Sim to prove the new mechanics,
  // not only the cursor and decorative missile meshes.
  const f26=await page.evaluate(()=>{
    const g=window.__game,p=g.sim.player;
    const a={type:'ability',id:'fireball'};
    const cancelExists=!!document.getElementById('highfly-f26-aim-cancel');
    const noFlashButton=!document.getElementById('hf-origin-f26-flash');
    const noFlashSkill=!g.sim.known.some(s=>s.def.id==='blink');
    const manaBefore=p.resource;
    g.hud.onHighflyAimGesture?.('cancel',a,0,0);
    const manaCancelled=p.resource;
    const end=g.hud.onHighflyAimGesture?.('end',a,0,-94);
    g.sim.castAbility('fireball');
    const manaAfterFireball=p.resource;
    const fireCd=p.cooldowns.get('fireball')??0;
    g.sim.castAbility('fireball'); // recast refused by the GCD/cooldown
    const manaAfterRejected=p.resource;
    return {cancelExists,noFlashButton,noFlashSkill,manaBefore,manaCancelled,
      end,manaAfterFireball,manaAfterRejected,fireCd};
  });
  if(!f26.cancelExists||!f26.noFlashButton||!f26.noFlashSkill||
     f26.manaCancelled!==f26.manaBefore||!f26.end||
     !(f26.manaAfterFireball<f26.manaBefore)||f26.fireCd<=0||
     f26.manaAfterRejected!==f26.manaAfterFireball)
    throw Error('F261_TRUE_SKILLSHOT_CANCEL_NO_FLASH_NOT_LIVE '+JSON.stringify(f26));
  console.log('HIGHFLY_F261_TRUE_SKILLSHOT_CANCEL_NO_FLASH_GREEN=1',JSON.stringify(f26));

  await page.evaluate(()=>{
    window.__game.hud.onHighflyAimGesture?.('cancel',{type:'ability',id:'fireball'},0,0);
    document.getElementById('hf-origin-f1-close')?.click();
  });
  const swaps=[];
  for(const weapon of ['rusty_hatchet','training_mace','worn_sword']){
    await page.evaluate((id)=>{
      const sim=window.__game.sim;
      // An inventory pickup—not a second Veteran grant—is how later gear is changed.
      if(!sim.players.get(sim.playerId).inventory.some(slot=>slot?.itemId===id))
        sim.addItem(id,1,sim.playerId);
      sim.equipItemToSlot(id,'mainhand');
    },weapon);
    await page.waitForFunction(id=>{
      const sim=window.__game.sim;
      return sim.players.get(sim.playerId)?.equipment?.mainhand===id &&
        sim.player.mainhandItemId===id;
    },{timeout:12000},weapon);
    await page.waitForFunction(oldUuid=>{
      const v=window.__game?.renderer?.views?.get(window.__game.sim.playerId)?.visual;
      let count=0;
      v?.model?.traverse?.(o=>{if(o.userData?.swapWeaponHolder && o.uuid!==oldUuid)count++});
      return count>0;
    },{timeout:22000},swaps.length?swaps[swaps.length-1].held[0]:sword.held[0]);
    const current=await page.evaluate(heldBody);
    if(current.held.length<1)throw Error('F26_EQUIPMENT_RENDER_MISSING '+weapon);
    swaps.push(current);
  }
  // Verify physical ATK is now an OVERLAY while real run gait remains active.
  await page.evaluate(()=>window.__game.input.setHighflyTouchVector({x:0,y:-1}));
  await page.waitForFunction(()=>{
    const v=window.__game?.renderer?.views?.get(window.__game.sim.playerId)?.visual;
    return v?.originGroundMoving===true;
  },{timeout:14000});
  const comboBefore=await page.evaluate(()=>Number(document.body.dataset.highflyBasicAttackCount||0));
  await page.touchscreen.tap(state.atk.x+state.atk.w/2,state.atk.y+state.atk.h/2);
  await page.waitForFunction(n=>Number(document.body.dataset.highflyBasicAttackCount||0)>n,{timeout:12000},comboBefore);
  await page.waitForFunction(()=>{
    const v=window.__game?.renderer?.views?.get(window.__game.sim.playerId)?.visual;
    return v?.originUpperAttack?.size>0;
  },{timeout:14000});
  const movingAttack=await page.evaluate(()=>{
    const v=window.__game.renderer.views.get(window.__game.sim.playerId)?.visual;
    return {maskedClips:v.originUpperAttack.size,fullBodyBlocking:v.currentIsOneShot===true,
      groundMoving:v.originGroundMoving};
  });
  if(movingAttack.maskedClips<1||movingAttack.fullBodyBlocking)
    throw Error('F26_SKATING_STILL_FULL_BODY '+JSON.stringify(movingAttack));
  // The moving-attack test holds a continuous left stick. Release it BEFORE
  // starting the next independent chain or the player may run off the town
  // terrain while Puppeteer waits for GPU pose updates.
  await page.evaluate(()=>window.__game.input.clearHighflyTouchVector());
  await page.waitForFunction(()=>{
    const p=window.__game?.sim?.player;
    return p && p.onGround && !p.dead && !p.climb && !p.mountKey;
  },{timeout:10000});
  // Real INPUT edges into the ONE Sim: first jump -> airborne dodge -> second
  // directional jump. The authored flip belongs to the renderer, not teleport.
  // Software-GPU CI can drop below 5fps under GLB compilation, while the
  // production tap latch is intentionally 220ms. Keep the exact real edge
  // but lengthen its QA holding interval until the next simulation tick.
  await page.evaluate(()=>{
    window.__game.input.triggerTouchJump();
    window.__game.input.touchJumpUntil=performance.now()+1500;
  });
  const jumpStarted=await page.waitForFunction(()=>window.__game?.sim?.player?.jumping===true,{timeout:12000})
    .then(()=>true).catch(()=>false);
  if(!jumpStarted) {
    const diagnosis=await page.evaluate(()=>{
      const g=window.__game,p=g.sim.player;
      return {input:g.input.readMoveInput(),suspended:g.input.suspendMovement,
        jumpSeq:g.input.highflyJumpSeq,lastJumpSeq:p.highflyLastJumpSeq,
        onGround:p.onGround,jumping:p.jumping,vy:p.vy,dead:p.dead,
        rooted:p.auras?.map(x=>x.id).slice(0,12),pos:p.pos,time:g.sim.time};
    });
    throw Error('F26_FIRST_JUMP_NOT_OBSERVED '+JSON.stringify(diagnosis));
  }
  await page.evaluate(()=>window.__game.input.triggerHighflyEvade());
  await page.waitForFunction(()=>window.__game?.sim?.player?.highflyLastEvadeSeq>0,{timeout:11000});
  await page.evaluate(()=>window.__game.input.setHighflyTouchVector({x:1,y:0}));
  await page.evaluate(()=>{
    window.__game.input.triggerTouchJump();
    window.__game.input.touchJumpUntil=performance.now()+1500;
  });
  await page.waitForFunction(()=>window.__game?.sim?.player?.highflyAirJumpUsed===true,{timeout:15000});
  const chain=await page.evaluate(()=>({
    secondJump:window.__game.sim.player.highflyAirJumpUsed,
    dashEdge:window.__game.sim.player.highflyLastEvadeSeq,
    flipState:window.__game.renderer.views.get(window.__game.sim.playerId)?.visual?.originWasAirFlip,
  }));
  await page.evaluate(()=>window.__game.input.clearHighflyTouchVector());
  if(!chain.secondJump||!chain.dashEdge)throw Error('F26_PHYSICAL_CHAIN_FAILED '+JSON.stringify(chain));
  const saved=await page.evaluate(()=>({
    beta:JSON.parse(localStorage.getItem('highfly.origin.f261-combat-beta.primary.v1')??'null'),
    f1:localStorage.getItem('highfly.origin.primary.v1'),
    f2:localStorage.getItem('highfly.origin.f2-combat-beta.primary.v1')
  }));
  if(saved.beta?.originF1?.starterWeaponId!=='worn_sword'||(saved.f1!=='F1_SAVE_MUST_SURVIVE'||saved.f2!=='OLD_F2_SAVE_MUST_SURVIVE'))
    throw Error('F26_BETA_SAVE_CROSSTALK '+JSON.stringify(saved));
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForSelector('#btn-play',{timeout:90000});
  await page.evaluate(()=>document.getElementById('btn-play')?.click());
  await page.waitForFunction(()=>document.getElementById('char-name')?.value==='Wayfarer',{timeout:60000});
  console.log('HIGHFLY_F2_PAGES_BETA_BROWSER_GREEN=1',JSON.stringify({
    url:BASE,attack,starter:'worn_sword',renderedWeapons:[sword,...swaps],movingAttack,physicalChain:chain,safeTownBirth:state.pos,
    innerCrescent:seats,previewHeldProps:before.heldPropCount,legacyButtons:state.legacies,
    saveNamespace:betaKey,
    rootSaveIntact:saved.f1==='F1_SAVE_MUST_SURVIVE',oldF2SaveIntact:saved.f2==='OLD_F2_SAVE_MUST_SURVIVE',resume:true,
    device:'Chrome 844x390 touch emulation; not physical S23',
    offline:'NOT TESTED / beta remains online-only'
  }));
}finally{await browser.close();}
