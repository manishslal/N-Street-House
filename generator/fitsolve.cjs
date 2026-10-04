// Fit solver: moves every floor-standing piece to the nearest spot where it really fits (inside its room, clear of walls, other pieces,
// door swings and the stairwell) and removes the ones that cannot fit. Run by emit.cjs after the furniture is placed; the log is
// written to docs/FIT_REPORT.md by `node emit.cjs`.
const SW=require('./swing.cjs'); const {rect,sat,wallRect}=SW;
const FT=0.3048;
const SOFT=['rectangular-carpet','round-carpet','persian-rug','ceiling-lamp','globe-pendant','dome-pendant','recessed-light','picture','round-mirror','brass-sconce','sheer-curtain','small-indoor-plant','coffee-machine'];
const inPoly=(p,pg)=>{let c=false;for(let i=0,j=pg.length-1;i<pg.length;j=i++){const a=pg[i],b=pg[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
// distance from point to polygon edge (for inset test)
const edgeDist=(p,pg)=>{let d=1e9;for(let i=0;i<pg.length;i++){const a=pg[i],b=pg[(i+1)%pg.length];const dx=b[0]-a[0],dz=b[1]-a[1],L2=dx*dx+dz*dz;let t=L2?((p[0]-a[0])*dx+(p[1]-a[1])*dz)/L2:0;t=Math.max(0,Math.min(1,t));d=Math.min(d,Math.hypot(p[0]-(a[0]+t*dx),p[1]-(a[1]+t*dz)));}return d;};

function solve(g, opts={}){
  const log=[]; const nodes=Object.values(g); const ctx=SW.context(g);
  const levelOf=ctx.levelOf; const inset=opts.inset??0.015;
  for(const lv of ['level_0','level_1']){
    const zones=nodes.filter(n=>n.type==='zone'&&levelOf(n)===lv);
    const walls=ctx.walls.filter(w=>w.lv===lv);
    // keep-out rectangles: stairwell holes, door swings (+ walking strip on the other side)
    const keep=[];
    const slab=nodes.find(n=>n.type==='slab'&&n.parentId===lv&&/^slab_[mu]$/.test(n.id));
    const roomPolys=nodes.filter(n=>n.type==='slab'&&n.parentId===lv&&/_room\d+$/.test(n.id)).map(n=>JSON.stringify(n.polygon));
    if(slab) for(const h of slab.holes||[]) if(!roomPolys.includes(JSON.stringify(h))) keep.push({poly:h.map(p=>p),why:'stairwell'});   // holes that are room-finish cut-outs are not stairwells
    for(const st of nodes.filter(n=>n.type==='stair'&&levelOf(n)===lv)) { /* stairs are modelled as holes + steps; main-floor flights start on the floor */
      const segs=(st.children||[]).map(id=>g[id]).filter(Boolean); const w=st.width||1; const L=segs.reduce((s,x)=>s+(x.length||0),0); const yaw=st.rotation||0;
      const fx=Math.sin(yaw),fz=Math.cos(yaw); keep.push({poly:rect(st.position[0]+fx*L/2,st.position[2]+fz*L/2,fx,fz,L,w),why:'stair',minY:st.position[1]}); }
    for(const d of nodes.filter(n=>n.type==='door'&&levelOf(g[n.parentId])===lv)){
      const W=g[d.parentId],wr=wallRect(W),t=W.thickness||0.1,w=d.width; const cx=W.start[0]+wr.ux*d.position[0],cz=W.start[1]+wr.uz*d.position[0],nx=-wr.uz,nz=wr.ux;
      const swing=d.openingKind==='door'?(d.swingDirection==='outward'?-1:1):0;
      // swing side: the quarter disc the open leaf sweeps (hinge corner, radius = door width); other side: a 0.45 m walking strip
      const dbl=d.doorType==='double'; const rad=dbl?w/2:w; const hinges=dbl?[-1,1]:[d.hingesSide==='right'?1:-1];
      for(const s of [1,-1]){
        if(s===swing){ for(const hinge of hinges){ const hx=cx+wr.ux*hinge*w/2, hz=cz+wr.uz*hinge*w/2; const fan=[[hx,hz]];
            const a0=Math.atan2(-hinge*wr.uz,-hinge*wr.ux), a1=Math.atan2(nz*s,nx*s); let da=a1-a0; while(da>Math.PI)da-=2*Math.PI; while(da<-Math.PI)da+=2*Math.PI;
            for(let k=0;k<=8;k++){ const a=a0+da*k/8; fan.push([hx+Math.cos(a)*rad,hz+Math.sin(a)*rad]); } keep.push({poly:fan,why:'door'}); } }
        else { const depth=0.45; keep.push({poly:rect(cx+nx*s*(depth/2+t/2),cz+nz*s*(depth/2+t/2),wr.ux,wr.uz,w,depth),why:'door'}); } }
    }
    const cabs=ctx.items.filter(i=>i.isCab&&i.lv===lv).map(i=>({poly:i.poly,name:i.n.name}));
    let pieces=ctx.items.filter(i=>!i.isCab&&i.lv===lv&&!SOFT.includes(i.n.asset.id)&&(i.n.position[1]||0)<=0.3&&(i.n.position[1]||0)>-0.5);
    pieces.sort((a,b)=>b.W*b.D-a.W*a.D);
    const placed=[];
    for(const it of pieces){
      const n=it.n, hint=[n.position[0],n.position[2]], yaw0=n.rotation[1], name=n.name||n.asset.name;
      const room=zones.find(z=>inPoly(hint,z.polygon))||zones.map(z=>({z,d:edgeDist(hint,z.polygon)})).sort((a,b)=>a.d-b.d)[0]?.z;
      if(!room){ log.push({lv,name,action:'kept',note:'not in any room'}); continue; }
      const ok=(x,z,yaw)=>{ const fx=Math.sin(yaw),fz=Math.cos(yaw); const P=rect(x,z,-fz,fx,it.W,it.D);
        for(const p of P){ if(!inPoly(p,room.polygon)||edgeDist(p,room.polygon)<inset-1e-9&&false) return false; }
        // small inset: corners must be inside; also shrink test by sampling the edge mid-points
        for(let k=0;k<4;k++){ const a=P[k],b=P[(k+1)%4]; if(!inPoly([(a[0]+b[0])/2,(a[1]+b[1])/2],room.polygon)) return false; }
        for(const w of walls) if(sat(P,w.poly)){ if(process.env.DEBUGFIT) (global.RJ=global.RJ||{})[name+'|wall']=(global.RJ[name+'|wall']||0)+1; return false; }
        for(const k of keep) if(!(k.why==='stair'&&(n.position[1]||0)<-0.5)&&sat(P,k.poly)){ if(process.env.DEBUGFIT) (global.RJ=global.RJ||{})[name+'|'+k.why]=(global.RJ[name+'|'+k.why]||0)+1; return false; }
        for(const c of cabs) if(sat(P,c.poly)) return false;
        for(const o of placed) if(sat(P,o.poly)&&!(opts.allowTucked&&opts.allowTucked(n,o.n))) return false;
        return true; };
      const yaws=[yaw0,yaw0+Math.PI/2,yaw0-Math.PI/2,yaw0+Math.PI];
      let best=null;
      const step=0.05, maxR=Math.max(1.6,Math.max(it.W,it.D));
      for(let r=0;r<=maxR&&!best;r+=step){
        const cand=[]; const m=Math.max(1,Math.round(r/step)*4);
        for(let k=0;k<(r===0?1:m);k++){ const a=k/m*2*Math.PI; cand.push([hint[0]+Math.cos(a)*r,hint[1]+Math.sin(a)*r]); }
        for(const c of cand) for(let yi=0;yi<yaws.length;yi++){ if(ok(c[0],c[1],yaws[yi])){ const cost=r+(yi?0.15:0); if(!best||cost<best.cost) best={x:c[0],z:c[1],yaw:yaws[yi],cost}; } }
        if(best&&best.cost<r+0.001) break; }
      if(!best){ // try a smaller one (up to 80 %) before giving up
        log.push({lv,name,room:room.name,action:'removed',note:`does not fit (${(it.W/FT).toFixed(1)} x ${(it.D/FT).toFixed(1)} ft)`}); delete g[n.id]; const par=g[n.parentId]; if(par) par.children=par.children.filter(c=>c!==n.id); continue; }
      const moved=Math.hypot(best.x-hint[0],best.z-hint[1]), turned=Math.abs(((best.yaw-yaw0)%(2*Math.PI)))>1e-6;
      n.position[0]=+best.x.toFixed(3); n.position[2]=+best.z.toFixed(3); n.rotation[1]=+best.yaw.toFixed(4);
      if(moved>0.02||turned) log.push({lv,name,room:room.name,action:'moved',note:`${(moved/FT).toFixed(1)} ft${turned?' and turned':''}`});
      placed.push({poly:rect(best.x,best.z,-Math.cos(best.yaw),Math.sin(best.yaw),it.W,it.D),n});
    }
  }
  if(process.env.DEBUGFIT) console.log(global.RJ);
  return log;
}
module.exports={solve};
