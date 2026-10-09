import assert from 'node:assert/strict';
import {validPremiumPaint,forgedPaintKey,PREMIUM_PAINT_SCHEMA} from './premium-paint-v13.mjs';
assert.equal(forgedPaintKey('HFV12_M_CHEST_ABDOMINAL_CUIRASS'),'HFV12_CHEST_ABDOMINAL_CUIRASS');
assert.equal(forgedPaintKey('HFV12_F_CHEST_ABDOMINAL_CUIRASS'),'HFV12_CHEST_ABDOMINAL_CUIRASS');
assert.equal(forgedPaintKey('M_Head'),null);
assert.equal(forgedPaintKey('HFV12_M_CHEST_../../../hijack'),null);
const data={schema:PREMIUM_PAINT_SCHEMA,paints:[{key:'HFV12_CHEST_FAULD_CENTER_0',
 color:'#8B5CF6',metalness:.6,roughness:.3}]};
assert.deepEqual(validPremiumPaint(data).paints[0],{...data.paints[0],color:'#8b5cf6'});
for(const x of [
 {...data,script:'cmd'}, {...data,paints:[...data.paints,...data.paints]},
 {...data,paints:[{...data.paints[0],color:'red'}]},
 {...data,paints:[{...data.paints[0],metalness:1.2}]},
 {...data,paints:[{...data.paints[0],key:'M_Head'}]},
 {...data,paints:[{...data.paints[0],roughness:NaN}]}
])assert.throws(()=>validPremiumPaint(x));
console.log('HIGHFLY_V13_REAL_FORGED_PAINT_RECIPE_VALIDATOR_GREEN=1');
