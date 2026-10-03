const {cap,classify,runs,r3}=require('./analyze.cjs');
const H_FULL=8;
function unionCover(fr){ // vertical union intervals
  const iv=fr.map(f=>[f.y0,f.y1]).sort((a,b)=>a[0]-b[0]); const out=[];
  for(const [a,b] of iv){ if(out.length&&a<=out[out.length-1][1]+1e-6) out[out.length-1][1]=Math.max(out[out.length-1][1],b); else out.push([a,b]); }
  return out;
}
// Returns walls: {along,c,t,lo,hi,floorY,solid:[...],openings:[{lo,hi,kind,sill,head}], isNew}
function buildWalls(name){
  const ctx=cap.contexts[name]; const c=classify(ctx); const res=[];
  for(const g of runs(c.walls)){
    // elementary intervals from sorted breakpoints
    const bp=[...new Set(g.frags.flatMap(f=>[r3(f.lo),r3(f.hi)]))].sort((a,b)=>a-b);
    const segs=[]; // {lo,hi,cover}
    for(let i=0;i<bp.length-1;i++){
      const lo=bp[i],hi=bp[i+1],mid=(lo+hi)/2;
      const fr=g.frags.filter(f=>f.lo<=mid&&f.hi>=mid);
      if(!fr.length){segs.push({lo,hi,gap:true});continue;}
      segs.push({lo,hi,cover:unionCover(fr),isNew:fr.some(f=>f.m==='wallNew')});
    }
    // merge consecutive identical coverage
    const merged=[];
    for(const s of segs){
      const key=JSON.stringify(s.cover||'gap');
      const p=merged[merged.length-1];
      if(p&&p.key===key&&Math.abs(p.hi-s.lo)<1e-6){p.hi=s.hi;p.isNew=p.isNew||s.isNew;} else merged.push({...s,key});
    }
    const lo=merged[0].lo,hi=merged[merged.length-1].hi;
    const yMin=Math.min(...g.frags.map(f=>f.y0));
    const openings=[];const solid=[];
    for(const s of merged){
      if(s.gap){openings.push({lo:s.lo,hi:s.hi,kind:'gap'});continue;}
      const cov=s.cover;
      const full=cov.length===1&&cov[0][0]<=yMin+1e-6&&cov[0][1]>=H_FULL-1e-6;
      if(full){solid.push([s.lo,s.hi,s.isNew]);continue;}
      if(cov.length===1&&cov[0][0]>yMin+1e-6){ openings.push({lo:s.lo,hi:s.hi,kind:'door',sill:yMin<0?0:0,head:cov[0][0]}); continue;}
      if(cov.length===2){ openings.push({lo:s.lo,hi:s.hi,kind:'window',sill:cov[0][1],head:cov[1][0]}); continue;}
      openings.push({lo:s.lo,hi:s.hi,kind:'other',cover:cov});
    }
    res.push({along:g.along,c:g.c,t:g.t,lo,hi,yMin,solid,openings,isNew:merged.some(m=>m.isNew)});
  }
  return {walls:res,doors:c.doors,glass:c.glass,other:c.other,ctx};
}
module.exports={buildWalls};
if(require.main===module){
  for(const name of Object.keys(cap.contexts)){
    const {walls}=buildWalls(name);
    console.log('==',name,'walls',walls.length);
    for(const w of walls.sort((a,b)=>a.along.localeCompare(b.along)||a.c-b.c)){
      console.log(`${w.along} c=${w.c} t=${w.t} [${w.lo}..${w.hi}] yMin=${w.yMin}${w.isNew?' NEW':''}`,
        w.openings.map(o=>`${o.kind}[${r3(o.lo)}..${r3(o.hi)}]${o.sill!==undefined?` sill${o.sill} head${o.head}`:''}`).join(' | '));
    }
  }
}
