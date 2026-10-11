#!/usr/bin/env python3
"""P09: adapt the successful P06 browser QA ONLY for opt-in Monster6 elites.
Preserves original S23 emulated runtime HUD/joystick/camera/training gates.
Runs on CI's disposable copy, never touches the canonical smoke source.
"""
import sys
from pathlib import Path
if len(sys.argv)!=2:
    raise SystemExit('Usage: python activate_p09_mobile_smoke.py <copied-P06-smoke>')
p=Path(sys.argv[1])
s=p.read_text('utf8')
old="const actual=(dungeon?.mobIds??[]).filter(id=>sim.entities.get(id)?.templateId?.startsWith('hf_hunt_'));"
new="""const types=(dungeon?.mobIds??[]).map(id=>sim.entities.get(id)?.templateId??'');
    const actual=types.filter(id=>id.startsWith('hf_hunt_')||id.startsWith('hf_enc_'));
    const eliteCount=types.filter(id=>id.startsWith('hf_enc_elite_')).length;
    const captainCount=types.filter(id=>id.startsWith('hf_enc_captain_')).length;
    const ordinaryCount=types.filter(id=>id.startsWith('hf_hunt_')).length;"""
anchor="eightHFNativeMobs:actual.length,"
gate="!result.p06.dungeonClaim||result.p06.eightHFNativeMobs!==8||"
if s.count(old)!=1 or s.count(anchor)!=1 or s.count(gate)!=1:
    raise SystemExit('HF_P09_P06_S23_BROWSER_CONTRACT_DRIFT')
s=s.replace(old,new,1).replace(anchor,"eightHFNativeMobs:actual.length,eliteCount,captainCount,ordinaryCount,",1)
s=s.replace(gate,gate+"""
     result.p06.ordinaryCount!==6||result.p06.eliteCount!==1||
     result.p06.captainCount!==1||""",1)
p.write_text(s,'utf8')
print('HF_P09_S23_BROWSER_REUSES_P06_BUT_REQUIRES_NATIVE_6_1_1=1')
