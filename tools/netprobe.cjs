// Lists which external assets (textures, models) the editor page loads and whether they succeed. usage: PORT=<port> node tools/netprobe.cjs
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ ({chromium}=require('/opt/node-tools/node_modules/playwright')); }
(async()=>{
  const port=process.env.PORT; const id=process.env.SCENE||'house-proposed';
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--ignore-certificate-errors']});
  const ctx=await b.newContext({viewport:{width:1280,height:800},ignoreHTTPSErrors:true});
  const p=await ctx.newPage(); const seen={};
  p.on('requestfailed',r=>{const u=new URL(r.url()); if(u.hostname!=='localhost'){const k=u.hostname+' FAIL '+r.failure().errorText; seen[k]=(seen[k]||0)+1;}});
  p.on('response',r=>{const u=new URL(r.url()); if(u.hostname==='editor.pascal.app'){console.log(r.status(),u.pathname.slice(0,120));}});
  p.on('console',m=>{ if(m.type()==='error') console.log('[console]',m.text().slice(0,200)); });
  await p.goto(`http://localhost:${port}/scene/${id}`,{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(15000);
  console.log(seen);
  await b.close();
})();
