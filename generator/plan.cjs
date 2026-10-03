// Neutral plan model (feet in, metres out) built from Bethan's own geometry.
const {cap,r3}=require('./analyze.cjs');
const {buildWalls}=require('./walls.cjs');
const FT=0.3048, FH=cap.FH;
const EPS=0.012;

function snapWalls(ws){
  // Snap run ends onto the centreline of any perpendicular run they touch or bury into.
  const out=ws.map(w=>({...w}));
  const perp=(w)=>out.filter(o=>o.along!==w.along);
  for(const w of out){
    for(const end of ['lo','hi']){
      const v=w[end];
      const cands=perp(w).filter(o=>{
        const half=o.t/2;
        const endInside=v>=o.c-half-EPS && v<=o.c+half+EPS;   // end value lies within the perpendicular wall thickness
        const spans=w.c>=o.lo-EPS && w.c<=o.hi+EPS;           // this wall's axis lies within the perpendicular wall's extent
        return endInside&&spans;
      });
      if(cands.length) w['snap_'+end]=cands[0].c;
    }
  }
  for(const w of out){ if(w.snap_lo!==undefined) w.slo=w.snap_lo; else w.slo=w.lo; if(w.snap_hi!==undefined) w.shi=w.snap_hi; else w.shi=w.hi; }
  return out;
}

function levelWalls(name){
  const {walls,doors}=buildWalls(name);
  const sn=snapWalls(walls);
  // 1) drop "gaps" that are just junctions with a perpendicular wall (the wall passes through the T)
  for(const w of sn){
    w.openings=w.openings.filter(o=>{
      if(o.kind!=='gap') return true;
      const hit=sn.find(p=>p.along!==w.along && o.lo>=p.c-p.t/2-EPS && o.hi<=p.c+p.t/2+EPS && w.c>=p.lo-EPS && w.c<=p.hi+EPS);
      return !hit;
    });
  }
  // 2) door leaves drawn flat on solid walls become real door openings
  for(const d of doors){
    const dx=d.x1-d.x0,dz=d.z1-d.z0, along=dx<dz?'z':'x';
    const cc=along==='z'?(d.x0+d.x1)/2:(d.z0+d.z1)/2, lo=along==='z'?d.z0:d.x0, hi=along==='z'?d.z1:d.x1;
    const host=sn.filter(w=>w.along===along && Math.abs(w.c-cc)<=w.t/2+0.08 && lo>=w.lo-EPS && hi<=w.hi+EPS)[0];
    if(!host){ if(process.env.DEBUG_PLAN) console.warn('door leaf with no host wall (open-swung leaf or cabinet front, ignored)',name,JSON.stringify(d)); continue; }
    const dup=host.openings.some(o=>Math.min(o.hi,hi)-Math.max(o.lo,lo)>0.5*(hi-lo));
    if(!dup) host.openings.push({lo,hi,kind:'door',sill:0,head:d.y1});
  }
  // 2b) a header-only gap with no door leaf anywhere near it is an open archway, not a door
  const leafBoxes=(buildWalls(name).ctx.boxes).filter(b=>(b.m==='door'||b.m==='front')&&b.y1-b.y0>=5);
  for(const w of sn) for(const o of w.openings){
    if(o.kind!=='door') continue;
    const mid=(o.lo+o.hi)/2, cx=w.along==='x'?mid:w.c, cz=w.along==='x'?w.c:mid, reach=(o.hi-o.lo)/2+3.5;
    const near=leafBoxes.some(b=>Math.hypot((b.x0+b.x1)/2-cx,(b.z0+b.z1)/2-cz)<=reach+Math.max(b.x1-b.x0,b.z1-b.z0)/2);
    if(!near){ o.kind='arch'; if(process.env.DEBUG_PLAN) console.warn('archway (no leaf):',name,w.along,w.c,o.lo,o.hi); }
  }
  // drop jamb-sized stubs (e.g. a 4 in fragment fully buried in neighbouring walls)
  for(let i=sn.length-1;i>=0;i--) if(sn[i].shi-sn[i].slo<0.4) sn.splice(i,1);
  // 3) emit wall nodes; half-height segments become their own wall
  const res=[];
  for(const w of sn){
    const a=(v)=>w.along==='x'?[v,w.c]:[w.c,v];
    const ops=w.openings.filter(o=>o.kind!=='other').sort((p,q)=>p.lo-q.lo);
    const lows=w.openings.filter(o=>o.kind==='other');
    const cuts=[w.slo,...lows.flatMap(o=>[o.lo,o.hi]),w.shi].sort((p,q)=>p-q);
    const segs=[];
    for(let i=0;i<cuts.length-1;i++){ const lo=cuts[i],hi=cuts[i+1]; if(hi-lo<1e-6) continue;
      const low=lows.find(o=>o.lo<=lo+1e-6&&o.hi>=hi-1e-6); segs.push({lo,hi,height:low?low.cover[0][1]:8}); }
    if(!lows.length&&segs.length!==1) throw new Error('seg split error');
    for(const sg of segs){
      const o2=ops.filter(o=>o.lo>=sg.lo-EPS&&o.hi<=sg.hi+EPS).map(o=>({kind:o.kind,u0:o.lo-sg.lo,u1:o.hi-sg.lo,sill:o.sill||0,head:o.head||0}));
      res.push({start:a(sg.lo),end:a(sg.hi),thickness:w.t,height:sg.height,half:sg.height<8,isNew:w.isNew,openings:o2});
    }
  }
  return res;
}

const toM=(p)=>p.map(v=>r3(v*FT));
module.exports={cap,FT,FH,levelWalls,toM,r3};
if(require.main===module){
  for(const n of Object.keys(cap.contexts)){
    const ws=levelWalls(n);
    console.log('==',n,ws.length);
    ws.forEach(w=>console.log(JSON.stringify(w.start.map(r3)),'->',JSON.stringify(w.end.map(r3)),'t',w.thickness,w.half?'HALF':'',w.isNew?'NEW':'',w.openings.map(o=>`${o.kind}@${r3(o.u0)}-${r3(o.u1)}`).join(',')));
  }
}
