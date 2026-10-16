/** R25A — SF27/R19 honest A/B test selection. No skills granted, saved,
 * equipped or cast; this is a read-only catalog and ground-geometry study.
 */
import { ABILITIES } from '../sim/content/classes';
import { ORIGIN_TOP36 } from '../sim/highfly_origin_r19_selection';
import { HIGHFLY_FUSED_SKILLS, type HighflyClass } from './highfly_origin_r25_sf27_catalog';
import type { Sim } from '../sim/sim';

export type LabMode='original'|'fusion';
export type LabAim='line'|'cone'|'circle'|'dash'|'target';
export interface LabRow {
  id:string; school:HighflyClass; mode:LabMode; name:string; donors:readonly string[];
  role:'combat'|'support'; shape:LabAim;
  registered:boolean; learned:boolean; testable:boolean; note:string;
}
export const LAB_SCHOOLS:readonly HighflyClass[]=[
 'warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'
] as const;
const dashNames=new Set(['heroic_leap','solar_step','veilstep','trailbreak','blink','bear_charge','dash','charge']);
const coneNames=new Set(['dragons_breath']);
export function originLabAimFromDonors(donors:readonly string[]):LabAim {
  for(const id of donors) {
    const def=ABILITIES[id];if(!def)continue;
    if(dashNames.has(id))return 'dash';
    if(coneNames.has(id))return 'cone';
    if(def.targetMode==='position'&&!def.selfCentered)return 'circle';
    if(def.requiresTarget && (def.range??0)<=5)return 'target';
    if(def.requiresTarget)return 'line';
    if(def.effects.some(e=>e.type==='aoeDamage' || e.type==='aoeHeal'))return 'circle';
  }
  return 'target';
}
export function originLabCatalog(sim?:Sim):LabRow[] {
  const known=new Set(sim?.known.map(k=>k.def.id)??[]);
  const entries:LabRow[]=[];
  for(const school of LAB_SCHOOLS) {
    const o=ORIGIN_TOP36[school];
    for(const id of [...o.combat,o.buff]){
      const d=ABILITIES[id];
      if(!d)throw Error('ORIGIN_R25A_MISSING_ORIGINAL_'+id);
      const learned=known.has(id);
      entries.push({id,school,mode:'original',name:d.name,donors:[id],
        role:id===o.buff?'support':'combat',shape:originLabAimFromDonors([id]),
        registered:true,learned,testable:learned,
        note:learned?'Aprendida; usá su slot nativo para lanzar':'Original preservada, aún no aprendida'});
    }
    for(const f of HIGHFLY_FUSED_SKILLS[school]) {
      const registered=Boolean(ABILITIES[f.id]);
      const learned=known.has(f.id);
      entries.push({id:f.id,school,mode:'fusion',name:f.name,donors:f.donors,
        role:'combat',shape:originLabAimFromDonors(f.donors),
        registered,learned,testable:registered&&learned,
        note:registered
          ? (learned?'Registrada y aprendida; requiere prueba nativa':'Registrada; no aprendida')
          : 'SF27 archivada: geometría de donantes disponible; ejecución pendiente de adaptador'});
    }
  }
  return entries;
}
export function originLabSummary(rows:readonly LabRow[]) {
 return {
   original:rows.filter(r=>r.mode==='original').length,
   fusion:rows.filter(r=>r.mode==='fusion').length,
   executable:rows.filter(r=>r.mode==='fusion'&&r.testable).length,
   registered:rows.filter(r=>r.mode==='fusion'&&r.registered).length
 };
}
const mk=(tag:string,content:string):HTMLElement=>{
  const el=document.createElement(tag);el.textContent=content;return el;
};
/** An in-panel analysis library. It never writes hotbar, save, Sim, skill grants
 * or cooldowns. Preview dispatch only reaches existing Three world geometry.
 */
