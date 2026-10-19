/** R40 native-Sim-confirmed cue only. Never resolves damage or gameplay. */
export function installHighflyR40Feedback():void{
  if(document.getElementById('hf-r40-confirmed-owner'))return;
  const owner=document.createElement('div');owner.id='hf-r40-confirmed-owner';
  owner.hidden=true;document.body.append(owner);
  document.addEventListener('hf-r40-confirmed-combat',(event:Event)=>{
    if(!document.body.classList.contains('hf-r40-universal'))return;
    const kind=(event as CustomEvent<{kind?:string}>).detail?.kind;
    const message=kind==='parry'?'PARRY PERFECTO':
      kind==='perfect-dodge'?'ESQUIVA PERFECTA':
      kind==='guard-break'?'GUARD BREAK':null;
    if(!message)return;
    document.getElementById('hf-r40-confirmed')?.remove();
    const el=document.createElement('div');el.id='hf-r40-confirmed';
    el.textContent=message;el.setAttribute('role','status');
    el.addEventListener('animationend',()=>el.remove(),{once:true});
    document.body.append(el);
  });
}
