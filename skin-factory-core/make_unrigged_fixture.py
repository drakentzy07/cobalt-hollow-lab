#!/usr/bin/env python3
"""Make an UNRIGGED real 3D test fixture from V19's actual Blender-built meshes.
This is NOT generated with AI and is NEVER a premium concept fidelity claim.
Removes V19 rig solely to prove automatic reweighting from original Warrior donor.
"""
import sys,json,os
import trimesh
source,out,report=sys.argv[1:4]
scene=trimesh.load(source,force='scene')
assert len(scene.geometry)==32,'ONLY_VERIFIED_V19_32_3D_PIECES'
assert len(scene.graph.nodes_geometry)==32,'SOURCE_3D_PARTS_MISSING'
assert sum(len(x.faces) for x in scene.geometry.values())>=1000,'REAL_GEOMETRY_EXPECTED'
bytes_=scene.export(file_type='glb')
with open(out,'wb') as f:f.write(bytes_)
with open(report,'w') as f:json.dump({
 'source':'V19 legitimate Blender 3D, stripped of original skin for REBIND experiment',
 'originalGeometryParts':32,'skinRemoved':True,
 'notFromTextOrImageAI':True,'notArtisticallyApproved':True,
 'bytes':len(bytes_)
},f,indent=2)
print('HIGHFLY_V19_REAL_UNRIGGED_3D_FIXTURE_READY',len(bytes_),len(scene.geometry))
