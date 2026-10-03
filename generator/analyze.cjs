const fs=require('fs');
const cap=JSON.parse(fs.readFileSync('capture.json','utf8'));
const r3=v=>Math.round(v*1000)/1000;
function classify(ctx){
  const walls=[],doors=[],glass=[],other=[];
  for(const b of ctx.boxes){
    const dx=b.x1-b.x0,dz=b.z1-b.z0,dy=b.y1-b.y0;
    if(b.m==='wall'||b.m==='wallNew'){
      if(Math.min(dx,dz)<=0.55 && Math.max(dx,dz)>0.3 && !(dx>0.6&&dz>0.6)) walls.push(b); else other.push(b);
    } else if(b.m==='door' && Math.min(dx,dz)<=0.06 && dy>=5.5) doors.push(b);
    else if(b.m==='glass') glass.push(b);
    else other.push(b);
  }
  return {walls,doors,glass,other};
}
// Merge wall fragments into runs: key by orientation, axis position and thickness.
function runs(walls){
  const groups=new Map();
  for(const w of walls){
    const dx=w.x1-w.x0,dz=w.z1-w.z0;
    const along=dx>=dz?'x':'z'; // wall runs along x (thin in z) or along z
    const t=along==='x'?dz:dx;
    const c=along==='x'?(w.z0+w.z1)/2:(w.x0+w.x1)/2;
    const key=along+'|'+r3(c)+'|'+r3(t);
    if(!groups.has(key)) groups.set(key,{along,c:r3(c),t:r3(t),frags:[]});
    const lo=along==='x'?w.x0:w.z0, hi=along==='x'?w.x1:w.z1;
    groups.get(key).frags.push({lo,hi,y0:w.y0,y1:w.y1,m:w.m});
  }
  return [...groups.values()];
}
module.exports={cap,classify,runs,r3};
if(require.main===module){
  const name=process.argv[2]||'main_prop';
  const c=classify(cap.contexts[name]);
  console.log(name,'walls',c.walls.length,'doors',c.doors.length,'glass',c.glass.length,'other',c.other.length);
  const rs=runs(c.walls);
  for(const g of rs.sort((a,b)=>a.along.localeCompare(b.along)||a.c-b.c)){
    console.log(g.along,'c='+g.c,'t='+g.t,'frags:',g.frags.map(f=>`[${r3(f.lo)}..${r3(f.hi)} y${f.y0}-${f.y1}]`).join(' '));
  }
}
