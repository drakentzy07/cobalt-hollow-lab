/** HIGHFLY ORIGIN F1 — in-world optional weapon-guide and unified resource view.
 * Player interaction and rewards use the ONE native Sim. This module never
 * teleports the actor, creates a second player, or alters quest progression.
 */
import type { Sim } from '../../sim/sim';
import { getActiveHighflyOriginMode, isUnifiedOriginRuntime } from './unified_mode';
import { ABILITIES } from '../../sim/data';
import { ORIGIN_VETERAN_POS } from './f1_start';
import { registerOriginResourceController, type OriginResourceController } from './f1_resource_bridge';
import {
  claimOriginStarter,
  consumeF1Resource,
  swapOriginStarter,
  ORIGIN_STARTER_WEAPONS,
  ORIGIN_F23_MASTER_SKILLS,
  originCanTrainSkill,
  tickF1Resources,
  type OriginF1Save,
} from './f1_core';

export const ORIGIN_GUIDE_ID = 'hf_origin_wayfarer';
export const ORIGIN_GUIDE_POS = ORIGIN_VETERAN_POS;

export interface OriginF1WorldUi {
  save(): OriginF1Save;
  close(): void;
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text: string, cls = ''):
    HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.textContent = text;
  if (cls) el.className = cls;
  return el;
}

