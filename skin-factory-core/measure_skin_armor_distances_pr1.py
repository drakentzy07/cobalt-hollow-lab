#!/usr/bin/env python3
"""HIGHFLY PR-1: source Warrior skin ⇄ Paladin armor REST-surface clearance proxy.
Nearest POINT-to-TRIANGLE Euclidean distances, NOT mere bbox differences.
Unsigned values do not establish inside/outside, thickness, collision or animated fit.
"""
import sys,json,time
from pathlib import Path
import numpy as np
import trimesh
from trimesh.proximity import closest_point

src=Path(sys.argv[1]); dst=Path(sys.argv[2])
d=json.loads(src.read_text())
surfaces=d['surfaces']
assert len(surfaces)==22 and d['originalBones']==23 and d['originalClips']==22
matches={
 'Head':'M_Head','Chest':'M_Torso','Back':'M_Torso',
 'ArmL':'M_ArmL','ArmR':'M_ArmR','HandL':'M_HandL','HandR':'M_HandR',
 'LegL':'M_LegL','LegR':'M_LegR','FootL':'M_FootL','FootR':'M_FootR',
}
def mesh(name):
    x=surfaces[name]
    v=np.asarray(x['vertices'],dtype='float64')
    f=np.asarray(x['faces'],dtype='int64')
    assert v.shape[1]==3 and f.shape[1]==3
    assert v.shape[0]>30 and f.shape[0]>20
    assert np.isfinite(v).all()
    assert f.min()>=0 and f.max()<v.shape[0]
    return trimesh.Trimesh(vertices=v,faces=f,process=False,validate=False)
def percentiles(a):
    a=np.asarray(a)
    assert a.size and np.isfinite(a).all()
    return {k:round(float(q),6) for k,q in [
      ('min',a.min()),('p05',np.percentile(a,5)),('p10',np.percentile(a,10)),
      ('median',np.median(a)),('p90',np.percentile(a,90)),
      ('p95',np.percentile(a,95)),('max',a.max())
    ]}
report={'schema':'highfly.pr1.paladin-source-rest-surface-distance/1',
  'originalSourceBytes':d['originalBytes'],
  'originalBones':23,'originalClips':22,
  'coordinateSystem':'original model units after applying all native inverseBindMatrices and rest-joint poses',
  'method':'bidirectional nearest source vertex to opposite source TRIANGLE surface (unsigned)',
  'whatItMeans':'surface distance statistics between matching body and armor components in original rest pose',
  'whatItDoesNOTMean':'NOT inner cavities, armor plate thickness, signed penetration, collision guarantee, complete animation or physical centimetres',
  'warning':'Armor shells are open/multipart and components may overlap neighboring zones; nearest unsigned distance is a coverage/clearance proxy only. Negative-space and penetration require triangle collision and animated signed/normal checks.',
  'pieces':{},'pass':False}
for slot,bodyName in matches.items():
    aName='Armor_paladin_'+slot
    a=mesh(aName);body=mesh(bodyName)
    if (not len(a.faces)) or (not len(body.faces)):raise ValueError(aName)
    armorV=np.asarray(a.vertices)
    bodyV=np.asarray(body.vertices)
    # Exact triangle surface, not vertex-to-vertex approximation.
    _,dist_to_body,_=closest_point(body,armorV)
    _,dist_to_armor,_=closest_point(a,bodyV)
    info={
      'armor':aName,'body':bodyName,
      'armorVertices':len(armorV),'armorTriangles':len(a.faces),
      'bodyVertices':len(bodyV),'bodyTriangles':len(body.faces),
      'armorVerticesToBodyTriangles':percentiles(dist_to_body),
      'bodyVerticesToArmorTriangles':percentiles(dist_to_armor),
      'armorVerticesWithin0p01ModelUnitsOfBody':int((dist_to_body<.01).sum()),
      'armorVerticesWithin0p001ModelUnitsOfBody':int((dist_to_body<.001).sum()),
      'armorWatertight':bool(a.is_watertight),
      'bodyWatertight':bool(body.is_watertight),
      'fitCertified':False,'animatedCollisionCertified':False
    }
    report['pieces'][slot]=info
    print('HIGHFLY_PR1_REAL_TRIANGLE_SURFACE_DISTANCE',slot,
       'armor_to_body_median',info['armorVerticesToBodyTriangles']['median'],
       'minimum',info['armorVerticesToBodyTriangles']['min'],flush=True)
assert len(report['pieces'])==11
report['pass']=True
dst.write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('HIGHFLY_PR1_ORIGINAL_11_PALADIN_SLOTS_NEAREST_TRIANGLE_DISTANCE_REST_GREEN',flush=True)
