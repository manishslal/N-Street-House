// Runs Bethan's own plan-building functions against a recording harness.
const fs=require('fs');
const html=fs.readFileSync(process.env.BETHAN_HTML||'../reference/bethan-original.html','utf8');
const a=html.indexOf('/* ---------------- main floor ---------------- */');
const b=html.indexOf('/* ---------------- labels ---------------- */');
const src=html.slice(a,b);
const FH=9.333;
const out={FH,contexts:{}};
function run(floor,mode,low){
  const rec={boxes:[],rods:[],labels:[],planes:[]};
  let curH=low?4:8, curF=floor;
  const mat=new Proxy({},{get:(_,k)=>String(k)});
  const box=(x0,x1,y0,y1,z0,z1,m)=>{ if(x1<=x0||y1<=y0||z1<=z0) return null; rec.boxes.push({x0,x1,y0,y1,z0,z1,m}); return {}; };
  const W=(x0,x1,y0,y1,z0,z1,m)=>box(x0,x1,y0,Math.min(y1,curH),z0,z1,m||'wall');
  const plane=(x0,x1,z0,z1,y)=>rec.planes.push({x0,x1,z0,z1,y});
  const rod=(a,b,r,m)=>rec.rods.push({a,b,r,m});
  const L=(text,x,y,z,cls)=>rec.labels.push({text,x,y,z,cls:cls||''});
  const state={floors:'side',low:!!low,mode};
  const fn=new Function('FH','mat','box','W','plane','rod','L','state','getH','setH',
    src+`;
     return {mainShell,mainExisting,mainProposed,upperShell,upperExisting,upperProposed,slab};`);
  let H=curH;
  const api=fn(FH,mat,box,W,plane,rod,L,state);
  return {api,rec,setH:v=>{curH=v;}};
}
// curH is a free variable in the source (module scope in the artifact), so inject through a getter object.
function build(floor,mode){
  const rec={boxes:[],rods:[],labels:[],planes:[]};
  const holder={curH:8};
  const mat=new Proxy({},{get:(_,k)=>String(k)});
  const box=(x0,x1,y0,y1,z0,z1,m)=>{ if(x1<=x0||y1<=y0||z1<=z0) return null; rec.boxes.push({x0,x1,y0,y1,z0,z1,m}); return {}; };
  const W=(x0,x1,y0,y1,z0,z1,m)=>box(x0,x1,y0,Math.min(y1,holder.curH),z0,z1,m||'wall');
  const plane=(x0,x1,z0,z1,y)=>rec.planes.push({x0,x1,z0,z1,y});
  const rod=(a,b,r,m)=>rec.rods.push({a,b,r,m});
  const L=(text,x,y,z,cls)=>rec.labels.push({text,x,y,z,cls:cls||''});
  // replace free `curH` with holder.curH
  const patched=src.replace(/\bcurH\b/g,'holder.curH');
  const fn=new Function('FH','mat','box','W','plane','rod','L','holder',patched+`;return {mainShell,mainExisting,mainProposed,upperShell,upperExisting,upperProposed};`);
  const api=fn(FH,mat,box,W,plane,rod,L,holder);
  if(floor==='main'){ api.mainShell(); (mode==='exist'?api.mainExisting:api.mainProposed)(); }
  else { api.upperShell(); (mode==='exist'?api.upperExisting:api.upperProposed)(); }
  return rec;
}
for(const mode of ['exist','prop']) for(const floor of ['main','upper']){
  out.contexts[floor+'_'+mode]=build(floor,mode);
}
fs.writeFileSync('capture.json',JSON.stringify(out));
for(const k in out.contexts){const r=out.contexts[k];console.log(k,'boxes',r.boxes.length,'rods',r.rods.length,'labels',r.labels.length,'planes',r.planes.length);}
