/** ANDROID P3 native HUD E2E: one visible 4 BASE owner, no C1 ghost slots, two Hunter bodies. */
import {chromium} from 'playwright';
import fs from 'node:fs';

const url='http://127.0.0.1:4173/cobalt-hollow-lab/?hf_android_p2=1&hf_android_p3=1';
const report={version:'HIGHFLY-ANDROID-P3',url,pass:false,device:'emulated Samsung S23 Ultra landscape, physical device not yet tested',hunters:[],failure:null};
let browser;
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const gender of ['male','female']) {
    const context=await browser.newContext({
      viewport:{width:844,height:390},screen:{width:844,height:390},
      deviceScaleFactor:3,isMobile:true,hasTouch:true,
      userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
    });
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.locator('#hf-clean-gender-picker button[data-origin-gender="'+gender+'"]').waitFor({timeout:50000});
    await page.evaluate(sex=>{
      document.querySelector('#hf-clean-gender-picker button[data-origin-gender="'+sex+'"]')?.click();
      const el=document.getElementById('hf-origin-name');
      if(el instanceof HTMLInputElement){
        el.value=sex==='male'?'Hunter Male':'Hunter Female';
        el.dispatchEvent(new Event('input',{bubbles:true}));
      }
      document.querySelector('#hf-origin-entry > button')?.click();
    },gender);
    await page.waitForFunction(()=>!!window.__game?.sim?.player||
      document.body.classList.contains('mobile-preflight-open')||
      document.getElementById('mobile-preflight')?.classList.contains('visible'),
      null,{timeout:110000});
    if(await page.locator('#mobile-preflight').isVisible().catch(()=>false)){
      await page.waitForFunction(()=>
        typeof document.getElementById('mobile-preflight-continue')?.onclick==='function',
        null,{timeout:15000});
      await page.evaluate(()=>document.getElementById('mobile-preflight-continue')?.click());
    }
    await page.waitForFunction(()=>!!window.__game?.sim?.player &&
      document.body.classList.contains('game-active'),null,{timeout:120000});
    // ClaudeCraft v0.44.0 deliberately hides #mobile-controls with inline
    // style.display='none' throughout the FIRST-SPAWN CAMERA CINEMATIC.
    // A game-active body precedes the end of that intro, so testing buttons
    // immediately here is a false negative. Use the native Escape-to-skip
    // action (only while the intro owns the HUD), then WAIT for restored controls.
    const initialIntroCover=await page.evaluate(()=>
      document.getElementById('mobile-controls')?.style.display==='none');
    if(initialIntroCover) await page.keyboard.press('Escape');
    await page.waitForFunction(()=>{
      const el=document.getElementById('mobile-controls');
      return !!el && el.style.display!=='none' &&
        getComputedStyle(el).display!=='none' &&
        document.body.classList.contains('game-active');
    },null,{timeout:60000});
    // Native transition may publish the first world frame before all
    // opening windows settle; never fake visibility or strip body classes.
    await page.waitForFunction(()=>!document.body.classList.contains('mobile-window-open'),
      null,{timeout:20000}).catch(()=>{});
    const found=await page.evaluate(()=>{
      const sim=window.__game.sim;
      const visible=el=>{
        if(!el)return false;
        const rect=el.getBoundingClientRect(),cs=getComputedStyle(el);
        if(cs.display==='none'||cs.visibility==='hidden'||rect.width<=0||rect.height<=0)return false;
        for(let cur=el.parentElement;cur;cur=cur.parentElement){
          const p=getComputedStyle(cur);
          if(p.display==='none'||p.visibility==='hidden')return false;
        }
        return true;
      };
      const slots=[...document.querySelectorAll('#mobile-action-ring .mobile-action-slot')];
      const explain=(id)=>{
        const el=document.getElementById(id);
        if(!el) return {missing:true};
        const cs=getComputedStyle(el),rect=el.getBoundingClientRect();
        const ancestors=[];
        for(let n=el;n && ancestors.length<5;n=n.parentElement){
          const c=getComputedStyle(n);
          ancestors.push({id:n.id||null,tag:n.tagName,classes:String(n.className).slice(0,140),
            display:c.display,visibility:c.visibility,opacity:c.opacity,
            inlineDisplay:n.style.display,rect:[Math.round(n.getBoundingClientRect().width),Math.round(n.getBoundingClientRect().height)]});
        }
        return {display:cs.display,visibility:cs.visibility,opacity:cs.opacity,
          pointerEvents:cs.pointerEvents,inlineDisplay:el.style.display,hidden:el.hidden,
          rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
          ancestors};
      };
      return {
        diagnostic: {
          bodyClass:document.body.className, bodyStyle:document.body.style.cssText,
          innerWidth:innerWidth,innerHeight:innerHeight,dpr:devicePixelRatio,
          pointerCoarse:matchMedia('(pointer: coarse)').matches,
          landscape:matchMedia('(orientation: landscape)').matches,
          openWindows:[...document.querySelectorAll('.window.panel')]
            .filter(el=>!el.hidden && getComputedStyle(el).display!=='none')
            .map(el=>({id:el.id,className:el.className,
              display:getComputedStyle(el).display,
              visible:el.getBoundingClientRect().width>0,
              windowOpen:el.getAttribute('data-window-open')}))
            .slice(0,24),
          nodes:Object.fromEntries(['mobile-controls','mobile-move-joystick','mobile-move-zone',
            'mobile-action-ring','mobile-action-attack','mobile-action-page-toggle',
            'mobile-preflight','ui'].map(id=>[id,explain(id)])),
        },
        androidP2:document.body.classList.contains('hf-android-p2'),
        androidP3:document.body.classList.contains('hf-android-p3'),
        oldBarVisible:visible(document.getElementById('actionbar')),
        oldSpecialVisible:visible(document.getElementById('hf-c1-special-seats')),
        oldGhostVisible:visible(document.getElementById('hf-c22-ghost-skills')),
        oldBuffTopVisible:visible(document.getElementById('hf-origin-buffs-top')),
        oldBuffBottomVisible:visible(document.getElementById('hf-origin-buffs-bottom')),
        labButtonVisible:visible(document.querySelector('#hf-origin-training > button')),
        labMenuExists:!!document.getElementById('hf-p3-lab-entry'),
        auxExists:!!document.getElementById('hf-p3-aux-root'),
        auxMoved:document.querySelectorAll('#hf-p3-aux-grid button[data-origin-buff]').length,
        interactionButtonExists:!!document.getElementById('mobile-interact'),
        contextualAttack:document.getElementById('mobile-action-attack')?.getAttribute('data-highfly-context'),
        touch:document.body.classList.contains('mobile-touch'),
        gameActive:document.body.classList.contains('game-active'),
        origin:!!sim.player.originResources,
        gender:sim.player.modularAppearance?.gender??null,
        equipment:sim.equipment,
        controls:visible(document.getElementById('mobile-controls')),
        moveJoystick:visible(document.getElementById('mobile-move-joystick')),
        ring:visible(document.getElementById('mobile-action-ring')),
        slots:slots.length,visibleSlots:slots.filter(visible).length,
        slotStyles:slots.map((el,i)=>({slot:i+1,display:getComputedStyle(el).display,
          visibility:getComputedStyle(el).visibility})),
        attack:visible(document.getElementById('mobile-action-attack')),
        pageToggle:visible(document.getElementById('mobile-action-page-toggle')),
        hasHiddenUniqueSlot:!!document.querySelector('[id*="origin-unique-slot"],[id*="hf-unique-locked"]'),
      };
    });
    const okay=found.androidP2&&found.androidP3&&found.touch&&found.gameActive&&found.origin &&
      found.gender===gender&&!found.equipment?.mainhand&&!found.equipment?.offhand &&
      !found.equipment?.chest&&found.controls&&found.moveJoystick&&found.ring &&
      found.slots===4&&found.visibleSlots===4&&found.attack&&!found.pageToggle &&
      !found.hasHiddenUniqueSlot&&!found.oldBarVisible&&!found.oldSpecialVisible&&
      !found.oldGhostVisible&&!found.oldBuffTopVisible&&!found.oldBuffBottomVisible&&
      !found.labButtonVisible&&!found.labMenuExists&&found.auxExists&&
      found.auxMoved===8&&found.interactionButtonExists&&
      found.contextualAttack==='ATK'&&errors.length===0;
    const entry={gender,pass:okay,introSkipped:initialIntroCover,found,errors:errors.slice(0,6)};
    report.hunters.push(entry);
    await page.screenshot({path:'../highfly-android-p3-'+gender+'.png',fullPage:false}).catch(()=>{});
    await context.close();
    if(!okay)throw Error('HIGHFLY_ANDROID_P3_HUD_BROWSER_RED '+JSON.stringify(entry));
  }
  report.pass=true;
  console.log('HIGHFLY_ANDROID_P3_CLEAN_4BASE_NO_GHOST_HUNTER_MALE_FEMALE_S23_BROWSER_GREEN=1');
}catch(e){
  report.failure=String(e);
  console.error('HIGHFLY_ANDROID_P3_BROWSER_RED '+JSON.stringify(report,null,2));
  process.exitCode=1;
}finally{
  fs.writeFileSync('../highfly-android-p3-report.json',JSON.stringify(report,null,2));
  if(browser)await browser.close();
}
