#!/usr/bin/env python3
"""HIGHFLY R37 independent non-Pages Android skill aiming pass.
Reuse real R20/R21/R22/P35 visual/native cast, not clone any skill system.
S1 Cinderbolt = narrow LINE without false impact AoE glyph.
Optional hf_lab=1&hf_r37=1 panel exposes original meteor + 3 AOEs and
native cast button ONLY when actually learned (no free skill grants).
"""
from pathlib import Path
import shutil
def once(path,a,b):
 p=Path(path);s=p.read_text(encoding='utf8');n=s.count(a)
 if n!=1:raise SystemExit('R37_SOURCE_DRIFT '+path+' '+str(n)+' '+repr(a[:110]))
 p.write_text(s.replace(a,b,1),encoding='utf8')

shutil.copyfile('../v9-corrections/game/c1/highfly_origin_r37_aim_truth.ts',
                'src/highfly/highfly_origin_r37_aim_truth.ts')

# R22 + P35: the Cinderbolt corridor is lineal. It used to end with a
# circular glyph that implied an AoE burst (it doesn't have one).
# Keep narrow ground-hugging lane + discreet direction cap.
aim='src/highfly/highfly_origin_r22_premium_visual.ts'
once(aim,
 """   this.annulus(this.glyph,impact,impactRadius,.065,24);""",
 """   // R37 S1 Cinderbolt: this is a PROJECTILE, not a meteor/ground blast.
   // Keep only two tiny forward ticks. No circular explosion/landing decal.
   const tick=Math.min(.32,Math.max(.14,impactRadius));
   const left=point(impact.x-dz*tick,impact.z+dx*tick);
   const right=point(impact.x+dz*tick,impact.z-dx*tick);
   const tip=point(end.x-dx*.06,end.z-dz*.06);
   this.strip(this.glyph,left,tip,.07);
   this.strip(this.glyph,right,tip,.07);""")

# The visual preview gallery sends a shape/ABILITY ID to R22's existing
# native mesh controller. Include original position-AoE abilities.
controller='src/highfly/highfly_origin_r17_hud.ts'
once(controller,
 "      'fireball','heroic_leap','blink','flamestrike'].includes(shape??''))return;",
 "      'fireball','heroic_leap','blink','flamestrike','meteor','rain_of_fire','blizzard'].includes(shape??''))return;")
once(controller,
 "      :['fireball','heroic_leap','blink','flamestrike'].includes(shape??'')?shape!",
 "      :['fireball','heroic_leap','blink','flamestrike','meteor','rain_of_fire','blizzard'].includes(shape??'')?shape!")
# Standard R22 gallery uses sample.shape; the actual def's targetMode and
# radius remain the source of truth. Meteor groundAoE is not given a fake cone.

runtime='src/highfly/highfly_android_p3_runtime.ts'
once(runtime,
 "import { originSkillRole } from './highfly_origin_r17_hud';",
 """import { originSkillRole } from './highfly_origin_r17_hud';
import { highflyR37AimTruth, type HighflyR37SkillId } from './highfly_origin_r37_aim_truth';""")
once(runtime,
 """    for (const id of P3_BASE_IDS) {""",
 """    const r37Lab=new URLSearchParams(location.search).get('hf_r37')==='1';
    // Official ClaudeCraft skills; extend only the optional laboratory.
    const referenceIds = r37Lab
      ? [...P3_BASE_IDS, 'meteor', 'rain_of_fire', 'blizzard'] as const
      : P3_BASE_IDS;
    for (const id of referenceIds) {""")
once(runtime,
 """      item.title = 'Mostrar geometría en terreno, sin costo ni habilidad concedida';""",
 """      item.title = 'Geometría nativa de apuntado · sin conceder habilidad';
      if (r37Lab && (['fireball','meteor','flamestrike','rain_of_fire','blizzard'] as string[]).includes(id)){
        const native=highflyR37AimTruth(id as HighflyR37SkillId);
        item.title += ' · '+native.shape+' · rango '+native.range+
          ' · radio '+native.radius+' · primer impacto '+native.delaySeconds+'s';
        item.dataset.r37SkillId=id;
        // This is metadata ONLY; actual AOE is handled by native Sim.
      }""")
once(runtime,
 """      samples.appendChild(item);""",
 """      samples.appendChild(item);
      if (r37Lab && (['meteor','rain_of_fire','blizzard','flamestrike'] as string[]).includes(id)) {
        const cast=document.createElement('button');
        cast.type='button';
        cast.dataset.r37NativeCast=id;
        cast.textContent='⚔ LANZAR '+(ABILITIES[id]?.name??id)+' (si aprendida)';
        cast.title='Ejecuta la habilidad original y consume recursos originales. Requiere aprendizaje.';
        cast.addEventListener('click',()=>{
          if(!sim.known.some(skill=>skill.def.id===id)){
            result.textContent='Primero descubrí/aprendé '+(ABILITIES[id]?.name??id)+
              '. El laboratorio no concede habilidades gratis.';
            return;
          }
          const skill=ABILITIES[id];
          if(skill?.targetMode!=='position')return;
          // Fresh manual forward point based on Hunter's current facing;
          // no fake projectile, no fabricated damage or cost bypass.
          const origin=sim.player.pos;
          const dist=Math.min(12,Math.max(2,(skill.range??30)*.5));
          const at={x:origin.x+Math.sin(sim.player.facing)*dist,
                    z:origin.z+Math.cos(sim.player.facing)*dist};
          originalToggle.click();
          syncPanel();
          sim.castAbilityAt(id,at);
        });
        samples.appendChild(cast);
      }""")
# Gallery is visible only under hf_lab=1 from R17. R37 additions also gated
# by hf_r37=1; normal UI/HUD and GOLDEN joystick are unchanged.
print('HIGHFLY_R37_S1_PROJECTILE_LINE_AND_REAL_NATIVE_AOE_GALLERY_NO_GRANTS_APPLIED=1')
