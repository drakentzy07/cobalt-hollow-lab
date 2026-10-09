import fs from 'node:fs';import assert from 'node:assert/strict';
import {createDreamProject,validateDreamProject,serializeProject,historyReducer} from './dream-project-v17.mjs';
import {factoryV4,saveFactoryV4} from './factory-recipe-v4.mjs';
import {PREMIUM_PAINT_SCHEMA} from './premium-paint-v13.mjs';
import {PREMIUM_SHAPE_SCHEMA} from './native-shape-v14.mjs';
const original=createDreamProject({
 name:'Kage Oni prueba',factory:saveFactoryV4(factoryV4()),
 paint:{schema:PREMIUM_PAINT_SCHEMA,paints:[]},
 shape:{schema:PREMIUM_SHAPE_SCHEMA,shapes:[]},
 text:'Una armadura samurai negra',notes:'Pintura violeta'
});
assert.deepEqual(validateDreamProject(serializeProject(original)),original,'V17_LOSSLESS_PROJECT');
assert.throws(()=>validateDreamProject({...original,originalSource:'FAKE_RIG'}),'V17_NO_SUBSTITUTE_RIG');
assert.throws(()=>validateDreamProject({...original,helmetFit:{scale:7,preset:'closed',occlusion:'full',x:0,y:0,z:0}}),'V17_HELMET_SCALE_SAFETY');
let history={current:'a',undo:[],redo:[]};
history=historyReducer(history,{type:'capture',snapshot:'b'});
history=historyReducer(history,{type:'undo'});
assert.equal(history.current,'a');assert.deepEqual(history.redo,['b']);
history=historyReducer(history,{type:'redo'});
assert.equal(history.current,'b');assert.deepEqual(history.undo,['a']);
const html=fs.readFileSync('highfly-dream-v17-preview/index.html','utf8');
for(const s of ['dream-v15-ui.mjs','dream-v16-ui.mjs','dream-studio-v17.mjs','DREAM SKIN STUDIO · V17']){
 assert(html.includes(s),'V17_UI_ENTRY_MISSING_'+s);
}
fs.mkdirSync('character-truth/v17-evidence',{recursive:true});
fs.writeFileSync('character-truth/v17-evidence/project-v17.json',serializeProject(original));
console.log('HIGHFLY_V17_PROJECT_SCHEMA_AND_COMPOSITION_GREEN=1');