export function mountOriginF1WorldUi(
  sim: Sim, initial: OriginF1Save, onStarterGranted: () => void,
): OriginF1WorldUi {
  document.getElementById('hf-origin-f1-hud')?.remove();
  const f27Preview=(isUnifiedOriginRuntime() || location.pathname.startsWith('/cobalt-hollow-lab/lab/f27-combat-beta/'));
  const unifiedFrame=isUnifiedOriginRuntime();
  const f263=f27Preview||location.pathname.startsWith('/cobalt-hollow-lab/lab/f263-combat-beta/');
  if(f27Preview)document.body.classList.add('hf-origin-f27');
  const f262=f263||location.pathname.startsWith('/cobalt-hollow-lab/lab/f262-combat-beta/');
  const f261=f262||location.pathname.startsWith('/cobalt-hollow-lab/lab/f261-combat-beta/');
  const f26=f261||location.pathname.startsWith('/cobalt-hollow-lab/lab/f26-combat-beta/');
  const f25=f26||location.pathname.startsWith('/cobalt-hollow-lab/lab/f25-combat-beta/');
  if(f25) document.body.classList.add('hf-origin-f25');
  if(f261) document.body.classList.add('hf-origin-f261');
  if(f263) document.body.classList.add('hf-origin-f263');
  const root = node('aside', '', 'hf-origin-f1-hud');
  root.id = 'hf-origin-f1-hud';
  root.setAttribute('aria-label', 'Hunter: recursos y guía de inicio');
  root.style.cssText = 'position:fixed;left:max(12px,env(safe-area-inset-left));top:55px;z-index:185;color:#fff;font:600 12px system-ui;pointer-events:none;max-width:245px';
  const meter = node('div', '', 'hf-origin-f1-resource-meter');
  meter.id = 'hf-origin-f1-resource-meter';
  meter.style.cssText = f25
    ? 'width:100%;box-sizing:border-box;margin:0;padding:0;display:block;flex:0 0 100%;background:transparent;border:0;box-shadow:none;pointer-events:none'
    : 'background:#0b1923d9;border:1px solid #63828a;border-radius:12px;padding:9px 12px;box-shadow:0 3px 15px #0007';
  // The original ClaudeCraft unit frame is the only HP authority/display.
  // Integrate Origin's MP/ST under that frame instead of drawing a duplicate
  // floating HP/MP/ST block over the left side of the battlefield.
  // The frame's native inner .uf-bars node can be replaced by the HUD
  // lifecycle. Attach to its stable #player-frame shell instead.
  root.append(meter);
  const originalFrame=document.getElementById('player-frame');
  if (originalFrame) {
    const bars=originalFrame.querySelector(':scope > .uf-bars');
    const hp=bars?.querySelector(':scope > .bar.hp');
    // Never attach the meter as a flex sibling of the portrait: it would paint
    // an independent rail shifted to the right on the S23 landscape viewport.
    if (unifiedFrame && hp) hp.after(meter);
    else if (!unifiedFrame) (f25 ? bars ?? originalFrame : originalFrame).append(meter);
  }
  const renderBars: Record<'mana'|'stamina', {wrap:HTMLDivElement;fill:HTMLDivElement;label:HTMLSpanElement}> =
    {} as Record<'hp'|'mana'|'stamina', {wrap:HTMLDivElement;fill:HTMLDivElement;label:HTMLSpanElement}>;
  // UNIFIED always shows both MP and ST beneath native HP; older labs keep
  // their existing native MP row and only one custom stamina row.
  for (const [key, title, color] of (f25 && !unifiedFrame
    ? [['stamina','ST','#e5b73a']] as const
    : [['mana','MP','#4e98e8'],['stamina','ST','#e5b73a']] as const)) {
    const row = node('div', '', '');
    row.style.cssText = f25
      ? 'box-sizing:border-box;position:relative;width:100%;height:14px;min-height:14px;margin:0;display:flex;align-items:center;padding:0;border:1px solid #b6a17288;border-radius:3px;background:linear-gradient(180deg,#3a372d,#151a1f);overflow:hidden;box-shadow:inset 0 1px 3px #0009'
      : 'display:flex;align-items:center;gap:8px;margin:3px 0';
    const lab = node('span', title);
    lab.style.cssText=f25 ? 'position:absolute;left:5px;top:0;z-index:2;line-height:12px;font-size:9px;text-shadow:0 1px 2px black' : 'width:24px';
    const track = node('div', '');
    track.style.cssText=f25
      ? 'position:absolute;inset:0;width:100%;height:100%;background:transparent;overflow:hidden;pointer-events:none'
      : 'background:#364250;flex:1;width:150px;height:7px;border-radius:7px;overflow:hidden';
    track.dataset.originResourceTrack=key;
    const fill = node('div', '');
    fill.style.cssText = f25
      ? `height:100%;background:${key==='mana'?'linear-gradient(180deg,#b9f2ff,#37b9e8 55%,#126fba)':'linear-gradient(180deg,#fbe5a1,#e5b73a 55%,#a06d21)'};width:100%;transition:width 140ms ease-out;box-shadow:inset 0 1px 2px #fff8`
      : `height:100%;background:${color};width:100%;border-radius:7px`;
    fill.dataset.originResourceFill=key;
    track.append(fill);
    const value = node('span', '—');
    value.style.cssText=f25
      ? 'position:absolute;right:5px;top:0;z-index:2;line-height:12px;font-size:9px;font-variant-numeric:tabular-nums;text-shadow:0 1px 2px black'
      : 'width:66px;text-align:right;font-size:10px';
    row.append(lab,track,value);
    meter.append(row);
    renderBars[key] = {wrap:row,fill,label:value};
  }
  // Compact proximity CTA remains above the battlefield, never covering the
  // movement joystick. Weapon choices open in their own true modal layer.
  // The old left-aligned floating guide clipped options beneath mobile controls.
  const guide = node('div', '', 'hf-origin-f1-guide');
  guide.id = 'hf-origin-f1-guide';
  guide.style.cssText='display:none;position:fixed;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(340px,74vw);pointer-events:auto;z-index:190';
  const talk=node('button','VETERANO DEL CAMINO · ELEGIR ARMA');
  talk.id='hf-origin-f1-open';
  talk.type='button';
  talk.style.cssText='display:block;width:100%;min-height:42px;background:#bd9459;color:#091725;border:2px solid #f2d29a;border-radius:12px;padding:8px;font:750 12px system-ui;cursor:pointer;box-shadow:0 3px 14px #000a';
  guide.append(talk);
  root.append(guide);

  const backdrop=node('div','','hf-origin-f1-modal-backdrop');
  backdrop.id='hf-origin-f1-modal-backdrop';
  backdrop.style.cssText='display:none;position:fixed;inset:0;width:100vw;height:100dvh;z-index:200;background:#000a;align-items:center;justify-content:center;pointer-events:auto;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));box-sizing:border-box';
  const modal=node('section','','hf-origin-f1-weapon-dialog');
  modal.id='hf-origin-f1-weapon-dialog';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-label','Elegir arma inicial');
  modal.style.cssText='box-sizing:border-box;width:min(490px,100%);max-height:100%;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;background:#111e30;border:2px solid #cca96f;border-radius:16px;padding:14px;color:#fff;box-shadow:0 10px 32px #000b;font:500 14px system-ui';
  const title=node('div','Veterano del Camino');
  title.style.cssText='font-size:18px;font-weight:800;color:#f1d29b;margin:0 0 6px';
  const caption=node('p','Elegí un arma inicial, o seguí a puño limpio. Podés volver a hablar con el veterano y cambiarla por otra sin duplicar armas.');
  caption.style.cssText='margin:0 0 10px;line-height:1.35';
  const options=node('div','','hf-origin-f1-options');
  options.id='hf-origin-f1-options';
  options.style.cssText='display:flex;flex-direction:column;gap:8px';
  const status=node('div','');
  status.setAttribute('role','status');
  status.style.cssText='min-height:0;font-size:12px;padding-top:5px;color:#ffd38f';
  const closeButton=node('button','VOLVER AL MUNDO');
  closeButton.id='hf-origin-f1-close';
  closeButton.type='button';
  closeButton.style.cssText='display:block;width:100%;min-height:40px;margin-top:8px;background:#28394f;border:1px solid #a8b2c0;border-radius:9px;color:#fff;font:700 12px system-ui;cursor:pointer';
  modal.append(title,caption,options,status,closeButton);
  backdrop.append(modal);
  // A separate modal layer avoids the guide's stacking context covering Bags.
  backdrop.style.zIndex='3200';
  document.body.append(root,backdrop);
  let current=structuredClone(initial);
  if(f26)sim.player.highflyOriginStamina=current.resources.stamina;
  const f23Trainer=location.pathname.startsWith('/cobalt-hollow-lab/lab/f23-combat-beta/') ||
    location.pathname.startsWith('/cobalt-hollow-lab/lab/f24-combat-beta/') || f25;
  if(f25)sim.player.highflyF25CombatFreedom=true;
  if(f26)sim.player.highflyF26CombatFreedom=true;
  if(f261)sim.player.highflyF261Controls=true;
  if(f262)sim.player.highflyF262ContactAssist=true;
  if(f263)sim.player.highflyF263ContactAssist=true;
  // One native Sim, one Hunter. Persist knowledge in the existing Origin save,
  // not in the donor Warrior's level-up list, which is intentionally disabled.
  // Hydrate only the explicitly learned spells into its already-authoritative
  // native spellbook and cast pipeline, with their native cost/effects.
  const hunter=sim.players.get(sim.playerId);
  const rebindOriginMana=()=>{
    if(!f23Trainer)return;
    // Equipping gear re-applies the hidden donor Warrior's rage resource.
    // Restore the Universal Hunter's own persisted mana instead, but never
    // overwrite live mana already spent by a spell when it is still mana.
    if(sim.player.resourceType!=='mana'){
      sim.player.resourceType='mana';
      sim.player.maxResource=current.resources.maxMana;
      sim.player.resource=current.resources.mana;
    }
  };
  const hydrateMasterSkills=()=>{
    if(!f23Trainer || !hunter)return;
    rebindOriginMana();
    // F2.7 beta ONLY: four non-persistent preview abilities. Do not mutate
    // learnedAbilityIds, trainer prices, XP, or the player's saved progression.
    const trial=f27Preview?['fireball','sinister_strike','highfly_blade_rush','meteor']:[];
    // Unified WORLD never receives free trial spells. LAB and historical beta do.
    if(isUnifiedOriginRuntime() && getActiveHighflyOriginMode()==='world') trial.length=0;
    const available=[...new Set([...(current.learnedAbilityIds??[]),...trial])];
    const previewBypass = f27Preview && (!isUnifiedOriginRuntime() || getActiveHighflyOriginMode()==='lab');
    hunter.known=available.flatMap(id=>{
      const row=ORIGIN_F23_MASTER_SKILLS.find(x=>x.id===id);
      // Extend the native Onrush definition, keeping the SAME Sim charge route.
      // Damage is settled only by its original arrival callback, not on cast.
      const def=row ? id==='highfly_blade_rush'
        ? {...ABILITIES.charge,id:'highfly_blade_rush',name:'Blade Rush',learnLevel:3,
            cost:0,cooldown:12,range:16,minRange:3,highflyStaminaCost:18,
            effects:[{type:'charge' as const}],castWhileMoving:true}
        : ABILITIES[id] : undefined;
      if(!row || !def || (!unifiedFrame && !previewBypass && def.learnLevel>sim.player.level) || def.hiddenFromPlayer)return [];
      const useDef=f26 && id==='fireball'
        ? {...def,castTime:0,cooldown:3,requiresTarget:false,castWhileMoving:true}
        : f26 && (id==='charge'||id==='heroic_leap')
          ? {...def,cost:0,highflyStaminaCost:id==='charge'?14:22,
              effects:def.effects.filter(effect=>effect.type!=='gainResource'),
              castWhileMoving:true}
        : f26 && id==='sinister_strike'
          ? {...def,cost:0,highflyStaminaCost:10,castWhileMoving:true}
        : f26 && id==='meteor'
          ? {...def,castTime:0,castWhileMoving:true}
        : f25 && id==='fireball' ? {...def,castWhileMoving:true} : def;
      const trialDef=f27Preview&&trial.includes(id)?{...useDef,learnLevel:1}:useDef;
      // WORLD/LAB Universal knowledge is learned from purchases, not class levels.
      const hunterDef=unifiedFrame?{...trialDef,learnLevel:1}:trialDef;
      return [{def:hunterDef,rank:1,cost:hunterDef.cost,castTime:hunterDef.castTime,cooldown:hunterDef.cooldown,
        effects:hunterDef.effects,castWhileMoving:hunterDef.castWhileMoving===true,
        threatFlat:useDef.threat?.flat??0,threatMult:useDef.threat?.mult??1}];
    });
    if(f26 && !f261){
      // Preserve legacy F2.6 tester Flash only. F2.6.1 grants NO independent
      // Flash skill; native Blink remains available for future hybrid skills.
      const blink={...ABILITIES.blink,name:'FLASH',learnLevel:1,cost:25,
        cooldown:20,offGcd:true,usableWhileCasting:true,
        effects:[{type:'blinkForward' as const,distance:6,breakRoots:false}]};
      hunter.known.push({def:blink,rank:1,cost:blink.cost,castTime:0,
        cooldown:blink.cooldown,effects:blink.effects,castWhileMoving:true,
        threatFlat:0,threatMult:1});
    }
  };
  if(f23Trainer){
    // ORIGIN uses MP for every acquired school; ST remains the separate
    // physical-attacks pool. Donor characters retain their original resource.
    sim.player.resourceType='mana';
    sim.player.maxResource=current.resources.maxMana;
    sim.player.resource=current.resources.mana;
    hydrateMasterSkills();
  }
  const resourceController: OriginResourceController = {
    canSpend: (kind, amount) => {
      const live={...current.resources,
        ...(f23Trainer?{mana:sim.player.resource}:{}),
        ...(f26?{stamina:sim.player.highflyOriginStamina??current.resources.stamina}:{})};
      return consumeF1Resource(live,kind,amount)!==null;
    },
    spend: (kind, amount) => {
      const live={...current.resources,
        ...(f23Trainer?{mana:sim.player.resource}:{}),
        ...(f26?{stamina:sim.player.highflyOriginStamina??current.resources.stamina}:{})};
      const next=consumeF1Resource(live,kind,amount);
      if(!next)return false;
      current={...current,resources:next};
      if(f23Trainer && kind==='mana')sim.player.resource=next.mana;
      if(f26 && kind==='stamina')sim.player.highflyOriginStamina=next.stamina;
      return true;
    },
  };
  registerOriginResourceController(resourceController);
  // F2.6.1 keeps only SALTO + EVADIR as native movement controls.
  // Do not take a fourth-skill slot or paint a fifth movement button.
  const flashButton=f26 && !f261?node('button','','hf-origin-f26-flash'):null;
  if(flashButton){
    flashButton.id='hf-origin-f26-flash';
    flashButton.setAttribute('aria-label','FLASH · desplazamiento instantáneo');
    flashButton.style.cssText='position:fixed;right:216px;bottom:30px;z-index:285;min-width:54px;height:48px;border-radius:18px;border:2px solid #b4c8f5;background:#273d78e8;color:#fff;font:800 12px system-ui;touch-action:none;user-select:none;box-shadow:0 3px 9px #0008';
    flashButton.textContent='FLASH';
    flashButton.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();event.stopPropagation();
      if(!sim.player.dead)sim.castAbility('blink');
    });
    document.body.append(flashButton);
  }
  let last=performance.now();
  let open=false;
  const setOpen=(next:boolean)=>{
    open=next;
    backdrop.style.display=open?'flex':'none';
    talk.setAttribute('aria-expanded',String(open));
    if(open)closeButton.focus({preventScroll:true});
  };
  talk.addEventListener('click',()=>{status.textContent='';setOpen(true)});
  closeButton.addEventListener('click',()=>setOpen(false));
  backdrop.addEventListener('click',e=>{if(e.target===backdrop)setOpen(false)});
  for(const item of ORIGIN_STARTER_WEAPONS){
    const b=node('button',item.label);
    b.type='button';
    b.dataset.starter=item.id;
    b.style.cssText='width:100%;min-height:44px;padding:10px 12px;border:1px solid #8395ab;border-radius:9px;background:#33465d;color:white;text-align:center;font:700 13px system-ui;cursor:pointer;touch-action:manipulation';
    b.addEventListener('click',()=>{
      const oldId=current.starterClaimed?current.starterWeaponId:null;
      if (oldId===item.id) {
        status.textContent='Esa ya es tu arma inicial. Podés regresar cuando quieras.';
        return;
      }
      // Re-selection is a STRICT 1-for-1 exchange: the Hunter must still
      // have the previously granted starter equipped. Never mint a second
      // weapon if the first was sold, dropped, or replaced by other gear.
      if (oldId && sim.players.get(sim.playerId)?.equipment.mainhand!==oldId) {
        status.textContent='Equipá tu arma inicial antes de cambiarla por otra.';
        return;
      }
      const next=oldId?swapOriginStarter(current,item.id):claimOriginStarter(current,item.id);
      if (!next || !sim.canAddItem(item.id,1,sim.playerId)) {
        status.textContent='No hay espacio en el inventario.';
        return;
      }
      sim.addItem(item.id,1,sim.playerId);
      sim.equipItem(item.id,sim.playerId);
      const equipped=sim.players.get(sim.playerId)?.equipment.mainhand===item.id;
      if (!equipped) {
        sim.removeItem(item.id,1,sim.playerId);
        status.textContent='Esta arma aún requiere adaptación al Hunter.';
        return;
      }
      if (oldId) {
        // EquipItem moves the previously worn starter into the player's bag.
        // Remove that exact old copy or roll the exchange back; never leave
        // both choices in circulation.
        const inBag=sim.inventory.some(slot=>slot.itemId===oldId&&slot.count>0);
        if (!inBag) {
          sim.equipItem(oldId,sim.playerId);
          sim.removeItem(item.id,1,sim.playerId);
          status.textContent='No se pudo intercambiar el arma anterior.';
          return;
        }
        sim.removeItem(oldId,1,sim.playerId);
      }
      current=next;
      onStarterGranted();
      setOpen(false);
    });
    options.append(b);
  }
  if(f23Trainer){
    const title=node('h3','MAESTRO · APRENDER HABILIDADES');
    title.style.cssText='margin:16px 0 6px;font-size:15px;color:#f1d29b';
    const info=node('p',unifiedFrame?'Comprá técnicas de cualquier escuela con cobre. Tu nivel NO limita qué habilidad podés aprender. También llegarán libros de botín y recompensas de misiones; todavía no están conectados.':'Aprendé habilidades con nivel y cobre. El laboratorio F2.7 ofrece cuatro técnicas temporales para prueba, sin alterar tu progreso.');
    info.style.cssText='font-size:12px;line-height:1.45;margin:0 0 8px';
    const list=node('div','','hf-origin-f23-trainer');
    list.id='hf-origin-f23-trainer';
    list.style.cssText='display:flex;flex-direction:column;gap:7px';
    const refresh=()=>{
      list.replaceChildren();
      const learned=current.learnedAbilityIds??[];
      for(const skill of ORIGIN_F23_MASTER_SKILLS){
        const known=learned.includes(skill.id);
        const eligible=originCanTrainSkill(skill.id,sim.player.level,hunter?.copper??0,learned,unifiedFrame);
        const button=node('button',skill.label+' · '+(known?'APRENDIDA':skill.copper+' cobre'+(unifiedFrame?'':' · NV '+skill.level)));
        button.type='button';button.dataset.learnSkill=skill.id;
        button.disabled=known;
        button.style.cssText='width:100%;min-height:44px;padding:9px 10px;border:1px solid #a7a27b;border-radius:8px;background:#33465d;color:white;text-align:left;font:650 12px system-ui;touch-action:manipulation;opacity:'+(known?'.64':'1');
        button.addEventListener('click',()=>{
          const earned=current.learnedAbilityIds??[];
          if(!hunter || !originCanTrainSkill(skill.id,sim.player.level,hunter.copper,earned,unifiedFrame)){
            status.textContent=unifiedFrame?'Necesitás monedas suficientes para comprar esta técnica.':'Necesitás el nivel indicado y monedas suficientes para aprender esta técnica.';return;
          }
          hunter.copper-=skill.copper;
          current={...current,learnedAbilityIds:[...earned,skill.id]};
          hydrateMasterSkills();
          onStarterGranted(); // existing save/refresh hook, not a weapon reward
          status.textContent='¡Técnica aprendida! Abrí tu libro para asignarla al HUD.';
          refresh();
        });
        if(!eligible && !known)button.title=unifiedFrame?'Falta cobre':'Falta nivel o cobre';
        list.append(button);
      }
    };
    // Reuse the existing full-screen scrollable Veteran dialog, not a second
    // overlay beneath the joystick or a class-selection menu.
    modal.insertBefore(title,closeButton);
    modal.insertBefore(info,closeButton);
    modal.insertBefore(list,closeButton);
    talk.addEventListener('click',refresh);
  }
  const timer=window.setInterval(()=>{
    if(!root.isConnected) {window.clearInterval(timer);return;}
    // HUD frames may remount/move AFTER the game-ready callback. Always seat
    // this one shared MP/ST meter alongside the LIVE native portrait/HP bars.
    const liveFrame=document.getElementById('player-frame');
    const bars=liveFrame?.querySelector(':scope > .uf-bars');
    const hp=bars?.querySelector(':scope > .bar.hp');
    if(unifiedFrame){
      // The native HUD can remount its bar stack. Re-seat as an actual HP
      // sibling, not as another player-frame flex column or floating overlay.
      if(hp && (meter.parentElement!==bars || meter.previousElementSibling!==hp)) hp.after(meter);
    } else {
      const host=(f25?bars:liveFrame)??liveFrame;
      if(host && meter.parentElement!==host)host.append(meter);
    }
    // Native jump + evade remain in their original responsive HUD seats.
    if(flashButton){
      const evade=document.getElementById('mobile-evade')?.getBoundingClientRect();
      if(evade&&evade.width>4){
        flashButton.style.left=Math.min(innerWidth-66,evade.right+9)+'px';
        flashButton.style.top=evade.top+'px';
        flashButton.style.right='auto';flashButton.style.bottom='auto';
      }
    }
    const now=performance.now();
    if(f26)current.resources.stamina=sim.player.highflyOriginStamina??current.resources.stamina;
    current={...current,resources:tickF1Resources(current.resources,(now-last)/1000)};
    if(f26)sim.player.highflyOriginStamina=current.resources.stamina;
    if(f23Trainer){
      rebindOriginMana();
      current.resources.mana=sim.player.resource;
      current.resources.maxMana=sim.player.maxResource;
    }
    last=now;
    const p=sim.player;
    for(const [key,cur,max] of (f25 && !unifiedFrame
      ? [['stamina',current.resources.stamina,current.resources.maxStamina]] as const
      : [['mana',current.resources.mana,current.resources.maxMana],
         ['stamina',current.resources.stamina,current.resources.maxStamina]] as const)){
      const bar=renderBars[key];
      bar.fill.style.width = `${Math.round(100*Math.max(0,Math.min(1,max>0?cur/max:0)))}%`;
      bar.label.textContent = `${Math.round(cur)} / ${Math.round(max)}`;
    }
    const dx=p.pos.x-ORIGIN_GUIDE_POS.x, dz=p.pos.z-ORIGIN_GUIDE_POS.z;
    const nearby=(dx*dx+dz*dz)<(8*8);
    talk.textContent = f23Trainer
      ? 'VETERANO · ARMAS Y MAESTRÍA'
      : (current.starterClaimed?'VETERANO DEL CAMINO · CAMBIAR ARMA':'VETERANO DEL CAMINO · ELEGIR ARMA');
    if(f23Trainer)guide.style.display = nearby ? 'block':'none';
    else guide.style.display = nearby && !current.starterClaimed ? 'block':'none';
    if (!nearby) {
      if (open) setOpen(false);
    }
  },120);
  return {
    save:()=>structuredClone(current),
    close:()=>{window.clearInterval(timer);registerOriginResourceController(null);flashButton?.remove();delete sim.player.highflyF263ContactAssist;delete sim.player.highflyF262ContactAssist;delete sim.player.highflyF261Controls;delete sim.player.highflyF26CombatFreedom;if(f25){delete sim.player.highflyF25CombatFreedom;document.body.classList.remove('hf-origin-f25','hf-origin-f261','hf-origin-f263');}backdrop.remove();meter.remove();root.remove();}
  };
}
