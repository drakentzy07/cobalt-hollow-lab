/* C8: rewrite only absolute STATIC PUBLIC-ASSET path literals to Pages base.
 * Avoid a runtime proxy/second asset pipeline. Branch-only build adapter.
 * The git upstream is immutable; all rewrites happen inside candidate CI.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const targetPrefix='/cobalt-hollow-lab/reborn/';
const starts=['ui','map_bg','audio','fonts','textures','env','vfx','models','claudium'];
let touched=0,files=0;
function walk(dir){
 if(!fs.existsSync(dir))return;
 for(const x of fs.readdirSync(dir,{withFileTypes:true})){
  const f=path.join(dir,x.name);
  if(x.isDirectory()){walk(f);continue;}
  if(!x.isFile()||!/\.(?:ts|tsx|js|css|scss)$/i.test(f))continue;
  const before=fs.readFileSync(f,'utf8');
  let current=before;
  for(const prefix of starts){
   const escaped=prefix.replaceAll('-','\\-');
   const patterns=[
    new RegExp('([\\x22\\x27\\x60])/'+escaped+'/','g'),
    new RegExp('url\\(\\s*/'+escaped+'/','g'),
   ];
   current=current.replace(patterns[0],(_,quote)=>{touched++;return quote+targetPrefix+prefix+'/'});
   current=current.replace(patterns[1],()=>{touched++;return 'url('+targetPrefix+prefix+'/'});
  }
  if(current!==before){fs.writeFileSync(f,current);files++;}
 }
}
walk(path.join(root,'src'));
const index=path.join(root,'index.html');
if(fs.existsSync(index)){
 let a=fs.readFileSync(index,'utf8');let b=a;
 for(const prefix of starts){
  for(const q of ['"',"'",'url(']){
   const v=q+'/'+prefix+'/';if(b.includes(v)){let n=b.split(v).length-1;touched+=n;b=b.split(v).join(q+targetPrefix+prefix+'/');}
  }
 }
 if(b!==a){fs.writeFileSync(index,b);files++;}
}
console.log('HIGHFLY_REBORN_C8_PAGES_PUBLIC_PATH_LITERALS='+touched+' FILES='+files);
if(touched<20)throw Error('C8_PUBLIC_ASSET_PATH_REWRITE_UNEXPECTED_COUNT');
