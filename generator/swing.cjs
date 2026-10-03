// Door-swing geometry shared by emit.cjs (to hang every door so it opens into free space) and audit.cjs (to report what is left).
// Pascal convention (verified in packages/nodes/src/door/floorplan.ts): perpendicular = wall direction rotated 90 degrees CCW in (x,z);
// swingDirection 'inward' swings toward +perp, 'outward' toward -perp; hingesSide 'left' hinges at the wall-start end of the opening.
const rect=(cx,cz,ux,uz,len,wid)=>{const vx=-uz,vz=ux,hl=len/2,hw=wid/2;
  return [[cx+ux*hl+vx*hw,cz+uz*hl+vz*hw],[cx+ux*hl-vx*hw,cz+uz*hl-vz*hw],[cx-ux*hl-vx*hw,cz-uz*hl-vz*hw],[cx-ux*hl+vx*hw,cz-uz*hl+vz*hw]];};
function sat(a,b){for(const P of [a,b])for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];
  const ax=-(q[1]-p[1]),az=q[0]-p[0];const pr=(S)=>{let mn=1e9,mx=-1e9;for(const s of S){const d=s[0]*ax+s[1]*az;mn=Math.min(mn,d);mx=Math.max(mx,d);}return[mn,mx];};
  const A=pr(a),B=pr(b);if(A[1]<=B[0]+1e-6||B[1]<=A[0]+1e-6)return false;}return true;}
const wallRect=(w)=>{const dx=w.end[0]-w.start[0],dz=w.end[1]-w.start[1],L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L;
  return {L,ux,uz,poly:rect((w.start[0]+w.end[0])/2,(w.start[1]+w.end[1])/2,ux,uz,L,w.thickness||0.1)};};

function context(g){
  const nodes=Object.values(g);
  const levelOf=(n)=>{while(n&&n.type!=='level')n=g[n.parentId];return n&&n.id;};
  const walls=nodes.filter(n=>n.type==='wall').map(w=>({w,lv:levelOf(w),...wallRect(w)}));
  const SOFT=['rectangular-carpet','round-carpet','ceiling-lamp','recessed-light','picture','round-mirror','small-indoor-plant','coffee-machine'];
  const items=nodes.filter(n=>n.type==='item'&&!SOFT.includes(n.asset.id)).map(n=>{
    const s=Array.isArray(n.scale)?n.scale:[n.scale||1,n.scale||1,n.scale||1];const d=n.asset.dimensions;
    const W=d[0]*s[0],D=d[2]*s[2],yaw=n.rotation[1],fx=Math.sin(yaw),fz=Math.cos(yaw);
    return {n,lv:levelOf(n),W,D,fx,fz,poly:rect(n.position[0],n.position[2],-fz,fx,W,D)};});
  const cabinets=nodes.filter(n=>n.type==='cabinet'&&(n.position[1]||0)<0.5).map(c=>{ // base/tall runs
    const yaw=c.rotation, ux=Math.cos(yaw), uz=-Math.sin(yaw); // local +x in world (three.js yaw about Y)
    return {n:{name:c.name||'Cabinets'},lv:levelOf(c),poly:rect(c.position[0]+ux*c.width/2,c.position[2]+uz*c.width/2,ux,uz,c.width,c.depth)};});
  return {g,nodes,levelOf,walls,items:[...items,...cabinets.map(c=>({...c,isCab:true}))],furniture:items};
}

// For one door: for each swing side (+1 = 'inward', -1 = 'outward') and hinge ('left'|'right'), what does the open leaf hit?
function analyzeDoor(ctx,d){
  const {g,walls,items,levelOf}=ctx; const W=g[d.parentId],wr=wallRect(W),lv=levelOf(W),t=W.thickness||0.1,w=d.width;
  const cx=W.start[0]+wr.ux*d.position[0],cz=W.start[1]+wr.uz*d.position[0],nx=-wr.uz,nz=wr.ux,double=d.doorType==='double';
  const res={};
  for(const s of [1,-1]) for(const hinge of ['left','right']){
    const hs=hinge==='left'?-1:1; const leaves=double?[-1,1]:[hs]; const lw=double?w/2:w; let hit=null;
    for(const h of leaves){ const hx=cx+wr.ux*h*w/2,hz=cz+wr.uz*h*w/2;
      const R=rect(hx+nx*s*(lw/2+t/2),hz+nz*s*(lw/2+t/2),nx*s,nz*s,lw,0.05);
      for(const o of walls){if(o.w===W||o.lv!==lv)continue;if(sat(R,o.poly)){hit=`wall "${o.w.name||o.w.id}"`;break;}}
      if(!hit)for(const it of items){if(it.lv!==lv)continue;if(sat(R,it.poly)){hit=it.n.name;break;}}
      if(hit)break; }
    res[`${s}:${hinge}`]=hit; }
  // free depth along the normal on each side (to the nearest wall face)
  const depth=(s)=>{let best=9;for(const o of walls){if(o.w===W||o.lv!==lv)continue;
    const P=rect(cx+nx*s*(2.5+t/2),cz+nz*s*(2.5+t/2),nx*s,nz*s,5,w*0.6);if(!sat(P,o.poly))continue;
    const ds=o.poly.map(p=>((p[0]-cx)*nx+(p[1]-cz)*nz)*s).filter(v=>v>t/2);if(ds.length)best=Math.min(best,Math.min(...ds)-t/2);}return best;};
  return {res,depth:{1:depth(1),'-1':depth(-1)},lv,W};
}

// hang every hinged door: prefer swinging toward the side with more free depth (into the room, not into a hall), clear of walls/furniture
function chooseSwings(g){
  const ctx=context(g); const report=[];
  for(const d of ctx.nodes.filter(n=>n.type==='door'&&n.openingKind==='door')){
    const a=analyzeDoor(ctx,d); const opts=[];
    for(const s of [1,-1]) for(const h of ['left','right']) opts.push({s,h,hit:a.res[`${s}:${h}`],depth:a.depth[s]});
    const clear=opts.filter(o=>!o.hit);
    const pool=clear.length?clear:opts;
    pool.sort((x,y)=>y.depth-x.depth||(x.h==='left'?-1:1));
    const pick=pool[0];
    d.swingDirection=pick.s===1?'inward':'outward'; d.hingesSide=pick.h; if(d.doorType!=='double') d.handleSide=pick.h==='left'?'right':'left';
    report.push({id:d.id,clear:!!clear.length,hit:pick.hit});
  }
  return report;
}
module.exports={rect,sat,wallRect,context,analyzeDoor,chooseSwings};
