// Eye-level screenshots of the generated scene through Pascal's own first-person walkthrough (what you see when you walk it).
// usage: PORT=<pascal port> node tools/eyeshot.cjs <exist|prop> <name> <x_ft> <z_ft> <yaw_deg> [more groups of 5...]
//   x,z are plan feet. yaw: 0 = looking north (toward the rear), -90 = east, 180 = south, 90 = west. Set LIGHT=1 to toggle Light preview.
//   Needs: a running Pascal editor, `node scripts/serve-models.cjs` (custom furniture), playwright with Chromium, and internet (textures).
//   Note the walkthrough pushes the camera out of walls/furniture, so stand in open floor. Output: tools/shots/eye_<name>.png
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ ({chromium}=require('/opt/node-tools/node_modules/playwright')); }
const path=require('path'); const GEN=path.join(__dirname,'..','generator'); process.chdir(GEN); const {build}=require(path.join(GEN,'emit.cjs')); process.chdir(__dirname);
require('fs').mkdirSync(path.join(__dirname,'shots'),{recursive:true});
(async()=>{
  const port=process.env.PORT; const a=process.argv.slice(2); const jobs=[];
  for(let i=0;i<a.length;i+=5) jobs.push({layout:a[i],name:a[i+1],x:a[i+2],z:a[i+3],yaw:(+a[i+4])*Math.PI/180});
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--ignore-certificate-errors']});
  for(const j of jobs){
    process.env.SPAWN_XZ=`${j.x},${j.z}`; process.env.SPAWN_YAW=String(j.yaw);
    const g=build(j.layout); const id='eye-test';
    const hdr={'content-type':'application/json',host:`pascal.localhost:${port}`};
    await fetch(`http://127.0.0.1:${port}/api/scenes/${id}`,{method:'DELETE',headers:hdr}).catch(()=>{});
    const r=await fetch(`http://127.0.0.1:${port}/api/scenes`,{method:'POST',headers:hdr,body:JSON.stringify({id,name:'eye',graph:g})});
    if(r.status!==201){console.log('load fail',r.status,(await r.text()).slice(0,300));continue;}
    const cx=await b.newContext({viewport:{width:1400,height:850},ignoreHTTPSErrors:true}); const p=await cx.newPage();
    await p.goto(`http://localhost:${port}/scene/${id}`,{waitUntil:'domcontentloaded',timeout:60000});
    await p.waitForTimeout(12000);
    await p.getByText('Preview',{exact:true}).first().click().catch(()=>{});
    await p.waitForTimeout(3000);
    await p.evaluate(()=>{const e=document.elementFromPoint(740,798); (e.closest('button')||e).click();});
    await p.waitForTimeout(24000);
    if(process.env.LIGHT){await p.mouse.click(1246,71);await p.waitForTimeout(6000);}
    await p.screenshot({path:`shots/eye_${j.name}.png`}); console.log('shot',j.name);
    await cx.close();
  }
  await b.close();
})();