export function mountOriginR25aSelector(sim:Sim,panel:HTMLElement):()=>void {
  const existing=panel.querySelector('#hf-origin-r25a-skill-lab');
  if(existing)existing.remove();
  const host=document.createElement('details');host.id='hf-origin-r25a-skill-lab';
  host.style.cssText='border:1px solid #a58a55;border-radius:9px;margin:7px 0;padding:7px;background:#101d31;';
  const title=mk('summary','⚔️ SF27 · LABORATORIO 63 / ORIGINALES 36');
  title.style.cssText='color:#efd18c;font-weight:750;cursor:pointer;min-height:26px;';
  const hint=mk('small','Seleccioná una escuela, compará original/fusión y mirá su apuntado en el suelo. PREVIEW visual; no aprende, regala ni equipa técnicas.');
  hint.style.cssText='color:#c9d5df;display:block;margin:6px 0;';
  const tools=document.createElement('div');
  tools.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin:6px 0;';
  const school=document.createElement('select');
  school.setAttribute('aria-label','Escuela SF27');
  school.style.cssText='background:#223952;color:#fff;border:1px solid #9e855b;padding:7px;max-width:54%;border-radius:7px;';
  for(const s of LAB_SCHOOLS){
    const o=document.createElement('option');o.value=s;o.textContent=s.toUpperCase();
    school.append(o);
  }
  const mode=document.createElement('select');
  mode.setAttribute('aria-label','Comparación original vs fusión');
  mode.style.cssText=school.style.cssText;
  for(const [v,label] of [['original','ORIGINALES 36'],['fusion','FUSIONES 63']] as const){
    const o=document.createElement('option');o.value=v;o.textContent=label;mode.append(o);
  }
  const search=document.createElement('input');
  search.type='search';search.placeholder='Filtrar habilidades…';
  search.style.cssText='box-sizing:border-box;width:100%;padding:7px;color:#fff;background:#14253d;border:1px solid #496b89;border-radius:6px;';
  tools.append(school,mode);
  const summary=mk('small','');
  summary.style.cssText='display:block;color:#acd8d3;padding:4px 0;';
  const rows=document.createElement('div');
  rows.style.cssText='display:grid;gap:5px;';
  const all=originLabCatalog(sim),counts=originLabSummary(all);
  let disposed=false;
  const paint=()=>{
    if(disposed)return;
    rows.replaceChildren();
    const candidates=all.filter(x=>x.school===school.value&&x.mode===mode.value&&
      (x.name+' '+x.id+' '+x.donors.join(' ')).toLowerCase().includes(search.value.trim().toLowerCase()));
    summary.textContent=counts.original+' originales · '+counts.fusion+
      ' fusiones · '+counts.registered+' fusiones registradas · '+counts.executable+' ejecutables en este Hunter';
    for(const entry of candidates){
      const card=document.createElement('div');card.style.cssText='background:#1a2b42;border:1px solid #496077;border-radius:7px;padding:8px;';
      const heading=mk('strong',entry.name+' · '+entry.id);
      heading.style.cssText='display:block;color:#f4e2c5;font-size:12px;';
      const details=mk('small',entry.shape.toUpperCase()+' · '+entry.donors.join(' + '));
      details.style.cssText='display:block;color:#b3c7de;margin:4px 0;';
      const state=mk('small',entry.note);state.style.cssText='display:block;color:'+(entry.testable?'#9ae3b9':'#efd091')+';';
      const preview=document.createElement('button');preview.type='button';
      preview.textContent='🎯 VER APUNTADO';
      preview.style.cssText='min-height:34px;border:1px solid #87b4df;border-radius:6px;background:#274869;color:#fff;margin-top:6px;padding:5px 10px;touch-action:manipulation;';
      preview.addEventListener('click',()=>{
        // This only calls the existing R22 visual renderer, NOT native casting.
        const id=entry.donors.find(d=>Boolean(ABILITIES[d]))??entry.id;
        document.dispatchEvent(new CustomEvent('hf-origin-aim-gallery',{
          detail:{shape:entry.shape,abilityId:id}
        }));
      });
      card.append(heading,details,state,preview);rows.append(card);
    }
    if(!candidates.length)rows.append(mk('small','No hay coincidencias para esta escuela.'));
  };
  school.addEventListener('change',paint);mode.addEventListener('change',paint);search.addEventListener('input',paint);
  host.append(title,hint,tools,search,summary,rows);
  panel.insertBefore(host,panel.querySelector('#hf-origin-r22-visual-gallery')??panel.firstChild);
  paint();
  return ()=>{disposed=true;host.remove();};
}
